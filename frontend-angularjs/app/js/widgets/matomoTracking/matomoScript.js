/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A directive to load the Matomo tracking script.
     * See also
     * - https://developer.matomo.org/guides/tracking-javascript-guide
     * - https://developer.matomo.org/guides/spa-tracking
     */
    module.directive('matomoScript', function () {
        return {
            restrict: 'E', // use only as HTML tag
            templateUrl: 'js/widgets/matomoTracking/matomoScript.html',
            controller: 'MatomoScriptController',
            controllerAs: 'vm',
            bindToController: true
        };
    });

    module.controller('MatomoScriptController', function (
        $injector
    ) {
        "ngInject";

        var matomoConfig = getMatomoConfig(),
            enabled = matomoConfig && Boolean(matomoConfig.url);

        if (enabled) {
            // the following function is defined as plain JavaScript in matomoScript.html
            // eslint-disable-next-line no-undef
            initMatomo(matomoConfig.url, matomoConfig.siteId); // jshint ignore:line
        }

        /**
         * Gets the matomo configuration or null.
         * @returns {*}
         */
        function getMatomoConfig () {
            // matomoConfig is optionally defined in app.local.js
            return $injector.has('matomoConfig') ? $injector.get('matomoConfig') : null;

        }
    });

})();
