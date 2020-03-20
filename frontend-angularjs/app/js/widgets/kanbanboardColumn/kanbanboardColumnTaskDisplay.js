/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Directive for displaying a Task within a Task Board Column
     * Handles editing the task, its privileges, etc...
     */
    module.directive('kanbanboardColumnTaskDisplayWidget', function () {
        return {
            'restrict': 'E',
            'controller': 'KanbanboardColumnTaskDisplayWidgetController',
            'templateUrl': "js/widgets/kanbanboardColumn/kanbanboardColumnTaskDisplay.html",
            'scope': {
                'column': '=',
                'taskAssignment': '=',
                "removeTaskFromKanban": '='
            },
            'controllerAs': 'vm',
            'bindToController': true
        };
    });

    /**
     * Controller for the kanbanboardColumnTaskDisplayWidget directive
     */
    module.controller('KanbanboardColumnTaskDisplayWidgetController', function (
        $scope,
        $state,
        $uibModal,
        $timeout,
        AuthRestService,
        IconImagesService,
        WorkbenchElementChangesWebSocket,
        noteListModalService,
        objectPrivilegesModalService,
        recentChangesModalService
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * Whether the menu (drag&drop, ...) for the current child element is currently shown or not
             * This is automatically set in onMouseEnter/onMouseLeave
             * @type {boolean}
             */
            vm.showElementMenu = false;

            /**
             * Whether the dropdown menu is currently shown or not
             * @type {boolean}
             */
            vm.dropDownMenuActive = false;

            /**
             * Main Element icons (e.g., task, note, ...)
             * @type {{}|*}
             */
            vm.elementIcons = IconImagesService.mainElementIcons;

            /**
             * Action icons
             */
            vm.actionIcons = IconImagesService.mainActionIcons;

            /**
             * Generic icons
             * @type {*|genericIcons|{phone, email, history}}
             */
            vm.genericIcons = IconImagesService.genericIcons;

            /**
             * Icon for the Task
             */
            vm.taskIcon = IconImagesService.mainElementIcons.task;

            /**
             * Link to the meta data of the element
             * @type {string}
             */
            vm.elementLink = "";

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * Whether more details of the column should be shown (triggerd on mouse over)
             * @type {boolean}
             */
            vm.showMoreDetails = false;

            /**
             * Whether the given task is a full day task or not
             */
            vm.isFullDay = true;

            /**
             * Timer for showing more details per Task
             * @type {null}
             */
            vm.moreDetailsTimer = null;

            /**
             * Initialize WebSocket: Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                "task", vm.taskAssignment.task.pk, function onChange (jsonMessage) {
                    // this element has changed
                    if (jsonMessage['element_changed'] || jsonMessage['element_relations_changed']) {
                        // update the element
                        vm.taskAssignment.$get();
                    }
                }
            );

            /**
             * Unsubscribe Websocket when this controller is destroyed
             */
            $scope.$on("$destroy", function () {
                wsUnsubscribeFunction();
            });

            /**
             * Watch the task assignment / task and update the element link
             */
            $scope.$watch("vm.taskAssignment.task", function () {
                vm.elementLink = $state.href('task-view', {task: vm.taskAssignment.task});
            });

            /**
             * watch start_date/due_date and figure out if this is a full day task or not
             */
            $scope.$watchGroup(["vm.taskAssignment.task.start_date", "vm.taskAssignment.task.due_date"], function () {
                vm.checkForFullDayTask();
            });
        };

        /**
         * On Mouse Enter show the menu icons
         */
        vm.onMouseEnter = function () {
            vm.showElementMenu = true;
            startShowMoreDetails();
        };

        /**
         * On Mouse Leave hide the menu icons
         */
        vm.onMouseLeave = function () {
            if (vm.showElementMenu && vm.dropDownMenuActive) {
                console.log("Keeping dropdown menu active for now");
            } else {
                vm.showElementMenu = false;
                startHideMoreDetails();
            }
        };

        /**
         * Starts a timer for showing more details
         */
        var startShowMoreDetails = function () {
            if (vm.moreDetailsTimer) {
                $timeout.cancel(vm.moreDetailsTimer);
            }

            vm.moreDetailsTimer = $timeout(function () {
                vm.showMoreDetails = true;
            }, 500);
        };

        /**
         * Starts a timer for hiding details
         */
        var startHideMoreDetails = function () {
            if (vm.moreDetailsTimer) {
                $timeout.cancel(vm.moreDetailsTimer);
            }

            vm.moreDetailsTimer = $timeout(function () {
                vm.showMoreDetails = false;
            }, 250);
        };

        /**
         * Open the privileges modal dialog
         */
        vm.openPrivilegesModalDialog = function () {
            objectPrivilegesModalService.open("tasks", vm.taskAssignment.task);
        };

        /**
         * Removes the task from the kanban board column
         */
        vm.removeTask = function () {
            vm.removeTaskFromKanban(vm.taskAssignment);
        };

        /**
         * Opens the recent changes modal dialog
         */
        vm.openRecentChangesModalDialog = function () {
            recentChangesModalService.open(vm.taskAssignment.task);
        };

        /**
         * Opens the notes modal dialog
         */
        vm.openNotesModalDialog = function () {
            var modal = noteListModalService.open(vm.taskAssignment.task);

            modal.result.then(
                function closed () {
                    vm.taskAssignment.$get();
                },
                function dismissed () {

                }
            );
        };

        /**
         * Checks whether the start_date is start of day and due_date is end of day
         */
        vm.checkForFullDayTask = function () {
            var start_diff = moment(vm.taskAssignment.task.start_date).diff(
                moment(vm.taskAssignment.task.start_date).startOf("day"), 'minutes'
            );
            var end_diff = moment(vm.taskAssignment.task.due_date).diff(
                moment(vm.taskAssignment.task.due_date).endOf("day"), 'minutes'
            );

            vm.isFullDay = (start_diff == 0 && end_diff == 0);
        };

        /**
         * Returns the number of checked task checklist items
         */
        vm.getNumberOfCheckedItems = function () {
            var cnt = 0;

            for (var i = 0; i < vm.taskAssignment.task.checklist_items.length; i++) {
                if (vm.taskAssignment.task.checklist_items[i].checked == true) {
                    cnt += 1;
                }
            }

            return cnt;
        };
    });
})();
