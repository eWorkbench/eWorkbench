/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    /**
     * Define a new plugin called "on_enter_key" which handles onKeyDown events for keyCode 13 (enter key)
     *
     * This is done by triggering an 'enter' event within selectize. You can listen on that event as follows:
     * ``selectize.on('enter', function () { });``
     */
    Selectize.define('on_enter_key', function (options) {
        var self = this;

        /**
         * Register onKeyDown event handler
         */
        this.onKeyDown = (function (e) {
            // store "normal" on key down
            var superOnKeyDown = self.onKeyDown;

            return function (e) {
                if (e.keyCode === 13) {
                    // trigger the enter event (with a setTimeout to be sure; yaay javaScript yaay .....)
                    setTimeout(function () {
                        self.trigger('enter');
                    });
                    // prevent the default action
                    e.preventDefault();
                }

                // call the normal on key down
                return superOnKeyDown.apply(this, arguments);
            }
        })();
    });
})();


