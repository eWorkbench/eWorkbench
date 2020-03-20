/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @description
     * A directive for uploading files
     * ToDo: Replace with ngf-select
     *
     * @deprecated Use ngf-select instead
     */
    module.directive('filesModel', function () {
        return {
            restrict: 'A',
            controller: function ($parse, $element, $attrs, $scope) {
                var exp = $parse($attrs.filesModel);

                $element.on('change', function () {
                    exp.assign($scope, this.files);
                    $scope.$apply();
                });
            }
        };
    });
})();
