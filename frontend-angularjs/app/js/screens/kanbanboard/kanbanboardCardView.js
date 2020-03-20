/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Kanbanboard List as cards
     */
    module.component('kanbanboardCardView', {
        templateUrl: 'js/screens/kanbanboard/kanbanboardCardView.html',
        controller: 'KanbanboardCardViewController',
        controllerAs: 'vm',
        bindings: {
            'kanbanboards': '<'
        }
    });

    /**
     * Controller for kanbanboard list as cards
     */
    module.controller('KanbanboardCardViewController', function () {
        "ngInject";

        // var vm = this;
    });
})();
