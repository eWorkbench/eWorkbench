/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function (window) {
    "use strict";

    /**
     * Compare two css inline style strings
     * E.g., "font-size: 10pt; color: #000000;" is equal to "font-size:10pt;color:#000000;"
     * @param leftStyleString
     * @param rightStyleString
     * @returns {boolean} whether or not the two style strings are equal
     */
    function cssInlineStyleEquals (leftStyleString, rightStyleString) {
        // split styles by ";" (so "font-size:10pt; color:red;" is converted to an array
        var leftStyles = leftStyleString.value.split(";"),
            rightStyles = rightStyleString.value.split(";");

        /**
         * Check if there are the same amount of styles in the style string
         */
        if (leftStyles.length != rightStyles.length) {
            // different amount of styles in the style string -> styles are different
            return false;
        }

        var j = 0,
            len = leftStyles.length;

        // compare all styles
        for (j = 0; j < len; j++) {
            // skip if the strings are equal
            if (leftStyles[j] == rightStyles[j]) {
                continue;
            }

            // split by first occurence of ":"
            var leftStyle = leftStyles[j].split(/:(.+)?/, 2);
            var rightStyle = rightStyles[j].split(/:(.+)?/, 2);

            // trim the style name
            var leftStyleName = jQuery.trim(leftStyle[0].toLowerCase());
            var rightStyleName = jQuery.trim(rightStyle[0].toLowerCase());

            // compare style names of left and right style
            if (leftStyleName != rightStyleName) {
                console.log("style name has changed");

                return false;
            }

            // trim the style values
            var leftStyleValue = jQuery.trim(leftStyle[1].toLowerCase());
            var rightStyleValue = jQuery.trim(rightStyle[1].toLowerCase());

            // finally, compare the values of the left and right style
            if (leftStyleValue != rightStyleValue) {
                return false;
            }
        }

        return true;
    }


    /**
     * Compares two dom elements with all their attributes, inner text, and children
     * Method is invoked recursively on all children
     * @param left the first DOM element to compare
     * @param right the second DOM element to compare the first DOM element with
     * @returns {boolean} whether the two dom elements are equal or not
     */
    function domElementEquals (left, right) {
        var i = 0,
            len1 = 0,
            len2 = 0;

        /**
         * We are going to perform some basic checks on the two DOM elements
         * 1. compare inner texts (if they are different, the DOM elements are different)
         * 2. compare node names (if they are different, the DOM elements are different)
         * 3. compare attributes of DOM elements
         *   3.a if there is a different amount of attributes, the DOM elements are different
         *   3.b compare the actual attribute values
         * 4. compare child elements of both nodes
         */

        // 1. compare inner texts (if they are set)
        if (left.innerText != right.innerText) {
            /**
             * inner text is different
             * e.g., <p>hello world</p> -> inner text: hello world
             *       <p>hello waldo</p> -> inner text: hello waldo
             */
            return false;
        }

        // 2. compare node names
        if (left.nodeName != right.nodeName) {
            /**
             * Node names are different
             * e.g., <h1>Hello World</h1> -> node name: h1
             *       <h2>Hello World</h2> -> node name: h2
             *       <span>Hello World</span> -> node name: span
             */
            return false;
        }

        // 3. compare left and right attributes (make sure they exist)
        if (left.attributes && right.attributes) {
            // 3.a check amount of attributes
            if (left.attributes.length != right.attributes.length) {
                // left and right attribute lengths differ
                return false;
            }

            len1 = left.attributes.length;

            // 3.b compare values of attributes (e.g., width, height and src of an img, or the style attribute)
            for (i = 0; i < len1; i++) {
                // get left attribute
                var leftAttribute = left.attributes[i];

                /**
                 * Try to find the attribute with name "leftAttribute" in the list of attribute sof the right DOM
                 * element. This allows different ordering of the attributes, e.g.:
                 * <img width="128" height="128" src="hello.png"/>
                 * is equal to
                 * <img height="128" src="hello.png" width="128" />
                 */
                var rightAttribute = right.attributes[leftAttribute.nodeName];

                if (!rightAttribute) {
                    // could not find right attribute -> elements are different
                    return false;
                }

                // compare the node names (this should never fail)
                if (leftAttribute.nodeName != rightAttribute.nodeName) {
                    /**
                     * This should not happen ever, as we select rightAttribute by looking up the nodename
                     * rightAttribute = right.attributes[leftAttribute.nodeName]
                     */
                    console.error("nodeName differs - this should not have happened!");

                    return false;
                }

                if (leftAttribute.nodeName != "style") {
                    // normal case: compare values
                    if (leftAttribute.value != rightAttribute.value) {
                        // values differ

                        return false;
                    }
                } else {
                    /**
                     * attribute name is style
                     * comparing style works different
                     * we can not just compare the values, as for a string comparison
                     * "font-size: 10pt;" != "font-size:10pt"
                     * However, the above example should yield true when calling "cssInlineStyleEquals"
                     */
                    if (!cssInlineStyleEquals(leftAttribute, rightAttribute)) {
                        return false;
                    }
                }
            }
        }

        // 4. check that both, the left and the right dom element have the same children
        if (left.children && right.children) {
            // verify that left and right element have the same amount of children
            if (left.children.length != right.children.length) {
                console.log("Different child length");

                return false;
            }

            len2 = left.children.length;

            for (i = 0; i < len2; i++) {
                // compare left and right child
                if (!domElementEquals(left.children[i], right.children[i])) {
                    // childs are different -> elements are different
                    return false;
                }
            }
        }

        return true;
    }

    window.domElementEquals = domElementEquals;
    window.cssInlineStyleEquals = cssInlineStyleEquals;
})(window);
