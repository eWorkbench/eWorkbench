/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * @class angular_directive.validatedFormElement
     * @memberOf angular_module
     * Angular Directive for combining the "error" output of a REST API with the input/textarea fields
     * @example <caption>Controller</caption>
     * app.controller('ExampleController', function ($scope, $stateParams, Project) {

        $scope.newProject = new Project();
        $scope.errors = [];
        $scope.create = function () {
            console.log("Trying to save project: ");
            console.log($scope.newProject);

            $scope.newProject.$save(function() {
                console.log("Project saved successfully!");
            },
            function(rejection) {
                // REST API threw an error
                console.log("Failed to save project!");
                $scope.errors = rejection.data;
            });
     * @example <caption>HTML</caption>
     * <div class="modal-header">
     <h3 class="modal-title">Create Project</h3>
     </div>

     <div class="modal-body">
     <form name="newProjectForm">
     <validated-form-element input-element="text" input-label="Project Name" field-name="project_name"
     placeholder="Name of the project"
     ng-model="newProject.name"  errors="errors['name']">
     </validated-form-element>

     <validated-form-element input-element="textarea" input-label="Description" field-name="project_description"
     placeholder="Please enter a project description"
     ng-model="newProject.description"  errors="errors['description']">
     </validated-form-element>
     </form>
     </div>
     <div class="modal-footer">
     <button class="btn btn-primary" type="button" ng-click="create()">Create</button>
     <button class="btn btn-info" type="button" ng-click="cancel()">Cancel</button>
     </div>
     */
    module.directive('validatedFormElement', function () {
        return {
            restrict: 'E',
            require: 'ngModel',
            transclude: true,
            controller: 'ValidatedFormElementController',
            controllerAs: 'vm',
            templateUrl: function (elem, attrs) {
                var basePath = 'js/shared/validatedFormElement/';

                switch (attrs.inputElement) {
                    case 'text':
                    case 'password':
                    case 'email':
                        return basePath + "validated-form-input.html";

                    case 'color':
                        return basePath + "validated-form-color.html";

                    case 'checkbox':
                        return basePath + "validated-form-checkbox.html";

                    case 'textarea':
                        return basePath + "validated-form-textarea.html";

                    case 'html':
                        return basePath + "validated-form-html.html";

                    case 'select':
                        if (attrs.listDict) {
                            // use a dictionary in config: k as v for (k,v) in listItems | orderBy: k
                            return basePath + "validated-form-dict-select.html";
                        }

                        // a dropdown with listOptions
                        return basePath + "validated-form-select.html";

                    case 'date':
                        // a date and timepicker
                        return basePath + "validated-form-date.html";

                    case 'list':
                        // a list with an add button
                        return basePath + "validated-form-list.html";

                    case 'list_checkbox_with_text':
                        // a list with an add button
                        return basePath + "validated-form-list-checkbox-with-text.html";

                    default:
                        console.error('validatedFormElement - Error: Unknown inputType ' + attrs.inputElement);

                        return basePath + "validated-form-input.html";
                }

            },
            scope: {
                id: "@", // pass as string
                inputElement: "@", // pass as string
                fieldName: "@", // pass as string
                placeholder: "@", // pass as string
                autoComplete: "@", // string for autocomplete (optional)
                autoFocus: "=", // whether or not this component should use focus-if for auto focus on DOM Render
                errors: "=", // pass as model (two way binding)
                options: "=", // pass as model (two way binding)
                ngModel: "=", // pass as model (two way binding)
                ngModelOptions: '=?',
                listItems: "=?", // optional, pass as model (two way binding)
                listOptions: "=?", // optional, pass as model (two way binding)
                listDict: "=?", // optional, pass as model
                rows: "@", // pass as string
                datePickerOptions: "=?", // pass as model
                ngDisabled: '=',
                ngReadonly: '=?',
                myNgPattern: "@",
                hasFormErrors: "=",
                tinymceToolbarDiv: "@?",
                initialObject: "<?" // pass as model (one way binding)
            }
        };
    });

    /**
     * Controller for validated form element
     */
    module.controller('ValidatedFormElementController', function (
        $scope,
        IconImagesService
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * gets the correct cancel icon
             */
            vm.cancelIcon = IconImagesService.searchElementIcons.cancel;
            /**
             * gets the correct alert icon
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;
            /**
             * gets the correct calendar icon
             */
            vm.calendarIcon = IconImagesService.mainElementIcons.meeting;

            if (!$scope.ngModelOptions) {
                /**
                 * NgModelOptions for ng-model on input fields
                 * @type {{}}
                 */
                $scope.ngModelOptions = {};
            }

            /**
             * defined initial object which is shown when the directive gives you the opportunity for creating a new
             * object over an add button
             */
            vm.initialObject = $scope.initialObject || "";
        };

        /**
         * Watch ngModelOptions and set it to an empty dictionary in case it is empty
         */
        $scope.$watch('ngModelOptions', function (newVal) {
            if (!$scope.ngModelOptions) {
                $scope.ngModelOptions = {};
            }
        });

        if ($scope.inputElement == "html") {
            /**
             * tiny mce options
             * @type {{}}
             */
            $scope.tinymceOptions = {
                'inline': true,
                'selector': 'div.editable',
                fixed_toolbar_container: $scope.tinymceToolbarDiv
            };

            /**
            * Put the TinyMCE-Toolbar in a separate container in a fixed position
            * if tinymceToolbarDiv is set
            */

            if ($scope.tinymceToolbarDiv) {
                $scope.tinymceOptions.fixed_toolbar_container = $scope.tinymceToolbarDiv;
            }
        }

        vm.addListAttribute = function () {
            $scope.ngModel.push(angular.copy(vm.initialObject));
        };

        vm.removeListAttribute = function (object) {
            var index = $scope.ngModel.indexOf(object);

            $scope.ngModel.splice(index, 1);
        };
    });
})();
