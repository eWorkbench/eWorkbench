/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Note List as cards
     */
    module.component('noteCardView', {
        templateUrl: 'js/screens/note/noteCardView.html',
        controller: 'NoteCardViewController',
        controllerAs: 'vm',
        bindings: {
            'notes': '<',
            'searchField': '<'
        }
    });

    /**
     * Controller for note list as cards
     */
    module.controller('NoteCardViewController', function () {
        "ngInject";
    });
})();
