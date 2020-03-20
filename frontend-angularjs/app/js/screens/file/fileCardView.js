/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * File List as cards
     */
    module.component('fileCardView', {
        templateUrl: 'js/screens/file/fileCardView.html',
        controller: 'FileCardViewController',
        controllerAs: 'vm',
        bindings: {
            'files': '<'
        }
    });

    /**
     * Controller for file list as cards
     */
    module.controller('FileCardViewController', function () {
        "ngInject";

        // var vm = this;
    });
})();
