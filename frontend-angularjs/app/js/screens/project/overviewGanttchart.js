/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Shows the gantt chart.
     */
    module.component('overviewGanttchart', {
        templateUrl: 'js/screens/project/overviewGanttchart.html',
        controller: 'OverviewGanttchartController',
        controllerAs: 'vm',
        bindings: {
            'project': '='
        }
    });

    /**
     * Controller for gantt chart screen.
     */
    module.controller('OverviewGanttchartController', function (
        $scope,
        $rootScope,
        $state,
        $filter,
        AuthRestService,
        IconImagesService,
        CalendarConfigurationService,
        gettextCatalog,
        toaster,
        ProjectRestService,
        projectCreateModalService,
        amMoment
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * list of all projects
             * @type {Array}
             */
            vm.displayProjects = [];

            /**
             * whether the project data has been loaded
             * @type {boolean}
             */
            vm.projectsLoaded = false;

            /**
             * Current User
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            vm.editIcon = IconImagesService.mainActionIcons.edit;

            /**
             * set language
             */
            amMoment.changeLocale(CalendarConfigurationService.getOptions().locale);

            // formats the headers date
            vm.headersFormats = {
                'year': 'YYYY',
                'quarter': '[Q]Q YYYY',
                month: 'MMMM',
                week: 'w',
                day: 'D',
                hour: 'H',
                minute: 'HH:mm'
            };

            vm.loadProjects();
        };

        vm.loadProjects = function () {
            var filters = {
                'recursive_parent': vm.project.pk
            };

            return ProjectRestService.query(filters).$promise.then(
                function (response) {
                    vm.projectsDict = {};

                    for (var i = 0; i < response.length; i++) {
                        var prj = response[i];

                        vm.projectsDict[prj.pk] = prj;
                    }

                    vm.projectsDict[vm.project.pk] = vm.project;

                    vm.buildProjectTree(vm.projectsDict);
                    vm.projectsLoaded = true;
                });
        };

        /**
         * Opens the create project modal dialog
         */
        vm.openCreateProjectDialog = function () {
            var modalInstance = projectCreateModalService.open(vm.project.pk);

            modalInstance.result.then(
                function success (project) {
                    projectCreateModalService.viewElement(project);
                }
            );
        };

        /**
         * register the api for the gantt chart
         * @param api
         */
        vm.registerApi = function (api) {
            api.core.on.rendered($scope, function () {
                // set side width to undefined will resize automatically the side width to fit content
                api.side.setWidth(undefined);
            });
        };

        /**
         * builds the correct data structure for the gantt chart
         * @param projects
         */
        vm.buildProjectTree = function (projects) {
            vm.fullProjects = [];
            vm.displayProjects = [];

            // fullProjects is used to get a list which contains all projects that are given in
            // vm.project.project_tree with the difference that the project objects include all attributes
            // because vm.project.all_sub_project only contains the pk and name foreach project
            for (var i = 0; i < vm.project.project_tree.length; i++) {
                vm.fullProjects.push(angular.copy(projects[vm.project.project_tree[i].pk]));
            }

            // sort vm.fullProjects using the angularjs filter orderBy
            vm.fullProjects = $filter('orderBy')(vm.fullProjects, 'name');

            //build the tree in the correct syntax for the gantt
            for (var j = 0; j < vm.fullProjects.length; j++) {

                var contentStr = "<a class=\"ganttchart-item-display\" ui-sref=\"project-view({project: row.model.pk })\"> {{row.model.name}} " +
                    "<span class=\"fa fa-trash\" ng-show=\"row.model.deleted\"></span>" +
                    "</a>";

                var project = vm.fullProjects[j];

                if (!project) {
                    console.debug("Couldn't process project", project);
                    continue;
                }

                // verify that parent_project is defined
                if (vm.fullProjects[j].parent_project
                    && vm.fullProjects[j].parent_project != ""
                    && projects[vm.fullProjects[j].parent_project] != undefined) {
                    // it's a child - have to define the parent for the correct tree view
                    vm.fullProjects[j].parent = projects[vm.fullProjects[j].parent_project].name;
                    // enables the click on that project (on row as on task because the vm.fullProjects[j] row is also
                    // defined as task)
                    vm.fullProjects[j].content = contentStr;
                    // objects in tasks array where displayed as task - when the object is not in task array it would
                    // only be displayed in the row
                    vm.fullProjects[j].tasks = [];
                    vm.fullProjects[j].tasks.push(angular.copy(vm.fullProjects[j]));
                    vm.fullProjects[j].classes = "customize-row";
                    //finished object
                    vm.displayProjects.push(vm.fullProjects[j]);
                } else {
                    // this project has no parent project
                    // enables the click on that project (on row as on task because the vm.fullProjects[j] is also
                    // defined as task)
                    vm.fullProjects[j].content = contentStr;
                    // objects in tasks array where displayed as task - when the object is not in task array it would
                    // only be displayed in the row
                    vm.fullProjects[j].tasks = [];
                    vm.fullProjects[j].tasks.push(angular.copy(vm.fullProjects[j]));
                    vm.fullProjects[j].classes = "customize-row";
                    //finished object
                    vm.displayProjects.push(vm.fullProjects[j]);
                }

            }
        };

        /**
         * handles the click on a task
         * @param model
         */
        $scope.handleTaskIconClick = function (model) {
            $state.go('project-view', {
                project: model.pk
            });
        };
    });
})();
