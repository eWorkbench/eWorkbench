/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing resource type info
     */
    module.factory('ResourceConverterService', function (gettextCatalog, userCacheService) {
        'ngInject';

        var service = {
            'resourceTypeImages': {
                'ROOM': 'fa fa-key',
                'LABEQ': 'fa fa-flask',
                'OFFEQ': 'fa fa-briefcase',
                'ITRES': 'fa fa-laptop'
            },
            'resourceTypeTexts': {
                'ROOM': gettextCatalog.getString('Room'),
                'LABEQ': gettextCatalog.getString('Lab Equipment'),
                'OFFEQ': gettextCatalog.getString('Office Equipment'),
                'ITRES': gettextCatalog.getString('IT-Resource')
            },
            'resourceTypeOrder': {
                'ROOM': 4,
                'LABEQ': 3,
                'OFFEQ': 2,
                'ITRES': 1
            },
            'branchLibraryTexts': {
                'CHEM': gettextCatalog.getString('Chemistry'),
                'MAIT': gettextCatalog.getString('Mathematics & Informatics'),
                'MEDIC': gettextCatalog.getString('Medicine'),
                'PHY': gettextCatalog.getString('Physics'),
                'SHSCI': gettextCatalog.getString('Sport & Health Sciences'),
                'MCAMP': gettextCatalog.getString('Main Campus'),
                'WEIH': gettextCatalog.getString('Weihenstephan')
            },
            'branchLibraryOrder': {
                'CHEM': 7,
                'MAIT': 6,
                'MEDIC': 5,
                'PHY': 4,
                'SHSCI': 3,
                'MCAMP': 2,
                'WEIH': 1
            },
            'resourceUserAvailabilityImages': {
                'GLB': 'fa fa-globe',
                'PRJ': 'fa fa-book',
                'USR': 'fa fa-user'
            },
            'resourceUserAvailabilityTexts': {
                'GLB': gettextCatalog.getString('Global'),
                'PRJ': gettextCatalog.getString('Only project members'),
                'USR': gettextCatalog.getString('Only selected users')
            },
            'resourceUserAvailabilityOrder': {
                'GLB': 3,
                'PRJ': 2,
                'USR': 1
            },
            /**
             * Adds type_as_text to the resource
             * @param resource
             * @returns {resource}
             */
            'convertResourceFromRestAPI': function (resource) {
                // do not convert objects that do not contain an actual resource
                // this is the case when rest api throws an error
                if (!resource.pk) {
                    return resource;
                }

                var i = 0;

                resource.priority_as_order = service.resourceTypeOrder[resource.type];
                resource.user_availability_as_order = service.resourceUserAvailabilityOrder[resource.user_availability];
                resource.project_pk = resource.project;

                if (resource.created_by) {
                    userCacheService.addUserToCache(resource.created_by);
                }
                if (resource.last_modified_by) {
                    userCacheService.addUserToCache(resource.last_modified_by);
                }
                if (resource.assigned_user) {
                    userCacheService.addUserToCache(resource.assigned_user);
                }
                if (resource.assigned_users) {
                    for (i = 0; i < resource.assigned_users.length; i++) {
                        userCacheService.addUserToCache(resource.assigned_users[i]);
                    }
                }

                return resource;
            },
            'transformResponseForResourceArray': function (data, headersGetter) {
                var list = angular.fromJson(data);

                for (var i = 0; i < list.length; i++) {
                    service.convertResourceFromRestAPI(list[i]);
                }

                return list;
            },
            'transformResponseForResource': function (data, headersGetter, status) {
                var resource = angular.fromJson(data);

                // do not convert the response if the status code is an error (e.g., 40x)
                if (status === undefined || (status >= 200 && status < 300)) {
                    return service.convertResourceFromRestAPI(resource);
                }

                return resource;
            }
        };

        return service;
    });

})();
