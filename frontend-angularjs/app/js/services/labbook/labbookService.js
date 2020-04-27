(function () {
    "use strict";

    var module = angular.module('services');

    module.service('LabbookService', function () {
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

        return service;
    });
})();
