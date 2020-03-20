/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Service for moving Labbook child elements to Labbook Sections
     */
    module.factory('moveLabbookElementToSectionModalService', function (
        $uibModal
    ) {
        var service = {};

        service.open = function (workbenchElement, element_id, labbook_pk, section, labbookChildElements) {
            return $uibModal.open({
                templateUrl: 'js/widgets/moveLabbookElementToSectionModal/moveLabbookElementToSectionModal.html',
                controller: 'MoveLabbookElementToSectionModalController',
                controllerAs: 'vm',
                size: 'lg',
                resolve: {
                    'workbenchElement': function () {
                        return workbenchElement;
                    },
                    'element_id': function () {
                        return element_id;
                    },
                    'labbook_pk': function () {
                        return labbook_pk;
                    },
                    'section': function () {
                        return section;
                    },
                    'labbookChildElements': function () {
                        return labbookChildElements;
                    }
                }
            });
        };

        return service;
    });

    module.controller('MoveLabbookElementToSectionModalController', function (
        $scope,
        $rootScope,
        $q,
        $uibModalInstance,
        WorkbenchElementsTranslationsService,
        toaster,
        gettextCatalog,
        workbenchElement,
        element_id,
        labbook_pk,
        section,
        labbookChildElements,
        LabbookSectionsRestService,
        LabbookChildElementsRestService
    ) {
        var vm = this;

        this.$onInit = function () {
            // a note, a file, a picture
            vm.workbenchElement = workbenchElement;
            // the pk of the labbook child element
            vm.labbookChildElementPk = element_id;
            // the pk of the labbook
            vm.labbookPk = labbook_pk;
            // the section if the element is currently within one
            vm.currentSection = section;
            // the childelements of the labbook, needed to show the other section as options to move elements to
            vm.labbookChildElements = labbookChildElements;
        };

        /**
         * Returns true if a labbook child element is a section
         */
        vm.isLabbookSection =  function (childElement) {
            if (childElement.child_object_content_type_model === 'labbooks.labbooksection') {
                return true;
            }

            return false;
        };

        /**
         * Starts the process of adding an element to a section
         */
        vm.moveElementToSection = function (childElement) {
            var section = childElement.child_object;

            section.child_elements.push(element_id);
            // now we need to get the lowest position availlable in the section grid
            vm.getPositionAtBottom(section);
            vm.close();
        };

        /**
         * Gets the lowest position in the section, so the new element can be added to the bottom
         */
        vm.getPositionAtBottom = function (section) {
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();
            var filters = {};

            // get the child elements of the section
            filters['section'] =  section.pk;
            LabbookChildElementsRestService(vm.labbookPk).query(filters).$promise.then(
                function success (response) {
                    vm.sectionChildElements = response;
                    // determine the maximum position_y + the height of this item
                    var maxY = 0;
                    var el = null,
                        i = 0;

                    for (i = 0; i < vm.sectionChildElements.length; i++) {
                        el = vm.sectionChildElements[i];

                        if (el.position_y + el.height > maxY) {
                            maxY = el.position_y + el.height;
                        }
                    }
                    // now we have the position lets actually add the element to the section
                    vm.addToSection(section, maxY);
                    d.resolve();
                }
            );

            return d.promise;
        };

        /**
         * Updates the position_y of an element = adding it to the bottom
         */
        vm.updatePositionOfChildElement = function (maxY) {
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            LabbookChildElementsRestService(vm.labbookPk).get({pk: vm.labbookChildElementPk}).$promise.then(
                function success (response) {
                    var childElement = response;

                    childElement.position_y = maxY;
                    childElement.$update();
                    d.resolve();
                }
            );

            return d.promise;
        };

        /**
         * Adds a child element to a section
         */
        vm.addToSection = function (section, maxY) {
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            var data = {
                'pk': section.pk,
                'child_elements': section.child_elements
            };

            LabbookSectionsRestService.updatePartial(data).$promise.then(
                function success (response) {
                    // triggers removal of the element from the top level labook grid, happens in labbookView.js
                    $rootScope.$emit("labbook-child-element-added-to-section", {element_id: element_id});
                    toaster.pop('success', gettextCatalog.getString("Element added to section"));
                    // removes the element from the current section, if it is in one
                    vm.removeFromCurrentSection(vm.currentSection, vm.labbookChildElementPk);
                    // update the position of the element to be at the bottom of its new section grid
                    vm.updatePositionOfChildElement(maxY);
                    d.resolve();
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data);
                        vm.errors = rejection.data;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Element"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Removes an element from a section
         */
        vm.removeFromCurrentSection = function (currentSection, labbookChildElementPk) {
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // if there is no current section, we stop the process here by returning the promise
            if (!currentSection) {
                return d.promise;
            }

            // remove the element from the child elements
            var currentChildElements = currentSection.child_object.child_elements;
            var child_elements = [];

            for (var i = 0; i < currentChildElements.length; i++) {
                if (currentChildElements[i] !== labbookChildElementPk) {
                    child_elements.push(currentChildElements[i]);
                }
            }
            var data = {
                'pk': currentSection.child_object.pk,
                'child_elements': child_elements
            };

            // updates the child elements using the new data
            LabbookSectionsRestService.updatePartial(data).$promise.then(
                function success (response) {
                    // trigger the removal of the element from the current grid
                    $rootScope.$emit("labbook-child-element-moved-from-section",
                        {element_id: labbookChildElementPk});
                    d.resolve();
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data);
                        vm.errors = rejection.data;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Element"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            );

            return d.promise;
        };

        vm.close = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
