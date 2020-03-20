/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A simple directive that makes the function buttons for relations (unlink, private) "dryer"
     */
    module.directive('displayRelationFunctionsWidget', function () {
        return {
            'templateUrl': 'js/widgets/displayRelationWidget/displayRelationFunctions.html'
        }
    });
})();
