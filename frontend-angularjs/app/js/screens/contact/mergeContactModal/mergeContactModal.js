(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a merge-contact modal dialog
     */
    module.service('mergeContactModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function () {
            return $uibModal.open({
                templateUrl: 'js/screens/contact/mergeContactModal/mergeContactModal.html',
                controller: 'MergeContactModalController',
                controllerAs: 'vm',
                size: 'lg',
                backdrop: 'static'
            });
        };

        return service;
    });

    module.controller('MergeContactModalController', function (
        $uibModalInstance,
        $scope,
        $q,
        toaster,
        gettextCatalog,
        ContactRestService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            // store contact PKs and contact data in separate[1] arrays of objects[2]
            // and initialize them with two entries for the base contact and one obligatory other contact
            // [1] ... so we can use watchers on the PK array to load data when needed
            // [2] ... so we can have multiple null-values for empty selection elements
            vm.selectedContactPks = [
                {pk: null},
                {pk: null}
            ];
            vm.selectedContacts = [
                {data: null},
                {data: null}
            ];

            // already selected contacts should not be offered for other selectize fields
            vm.excludedContactPks = [];

            // selected values (input fields where radio buttons are checked)
            // object attributes must be named the same as in contact data objects
            // default is always 0 (base contact)
            vm.selectedValueIndices = {
                academic_title: 0,
                first_name: 0,
                last_name: 0,
                email: 0,
                phone: 0,
                company: 0,
                notes: 0
            };

            // loaded contact data from the selectize widget
            vm.loadedContacts = [];

            // Flag for merge button. Merging is possible if >= 2 contacts have been selected.
            vm.canMerge = false;
        };

        /**
         * Reload contact data if selected PKs change
         */
        $scope.$watch('vm.selectedContactPks', function () {
            var pk = null;

            // clear old data
            vm.selectedContacts.length = 0;
            vm.excludedContactPks.length = 0;

            // load new contact data
            for (var i = 0; i < vm.selectedContactPks.length; i++) {
                pk = vm.selectedContactPks[i].pk;

                // add non-empty PKs to exclusion list for other selectize fields
                if (pk) {
                    vm.excludedContactPks.push(pk);
                }

                // update contact data
                vm.selectedContacts.push({
                    pk: pk,
                    data: pk ? angular.copy(vm.loadedContacts[pk]) : null
                });
            }

            // update canMerge flag: base contact and at least one other contact is selected
            vm.canMerge = vm.selectedContactPks[0].pk && vm.getNonNullContacts().length >= 2;

            vm.makeSureSelectedIndicesAreSetToSelectedContacts();
        }, true);

        vm.addContact = function () {
            vm.selectedContactPks.push({pk: null});
        };

        vm.removeContact = function (index) {
            vm.selectedContactPks.splice(index, 1);
        };

        vm.makeSureSelectedIndicesAreSetToSelectedContacts = function () {
            for (var key in vm.selectedValueIndices) {
                if (vm.selectedValueIndices.hasOwnProperty(key)) {
                    var index = vm.selectedValueIndices[key];

                    // no contact selected on index => set index to base contact
                    if (index >= vm.selectedContactPks.length || !vm.selectedContactPks[index].pk) {
                        vm.selectedValueIndices[key] = 0;
                    }
                }
            }
        };

        vm.switchBaseContact = function (index) {
            var basePk = vm.selectedContactPks[0];

            vm.selectedContactPks[0] = vm.selectedContactPks[index];
            vm.selectedContactPks[index] = basePk;
        };

        vm.getNonNullContacts = function () {
            var contacts = [],
                pk = null,
                data = null;

            for (var i = 0; i < vm.selectedContactPks.length; i++) {
                pk = vm.selectedContactPks[i].pk;
                data = vm.selectedContacts[i].data;

                if (pk && data) {
                    contacts.push({
                        pk: pk,
                        data: data
                    });
                }
            }

            return contacts;
        };

        /**
         * Merge all selected contacts into the first selected one
         */
        vm.merge = function () {
            // check that at least two contacts have been selected
            var nonNullContacts = vm.getNonNullContacts();

            if (nonNullContacts.length < 2) {
                toaster.pop('error', gettextCatalog.getString("At least two contacts must be selected"));

                return;
            }

            // lock the selection elements until the merging is done
            vm.readOnly = true;

            var baseContactName = vm.selectedContacts[0].data.display;

            vm.updateBaseContact().then(
                function success (data) {
                    console.log("Success: Updated base contact", baseContactName);

                    vm.trashMergedContacts().finally(
                        function () {
                            vm.readOnly = false;
                            $uibModalInstance.close();
                        }
                    );
                },
                function error (rejection) {
                    console.error("Failed to update contact", rejection);
                    if (rejection.status === 403) {
                        toaster.pop('error',
                            gettextCatalog.getString("Permission denied to change contact " + baseContactName)
                        );
                    } else {
                        toaster.pop('error',
                            gettextCatalog.getString("Could not save merged contact " + baseContactName)
                        );
                    }

                    vm.readOnly = false;
                }
            );
        };

        vm.updateBaseContact = function () {
            var baseContact = angular.copy(vm.selectedContacts[0].data),
                index = undefined,
                contact = undefined;

            // merge selected attributes into base contact
            for (var fieldName in vm.selectedValueIndices) {
                if (vm.selectedValueIndices.hasOwnProperty(fieldName)) {
                    index = vm.selectedValueIndices[fieldName];
                    contact = vm.selectedContacts[index].data;
                    baseContact[fieldName] = contact[fieldName];
                }
            }

            return ContactRestService.update(baseContact).$promise;
        };

        vm.trashMergedContacts = function () {
            var promises = [],
                promise = null;

            for (var i = 1; i < vm.selectedContacts.length; i++) {
                var contact = vm.selectedContacts[i].data;

                if (contact) {
                    promise = vm.trashContact(contact);
                    promises.push(promise);
                }
            }

            return $q.all(promises);
        };

        vm.trashContact = function (contact) {
            var name = contact.display,
                defer = $q.defer();

            contact.$softDelete().then(
                function success (response) {
                    console.log("Success: Trashed " + name);
                    defer.resolve();
                },
                function error (rejection) {
                    console.error("Failed to trash contact", rejection);
                    if (rejection.status === 403) {
                        toaster.pop('error', gettextCatalog.getString("You do not have permission to trash contact " + name));
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Failed to trash contact " + name));
                    }
                    defer.reject();
                }
            );

            return defer.promise;
        };

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
