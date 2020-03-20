/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('services');

    module.factory('ProjectPkToDetailService', function (
        ProjectRestService,
        $q
    ) {
        var service = {};

        /**
         * Fetch projects for given PK-List and return as list
         * @param projectPks[]
         */
        service.getProjectList = function (projectPks) {
            var promiseList = [],
                promise = null;

            angular.forEach(projectPks, function (projectPk) {
                promise = ProjectRestService.getCached({pk: projectPk}).$promise;

                // Convert rejected promises to fulfilled promises
                // Creates "Unknown project" entries for projects the user has no access to.
                // This is necessary for $q.all() not to abort.
                promise = promise.catch(function () {
                    return {"name": "Unknown project", pk: projectPk};
                });

                promiseList.push(promise);
            });


            return $q.all(promiseList).then(
                function success (projects) {
                    return projects;
                },
                function error (rejection) {
                    return rejection;
                }
            );

        };

        return service;
    });
})();
