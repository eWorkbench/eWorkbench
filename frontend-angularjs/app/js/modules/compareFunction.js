/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('compareFunctions', []);

    /**
     * Compares the references of the given objects.
     * @param left
     * @param right
     * @returns {number}
     */
    function compareReference (left, right) {
        // check for same reference
        if (left === right) {
            return 0;
        }

        // check for null
        if (!left && !right) {
            return 0;
        } else if (!left || !right) {
            return -1;
        }

        return 0;
    }

    /**
     * Compares metadata entries for equality.
     * @param left
     * @param right
     * @returns {*}
     */
    function compareMetadata (left, right) {
        var referenceCheck = compareReference(left, right);

        if (referenceCheck !== 0) {
            return referenceCheck;
        }

        // check values of the entry
        if (compareMetadataValuesObject(left, right) !== 0) {
            return -1;
        }

        return 0;
    }

    /**
     * Compares the 'values' object of metadata objects for equality.
     * @param left
     * @param right
     * @returns {number}
     */
    function compareMetadataValuesObject (left, right) {
        // check that left values are contained in right values
        for (var prop in left) {
            if (left.hasOwnProperty(prop)) {
                if (!right.hasOwnProperty(prop)) {
                    return -1;
                }

                if (compareMetadataValue(left[prop], right[prop]) !== 0) {
                    return -1;
                }
            }
        }

        // check that right values are contained in left values
        for (var rightProp in right) {
            if (right.hasOwnProperty(rightProp) && !left.hasOwnProperty(rightProp)) {
                return -1;
            }
        }

        return 0;
    }

    /**
     * Compares individual metadata values for equality.
     * @param left
     * @param right
     * @returns {*}
     */
    function compareMetadataValue (left, right) {
        // check for moment.js objects
        // (e.g. DateTimePicker converts values to moment objects)
        if (moment.isMoment(left) || moment.isMoment(right)) {
            return moment(left).diff(moment(right), 'minutes');
        }

        // no moment object -> do a normal comparison
        if (!angular.equals(left, right)) {
            return -1;
        }

        return 0;
    }

    /**
     * Compares arrays without checking the content.
     * @param left
     * @param right
     * @returns {number}
     */
    function compareArray (left, right) {
        if (left != right) {

            if (left && right) {

                var leftSize = left.length;
                var rightSize = right.length;

                // array length has to be the same
                if (leftSize === rightSize) {
                    left.sort();
                    right.sort();

                    for (var i = 0; i < leftSize; i++) {
                        if (left[i] !== right[i]) {
                            return -1;
                        }
                    }

                    return 0;
                }

                return -1;
            }

            return -1;
        }

        return 0;
    }

    var compareFunctionFactory = {
        /**
         * @param compareMethod {string} the compare method type (either "date" or "object")
         * @param modelFields {string[]}
         */
        getCompareFunction: function (compareMethod, modelFields, compareModeDateGranularity) {
            var self = {};

            self.compareModeDateGranularity = compareModeDateGranularity;
            self.modelFields = modelFields;

            if (compareMethod == 'object') {
                /**
                 * Compare normal objects (e.g., string)
                 * @param left
                 * @param right
                 * @returns {boolean} true (or something != 0), if left is different from right
                 */
                self.compareDetail = function (left, right) {
                    return (left != right);
                };
            } else if (compareMethod == 'deepEquals') {
                /**
                 * Compare json objects with a deep equals
                 * @param left
                 * @param right
                 * @returns {boolean} true (or something != 0), if left is different from right
                 */
                self.compareDetail = function (left, right) {
                    return !angular.equals(left, right);
                };
            } else if (compareMethod == 'date') {
                /**
                 * Compare moment date objects
                 * @param left
                 * @param right
                 * @returns {*}
                 */
                self.compareDetail = function (left, right) {
                    if (left != right) {
                        if (moment.isMoment(left) && moment.isMoment(right)) {
                            return moment(left).diff(moment(right), self.compareModeDateGranularity);
                        } else if (moment.isMoment(left) != moment.isMoment(right)) {
                            return -1;
                        }
                    }

                    return 0;
                }
            } else if (compareMethod == 'html') {
                /**
                 * Compare Detail for HTML elements
                 * puts the elements into jquery nodes
                 * @param left
                 * @param right
                 * @returns {number}
                 */
                self.compareDetail = function (left, right) {
                    // Occasionally the text template stored in the backend does not have
                    // a html paragraph and therefore causes an error
                    try {
                        var rightNode = jQuery(right);

                    } catch (err) {
                        right = "<p>" + right + "</p>";
                        rightNode = jQuery(right);
                    }

                    try {
                        var leftNode = jQuery(left);

                    } catch (err) {
                        left = "<p>" + left + "</p>";
                        leftNode = jQuery(left);
                    }


                    if (leftNode.length != rightNode.length) {
                        return 1;
                    }


                    for (var i = 0; i < leftNode.length; i++) {
                        // compare left and right node
                        if (!window.domElementEquals(leftNode[i], rightNode[i])) {
                            // difference found
                            return -1;
                        }
                    }

                    return 0;
                }
            } else if (compareMethod == 'array') {
                /**
                 * compare the contents of two arrays
                 * return
                 *      0: arrays are the same
                 *     -1: arrays are different
                 * @param left
                 * @param right
                 */
                self.compareDetail = function (left, right) {
                    return compareArray(left, right);
                };
            } else if (compareMethod == 'task_checklist') {
                /**
                 * compare the contents of a checklist
                 * return
                 *      0: arrays are the same
                 *     -1: arrays are different
                 * @param left
                 * @param right
                 */
                self.compareDetail = function (left, right) {
                    if (left != right) {

                        if (left && right) {

                            var leftSize = left.length;
                            var rightSize = right.length;

                            // array length has to be the same
                            if (leftSize === rightSize) {
                                // set the compareValue default to -1 and only to 0 when everything is the same
                                var compareValue = -1;

                                for (var i = 0; i < rightSize; i++) {
                                    // the compareValue has to be 0 after the inner 'for' has been completed else no
                                    // values from the left side fit to the one on the right side
                                    // only at the first round the compareValue can not be 0 (i == 0)
                                    if (i === 0 || compareValue === 0) {
                                        compareValue = -1;
                                        for (var j = 0; j < leftSize; j++) {
                                            // is true when a new object was added and received from the api so the
                                            // primary key was set on the new object but not on the old one.
                                            // Anyway both are the same object
                                            if (right[i].pk && !left[j].pk && right[i].title === left[j].title
                                                && right[i].checked === left[j].checked) {
                                                compareValue = 0;
                                                break;
                                            } else if (right[i].pk === left[j].pk && right[i].title === left[j].title
                                                && right[i].checked === left[j].checked) {
                                                //true when the two objects have the same values
                                                compareValue = 0;
                                                break;
                                            }
                                        }
                                    }
                                }

                                return compareValue;
                            }

                            return -1;
                        }

                        return -1;
                    }

                    return 0;
                };
            } else if (compareMethod === 'metadata') {
                self.compareDetail = compareMetadata;
            }

            if (modelFields && modelFields.length > 0) {
                /**
                 * Compare model fields
                 * @param left
                 * @param right
                 * @returns {number}
                 */
                self.compare = function (left, right) {
                    if (left == null || right == null) {
                        return 1;
                    }

                    // iterate over all model fields
                    for (var i = 0; i < self.modelFields.length; i++) {
                        var key = self.modelFields[i];

                        // for the given key compare the values of the left and right
                        var compareValue = self.compareDetail(left[key], right[key]);

                        // if a difference is detected, we can return
                        if (compareValue != 0) {
                            return compareValue;
                        }
                    }

                    return 0;
                };
            } else {
                self.compare = self.compareDetail;
            }

            return self;
        }
    };

    module.service('compareFunctionFactory', function () {
        return compareFunctionFactory.getCompareFunction;
    });
})();
