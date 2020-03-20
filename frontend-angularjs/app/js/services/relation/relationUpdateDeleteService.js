/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for relation update and delete
     */
    module.factory('RelationUpdateDeleteService', function ($q, gettextCatalog, $uibModal, toaster) {
        'ngInject';

        return {
            'delete' : function (relation) {
                //opens a modal dialog and delete the relation when the user explicit said 'yes'.
                var defer = $q.defer();

                var modalInstance = $uibModal.open({
                    templateUrl: 'js/screens/relation/relationViewReallyDeleteRelation.html',
                    controller: 'relationViewReallyDeleteRelationController',
                    controllerAs: 'vm',
                    resolve: {
                    }
                });

                modalInstance.result.then(
                    function success (doDelete) {
                        if (doDelete) {
                            // really delete it!
                            relation.$delete().then(
                                function success (response) {
                                    toaster.pop('success', gettextCatalog.getString("Link deleted!"));
                                    defer.resolve(response);
                                },
                                function error (rejection) {
                                    console.log(rejection);
                                    toaster.pop('error', gettextCatalog.getString("Failed to delete link"));
                                    defer.reject(rejection);
                                }
                            );
                        }
                    },
                    function dismiss () {
                        console.log('modal dialog dismissed');
                        defer.reject({dismissed: true, error: false});
                    }
                );

                return defer.promise;
            },
            'update': function (relation) {
                //updates the relation private status
                var defer = $q.defer();

                // toggle private field
                relation.private = !relation.private;

                // update relation via rest api
                relation.$update().then(
                    function success (response) {
                        if (relation.private) {
                            toaster.pop('success', gettextCatalog.getString("Link is now private"));
                        } else {
                            toaster.pop('success', gettextCatalog.getString("Link is now public"));
                        }

                        defer.resolve(response);
                    },
                    function error (rejection) {
                        console.log(rejection);
                        // reset private status
                        relation.private = !relation.private;

                        toaster.pop('error', gettextCatalog.getString("Failed to update link private status"));
                        defer.reject(rejection);
                    }
                );

                return defer.promise;
            }
        };
    });

})();
