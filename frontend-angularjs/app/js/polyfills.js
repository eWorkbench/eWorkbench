/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    /**
     * Polyfill for Canvas .toBlob (needed for IE11)
     * From https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
     */
    if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {
                var canvas = this;

                setTimeout(function () {

                    var binStr = atob( canvas.toDataURL(type, quality).split(',')[1] ),
                        len = binStr.length,
                        arr = new window.Uint8Array(len);

                    for (var i = 0; i < len; i++ ) {
                        arr[i] = binStr.charCodeAt(i);
                    }

                    callback( new Blob( [arr], {type: type || 'image/png'} ) );

                });
            }
        });
    }


    /**
     * Polyfill for string startsWith (needed for IE11)
     */
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;

            return this.indexOf(searchString, position) === position;
        };
    }


    /**
     * Polyfill for array includes
     * https://tc39.github.io/ecma262/#sec-array.prototype.includes
     */
    /* eslint-disable */
    if (!Array.prototype.includes) {
        Object.defineProperty(Array.prototype, 'includes', {
            value: function (searchElement, fromIndex) {

                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                // 1. Let O be ? ToObject(this value).
                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If len is 0, return false.
                if (len === 0) {
                    return false;
                }

                // 4. Let n be ? ToInteger(fromIndex).
                //    (If fromIndex is undefined, this step produces the value 0.)
                var n = fromIndex | 0;

                // 5. If n ≥ 0, then
                //  a. Let k be n.
                // 6. Else n < 0,
                //  a. Let k be len + n.
                //  b. If k < 0, let k be 0.
                var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

                function sameValueZero(x, y) {
                    return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
                }

                // 7. Repeat, while k < len
                while (k < len) {
                    // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                    // b. If SameValueZero(searchElement, elementK) is true, return true.
                    if (sameValueZero(o[k], searchElement)) {
                        return true;
                    }
                    // c. Increase k by 1.
                    k++;
                }

                // 8. Return false
                return false;
            }
        });
    }
    /* eslint-enable */

    Array.prototype.diff = function (a) {
        return this.filter(function (i) {
            return a.indexOf(i) < 0;
        });
    };

    Array.prototype.intersection = function (arr) {
        return this.filter(function (e) {
            return arr.indexOf(e) > -1;
        });
    };

})();