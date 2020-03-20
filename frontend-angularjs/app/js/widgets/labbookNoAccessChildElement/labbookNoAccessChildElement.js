/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    module.directive('labbookNoAccessChildElementWidget', function () {
        return {
            templateUrl: 'js/widgets/labbookNoAccessChildElement/labbookNoAccessChildElement.html',
            controller: 'LabbookNoAccessChildElementWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                element: '='
            }
        }
    });

    module.controller('LabbookNoAccessChildElementWidgetController', function (
        $scope,
        IconImagesService,
        confirmDialogWidget,
        gettextCatalog
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Whether the menu (drag&drop, ...) for the current child element is currently shown or not
             * This is automatically set in onMouseEnter/onMouseLeave
             * @type {boolean}
             */
            vm.showElementMenu = false;

            /**
             * whether the mouse is currently inside of the menu
             * @type {boolean}
             */
            vm.mouseIsInsideMenu = false;

            /**
             * Whether the dropdown menu is currently shown or not
             * @type {boolean}
             */
            vm.dropDownMenuActive = false;

            vm.actionIcons = IconImagesService.mainActionIcons;
        };

        /**
         * On Mouse Enter show the menu icons
         */
        vm.onMouseEnter = function () {
            vm.showElementMenu = true;
            vm.mouseIsInsideMenu = true;
        };

        /**
         * On Mouse Leave hide the menu icons
         */
        vm.onMouseLeave = function () {
            vm.mouseIsInsideMenu = false;
            if (vm.showElementMenu && vm.dropDownMenuActive) {
                console.log("Keeping dropdown menu active for now");
            } else {
                vm.showElementMenu = false;
            }
        };

        /**
         * Called when the dropdown menu is opened or closed
         * When it is closed, we need to check if the mouse has left and we should hide menu
         * @param open
         */
        vm.dropdownMenuToggled = function (open) {
            if (!vm.mouseIsInsideMenu && open == false) {
                vm.showElementMenu = false;
            }
        };

        /**
         * Asks the user if they want to remove this element from the labbook
         * The element will only be removed from the labbook, but will stay available for edit in the workbench
         */
        vm.removeElementFromLabbook = function () {
            // create modal dialog
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Remove?'),
                message: gettextCatalog.getString('Do you really want to remove this element from your LabBook?'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Remove'),
                dialogKey: 'RemoveElementFromLabbook'
            });

            // react on the result of the modal dialog
            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        $scope.$emit("labbook-remove-child-element", {childElement: vm.element});
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };
    });
})();
