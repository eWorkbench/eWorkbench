/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Widget for selecting one or many meetings
     */
    module.directive('meetingSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/meetingSelectizeWidget.html',
            controller: 'MeetingSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                meetings: "=",
                maxItems: '=',
                selectedMeetingPk: '='
            }
        }
    });

    module.controller('MeetingSelectizeWidgetController', function (
        $scope,
        $timeout
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.selectizeConfig = {
                plugins: {
                    'on_enter_key': {}
                },
                valueField: 'pk',
                labelField: 'title',
                sortField: 'title',
                placeholder: vm.placeholder,
                searchField: ['title'],
                render: {
                    // formats the dropdown item
                    option: function (item, escape) {
                        var str = '<div>';

                        str += '<span>' + escape(item.title) + '</span></br>';
                        if (item.description && item.description != '') {
                            str += '<span class="description-display">' + escape(item.description) + '</span> ';
                        }

                        str += '</div>';

                        return str;
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        return '<div>'
                            + '<span>' + escape(item.title) + '</span>'
                            + '</div>';
                    }
                },
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
                        $scope.$emit("selectize:onSubmit");
                    });
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
    });
})();
