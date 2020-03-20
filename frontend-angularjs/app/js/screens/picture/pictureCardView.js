/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Picture List as cards
     */
    module.component('pictureCardView', {
        templateUrl: 'js/screens/picture/pictureCardView.html',
        controller: 'PictureCardViewController',
        controllerAs: 'vm',
        bindings: {
            'pictures': '<',
            'searchField': '<'
        }
    });

    /**
     * Controller for picture list as cards
     */
    module.controller('PictureCardViewController', function () {
        "ngInject";
    });
})();
