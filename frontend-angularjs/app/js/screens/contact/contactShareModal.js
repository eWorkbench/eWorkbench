(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a contact-share modal dialog
     */
    module.service('contactShareModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function (contact) {
            return $uibModal.open({
                templateUrl: 'js/screens/contact/contactShareModal.html',
                controller: 'ContactShareModalController',
                controllerAs: 'vm',
                backdrop: 'static',
                resolve: {
                    template: function () {
                        return contact;
                    }
                }
            });
        };

        return service;
    });

    module.controller('ContactShareModalController', function (
        $uibModalInstance,
        $filter,
        toaster,
        gettextCatalog,
        ContactRestService,
        template
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * contact to share
             * @type {template}
             */
            vm.contact = angular.copy(template);
        };

        /**
         * share contact with selected user
         */
        vm.share = function () {
            if (vm.userPK) {
                var user = $filter('filter')(vm.users, {'pk': vm.userPK})[0];

                vm.contact.created_for = user.pk;

                ContactRestService.resource.share(vm.contact).$promise.then(
                    function success (response) {
                        toaster.pop('success', gettextCatalog.getString("Contact shared"));

                        // done - close the modal dialog
                        $uibModalInstance.close(response);
                    },
                    function error (rejection) {
                        toaster.pop('error', gettextCatalog.getString("Failed to create contact"));
                        console.log(rejection);
                        vm.errors = rejection.data;

                        // handle permission denied errors
                        if (rejection.status == 403) {
                            // permission denied -> this is most likely due to the fact that the user does not have the
                            // appropriate permissions in the selected project
                            if (vm.contact.projects && vm.contact.projects.length > 0) {
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new contact in at least one of the " +
                                        "specified projects"
                                    )
                                ];
                            } else {
                                // permission denied -> user must select a project
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new contact without selecting a project"
                                    )
                                ];
                            }
                        }
                    }
                );
            }
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
