/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing history model type information
     */
    module.factory('HistoryModelTypeService', function (gettextCatalog, userCacheService) {
        'ngInject';

        var service = {
            'historyChangeText': {
                'U': gettextCatalog.getString('edited'),
                'I': gettextCatalog.getString('created'),
                'D': gettextCatalog.getString('deleted'),
                'S': gettextCatalog.getString('trashed'),
                'R': gettextCatalog.getString('restored')
            },
            /**
             * Adds change_name to the history
             * @param history
             * @returns {history}
             */
            'convertHistoryFromRestAPI': function (history) {
                history.change_name = service.historyChangeText[history.changeset_type];

                return history;
            },
            'transformResponseForHistoryArray': function (data, headersGetter) {
                var list = angular.fromJson(data);

                if (list.results) {
                    for (var i = 0; i < list.results.length; i++) {
                        service.convertHistoryFromRestAPI(list.results[i]);
                    }
                } else {
                    for (var j = 0; i < list.length; j++) {
                        service.convertHistoryFromRestAPI(list[j]);
                    }

                    return list;
                }

                return list;
            },
            'transformResponseForHistory': function (data, headersGetter) {
                var history = angular.fromJson(data);

                if (history.user) {
                    userCacheService.addUserToCache(history.user);
                }

                return service.transformResponseForHistoryArray(history);
            }

        };

        return service;
    });
})();
