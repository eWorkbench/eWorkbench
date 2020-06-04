(function () {
    'use strict';

    var module = angular.module('screens');

    module.directive('mergeContactModalInputGroup', function () {
        return {
            templateUrl: 'js/screens/contact/mergeContactModal/mergeContactModalInputGroup.html',
            controller: 'MergeContactModalInputGroupController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                label: '@',
                fieldName: '@',
                contacts: '<',
                selectedValueIndex: '=',
                errors: '<',
                inputElement: '@'
            }
        };
    });

    module.controller('MergeContactModalInputGroupController', function () {
        'ngInject';
    });
})();
