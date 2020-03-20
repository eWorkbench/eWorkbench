/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('screens');

    /**
     * Dummy component which makes sure we get the password reset token in the login screen controller
     */
    module.component('passwordReset', {
        template: '',
        controller: function ($stateParams) {
            "ngInject";
        }
    });
})();
