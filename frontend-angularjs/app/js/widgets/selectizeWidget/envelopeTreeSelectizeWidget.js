/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Widget for selecting one or many directories within a tree
     */
    module.directive('envelopeTreeSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/envelopeTreeSelectizeWidget.html',
            controller: 'EnvelopeTreeSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                selectedEnvelopePk: '='
            }
        }
    });

    module.controller('EnvelopeTreeSelectizeWidgetController', function (
        $scope,
        $timeout,
        IconImagesService,
        DSSContainerRestService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.drives = [];
            vm.containersByPk = {};
            vm.envelopesByPk = {};
            vm.directories = [];
            vm.directoryLevelsById = {};

            vm.selectizeConfig = {
                plugins: {
                    'remove_button': {
                        mode: 'single'
                    },
                    // activate on enter key plugin
                    'on_enter_key': {}
                },
                create: false,
                nesting: true,
                valueField: 'pk',
                labelField: 'path',
                sortField: 'levelSortOrder',
                placeholder: vm.placeholder,
                searchField: ['path'],
                render: {
                    //formats the dropdown item
                    option: function (item, escape) {
                        var str = '<div>';

                        if (vm.envelopesByPk[item.pk]) {
                            str += '<span>' + escape(vm.envelopesByPk[item.pk].path) +
                                ' (Container: ' + escape(vm.envelopesByPk[item.pk].container_path) + ')</span> ';
                        }

                        str += '</div>';

                        return str;
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        var str = '<div>';

                        if (vm.envelopesByPk[item.pk]) {
                            str += '<span>' + escape(vm.envelopesByPk[item.pk].path) + '</span> ';
                        }

                        str += '</div>';

                        return str;
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

                    // on enter key press, emit a onSubmit event
                    selectize.on('enter', function () {
                        console.log('on enter');
                        $scope.$emit("selectize:onSubmit");
                    });
                },
                maxItems: 1
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

        var getContainersAndEnvelopes = function () {
            return DSSContainerRestService.queryCached().$promise.then(
                function success (response) {
                    vm.containers = response;

                    vm.envelopesByPk = {};
                    vm.envelopes = [];

                    for (var i = 0; i < vm.containers.length; i++) {
                        for (var j = 0; j < vm.containers[i].envelopes.length; j++) {
                            var envelope = vm.containers[i].envelopes[j];

                            envelope.container_path = vm.containers[i].path;

                            vm.envelopesByPk[envelope.pk] = envelope;
                            vm.envelopes.push(envelope);
                        }
                        vm.containersByPk[vm.containers[i].pk] = vm.containers[i];
                    }
                },
                function error (rejection) {
                    console.log(rejection);
                }
            );
        };

        getContainersAndEnvelopes();
    });
})();
