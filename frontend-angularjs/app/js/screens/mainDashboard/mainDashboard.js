/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('mainDashboard', {
        templateUrl: 'js/screens/mainDashboard/mainDashboard.html',
        controller: 'MainDashboardController',
        controllerAs: 'vm',
        bindToController: true,
        bindings: {}
    });

    /**
     * Main Controller
     *
     * Displays the mainDashboard overview page
     */
    module.controller('MainDashboardController',
        function (
            $state,
            $q,
            ProjectRestService,
            MyTaskRestService,
            HistoryRestService,
            DashboardService,
            gettextCatalog,
            toaster,
            WorkbenchElementsTranslationsService,
            ProjectSidebarService
        ) {
            'ngInject';

            var
                vm = this,
                changesPerPage = 9;

            this.$onInit = function () {
                // reset project sidebar
                ProjectSidebarService.project = null;

                /**
                 * dashboard all data
                 * @type {Array}
                 */
                vm.dashboardData = [];
                /**
                 * dashboard default config
                 * @type {Array}
                 */
                vm.dashboardConfig = [];

                /**
                 * list of documents
                 * @type {Array}
                 */
                vm.documents = [];
                /**
                 * list of contacts
                 * @type {Array}
                 */
                vm.contacts = [];
                /**
                 * list of history elements
                 * @type {Array}
                 */
                vm.histories = [];
                /**
                 * List of tasks
                 * @type {Array}
                 */
                vm.tasks = [];
                /**
                 * List of labbooks
                 * @type {Array}
                 */
                vm.labbooks = [];
                /**
                 * List of resources
                 * @type {Array}
                 */
                vm.resources = [];
                /**
                 * List of notes
                 * @type {Array}
                 */
                vm.notes = [];
                /**
                 * List of appointments
                 * @type {Array}
                 */
                vm.meetings = [];
                /**
                 * List of dmps
                 * @type {Array}
                 */
                vm.dmps = [];
                /**
                 * List statistics
                 * @type {Array}
                 */
                vm.summary = [];
                /**
                 * loading indicator
                 * @type {bool}
                 */
                vm.isLoading = true;

                vm.dataLoaded = false;

                $q.when()
                    .then(vm.getDashboardData)
                    .then(setDashboardConfig);
            };

            var setDashboardConfig = function () {
                /**
                 * dashboard default config
                 * @type {Array}
                 */
                vm.dashboardConfig = [
                    {
                        type: 'calendar',
                        size: 3
                    },
                    // {
                    //     type: 'activities',
                    //     size: 1,
                    //     data: vm.histories.splice(0, changesPerPage)
                    // },
                    {
                        type: 'tasks',
                        size: 2,
                        data: vm.tasks.splice(0, changesPerPage)
                    },
                    {
                        type: 'bubbles',
                        size: 1,
                        data: vm.summary
                    },
                    // {
                    //     type: 'notes',
                    //     size: 1,
                    //     data: vm.notes.splice(0, changesPerPage)
                    // },
                    {
                        type: 'projects',
                        size: 1,
                        data: vm.projectsSubset.splice(0, changesPerPage)
                    },
                    {
                        type: 'files',//===documents
                        size: 1,
                        data: vm.documents.splice(0, changesPerPage)
                    },
                    {
                        type: 'contacts',
                        size: 1,
                        data: vm.contacts.splice(0, changesPerPage)
                    },
                    {
                        type: 'resources',
                        size: 1,
                        data: vm.resources.splice(0, changesPerPage)
                    },
                    // {
                    //     type: 'labbooks',
                    //     size: 1,
                    //     data: vm.labbooks.splice(0, changesPerPage)
                    // },
                    {
                        type: 'dmps',
                        size: 1,
                        data: vm.dmps.splice(0, changesPerPage)
                    }
                ];

                // set css column class (for bootstrap grid) for each dashboard element
                for (var i = 0; i < vm.dashboardConfig.length; i++) {
                    var elem = vm.dashboardConfig[i];

                    elem.cssClass = getColumnClass(elem.size);
                }

                vm.isLoading = false;
            };

            /**
             * For a given value between 1 and 3 return the used bootstrap class
             */
            var getColumnClass = function (definedWidth) {
                var
                    cssClass = '';

                switch (definedWidth) {
                    case 1:
                        cssClass = 'col-xs-12 col-sm-6 col-md-4';
                        break;
                    case 2:
                        cssClass = 'col-xs-12 col-sm-6 col-md-8';
                        break;
                    case 3:
                        cssClass = 'col-xs-12 col-sm-12 col-md-12';
                        break;
                    default:
                        break;
                }

                return cssClass;
            };

            /**
             * get all dashboard data
             */
            vm.getDashboardData = function () {
                return DashboardService.get().$promise.then(
                    function success (response) {
                        console.dir(response);
                        vm.dashboardData = response;
                        vm.projectsSubset = response.projects;
                        // vm.histories = response.history;
                        vm.tasks = response.tasks;
                        vm.documents = response.files;
                        vm.resources = response.resources;
                        vm.dmps = response.dmps;
                        // vm.labbooks = response.labbooks;
                        vm.summary = vm.postProcessSummary(response.summary);
                        vm.contacts = response.contacts;
                        // vm.notes = response.notes;
                        vm.meetings = response.meetings;
                        vm.dataLoaded = true;
                    }
                );
            };

            /**
             * Post process for summary (used for bubble screen)
             * @param summary
             * @returns {Array}
             */
            vm.postProcessSummary = function (summary) {
                var statistics = [];

                var backgroundColors = {
                    contacts: '#3c7416',
                    dmps: '#8CBA80',
                    files: '#BD0926',
                    meetings: '#90BFD1',
                    notes: '#C7C7C7',
                    projects: '#007C85',
                    resources: '#FFD275',
                    tasks: '#E77C00',
                    kanbanboards: '#934b00',
                    labbooks: '#004A52',
                    pictures: '#1A350A',
                    drives: '#4b0813'
                };

                var textColors = {
                    contacts: '#000000',
                    dmps: '#000000',
                    files: '#000000',
                    meetings: '#000000',
                    notes: '#000000',
                    projects: '#000000',
                    resources: '#000000',
                    tasks: '#000000',
                    kanbanboards: '#cccccc',
                    labbooks: '#cccccc',
                    pictures: '#cccccc',
                    drives: '#cccccc'
                };

                /**
                 * TextLabels for bubbles
                 * @type {{}}
                 * */
                var textLabels = {
                    contacts: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['contact'],
                    kanbanboards: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['kanbanboard'],
                    dmps: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['dmp'],
                    files: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['file'],
                    meetings: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['meeting'],
                    notes: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['note'],
                    projects: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['project'],
                    resources: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['resource'],
                    tasks: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['task'],
                    labbooks: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['labbook'],
                    pictures: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['picture'],
                    drives: WorkbenchElementsTranslationsService.modelNameToTranslationPlural['drive']
                };

                /**
                 * Routes for bubbles
                 * @type {{}}
                 * */
                var routes = {
                    contacts: 'contact-list',
                    kanbanboards: 'kanbanboard-list',
                    dmps: 'dmp-list',
                    files: 'file-list',
                    meetings: 'meeting-list',
                    notes: 'note-list',
                    projects: 'project-list',
                    resources: 'resource-list',
                    tasks: 'task-list',
                    labbooks: 'labbook-list',
                    pictures: 'picture-list',
                    drives: 'drive-list'
                };

                // iterate over all bubble items and give them a text, a value, a color and a hyperlink
                for (var key in summary) {
                    if (summary.hasOwnProperty(key)) {
                        statistics.push({
                            text: summary[key] + ' ' + textLabels[key],
                            link: $state.href(routes[key]),
                            value: summary[key],
                            bgColor: backgroundColors[key],
                            textColor: textColors[key]
                        });
                    }
                }

                return statistics;
            };
        });
})();

