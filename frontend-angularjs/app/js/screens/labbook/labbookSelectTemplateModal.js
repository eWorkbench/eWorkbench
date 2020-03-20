/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Controller for selecting a LabBook Template and loading child elements from the template
     */
    module.controller('LabbookSelectTemplateModalController', function (
        $scope,
        $uibModalInstance,
        LabbookRestService,
        LabbookChildElementsRestService,
        gettextCatalog,
        toaster
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * A list of labbooks that are templates
             * @type {Array}
             */
            vm.labbooks = [];

            /**
             * The currently selected labbook
             * @type {null}
             */
            vm.selectedLabbookPk = null;

            /**
             * List of childElements of the selected labbook
             * @type {Array}
             */
            vm.childElements = [];

            /**
             * A dictionary of the selected child elements
             * @type {{}}
             */
            vm.selectedChildElements = {};

            /**
             * A dictionary of childElements within sections, with the section.pk as the first level key
             * @type {{}}
             */
            vm.sectionChildElements = {};

            /**
             * A dictionary of the selected child elements of sections, with the section.pk as the first level key
             * @type {{}}
             */
            vm.selectedSectionChildElements = {}
        };

        /**
         * Selecting template means we need to know about all labbooks that are templates
         * Query the rest API is is_template=true
         */
        LabbookRestService.query({is_template: true}).$promise.then(
            function success (response) {
                // store labbooks
                vm.labbooks = response;
            },
            function error (rejection) {
                console.log(rejection);
                toaster.pop('error', gettextCatalog.getString("Error"),
                    gettextCatalog.getString("Failed to query LabBooks"));
            }
        );

        /**
         * Watch the selected labbook template
         * On change of the selected labbook template, query all child elements of the labook
         */
        $scope.$watch("vm.selectedLabbookPk", function (newVal, oldVal) {
            if (vm.selectedLabbookPk) {
                // reset child element list
                vm.childElements = [];
                // reset selected child elements
                vm.selectedChildElements = {};
                // reset section child element object
                vm.sectionChildElements = {};
                // reset selected section child elements
                vm.selectedSectionChildElements = {};

                LabbookChildElementsRestService(vm.selectedLabbookPk).query().$promise.then(
                    function success (response) {
                        vm.childElements = response;
                        if (vm.childElements && vm.childElements.length > 0) {
                            // get the child elements of all sections
                            vm.getSectionChildElements(vm.childElements);
                        }
                        if (vm.insertWholeTemplate) {
                            vm.checkAllBoxes();
                        }
                    },
                    function error (rejection) {
                        toaster.pop('error', gettextCatalog.getString("Failed to retrieve cells"));
                    }
                )
            }
        });

        /**
         * Watch the selectedChildElements
         * When a section is selected make sure the section child elements are selected too
         */
        $scope.$watchCollection("vm.selectedChildElements", function (newVal, oldVal) {
            if (vm.selectedChildElements && Object.keys(vm.selectedChildElements).length > 0) {
                // iterate over vm.selectedChildElements
                angular.forEach(vm.selectedChildElements, function (bool, pk) {
                    // get the child objects from the selected pk
                    var childElement = vm.childElements.filter(function (element) {
                        return element.pk === pk;
                    })[0];

                    // if a selected element is a section and has child_elements
                    if (vm.isSection(childElement) &&
                        childElement.child_object.child_elements &&
                        childElement.child_object.child_elements.length > 0) {
                        // the section is the child_object of the child element of the labbook
                        var section = childElement.child_object;

                        if (vm.selectedChildElements[childElement.pk] !== false) {
                            // set the first level of data
                            if (!vm.selectedSectionChildElements[section.pk]) {
                                vm.selectedSectionChildElements[section.pk] = {};
                            }
                            // iterate over the section child elements
                            for (var i = 0; i < section.child_elements.length; i++) {
                                // set all the section child element checkboxes to true if isn't set to false already
                                if (vm.selectedSectionChildElements[section.pk][section.child_elements[i]] !== false) {
                                    vm.selectedSectionChildElements[section.pk][section.child_elements[i]] = true;
                                }
                            }
                        }
                    }
                });
            }
        });

        /**
         * returns true if the labbook child element is a section, false if it is not
         */
        vm.isSection = function (childElement) {
            return childElement.child_object.content_type_model === 'labbooks.labbooksection';
        };

        /**
         * get the child elements of all section elements of the labbook
         */
        vm.getSectionChildElements = function (childElements) {
            // iterate over all labbook child elements
            for (var i = 0; i < childElements.length; i++) {
                var childElement = childElements[i];

                // if the child element is a section
                if (vm.isSection(childElement)) {
                    var sectionPk = childElement.child_object.pk;

                    // query the child elements of the section
                    vm.querySectionChildElements(sectionPk);
                }
            }
        };

        /**
         * query all child elements of a section and put the results in an object with the section pk as the key
         */
        vm.querySectionChildElements = function (sectionPk) {
            // setup the filter with the pk of the section as the value for the 'section' parameter
            var filter = {};

            filter['section'] =  sectionPk;
            // do the API query
            LabbookChildElementsRestService(vm.selectedLabbookPk).query(filter).$promise.then(
                function success (response) {
                    // set the child elements of the section in the vm.sectionChildElements
                    // object with the pk of the section as the key
                    vm.sectionChildElements[sectionPk] = response;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to retrieve section child elements"));
                }
            )
        };

        /**
         * checks all the checkboxes
         */
        vm.checkAllBoxes = function () {
            // iterate over childElements and add all of them
            for (var i = 0; i < vm.childElements.length; i++) {
                vm.selectedChildElements[vm.childElements[i].pk] = true;
                // if the child element is a section and the section has child elements itself
                if (vm.isSection(vm.childElements[i])
                    && vm.childElements[i].child_object.child_elements.length > 0) {
                    // the section is the child_object of the child element of the labbook
                    var section = vm.childElements[i].child_object;

                    // set the first level of data
                    vm.selectedSectionChildElements[section.pk] = {};
                    // iterate over the section child elements
                    for (var j = 0; j < section.child_elements.length; j++) {
                        // set all the section child element checkboxes to true
                        vm.selectedSectionChildElements[section.pk][section.child_elements[j]] = true;
                    }
                }
            }
        };

        /**
         * if `vm.insertWholeTemplate` changes, we need to add the elements to vm.selectedChildElements
         * and vm.selectedSectionChildElements
         */
        vm.toggleInsertWholeTemplate = function () {
            // reset selected child elements
            vm.selectedChildElements = {};
            // reset selected section child elements
            vm.selectedSectionChildElements = {};

            // check if the user wants to insert the whole template
            if (vm.insertWholeTemplate) {
                vm.checkAllBoxes();
            }
        };

        /**
         * When the user presses the "Insert" Button, we need to collect all child elements that should be added
         * and return it (via $uibModalInstance.close)
         */
        vm.insertIntoLabbook = function () {
            var collectedChildElements = [];
            var collectedSectionChildElements = {};

            // collect all labbook elements
            for (var i = 0; i < vm.childElements.length; i++) {
                var element = vm.childElements[i];

                if (vm.selectedChildElements[element.pk]) {
                    collectedChildElements.push(element);
                }
            }

            // collect all section child_elements where the section is selected
            angular.forEach(vm.sectionChildElements, function (childElements, sectionPk) {
                for (var i = 0; i < childElements.length; i++) {
                    var childElement = childElements[i];

                    // if there is an entry for the childElement in vm.selectedSectionChildElements
                    if (vm.selectedSectionChildElements[sectionPk] &&
                        vm.selectedSectionChildElements[sectionPk][childElement.pk]) {
                        // iterate over the selected labbook elements
                        for (var j = 0; j < collectedChildElements.length; j++) {
                            // and check if the section the section child element is in was selected
                            if (collectedChildElements[j].child_object.pk === sectionPk &&
                                vm.selectedChildElements[collectedChildElements[j].pk]) {
                                if (!collectedSectionChildElements[sectionPk]) {
                                    collectedSectionChildElements[sectionPk] = [];
                                }
                                // put that in the section import list
                                collectedSectionChildElements[sectionPk].push(childElement);
                            }
                        }
                    }
                    // collect all section child_elements where the section is not selected
                    if (collectedSectionChildElements[sectionPk] === undefined &&
                        vm.selectedSectionChildElements[sectionPk] &&
                        vm.selectedSectionChildElements[sectionPk][childElement.pk]) {
                        // put that in the labbook import list
                        collectedChildElements.push(childElement);
                    }
                }
            });

            // check if any child elements have been selected
            if (collectedChildElements.length == 0) {
                toaster.pop('error', gettextCatalog.getString("Error"),
                    gettextCatalog.getString("Please select at least one cell"));

                return;
            }

            // All Elements to be imported are added to this object as $uibModalInstance.close (promise)
            // can only return one value
            var allElements = {};

            allElements['collectedChildElements'] = collectedChildElements;
            allElements['collectedSectionChildElements'] = collectedSectionChildElements;
            // provide selected elements
            $uibModalInstance.close(allElements);
        };

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        }
    });
})();
