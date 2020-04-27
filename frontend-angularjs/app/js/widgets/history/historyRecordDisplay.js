/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A simple directive which decides how to render "value" based on "fieldName"
     * e.g., if fieldName == "project", then the value is rendered as a project-link
     */
    module.directive('historyRecordDisplayWidget', function () {
        return {
            restrict: 'E',
            scope: {
                changesetType: '=',
                fieldName: '=',
                value: '='
            },
            templateUrl: 'js/widgets/history/historyRecordDisplay.html'
        };
    });
})();
