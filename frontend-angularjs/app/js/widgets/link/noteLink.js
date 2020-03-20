/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a userDisplay object coming from the REST API
     */
    module.directive('noteLink', function () {
        return {
            templateUrl: 'js/widgets/link/noteLink.html',
            controller: "NoteLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                note: '='
            }
        }
    });

    module.controller('NoteLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch Note and generate an URL for the given note
         */
        $scope.$watch("vm.note", function () {
            if (vm.note) {
                vm.noteUrl = $state.href("note-view", {note: vm.note});
            } else {
                vm.noteUrl = "";
            }
        });
    });
})();
