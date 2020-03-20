/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * Widget for selecting one or many resources
     */
    module.directive('projectFilterSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/projectFilterSelectizeWidget.html',
            controller: 'ProjectFilterSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                maxItems: '=',
                selectedProjectPks: '=',
                options: '='
            }
        }
    });

    module.controller('ProjectFilterSelectizeWidgetController', function (
        $scope,
        $q,
        ProjectRestService,
        $timeout
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.selection = null;

            vm.projects = [];

            /** check if there are initially selected projects pks and
             * fill vm.projects with the available options
             * vm.projects is fed to selectize as its option-list.
             * Selectize then matches the pk in vm.selectedProjectPks with the option-list
             * to display the associated name in the filter-element
             */
            if (vm.selectedProjectPks) {
                vm.selection = vm.selectedProjectPks;

                // a searchField is required, as selectize.js retains but no longer finds this option
                // when it's deleted (Despite setting "persist=True")
                // this fix is not perfect, as the "level" (indendation) for this option is
                // always 0 and therefore won't match the level of it's children
                for (var i = 0; i < vm.options.length; i++) {
                    vm.options[i].searchField = vm.options[i].name;
                }

                vm.projects = vm.options;
            } else {
                // set selectedProjectPks to empty array, in case there was no value given
                // (necessary for new-element dialogs, because there are no base values)
                vm.selectedProjectPks = [];
            }

            vm.projectLevelsById = [];
            vm.projectLevelTree = {};
            vm.matchedProjectTree = {};

            vm.selectizeConfig = {
                plugins: {
                    'remove_button': {
                        mode: 'single'
                    },
                    // activate on enter key plugin
                    'on_enter_key': {}
                },
                create: false,
                nesting: false,
                persist: true,
                // close the selectize dropdown after selecting
                closeAfterSelect: true,
                // let the user select an entry via using tab
                selectOnTab: true,
                valueField: 'pk',
                labelField: 'name',
                // "you have to keep the '$score' field to make it work" *rolleyes*
                // https://github.com/selectize/selectize.js/issues/1000#issuecomment-215686745
                sortField: [
                    {field: 'levelSortOrder', direction: 'asc'},
                    {field: '$score'}
                ],
                placeholder: vm.placeholder,
                searchField: ['searchField'],
                render: {
                    // formats the dropdown item
                    option: function (item, escape) {
                        if (item.level === undefined) {
                            item.level = 0;
                        }
                        // display project
                        var str = '<div class="level-' + escape(item.level) + '">';

                        str += '<span>' + escape(item.name) + '</span> '
                            + '</div>';

                        return str;
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        // display project
                        return '<div>'
                            + '<span>' + escape(item.name) + '</span> '
                            + '</div>';
                    }
                },
                load: loadSelectizeOptions,
                onInitialize: function (selectize) {
                    // store selectize element
                    vm.selectize = selectize;

                    // check for readonly (needs to be done in next digest cycle)
                    $timeout(function () {
                        if (vm.ngReadonly) {
                            selectize.lock();
                        }
                    });

                    // activate plugin: on enter key press, emit an onSubmit event
                    selectize.on('enter', function () {
                        // submit the form in the next Digest Cycle (yay AngularJS)
                        $timeout(function () {
                            selectize.$input.closest("form").submit();
                        });
                    });
                },
                onDropdownOpen: function () {
                    // Manually prevent dropdown from opening when there is no search term
                    if (!this.lastQuery.length) {
                        this.$dropdown.hide();
                    }
                },
                onDelete: function (values) {
                    // on a selectize with a single selectable option, removing the selection
                    // emits "project-removed-from-filter-selection", which in turn triggers an update
                    // of the item-list (see taskList/noteList/fileList etc.)
                    if (vm.maxItems === 1) {
                        // if the selectize is multiselect, the deleted options is removed from vm.selectedProjectPks,
                        // which triggers watchers on vm.selectedProjectPks (e.g. editable-select-list)
                        $timeout(function () {
                            $scope.$emit("project-removed-from-filter-selection");
                            vm.selectedProjectPks = [];
                        });
                    } else {
                        angular.forEach(values, function (projectPk) {
                            var index = vm.selectedProjectPks.indexOf(projectPk);

                            if (index > -1) {
                                // we need this $timeout to trigger angularjs's digest cycle
                                // when vm.selectedProjectPks has changed
                                $timeout(function () {
                                    vm.selectedProjectPks.splice(index, 1);
                                })
                            }
                        })
                    }
                },
                onType: function (str) {
                    // Close drop down when no search is typed.
                    if (!str) {
                        this.$dropdown.hide();
                    } else {
                        // make sure to show it again
                        this.$dropdown.show();
                    }
                },
                onItemAdd: function (value, $item) {
                    if (vm.maxItems === 1) {
                        vm.selectedProjectPks = [];
                        if (vm.selection) {
                            vm.selectedProjectPks = [value];
                        }
                        // only add new item to vm.selectedProjectPks if it hasn't been added yet
                    } else if (!vm.selectedProjectPks.includes(value)) {
                        $timeout(function () {
                            // we need this $timeout to trigger angularjs's digest cycle
                            // when vm.selectedProjectPks has changed
                            vm.selectedProjectPks.push(value);
                        });
                    }
                },
                maxItems: vm.maxItems
            };
        };

        // watch ngReadonly and lock/unlock the selectize element (if it is already activated)
        $scope.$watch("vm.ngReadonly", function (newValue, oldValue) {
            if (vm.selectize) {
                if (newValue) {
                    vm.selectize.lock();
                } else {
                    vm.selectize.unlock();
                }
            }
        });

        var loadSelectizeOptions = function (searchTerm, callback) {
            console.log("Loading projects. Search term:", searchTerm);

            // do nothing for irrelevant input
            if (!searchTerm.trim() || searchTerm.length < 3) {
                callback([]);

                // nothing more to do -> return fulfilled promise
                return $q.resolve();
            }

            return ProjectRestService.resource.searchTree({search: searchTerm}).$promise.then(
                function success (response) {
                    var optionsList = buildSelectizeOptionsList(response);

                    callback(optionsList);
                },
                function error (rejection) {
                    console.log("Error querying project search endpoint");
                    console.log(rejection);
                    callback([]);
                }
            );
        };

        var buildSelectizeOptionsList = function (projects) {
            if (!projects || projects.length < 1) {
                return [];
            }

            var level = -1,
                parentNameList = "";

            vm.projectLevelsById = [];
            generateProjectLevels(projects, parentNameList, level, {});

            return vm.projectLevelsById;
        };

        var levelSortOrder = 0;
        var generateProjectLevels = function (project_tree, parentNameList, level, levellist) {
            /** Iterate through the project tree that was returned from the backend
             * and create a list of options. These options have the following attributes:
             * level: The level in the hierarchy of options, used for indenting the
             *        name in the option-list, see selectize-render-function above
             * levelSortOrder: The order in which the options should appear, see
             *                 selectize's "sortField" above
             * name, pk: name and pk of the project, used by selectize's render-function
             * searchField: a string containing the names of all parent-projects of each option
             *              used by selectize's "searchField"-parameter
             */
            level++;
            // only 9 indendation-levels are defined in selectizeWidget.less
            if (level > 9) {
                level = 9;
            }

            angular.forEach(project_tree, function (project) {
                levelSortOrder++;

                parentNameList += project.name;
                /** when there are multiple parallel branches starting on the same level
                 *  we have to remove the project-names of the previous parallel branch from
                 *  the parentNameList, otherwise the parallel branches will appear
                 *  in the resulting dropdown-menu.
                 *  This is done by resetting the parentNameList to
                 *  the parentNameList one level below the current level and adding the current project-name
                 *  The levellist-entry at the current level is then overwritten with this new parentNameList
                 */
                if (level in levellist) {
                    parentNameList = levellist[level - 1] + project.name;
                    levellist[level] = parentNameList;
                } else {
                    // we have never seen this level before, so add it to the levellist
                    levellist[level] = parentNameList
                }

                vm.projectLevelsById.push({
                    'level': level,
                    'name': project.name,
                    'searchField': levellist[level],
                    'levelSortOrder': levelSortOrder,
                    'pk': project.pk
                });

                if (project.child_tree !== undefined && project.child_tree.length > 0) {
                    // there are additional sub-projects in lower levels
                    // so we increment level and descend into the next level
                    generateProjectLevels(project.child_tree, parentNameList, level, levellist);
                }
            });
        };

    });
})();
