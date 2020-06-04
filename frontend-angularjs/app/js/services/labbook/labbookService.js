(function () {
    "use strict";

    var module = angular.module('services');

    module.service('LabbookService', function (
        $rootScope,
        $q,
        toaster,
        gettextCatalog,
        LabbookSectionsRestService
    ) {
        "ngInject";

        var service = {};

        /**
         * recalculates the position of sections and child elements after a child element deletion
         * @param childElement
         */
        service.recalculatePositions = function (allElements, childElement, updateFunction) {
            var
                doRecalculation = true,
                i = 0;

            if (childElement.width >= 20) {
                // recalculate all element positions, that come after the deleted element
                for (i; i < allElements.length; i++) {
                    var child = allElements[i];

                    if (child.position_y > childElement.position_y) {
                        child.position_y -= childElement.height;
                    }
                }
            } else {
                for (i = 0; i < allElements.length && doRecalculation; i++) {
                    // eslint-disable-next-line no-redeclare
                    var child = allElements[i];

                    // skip deleted childElement
                    if (child.pk != childElement.pk) {
                        // skip recalculation if the deleted childElement overlaps with another in the y axis
                        if (child.position_y == childElement.position_y) {
                            doRecalculation = false;
                        } else if (child.position_y > childElement.position_y) {
                            if (child.position_y < (childElement.position_y + childElement.height)) {
                                doRecalculation = false;
                            } else {
                                // if there is not overlap, recalculate all element positions
                                child.position_y -= childElement.height;
                            }
                        } else if ((child.position_y + child.height) > childElement.position_y) {
                            doRecalculation = false;
                        }
                    }
                    i++;
                }
            }
            if (doRecalculation) {
                updateFunction(allElements);

                return true;
            }

            return false;
        };

        /**
         * Removes an element from a section
         */
        service.removeFromCurrentSection = function (currentSection, labbookChildElementPk) {
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
                    d.resolve();
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data);
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

        return service;
    });
})();
