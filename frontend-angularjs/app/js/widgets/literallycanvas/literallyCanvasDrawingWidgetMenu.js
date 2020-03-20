/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');


    /**
     * The menu for the literally drawing widget
     */
    module.directive('literallyCanvasDrawingWidgetMenu', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/literallycanvas/literallyCanvasDrawingWidgetMenu.html',
            scope: {
                lcApi: '=',
                shapes: '=',
                shapesVisible: '=',
                showSaveButton: '=?',
                hasUnsavedChanges: '=',
                backgroundImageUrl: '=',
                width: '=',
                height: '='
            },
            controller: 'LiterallyCanvasDrawingWidgetMenuController',
            bindToController: true,
            controllerAs: 'vm'
        }
    });

    module.controller('LiterallyCanvasDrawingWidgetMenuController', function (
        $scope,
        $timeout,
        $uibModal,
        $q,
        gettextCatalog,
        resizeImageService
    ) {
        var vm = this;

        /**
         * Secondary color of the currently selected shape (used by the color picker)
         * @type {null}
         */
        var selectedShapeSecondaryColor = null,
            /**
             * Primary color of the currently selected shape (used by the color picker)
             * @type {null}
             */
            selectedShapePrimaryColor = null;

        this.$onInit = function () {
            /**
             * The currently active tool
             * @type {null}
             */
            vm.activeTool = null;

            /**
             * The currently selected shape
             * @type {null}
             */
            vm.selectedShape = null;


            vm.newTools = {
                'select': {
                    name: gettextCatalog.getString('Select'),
                    tool: "select",
                    icon: 'fa fa-mouse-pointer'
                },
                'text': {
                    name: gettextCatalog.getString('Text'),
                    tool: "text",
                    icon: 'fa fa-font'
                },
                'pencil': {
                    name: gettextCatalog.getString('Pencil'),
                    tool: "pencil",
                    icon: 'fa fa-pencil'
                },
                'eraser':  {
                    name: gettextCatalog.getString('Eraser'),
                    tool: "eraser",
                    icon: 'fa fa-eraser'
                },
                'line': {
                    name: gettextCatalog.getString('Line'),
                    tool: "line",
                    icon: 'icon-line'
                },
                'ellipse': {
                    name: gettextCatalog.getString('Ellipse'),
                    tool: "ellipse",
                    icon: 'icon-circle'
                },
                'polygon': {
                    name: gettextCatalog.getString('Polygon'),
                    tool: "polygon",
                    icon: 'icon-polygon'
                },
                'rectangle': {
                    name: gettextCatalog.getString('Rectangle'),
                    tool: "rectangle",
                    icon: 'icon-rectangle'
                }
            };

            // set default colors
            vm.secondaryColor = "#00000000";
            vm.primaryColor = "#000000";

            initColorPickerEvents();
        };

        /**
         * Activate the provided tool
         * @param tool
         */
        vm.activateTool = function (tool) {
            var actualTool = null;

            if (tool.tool == "select") {
                actualTool = new LC.tools.SelectShape(vm.lcApi);
            } else if (tool.tool == "line") {
                actualTool = new LC.tools.Line(vm.lcApi);
            } else if (tool.tool == "pencil") {
                actualTool = new LC.tools.Pencil(vm.lcApi);
            } else if (tool.tool == "eraser") {
                actualTool = new LC.tools.Eraser(vm.lcApi);
            } else if (tool.tool == "ellipse") {
                actualTool = new LC.tools.Ellipse(vm.lcApi);
            } else if (tool.tool == "rectangle") {
                actualTool = new LC.tools.Rectangle(vm.lcApi);
            } else if (tool.tool == "polygon") {
                actualTool = new LC.tools.Polygon(vm.lcApi);
            } else if (tool.tool == "text") {
                actualTool = new LC.tools.Text(vm.lcApi);
            }

            // set initial secondary color
            vm.lcApi.setColor("primary", vm.primaryColor);
            vm.lcApi.setColor("secondary", vm.secondaryColor);

            if (!actualTool) {
                // tool not found
                console.error("Unknown tool '" + tool.tool + "'");
                console.log(tool);
                vm.activeTool = null;
            } else {
                // select tool
                vm.lcApi.setTool(actualTool);
                vm.activeTool = tool;
            }
        };

        /**
         * Watch lcApi, and when lcApi is set, we need to activate the first tool (select tool)
         * we can then unregister the watcher
         */
        var unregisterLcApiWatcher = $scope.$watch("vm.lcApi", function (newValue, oldValue) {
            console.log("vm.lcApi has changed...");
            // wait for lcApi to be set
            if (newValue) {
                // activate the select tool
                vm.activateTool(vm.newTools['select']);

                // unregister the watcher
                unregisterLcApiWatcher();
            }
        });


        /**
         * On remove shape button click
         * Removes the currently selected shape (if one is selected)
         */
        vm.removeShape = function () {
            var selectedShape = vm.lcApi.tool.selectedShape;

            if (selectedShape) {
                var selectedShapeIndex = vm.lcApi.shapes.indexOf(selectedShape);

                vm.lcApi.execute({
                    'do': function () {
                        // remove shape
                        vm.lcApi.shapes.splice(selectedShapeIndex, 1);

                        vm.lcApi.trigger('shapeMoved', { shape: selectedShape });
                        vm.lcApi.trigger('drawingChange', {});

                        // reset selected shape
                        vm.lcApi.tool.selectedShape = null;

                        /* Also removes selection box */
                        vm.lcApi.setShapesInProgress([]);
                        // redraw
                        vm.lcApi.repaintLayer('main');
                    },
                    'undo': function () {
                        // re add shape
                        vm.lcApi.shapes.splice(selectedShapeIndex, 0, selectedShape);

                        vm.lcApi.trigger('shapeMoved', { shape: selectedShape });
                        vm.lcApi.trigger('drawingChange', {});

                        // reset selected shape
                        vm.lcApi.tool.selectedShape = selectedShape;

                        // add selection box
                        vm.lcApi.setShapesInProgress([selectedShape]);
                        // redraw
                        vm.lcApi.repaintLayer('main');
                    }
                });

                // select the first tool (select tool) again
                vm.activateTool(vm.newTools['select']);
            }
        };

        /**
         * Hides all drawings, so that the user gets a view of the background image
         */
        vm.toggleDrawings = function () {
            vm.shapesVisible = !vm.shapesVisible;
        };

        /**
         * Removes all shapes from the drawing
         * Also adds this to the history
         */
        vm.clearDrawing = function () {
            // create a backup of the existing shapes
            var shapesBackup = angular.copy(vm.shapes);

            vm.lcApi.execute({
                'do': function () {
                    vm.shapes = [];
                },
                'undo': function () {
                    vm.shapes = shapesBackup;
                }
            });
        };

        /**
         * Wrapper for literally canvas canUndo
         * @returns {boolean} whether there is an action that can be undone or not
         */
        vm.canUndo = function () {
            if (vm.lcApi) {
                return vm.lcApi.canUndo();
            }

            return false;
        };

        /**
         * Wrapper for literally canvas canRedo
         * @returns {boolean} whether there is an action that can be redone or not
         */
        vm.canRedo = function () {
            if (vm.lcApi) {
                return vm.lcApi.canRedo();
            }

            return false;
        };

        /**
         * Undo last action
         */
        vm.undo = function () {
            if (vm.lcApi) {
                // make sure that the select tool is active
                vm.activateTool(vm.newTools['select']);

                // wait for the next digest cycle to undo the last change
                $timeout(function () {
                    vm.lcApi.undo();
                });
            }
        };

        /**
         * Redo last action
         */
        vm.redo = function () {
            if (vm.lcApi) {
                // make sure that the select tool is active
                vm.activateTool(vm.newTools['select']);

                // wait for the next digest cycle to redo the last change
                $timeout(function () {
                    vm.lcApi.redo();
                });
            }
        };

        /**
         * Gets the secondary color (e.g., fillColor) of a shape
         * @param shape
         * @returns {*}
         */
        var getShapeSecondaryColor = function (shape) {
            if (shape.hasOwnProperty('fillColor')) {
                return shape.fillColor;
            }

            return undefined;
        };

        /**
         * Gets the primary color (e.g., strokeColor) of a shape
         * @param shape
         * @returns {*}
         */
        var getShapePrimaryColor = function (shape) {
            if (shape.hasOwnProperty('smoothedPoints')) {
                // Pencil shapes
                if (shape.smoothedPoints.length > 0) {
                    return shape.smoothedPoints[0].color;
                }
            } else if (shape.hasOwnProperty('points')) {
                // Polygon shapes
                if (shape.points.length > 0) {
                    return shape.points[0].color;
                }
            } else if (shape.hasOwnProperty('strokeColor')) {
                // stroke color
                return shape.strokeColor;
            } else {
                // line shape
                return shape.color;
            }

            return undefined;
        };

        /**
         * Sets the shape secondary color  (e.g., fill color of a circle/rectangle)
         * also triggers a "drawingChange" event of literallyCanvas
         * @param shape
         * @param color
         */
        var setShapeSecondaryColor = function (shape, color) {
            if (shape.hasOwnProperty('fillColor')) {
                shape.fillColor = color;

                // repaint
                vm.lcApi.repaintAllLayers();
                vm.lcApi.trigger('drawingChange');
            }
        };

        /**
         * Sets the shape primary color  (e.g., stroke color of a circle/rectangle)
         * also triggers a "drawingChange" event of literallyCanvas
         * @param shape
         * @param color
         */
        var setShapePrimaryColor = function (shape, color) {
            var j = 0;

            if (shape.hasOwnProperty('smoothedPoints')) {
                // Pencil shapes - iterate over all smoothed points and set the color
                for (j = 0; j < shape.smoothedPoints.length; j++) {
                    shape.smoothedPoints[j].color = color;
                }
            } else if (shape.hasOwnProperty('points')) {
                // polygon shape
                for (j = 0; j < shape.points.length; j++) {
                    shape.points[j].color = color;
                }
            } else if (shape.hasOwnProperty('strokeColor')) {
                // stroke color
                shape.strokeColor = color;
            } else {
                // line shape
                shape.color = color;
            }

            // repaint
            vm.lcApi.repaintAllLayers();
            vm.lcApi.trigger('drawingChange');
        };

        /**
         * Initialize color picker watchers
         * - colorpicker-shown
         * - colorpicker-closed
         *
         * Sets the secondary and primary color
         */
        var initColorPickerEvents = function () {
            /**
             * When the colorpicker is shown, we need to store the secondary and primary color of the selected shape,
             * such that we can create a redo/undo event when the colorpicker is closed
             */
            $scope.$on('colorpicker-shown', function () {
                console.log("color picker shown");

                // if a shape is selected, store its colors
                var selectedShape = vm.lcApi.tool.selectedShape;

                if (selectedShape) {
                    selectedShapeSecondaryColor = getShapeSecondaryColor(selectedShape);
                    selectedShapePrimaryColor = getShapePrimaryColor(selectedShape);
                } else {
                    // no shape selected, user might want to draw a new shape and pre-select colors
                    selectedShapeSecondaryColor = null;
                    selectedShapePrimaryColor = null;
                }
            });

            /**
             * When the colorpicker is closed, we need to store a redo/undo event for the selected shape
             */
            $scope.$on('colorpicker-closed', function () {
                console.log("color picker closed");

                // if a shape is selected, create a do/undo event
                var selectedShape = vm.lcApi.tool.selectedShape;

                if (selectedShape && (selectedShapeSecondaryColor || selectedShapePrimaryColor)) {

                    var newSecondaryColor = vm.secondaryColor,
                        newPrimaryColor = vm.primaryColor,
                        previousSecondaryColor = selectedShapeSecondaryColor,
                        previousPrimaryColor = selectedShapePrimaryColor;


                    console.log("adding undo event for color change");

                    // add redo/undo functionality for color changes
                    vm.lcApi.execute({
                        'do': function () {
                            setShapeSecondaryColor(selectedShape, newSecondaryColor);
                            setShapePrimaryColor(selectedShape, newPrimaryColor);
                        },
                        'undo': function () {
                            setShapeSecondaryColor(selectedShape, previousSecondaryColor);
                            setShapePrimaryColor(selectedShape, previousPrimaryColor);
                        }
                    });
                }

                selectedShapeSecondaryColor = null;
            });
        };

        /**
         * Watch secondary color (set by the user in a color chooser)
         * On change, check if a shape is selected, and if one is selected, update its color
         */
        $scope.$watch("vm.secondaryColor", function () {
            if (vm.lcApi) {
                // set secondary color of literally canvas, so new elements have the color set automatically
                vm.lcApi.setColor("secondary", vm.secondaryColor);

                // change secondary color of selected shape
                if (vm.selectedShape) {
                    console.log("change secondary color of selected shape to " + vm.secondaryColor);
                    setShapeSecondaryColor(vm.selectedShape, vm.secondaryColor);
                }
            }
        });

        /**
         * Watch primary color (set by the user in a color chooser)
         * On change, check if a shape is selected, and if one is selected, update its color
         */
        $scope.$watch("vm.primaryColor", function () {
            if (vm.lcApi) {
                // set primary color of literally canvas, so new elements have the color set automatically
                vm.lcApi.setColor("primary", vm.primaryColor);

                // change secondary color of selected shape
                if (vm.selectedShape) {
                    console.log("change primary color of selected shape to " + vm.primaryColor);
                    setShapePrimaryColor(vm.selectedShape, vm.primaryColor);
                }
            }
        });

        /**
         * Watch the selected shape and store it in vm.selectedShape
         * If a shape is selected, select the primary and secondary color of the shape
         */
        $scope.$watch(function () {
            if (vm.lcApi) {
                return vm.lcApi.tool.selectedShape;
            }

            return null;
        }, function (newVal, oldVal) {
            console.log("!!!! SELECTED SHAPE HAS CHANGED !!!");
            vm.selectedShape = newVal;

            // if the selectedShape is available
            if (newVal) {
                // set current primary color based on the shape
                if (vm.selectedShape.hasOwnProperty('smoothedPoints')) {
                    vm.primaryColor = vm.selectedShape.smoothedPoints[0].color;
                } else if (vm.selectedShape.hasOwnProperty('strokeColor')) {
                    vm.primaryColor = vm.selectedShape.strokeColor;
                } else {
                    vm.primaryColor = vm.selectedShape.color;
                }

                // Set current secondary color based on the shape
                if (vm.selectedShape.hasOwnProperty('fillColor')) {
                    vm.secondaryColor = vm.selectedShape.fillColor;
                }
            }
        });


        var loadBackgroundImageAndCheckCanvas = function (file) {
            var d = $q.defer(),
                url = URL.createObjectURL(file),
                backgroundImage =  new Image();

            // load the background image from the provided file (url)
            backgroundImage.src = url;

            // we need to check the size of the image, therefore we need to load it
            backgroundImage.onload = function () {
                console.log("image loaded");

                if (backgroundImage.width > vm.width || backgroundImage.height > vm.height) {
                    // background Image is too large for the current canvas

                    var modalInstance = $uibModal.open({
                        templateUrl: 'js/widgets/literallycanvas/modalBackgroundImageTooBig.html',
                        controller: 'ModalBackgroundImageTooBigController',
                        controllerAs: 'vm',
                        resolve: {
                            imageSize: function () {
                                return {
                                    'width': backgroundImage.width,
                                    'height': backgroundImage.height
                                };
                            },
                            canvasSize: function () {
                                return {
                                    'width': vm.width,
                                    'height': vm.height
                                };
                            }
                        }
                    });

                    modalInstance.result.then(
                        function confirm (scaleImage) {
                            // Modal Dialog was closed; check whether the image or the canvas needs to be changed

                            if (scaleImage) {
                                // resize the image to match the canvas
                                var widthRatio = vm.width / backgroundImage.width,
                                    heightRatio = vm.height / backgroundImage.height;

                                var ratio = Math.min(widthRatio, heightRatio);

                                resizeImageService.resizeImage(
                                    backgroundImage,
                                    backgroundImage.width * ratio,
                                    backgroundImage.height * ratio
                                ).then(function (blob) {
                                    // convert the blob to a URL
                                    var url = window.URL.createObjectURL(blob);

                                    // done! Resolve the URL
                                    d.resolve(url);
                                });
                            } else {
                                // resize the canvas such that the image fits into the canvas
                                if (vm.width < backgroundImage.width) {
                                    // increase width to match the image
                                    vm.width = backgroundImage.width;
                                }

                                if (vm.height < backgroundImage.height) {
                                    // increase height to match the height
                                    vm.height = backgroundImage.height;
                                }
                                // and resolve the original url
                                d.resolve(url);
                            }
                        },
                        function dismiss () {
                            console.log("Do not use the image, dismissing...");
                            d.reject();
                        }
                    );
                } else {
                    // everything is fine
                    d.resolve(url);
                }
            };

            return d.promise;
        };


        /**
         * A background image was selected by the user
         * @param file
         * @param errFiles
         */
        vm.saveBackgroundImage = function (file, errFiles) {
            if (file) {
                loadBackgroundImageAndCheckCanvas(file).then(
                    function loaded (url) {
                        // once it is loaded, use it
                        vm.backgroundImageUrl = url;

                        // and store it via REST API

                    },
                    function aborted () {
                        console.log("Aborted loading of background image");
                    }
                );
            }
        };
    });
})();
