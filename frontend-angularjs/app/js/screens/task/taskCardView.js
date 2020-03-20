/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Task List as cards
     */
    module.component('taskCardView', {
        templateUrl: 'js/screens/task/taskCardView.html',
        controller: 'TaskCardViewController',
        controllerAs: 'vm',
        bindings: {
            'tasks': '<'
        }
    });

    /**
     * Controller for task list as cards
     */
    module.controller('TaskCardViewController', function () {
        "ngInject";

    });
})();
