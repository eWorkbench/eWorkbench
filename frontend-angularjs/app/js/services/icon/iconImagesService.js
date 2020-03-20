/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing icon images in whole project
     */
    module.factory('IconImagesService', function (workbenchElements) {
        'ngInject';

        // Generate main element icons

        var mainElementIcons = {};

        /**
         * Iterate over all workbench elements and add those elements with their names to mainElementIcons
         */
        for (var elementName in workbenchElements.elements) {
            if (workbenchElements.elements.hasOwnProperty(elementName)) {
                var element = workbenchElements.elements[elementName];

                mainElementIcons[element.modelName] = element.icon;
            }
        }

        mainElementIcons['user'] = 'fa fa-user';
        mainElementIcons['activity'] = 'fa fa-list';

        var service = {
            'mainElementIcons': mainElementIcons,
            'searchElementIcons': {
                'waiting': 'fa fa-clock-o',
                'search': 'fa fa-search',
                'cancel': 'fa fa-times',
                'noResult': 'fa fa-exclamation-circle',
                'searching': 'fa fa-spinner'
            },
            'mainActionIcons':{
                'add': 'fa fa-plus',
                'edit': 'fa fa-pencil',
                "add_square": 'fa fa-plus-square',
                'export_pdf': 'fa fa-file-pdf-o',
                'export': 'fa fa-download',
                'close': 'fa fa-times',
                'trash': 'fa fa-trash',
                'restore': 'fa fa-recycle',
                'delete': 'fa fa-times',
                'duplicate': 'fa fa-clone',
                'privileges': 'fa fa-unlock-alt',
                'check': 'fa fa-check',
                'save': 'fa fa-save',
                'down': 'fa fa-chevron-down',
                'up': 'fa fa-chevron-up',
                'move': 'fa fa-arrows-alt',
                'share': 'fa fa-share'
            },
            'mainWarningIcons':{
                'alert': 'fa fa-exclamation-circle'
            },
            'genericIcons':{
                'phone': 'fa fa-phone',
                'email': 'fa fa-envelope-o',
                'history': 'fa fa-history',
                'directory': 'fa fa-folder-o',
                'password': 'fa fa-lock'
            }
        };

        return service;
    });

})();
