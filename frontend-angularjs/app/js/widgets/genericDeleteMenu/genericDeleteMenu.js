/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A widget soft delete and restore icons
     */
    module.directive('genericDeleteMenuWidget', function () {
        return {
            'restrict': 'E',
            'controller': 'GenericDeleteMenuWidgetController',
            'templateUrl': 'js/widgets/genericDeleteMenu/genericDeleteMenu.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'scope': {
                'modelObject': '='
            }
        };
    });

    module.controller('GenericDeleteMenuWidgetController', function (
        $window,
        $uibModal,
        IconImagesService,
        toaster,
        $scope,
        $rootScope,
        confirmDialogWidget,
        gettextCatalog
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.icons = IconImagesService.mainActionIcons;
        };

        /**
         * Restore modelObject
         * @returns {*}
         */
        vm.restoreModelObject = function () {
            vm.modelObject.$restore().then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Restored"));
                    $rootScope.$broadcast('objectRestoredEvent');
                },
                function error (rejection) {
                    console.log(rejection);
                    if (rejection.data && rejection.data.non_field_errors) {
                        toaster.pop('error', gettextCatalog.getString("Restore failed"),
                            rejection.data.non_field_errors.join(" ")
                        );
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Restore failed"));
                    }
                }
            );
        };

        /**
         * On trash button click present a modal dialog that asks the user whether to really trash
         * the modelObject or not
         * @returns {*}
         */
        vm.trashModelObject = function () {
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Trash?'),
                message: gettextCatalog.getString('Do you really want to trash this element'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Trash'),
                dialogKey: 'TrashElementFromDeleteMenu'
            });

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        vm.modelObject.$softDelete().then(
                            function success (response) {
                                toaster.pop('success', gettextCatalog.getString("Trashed"));
                                $rootScope.$broadcast('objectTrashedEvent');
                            },
                            function error (rejection) {
                                if (rejection.data && rejection.data.non_field_errors) {
                                    toaster.pop('error', gettextCatalog.getString("Trash failed"),
                                        rejection.data.non_field_errors.join(" ")
                                    );
                                } else {
                                    toaster.pop('error', gettextCatalog.getString("Trash failed"));
                                }
                            }
                        );
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };
    });
})();
