/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing DSS container info
     */
    module.factory('DSSContainerConverterService', function (gettextCatalog, userCacheService, PaginationCountHeader) {
        'ngInject';

        var service = {
            // define DSS container read write settings
            'dssContainerRWSettings': {
                'RO': 'dsscontainer-read-only',
                'RWNN': 'dsscontainer-read-write-no-new',
                'RWON': 'dsscontainer-read-write-only-new',
                'RWA': 'dsscontainer-read-write-all'
            },
            // define default order of DSS container read write settings
            'dssContainerRWSettingOrder': {
                'RO': 1,
                'RWNN': 2,
                'RWON': 3,
                'RWA': 4
            },
            'dssContainerRWSettingImages': {
                'RO': 'fa fa-eye',
                'RWNN': 'fa fa-star',
                'RWON': 'fa fa-plus',
                'RWA': 'fa fa-arrows-v'
            },
            'dssContainerRWSettingTexts': {
                'RO': gettextCatalog.getString('Read Only'),
                'RWNN': gettextCatalog.getString('Read Write No New'),
                'RWON': gettextCatalog.getString('Read Write Only New'),
                'RWA': gettextCatalog.getString('Read Write All')
            },
            // define DSS container import options
            'dssContainerImportOptions': {
                'ION': 'dsscontainer-import-only-new',
                'IL': 'dsscontainer-import-list',
                'IA': 'dsscontainer-import-all'
            },
            // define default order of DSS container read write settings
            'dssContainerImportOptionOrder': [
                'ION',
                'IL',
                'IA'
            ],
            'dssContainerImportOptionImages': {
                'ION': 'fa fa-plus',
                'IL': 'fa fa-list',
                'IA': 'fa fa-globe'
            },
            'dssContainerImportOptionTexts': {
                'ION': gettextCatalog.getString('Only new Globus imports'),
                'IL': gettextCatalog.getString('Import list'),
                'IA': gettextCatalog.getString('Import all')
            },
            /**
             * Adds additional information from the api to the dsscontainer
             * @param dsscontainer
             * @returns {dsscontainer}
             */
            'convertDSSContainerFromRestAPI': function (dsscontainer) {
                // do not convert objects that do not contain an actual dsscontainer
                // this is the case when rest api throws an error
                if (!dsscontainer.pk) {
                    return dsscontainer;
                }

                var i = 0;

                dsscontainer.project_pk = dsscontainer.project;

                if (dsscontainer.created_by) {
                    userCacheService.addUserToCache(dsscontainer.created_by);
                }
                if (dsscontainer.last_modified_by) {
                    userCacheService.addUserToCache(dsscontainer.last_modified_by);
                }
                if (dsscontainer.assigned_user) {
                    userCacheService.addUserToCache(dsscontainer.assigned_user);
                }
                if (dsscontainer.assigned_users) {
                    for (i = 0; i < dsscontainer.assigned_users.length; i++) {
                        userCacheService.addUserToCache(dsscontainer.assigned_users[i]);
                    }
                }

                return dsscontainer;
            },
            'transformResponseForDSSContainerArray': function (data, headers) {
                var list = angular.fromJson(data);

                headers()[PaginationCountHeader.getHeaderName()] = list.count;

                if (list.results) {
                    for (var i = 0; i < list.results.length; i++) {
                        service.convertDSSContainerFromRestAPI(list.results[i]);
                    }
                } else {
                    for (var j = 0; j < list.length; j++) {
                        service.convertDSSContainerFromRestAPI(list[j]);
                    }

                    return list;
                }

                return list.results;
            },
            'transformResponseForDSSContainer': function (data, headersGetter, status) {
                var dsscontainer = angular.fromJson(data);

                // do not convert the response if the status code is an error (e.g., 40x)
                if (status === undefined || (status >= 200 && status < 300)) {
                    return service.convertDSSContainerFromRestAPI(dsscontainer);
                }

                return dsscontainer;
            }
        };

        return service;
    });

})();
