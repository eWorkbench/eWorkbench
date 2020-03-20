/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    module.directive('breadcrumbBarWidget', function () {
        'ngInject';

        return {
            templateUrl: 'js/widgets/breadcrumbBar/breadcrumbBarWidget.html',
            controller: 'BreadcrumbBarWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                breadcrumbs: '=',
                api: '='
            }
        }
    });

    module.controller('BreadcrumbBarWidgetController', function ($scope) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * API object
             * @type {Object}
             */
            var api = vm.api || {},
                /**
                 * List of breadcrumbs
                 * @type {Array<Object>}
                 */
                breadcrumbs = vm.breadcrumbs || [],
                /**
                 * Index of currently active breadcrumb
                 * @type {int|null}
                 */
                currentBreadcrumbIndex = null;

            /**
             * Clears the breadcrumbs
             */
            api.clearBreadcrumbs = function () {
                breadcrumbs.length = 0;
            };

            /**
             * Gets all breadcrumbs
             * @returns {Array}
             */
            api.getBreadcrumbs = function () {
                return breadcrumbs;
            };

            /**
             * Returns true if the given object is a breadcrumb of the bar
             * @param breadcrumb
             * @returns {boolean}
             */
            api.isBreadcrumb = function (breadcrumb) {
                return breadcrumbs.indexOf(breadcrumb) !== -1;
            };

            /**
             * Sets the given breadcrumb as the currently active breadcrumb
             * @param breadcrumb
             * @returns {Object|null}
             */
            api.setCurrentBreadcrumb = function (breadcrumb) {
                var
                    breadcrumbIndex = breadcrumbs.indexOf(breadcrumb),
                    breadcrumbFound = breadcrumbIndex !== -1;

                if (breadcrumbFound) {
                    console.log("Switching current breadcrumb");
                    currentBreadcrumbIndex = breadcrumbIndex;

                    return breadcrumb;
                }

                console.warn("Cannot switch active breadcrumb because given breadcrumb is not managed by the bar");

                return breadcrumbs[currentBreadcrumbIndex] || null;
            };

            /**
             * Gets the currently active breadcrumb
             * @returns {Object|null}
             */
            api.getCurrentBreadcrumb = function () {
                return breadcrumbs[currentBreadcrumbIndex] || null;
            };

            /**
             * Checks if the given breadcrumb is the currently active breadcrumb
             * @param breadcrumb
             * @returns {boolean}
             */
            api.isCurrentBreadcrumb = function (breadcrumb) {
                return api.getCurrentBreadcrumb() === breadcrumb;
            };

            /**
             * Creates a new breadcrumb
             * @param breadcrumb
             * @returns {{title: string, id:(string|int), url:string}}
             */
            api.createBreadcrumb = function (breadcrumb) {
                console.log("Create breadcrumb");

                breadcrumb = breadcrumb || {
                    'title': 'Undefined',
                    'id': Math.ceil(Math.random() * 1000000),
                    'url': '/'
                };

                breadcrumbs.push(breadcrumb);

                return breadcrumb;
            };

            /**
             * Removes an existing breadcrumb
             * @param breadcrumb
             */
            api.destroyBreadcrumb = function (breadcrumb) {
                // ToDo: Check if this method is used

                var
                    breadcrumbIndex = breadcrumbs.indexOf(breadcrumb),
                    breadcrumbFound = breadcrumbIndex !== -1;

                if (breadcrumbFound) {
                    console.log("Destroy breadcrumb");

                    breadcrumbs.splice(breadcrumbIndex, 1);

                    // if removed breadcrumb is before the active one, we need to shift the active index left
                    if (breadcrumbIndex <= currentBreadcrumbIndex) {
                        if (currentBreadcrumbIndex > 0) {
                            currentBreadcrumbIndex--;
                        }
                        if (!breadcrumbs.length) {
                            currentBreadcrumbIndex = null;
                        }
                    }
                }
            };

            /**
             * Marker to identify the API object as ready
             * @type {boolean}
             */
            api.ready = true;

            /**
             * Make the API object directly available on the angular scope
             * @type {Object}
             */
            $scope.api = api;
        };
    });
})();
