/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    /**
     * Whether a jquery element has scrollbars (both, vertical or horizontal)
     * @returns {boolean}
     */
    jQuery.fn.hasScrollBar = function () {
        if (!this.get(0)) {
            return false;
        }

        return this.get(0).scrollHeight > this.innerHeight() || this.get(0).scrollWidth > this.innerWidth();
    };

    /**
     * Whether a jquery element has horizontal (left to right) scrollbars
     * @returns {boolean}
     */
    jQuery.fn.hasHorizontalScrollBar = function () {
        return this.get(0).scrollWidth > this.innerWidth();
    };

    /**
     * Whether a jquery element has vertical (top to bottom) scrollbars
     * @returns {boolean}
     */
    jQuery.fn.hasVerticalScrollBar = function () {
        return this.get(0).scrollHeight > this.innerHeight();
    };
})();
