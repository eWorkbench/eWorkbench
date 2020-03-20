/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A modal that deletes a section element from the labook and
     * if the section has child elements it asks what to do with them: remove or move to labbook
     */
    module.factory('labbookSectionDeleteModalService', function (
        $uibModal
    ) {
        var service = {};

        service.open = function (section) {
            return $uibModal.open({
                templateUrl: 'js/widgets/labbookSectionDeleteModal/labbookSectionDeleteModal.html',
                controller: 'LabbookSectionDeleteModalModalController',
                controllerAs: 'vm',
                resolve: {
                    'section': function () {
                        return section;
                    }
                }
            });
        };

        return service;
    });

    module.controller('LabbookSectionDeleteModalModalController', function (
        $scope,
        $rootScope,
        $uibModalInstance,
        toaster,
        gettextCatalog,
        section,
        LabbookSectionsRestService
    ) {
        var vm = this;

        this.$onInit = function () {
            vm.radio = {
                result: 'remove'
            };

            vm.sectionLoaded = false;

            vm.getSection();
        };

        vm.getSection = function () {
            LabbookSectionsRestService.get({pk: section.pk}).$promise.then(
                function success (response) {
                    vm.section = response;
                    vm.sectionLoaded = true;
                },
                function error (rejection) {
                    console.log(rejection);
                    if (rejection.data && rejection.data.non_field_errors) {
                        toaster.pop('error', gettextCatalog.getString("Delete failed"),
                            rejection.data.non_field_errors.join(" ")
                        );
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Delete failed"));
                    }
                }
            );
        };

        vm.yesDelete = function () {
            if (vm.radio.result === 'remove') {
                // trigger removal of the child elements, happens in labbookView.js
                $rootScope.$emit("labbook-remove-all-section-child-elements", {
                    section: vm.section});
            }
            if (vm.radio.result === 'move') {
                // trigger moving of the child elements to the labbook, happens in labbookView.js
                $rootScope.$emit("labbook-move-all-section-child-elements-to-labbook", {
                    section: vm.section});
            }
            $uibModalInstance.close(true);
        };

        vm.cancel = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
