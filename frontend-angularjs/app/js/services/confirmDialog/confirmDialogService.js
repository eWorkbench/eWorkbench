/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    module.service('confirmDialogService', function (
        $q,
        gettextCatalog,
        UiSettingsService,
        toaster,
        AuthRestService
    ) {
        var service = {},
            settingKey = 'confirm_dialog',
            prefix = 'SkipDialog-';

        var init = function () {
            var user = AuthRestService.getCurrentUser();

            service.user = user;
            service.settings = UiSettingsService.getSaved(settingKey) || {};
        };

        service.save = function () {
            return UiSettingsService.save(settingKey, service.settings);
        };

        service.getInfoMap = function () {
            return {
                'RemoveDirectory': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when removing a directory')
                },
                'TrashFile': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when trashing a file')
                },
                'ConvertTiff': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when a TIFF image needs to be converted first')
                },
                'LeaveProject': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when leaving a project')
                },
                'DeleteElementFromDeleteMenu': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when deleting an element from the menu')
                },
                'TrashElementFromDeleteMenu': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when trashing an element from the menu')
                },
                'DeleteColumn': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when deleting a column')
                },
                'DeleteElementFromDetailView': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when deleting an element')
                },
                'TrashElementFromDetailView': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when trashing an element')
                },
                'DuplicateProject': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when duplicating a project')
                },
                'RemoveElementFromLabbook': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when removing an element from a labbook')
                },
                'TrashAndDeleteElementFromLabbook': {
                    'label': gettextCatalog.getString(
                        'Ask for confirmation when trashing and deleting an element from a labbook')
                }
            };
        };

        service.getDialogInfos = function () {
            var infoMap = service.getInfoMap();

            for (var key in infoMap) {
                if (infoMap.hasOwnProperty(key)) {
                    var dialog = infoMap[key];

                    dialog.enabled = !service.isDialogSkipped(key);
                }
            }

            return infoMap;
        };

        service.getDialogKeys = function () {
            var keys = [],
                infoMap = service.getInfoMap();

            for (var key in infoMap) {
                if (infoMap.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }

            return keys;
        };

        service.isDialogSkipped = function (dialogKey) {
            if (service.settings) {
                if (service.settings[prefix + dialogKey]) {
                    return true;
                }
            }

            return false;
        };

        service.setDialogActive = function (dialogKey, active) {
            service.settings[prefix + dialogKey] = !active;
        };

        init();

        return service;
    });
})();
