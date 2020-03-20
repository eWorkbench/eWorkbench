/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    /**
     * Converts an arrayBuffer to a string
     * @param arrayBuf
     * @returns {string}
     */
    window.arrayBufferToString = function (arrayBuf) {
        var uintBuffer = new window.Uint8Array(arrayBuf);
        var length = uintBuffer.length;
        var result = "";
        var addition = Math.pow(2,8);

        // bulk import 2^8 bytes from array
        for (var i = 0; i < length; i += addition) {

            if (i + addition > length) {
                addition = length - i;
            }

            // convert it to a string
            result += String.fromCharCode.apply(null, uintBuffer.subarray(i, i + addition));
        }

        return result;
    };
})();
