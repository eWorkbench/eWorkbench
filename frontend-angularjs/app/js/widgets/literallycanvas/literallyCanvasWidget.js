/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name literallyCanvasWidget
     *
     * @restrict E
     *
     * @memberOf module:widgets
     *
     * @description
     * A widget that wraps the literally canvas tool
     */
    module.directive('literallyCanvasWidget', function () {
        return {
            templateUrl: 'js/widgets/literallycanvas/literallyCanvasWidget.html',
            controller: 'LiterallyCanvasWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                shapes: '=',
                shapesVisible: '=',
                lcApi: '=',
                width: '=',
                height: '=',
                backgroundImageUrl: '='
            },
            link: function (scope, element, attrs) {
                // store the directive dom element
                scope.vm.element = element;
            }
        };
    });

    /**
     * controller for the literally canvas widget
     */
    module.controller('LiterallyCanvasWidgetController', function (
        $scope,
        $timeout
    ) {
        var vm = this;

        /**
         * The Background Image of the literally canvas element
         * This is modified using a watcher on `vm.backgroundImageUrl` (see below)
         */
        var backgroundImage = new Image();

        /**
         * Background images need to be explicitly allowed from cross origin hosts
         */
        backgroundImage.setAttribute('crossOrigin', 'anonymous');

        var drawingChangedIgnoreWatch = false;

        /**
         * Timeout ID for manual debounce
         * @type {null}
         */
        var drawingChangeTimeoutId = undefined;

        this.$onInit = function () {
            /**
             * Wrap a timeout over init literally canvas, as we need to wait for vm.element to be set
             */
            $timeout(initLiterallyCanvas);
        };

        /**
         * Initialize the literally canvas element
         */
        var initLiterallyCanvas = function () {
            if (vm.lcApi != null) {
                console.log("tearing down...");
                vm.lcApi.teardown();
                vm.lcApi = null;
            }

            // create a new literally canvas element on a division with the classes "literally core"
            vm.lcApi = LC.init(
                jQuery(vm.element).find('div.literally.core')[0],
                {
                    onInit: function (lc) {
                        console.log("LiterallyCanvas initialized!");

                        lc.respondToSizeChange();

                        // make sure that the select shape tool is always active by default
                        lc.setTool(new LC.tools.SelectShape(lc));

                        // reset undo stack
                        lc.undoStack = [];
                    },
                    backgroundShapes: [
                        LC.createShape(
                            'Image', {x: 0, y: 0, image: backgroundImage, scale: 1}
                        )
                    ]
                }
            );

            vm.lcApi.setImageSize(vm.width, vm.height);
            vm.lcApi.respondToSizeChange();

            // if shapes are set, load them
            if (vm.shapes) {
                console.log("Loading shapes");
                // just load shapes
                vm.lcApi.loadSnapshot({
                    'shapes': vm.shapes
                });
            }

            // set drawingChangedIgnoreWatch to True so we can ignore the first cycle
            drawingChangedIgnoreWatch = true;

            /**
             * Watch shapes, in case they change externally
             * ToDo: This could be really bad if we are editing the shapes at the moment
             */
            $scope.$watch("vm.shapes", function (newValue, oldValue) {
                if (drawingChangedIgnoreWatch) {
                    console.log("vm.shapes has changed, but this was a drawing change, ignoring...");
                    drawingChangedIgnoreWatch = false;
                } else {
                    console.log("vm.shapes has changed externally");

                    // shapes have changed from the outside, redraw the image
                    vm.lcApi.clear();

                    vm.lcApi.loadSnapshot({
                        'shapes': vm.shapes
                    });

                    vm.lcApi.respondToSizeChange();
                }
            });

            /**
             * React on drawing changes of lcApi
             * Everytime the drawing changes, we need to reflect those changes in the vm.shapes array
             * This method is quite expensive, so we have to debounce it
             */
            vm.lcApi.on('drawingChange', function () {
                // only react on drawing changes if shapes are visible
                if (vm.shapesVisible && vm.lcApi) {

                    /**
                     * Manual Debounce
                     */
                    if (drawingChangeTimeoutId) {
                        clearTimeout(drawingChangeTimeoutId);
                        drawingChangeTimeoutId = null;
                    }

                    // manually debounce the "getSnapshot" and ".shapes" command
                    drawingChangeTimeoutId = setTimeout(function () {
                        console.log("In timeout... executing");
                        // update shapes
                        $scope.$apply(function () {
                            // this method is potentially very expensive (especially on mobile)
                            var snapshot = vm.lcApi.getSnapshot();

                            vm.shapes = snapshot.shapes;

                            drawingChangedIgnoreWatch = true;
                        });
                    }, 200);
                }
            });

            /**
             * Register a pointerdown event which fires a $scope.$apply, such that we detect potential changes via
             * drawingChange immediately
             * E.g., selecting an already existing element will not trigger a drawing change, but we need to update
             * several things such as the selected shape via AngularJS digest cycle
             */
            vm.lcApi.on('pointerdown', function () {
                // apply on the parent scope, which should include the menu and watch for the selected shape
                $scope.$parent.$apply(function () {

                });
            });
        };

        /**
         * Watch width and height and adapt literally canvas
         */
        $scope.$watchGroup(["vm.width", "vm.height"], function () {
            if (vm.lcApi) {
                vm.lcApi.setImageSize(vm.width, vm.height);
                vm.lcApi.respondToSizeChange();

                // trigger a resize event (for some reason the canvas element needs this)
                setTimeout(function () {
                    window.dispatchEvent(new Event('resize'));
                }, 1);
            }
        });

        /**
         * Watch the background image url and adapt backgroundImage of literally canvas on any changes
         */
        $scope.$watch("vm.backgroundImageUrl", function () {
            if (vm.backgroundImageUrl) {
                console.log("Switching background image to " + vm.backgroundImageUrl);
                $timeout(function () {
                    backgroundImage.src = vm.backgroundImageUrl;
                });

            }
        });

        /**
         * Watch shapes visible and hide/show the shapes
         */
        $scope.$watch("vm.shapesVisible", function (newVal, oldVal) {
            if (newVal != oldVal) {
                if (newVal) {
                    // show
                    // shapes have changed from the outside, redraw the image
                    vm.lcApi.clear();

                    vm.lcApi.loadSnapshot({
                        'shapes': vm.shapes
                    });

                    vm.lcApi.respondToSizeChange();
                } else {
                    // hide
                    // shapes have changed from the outside, redraw the image
                    vm.lcApi.clear();

                    vm.lcApi.respondToSizeChange();
                }
            }
        })
    });
})();
