/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    module.service('DynamicTableSettingsService', function (
        $q,
        UiSettingsService,
        AuthRestService,
        DefaultTableStates
    ) {
        var service = {},
            settingKey = 'dynamic_table';

        var init = function () {
            var user = AuthRestService.getCurrentUser();

            service.user = user;
            service.settings = UiSettingsService.getSaved(settingKey) || {};
        };

        service.save = function (storageKey, state) {
            service.settings[storageKey] = state;

            return UiSettingsService.save(settingKey, service.settings);
        };

        service.getSaved = function (storageKey) {
            return service.settings[storageKey] || {};
        };

        service.getColumnSortingAndMatchNameToField = function (storageKey) {
            var storedGridState = this.getSaved(storageKey);

            var defaultGridState = DefaultTableStates[storageKey] || {};

            var sortColumnName = "";
            var sortColumnField = "";
            var sortColumnDir = "";

            angular.forEach(storedGridState.columns, function (column) {
                if (Object.keys(column.sort).length !== 0 && column.sort.constructor === Object) {
                    sortColumnDir = column.sort.direction;
                    sortColumnName = column.name;
                }
            });

            angular.forEach(defaultGridState.columns, function (column) {
                if (sortColumnName === column.name) {
                    sortColumnField = column.field;
                }
            });

            return {sortDir: sortColumnDir, sortField: sortColumnField};
        };

        init();

        return service;
    });
})();
