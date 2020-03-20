/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.service('elementLabelCreateEditModalService', function ($uibModal) {
        "ngInject";

        var service = {};

        service.openCreate = function () {
            return $uibModal.open({
                templateUrl: 'js/screens/elementLabel/elementLabelCreateEditModal.html',
                controller: 'ElementLabelCreateEditModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    isEditing: function () {
                        return false;
                    },
                    elementLabel: function () {
                        return null;
                    }
                }
            });
        };

        service.openEdit = function (elementLabel) {
            return $uibModal.open({
                templateUrl: 'js/screens/elementLabel/elementLabelCreateEditModal.html',
                controller: 'ElementLabelCreateEditModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    isEditing: function () {
                        return true;
                    },
                    elementLabel: function () {
                        return elementLabel;
                    }
                }
            });
        };

        return service;
    });

    module.controller('ElementLabelCreateEditModalController', function (
        $uibModalInstance,
        gettextCatalog,
        toaster,
        ElementLabelRestService,
        // provided by $uibModal.open
        elementLabel,
        isEditing
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            /**
             * Whether this modal dialog is meant for editing or not
             * @type {boolean}
             */
            vm.isEditing = isEditing;

            /**
             * Name of the label
             * @type {string}
             */
            vm.name = '';

            /**
             * Color of the label
             * @type {string}
             */
            vm.color = 'rgba(50,50,50,1)';

            // set title of the directory that is being edited
            if (isEditing && elementLabel) {
                vm.name = elementLabel.name;

                vm.elementLabel = elementLabel;

                vm.color = elementLabel.color;
            }

            /**
             * Error Dictionary for errors coming from REST API
             * @type {{}}
             */
            vm.errors = {};

            /**
             * All directories of this drive
             * @type {Array}
             */
            vm.directories = [];
        };

        /**
         * Save changes via REST API, close the modal afterwards
         */
        vm.save = function () {
            var data = {
                'name': vm.name,
                'color': vm.color
            };

            if (vm.isEditing) {
                data['pk'] = vm.elementLabel.pk;

                // update directory via REST API
                ElementLabelRestService.updatePartial(data).$promise.then(
                    function success (response) {
                        vm.elementLabel.name = vm.name;
                        vm.elementLabel.color = vm.color;
                        $uibModalInstance.close(response);
                    },
                    function error (rejection) {
                        vm.errors = rejection.data;
                    }
                );
            } else {
                // create directory via REST API
                ElementLabelRestService.create(data).$promise.then(
                    function success (response) {
                        $uibModalInstance.close(response);
                    },
                    function error (rejection) {
                        vm.errors = rejection.data;
                    }
                );
            }
        };

        /**
         * Dismiss the modal
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    })
})();
