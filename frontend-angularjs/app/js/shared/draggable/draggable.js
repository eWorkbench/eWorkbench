/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('shared');

    module.directive('ngDraggable', function ($rootScope) {
        "ngInject";

        return {
            scope: {
                draggableModel: '='
            },
            restrict: 'A',

            link: function (scope, el, attrs, controller) {
                // mark this element as draggable
                angular.element(el).attr("draggable", "true");

                // bind the dragstart of this event
                el.bind("dragstart", function (e) {
                    e.originalEvent.dataTransfer.setData('text', angular.toJson(scope.draggableModel));
                    console.log('dragging - data transfer set');
                });

                el.bind("dragend", function (e) {

                });
            }
        };
    });

    module.directive('ngDropTarget', function () {
        "ngInject";

        return {
            restrict: 'A',
            scope: {
                onDrop: '&'
            },
            link: function (scope, el, attrs, controller) {
                el.bind("dragover", function (e) {
                    if (e.originalEvent.dataTransfer.files.length > 0) {
                        return; // ignore files
                    }

                    if (e.preventDefault) {
                        e.preventDefault(); // Allows us to drop
                    }

                    e.originalEvent.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object
                });

                el.bind("drop", function (e) {
                    if (e.originalEvent.dataTransfer.files.length > 0) {
                        return; // ignore files
                    }

                    var jsonData = e.originalEvent.dataTransfer.getData("text");

                    if (jsonData == '') {
                        return; // ignore empty dnd event
                    }

                    if (e.preventDefault) {
                        e.preventDefault(); // Necessary. Allows us to drop.
                    }

                    if (e.stopPropagation) {
                        e.stopPropagation(); // Necessary. Allows us to drop.
                    }

                    var data = angular.fromJson(jsonData);

                    scope.onDrop({data: data});
                });
            }
        };
    });
})();