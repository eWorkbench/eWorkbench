/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Controller for the Task Board Column Change Modal Dialog
     * This Modal Dialog provides the ability to
     * - edit title, color and task_state
     * - delete the column
     */
    module.controller('KanbanboardColumnChangeModalController', function (
        $uibModalInstance,
        IconImagesService,
        KanbanboardRestService,
        column,
        kanbanboard,
        gettextCatalog,
        toaster
    ) {
        var vm = this;

        /**
         * Delete Icon
         * @type {string}
         */
        vm.deleteIcon = IconImagesService.mainActionIcons.delete;

        /**
         * The column that is updated
         * @type {column|*}
         */
        vm.column = column;

        /**
         * The kanban board that the column that is updated belongs to
         * @type {kanbanboard|*}
         */
        vm.kanbanboard = kanbanboard;

        /**
         * Dict of errors (filled on save)
         * @type {{}}
         */
        vm.errors = {};

        /**
         * Delete column
         */
        vm.delete = function () {
            vm.errors = {};

            // get index of the column
            var idx = vm.kanbanboard.kanban_board_columns.indexOf(vm.column);

            if (idx == -1) {
                console.error("Could not find the column...");

                return;
            }

            // copy columns (so we can easily revert deleting if deleting fails)
            var copiedColumns = angular.copy(vm.kanbanboard.kanban_board_columns);

            // remove the element from the copied array
            copiedColumns.splice(idx, 1);

            KanbanboardRestService.updatePartial({
                'pk': vm.kanbanboard.pk,
                'kanban_board_columns': copiedColumns
            }).$promise.then(
                function success (response) {
                    // worked! now we can splice the column from the original kanban board columsn array
                    vm.kanbanboard.kanban_board_columns.splice(idx, 1);

                    // close the modal and send the updated column to the parent
                    $uibModalInstance.close();
                },
                function error (rejection) {
                    console.log(rejection);

                    if (rejection.data.non_field_errors) {
                        toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.non_field_errors);
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Failed to delete column")
                        );
                    }
                }
            );
        };

        /**
         * Save column details
         */
        vm.save = function () {
            vm.errors = {};

            // save the columns via REST API
            KanbanboardRestService.updatePartial({
                'pk': vm.kanbanboard.pk,
                'kanban_board_columns': vm.kanbanboard.kanban_board_columns
            }).$promise.then(
                function success (response) {
                    // close the modal and send the updated column to the parent
                    $uibModalInstance.close(vm.column);
                },
                function error (rejection) {
                    console.log(rejection);

                    if (rejection.data.kanban_board_columns) {
                        // we are only interested in errors of kanban_board_columns
                        var errors = rejection.data.kanban_board_columns;
                        var idx = vm.kanbanboard.kanban_board_columns.indexOf(vm.column);

                        vm.errors = errors[idx];
                    } else if (rejection.data.non_field_errors) {
                        toaster.pop('error', rejection.data.non_field_errors.join(", "));
                    }
                }
            );
        };

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
