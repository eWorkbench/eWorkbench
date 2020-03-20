/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    module.service('LabbookGridOptions', function (
    ) {
        var service = {};

        service.getCommonGridsterOpts = function () {
            /**
             * Options for angular gridster
             *
             * This specifies how the labbook grid looks like and how it behaves
             * e.g., columns defines the width of the grid in number of columns
             * @type {{}}
             **/
            return {
                columns: 20, // the width of the grid, in columns (if you increase this, performance is going to suffer)
                pushing: true, // whether to push other items out of the way on move or resize
                // whether to automatically float items up so they stack (you can temporarily disable if you are adding
                // unsorted items with ng-repeat)
                floating: false,
                // whether or not to have items of the same size switch places instead of pushing down if they are the
                // same size
                swapping: true,
                // can be an integer or 'auto'. 'auto' scales gridster to be the full width of its containing element
                width: 'auto',
                // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
                colWidth: 'auto',
                rowHeight: '50', // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
                margins: [6, 6], // the pixel distance between each widget
                outerMargin: false, // whether margins apply to outer edges of the grid
                sparse: true, // "true" can increase performance of dragging and resizing for big grid (e.g. 20x50)
                isMobile: false, // stacks the grid items if true
                // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
                mobileModeEnabled: false,
                minColumns: 1, // the minimum columns the grid must have
                minRows: 1, // the minimum height of the grid, in rows
                maxRows: 5000,
                extraRows: 5,
                defaultSizeX: 4, // the default width of a gridster item, if not specifed
                defaultSizeY: 3, // the default height of a gridster item, if not specified
                minSizeX: 4, // minimum column width of an item
                maxSizeX: null, // maximum column width of an item
                minSizeY: 1, // minumum row height of an item
                maxSizeY: null, // maximum row height of an item
                resizable: {
                    enabled: false
                },
                draggable: {
                    enabled: false
                }
            };
        };

        return service;
    });
})();
