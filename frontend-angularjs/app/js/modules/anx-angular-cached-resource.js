/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/**
 * @ngdoc module
 *
 * @name cachedResource
 *
 * @class angular_module.cachedResource
 *
 * @memberOf angular_module
 *
 * @description
 * Defines an extension for ng-resource that keeps an internal array and dictionary of the underlying data coming from
 * REST API. Any update/create/delete done with this module is synced between a local in memory storage and the REST
 * endpoint. The service works as a replacement for an ordinary ng-resource and keeps the data locally in a cache.
 *
 * It is assumed that ng-resource provides the following methods:
 *  - query (query a list/array of items)
 *  - get (query a item by primary key)
 *  - create (create a new item)
 *  - update (updates an existing item by primary key)
 *  - delete (deletes an existing item by primary key)
 *
 * For information about how to use these methods, please look at the documentation of the "normal" ng-resource:
 * https://docs.angularjs.org/api/ngResource/service/$resource
 *
 * The following methods are made available in addition to those by ng-resource:
 *  - queryCached - returns a cached copy of the list
 *  - create - creates a new entry and stores it in the cache
 *  - getCached - gets an object by its primary key value (either from cache or from REST)
 *  - invalidateLocalDataStore - invalidates the current local data store, which will force a reload of the data store
 *    for the next request
 *
 * Cache Configuration Parameters:
 *
 * @param {{}} cacheConfig - a dictionary with some options
 *
 * @param {string} cacheConfig.keyName Name of the primary key column (default: pk)
 *
 * @param {number} cacheConfig.cacheTimeoutInSeconds Time after which the cache is invalidated in seconds
 *
 * @param {boolean} cacheConfig.invalidateCacheOnUpdates Whether or not the cache should be invalidated after each
 *   update (default: true)
 *
 * @param {boolean} cacheConfig.invalidateCacheOnInsert Whether or not the cache should be invalidated after each
 *   insert (default: true)
 *
 * @param {array} cacheConfig.relatedCaches A list of related caches that needs to be cleared when
 *   invalidateLocalDataStore is called (handled via angular dynamic injection)
 *
 * @example <caption>Define the service</caption>
 ```
 app.factory('Project', function(cachedResource) {
    // create ng-resource for api endpoint /api/projects, with parameter pk
    return cachedResource(
        '/api/projects/:pk/',
        {pk: '@pk'},
        {},
        {
            keyName: 'pk',
            cacheTimeoutInSeconds: 30,
            invalidateCacheOnUpdates: true
        }
    );
});
 ```
 * @example <caption>Controller</caption>
 ```
 // query (get all)
 Project.query().$promise.then(
 function(response) {
         console.log('projects loaded');
         $scope.projects = response;
     }
 );

 // query from cache
 Project.queryCached().then(
 function(response) {
         console.log('projects loaded');
         $scope.projects = response;
     }
 );

 // create
 Project.create($scope.project).$promise.then(
 function(response) {
         console.log("Project created!");
     },
 function(rejection) {
         console.log("Failed to create project!");
         console.log(rejection);
     }
 );

 // get by id (from REST endpoint)
 Project.get({pk: project_pk}).$promise.then(
 function(response) {
          console.log("response=");
          console.log(response);
          $scope.project = response;
     }, function(rejection) {
          console.log("Error: Could not find project with id " + project_id);
          console.log(rejection);
     }
 );


 // get by id (from cache, if available)
 Project.getCached(project_pk).$promise.then(
 function(response) {
          console.log("response=");
          console.log(response);
          $scope.project = response;
     }, function(rejection) {
          console.log("Error: Could not find project with id " + project_id);
          console.log(rejection);
     }
 );


 // get by id (force get from REST API)
 Project.getCached(project_pk, true).$promise.then(
 function(response) {
          console.log("response=");
          console.log(response);
          $scope.project = response;
     }, function(rejection) {
          console.log("Error: Could not find project with id " + project_id);
          console.log(rejection);
     }
 );

 // delete object
 $scope.project.$delete().$promise.then(
 function(response) {
         console.log('success remove');
     }, function(rejection) {
         console.log('remove failed');
         console.log(rejection);
     }
 );

 // update object
 $scope.project.$update().$promise.then(
 function(response) {
         console.log('success update');
     }, function(rejection) {
         console.log('update failed');
         console.log(rejection);
     }
 );
 ```
 */
(function () {
    'use strict';

    angular.module('anx.cachedResource', ['ngResource'])
        .constant('MODULE_VERSION', '0.2')
        .factory('cachedResource', function ($q, $resource, $injector) {
            'ngInject';

            /**
             * A cache of cached resources
             * @type {{}}
             */
            var cachedResources = {};

            // create the object for this module
            return function (url, params, methods, cacheConfig) {
                // check if cachedResources[url] is set
                if (cachedResources.hasOwnProperty(url)) {
                    console.log(url + " - reusing existing cachedResource");
                    return cachedResources[url];
                }

                var obj = {};

                var emptyHashValue = Hashcode.value(undefined);

                cacheConfig = cacheConfig || {};

                /**
                 * Name of the primary key
                 * @type {string}
                 */
                obj.keyName = cacheConfig.keyName || "pk";

                /**
                 * Define the time when the cache should be invalidated in seconds
                 * @type {number}
                 */
                obj.cacheTimeoutInSeconds = 30;
                if (cacheConfig.cacheTimeoutInSeconds !== undefined)
                    obj.cacheTimeoutInSeconds = cacheConfig.cacheTimeoutInSeconds;

                /**
                 * Whether or not the cache should be invalidated on update/delete/... operations
                 * @type {boolean}
                 */
                obj.invalidateCacheOnUpdates = true;
                if (cacheConfig.invalidateCacheOnUpdates !== undefined)
                    obj.invalidateCacheOnUpdates = cacheConfig.invalidateCacheOnUpdates;

                /**
                 * Whether or not the cache should be invalidated on insert operations
                 * @type {boolean}
                 */
                obj.invalidateCacheOnInsert = true;
                if (cacheConfig.invalidateCacheOnInsert !== undefined)
                    obj.invalidateCacheOnInsert = cacheConfig.invalidateCacheOnInsert;

                /**
                 * A list of cache dependencies (e.g., other factories of type angular-cached-resource)
                 * @type {Array}
                 */
                obj.relatedCaches = [];
                if (cacheConfig.relatedCaches)
                    obj.relatedCaches = cacheConfig.relatedCaches;


                /**
                 * Array that holds the local data
                 * @type {Array}
                 */
                obj.localDataStore = [];

                /**
                 * Dictionary that holds local data by primary key
                 * @type {{}}
                 */
                obj.localDataStoreByKey = {};

                /**
                 * Dictionary that holds active QUERY requests by URL
                 * @type {{}}
                 */
                obj.queryInProgressByUrl = {};

                /**
                 * Dictionary that holds active promises by URL
                 * @type {{}}
                 */
                obj.queryPromiseByUrl = {};

                /**
                 * Dictionary that holds active GET requests by URL
                 * @type {{}}
                 */
                obj.getInProgressByUrl = {};

                /**
                 * Dictionary that holds active GET request promises by URL
                 * @type {{}}
                 */
                obj.getPromiseByUrl = {};

                /**
                 * Dictionary that holds the time when the last query happened by URL
                 * @type {{}}
                 */
                obj.lastQueryTimeByUrl = {};


                obj.deletePromise = undefined;
                obj.updatePromise = undefined;

                /* default actions as they should be provided in app.js
                 $resourceProvider.defaults.actions = {
                 'get': {'method': 'GET'},
                 'query': {'method': 'GET', 'isArray': true},
                 'create': {'method': 'POST'},
                 'update': {'method': 'PUT'},
                 'delete': {'method': 'DELETE'}
                 };
                 */

                // create a "normal" ng-resource
                obj.resource = $resource(url, params, methods);

                /**
                 * Wrapper for ng resources update
                 * @param updated_data
                 */
                obj.update = function (updated_data) {
                    console.debug('In obj.update');
                    console.debug(updated_data);
                    obj.updatePromise = obj.resource.update(updated_data);

                    if (obj.invalidateCacheOnUpdates) {
                        obj.invalidateLocalDataStore();
                    } else {
                        // we need to do something with the updated data
                        obj.updatePromise.$promise.then(
                            function (response) {
                                console.log(url + ': Positive response on $update');
                                var idx = obj.getIndexOfDataByKey(updated_data[obj.keyName]);
                                if (idx != -1) {
                                    // update entry in local data store
                                    obj.localDataStore[idx] = response;
                                    obj.localDataStoreByKey[updated_data[obj.keyName]] = response;
                                } else {
                                    console.error(url + ': Could not find updated entry in local data store... ' +
                                        'adding it anyway');
                                    obj.localDataStore.push(response);
                                    obj.localDataStoreByKey[updated_data[obj.keyName]] = response;
                                }
                            }
                        );
                    }

                    return obj.updatePromise;
                };

                // overwrite the update method of each entity
                obj.resource.prototype.$update = function () {
                    var updated_data = this;
                    return obj.update(updated_data).$promise;
                };

                obj.updatePartial = function (updated_data) {
                    console.debug('In obj.updatePartial');
                    console.debug(updated_data);
                    obj.updatePartialPromise = obj.resource.updatePartial(updated_data);

                    if (obj.invalidateCacheOnUpdates) {
                        obj.invalidateLocalDataStore();
                    } else {
                        // we need to do something with the updated data
                        obj.updatePartialPromise.$promise.then(
                            function (response) {
                                console.log(url + ': Positive response on $update');
                                var idx = obj.getIndexOfDataByKey(updated_data[obj.keyName]);
                                if (idx != -1) {
                                    // update entry in local data store
                                    obj.localDataStore[idx] = response;
                                    obj.localDataStoreByKey[updated_data[obj.keyName]] = response;
                                } else {
                                    console.error(url + ': Could not find updated entry in local data store... ' +
                                        'adding it anyway');
                                    obj.localDataStore.push(response);
                                    obj.localDataStoreByKey[updated_data[obj.keyName]] = response;
                                }
                            }
                        );
                    }

                    return obj.updatePartialPromise;
                };

                /**
                 * wrapper for ng resources delete
                 * @param data_to_delete
                 */
                obj.delete = function (data_to_delete) {
                    // call ng resources delete function
                    obj.deletePromise = obj.resource.delete(data_to_delete[obj.keyName], data_to_delete);

                    if (obj.invalidateCacheOnUpdates) {
                        obj.invalidateLocalDataStore();
                    } else {
                        // we need to do something with the data
                        obj.deletePromise.$promise.then(
                            function (response) {
                                var idx = obj.getIndexOfDataByKey(data_to_delete[obj.keyName]);
                                if (idx != -1) {
                                    // delete entry from local data store
                                    obj.localDataStore.splice(idx, 1);
                                    delete obj.localDataStoreByKey[data_to_delete[obj.keyName]];
                                } else {
                                    console.error(url + ': Could not find deleted entry in local data store... ');
                                }
                            }
                        );
                    }

                    return obj.deletePromise;
                };

                obj.resource.prototype.$delete = function () {
                    var data_to_delete = this;
                    return obj.delete(angular.copy(data_to_delete)).$promise;
                };

                /**
                 * Wrapper for $resource create
                 * @param data
                 * @returns {*}
                 */
                obj.create = function (data) {
                    console.debug(url + ': in obj.create');
                    obj.createPromise = obj.resource.create(data);

                    if (obj.invalidateCacheOnInsert) {
                        console.debug(url + ': Invalidating cache on insert...');
                        obj.invalidateLocalDataStore();
                    } else {
                        // we need to do something with the data
                        obj.createPromise.$promise.then(function (response) {
                            console.debug(url + ': Adding response to localDataStore');
                            console.debug(response);
                            // positive response
                            // push to local data store
                            obj.localDataStore.push(response);
                            // and add it to the store by key
                            obj.localDataStoreByKey[response[obj.keyName]] = response;
                        });
                    }

                    return obj.createPromise;
                };

                /**
                 * the last nonce for invalidating caches
                 * @type {undefined}
                 */
                obj.lastNonce = undefined;

                /**
                 * Invalidates the current cache and all related caches
                 * @param nonce - number used once for detecting circular references within related caches
                 */
                obj.invalidateLocalDataStore = function (nonce) {
                    console.debug(url + ': Trying to invalidate local data store for url=' + url);
                    // check if nonce is set
                    if (nonce !== undefined) {
                        if (nonce == obj.lastNonce) {
                            console.debug(url + ': invalidateLocalDataStore: Circular reference detected and stopped!');
                            return;
                        } else {
                            // use current nonce
                            obj.lastNonce = nonce;
                        }
                    } else {
                        // generate a new nonce
                        obj.lastNonce = Math.random();
                    }

                    // reset last Query time
                    obj.lastQueryTimeByUrl = {};

                    obj.localDataStore = [];
                    obj.localDataStoreByKey = {};

                    console.debug(url + ': Invalidating related data stores: ' + obj.relatedCaches.join(', '));
                    // invalidate local data store for all related caches
                    angular.forEach(obj.relatedCaches, function (dep) {
                        // invoke the invalidateLocalDataStore method of the related cached-resource
                        $injector.get(dep).invalidateLocalDataStore(obj.lastNonce);
                    });
                };

                obj.waitForQueryPromiseAndReturnPromiseDict = function () {
                    var defer = $q.defer();

                    // wait for query promise to finish, then return the local data store by key
                    obj.queryPromiseByUrl[emptyHashValue].$promise.then(function success(response) {
                        defer.resolve(obj.localDataStoreByKey);
                    }, function error(rejection) {
                        defer.reject(rejection);
                    });

                    return defer.promise;
                };

                /**
                 * Returns a cached version of the dictionary
                 */
                obj.queryCachedDict = function () {
                    if (obj.queryInProgressByUrl[emptyHashValue]) {
                        console.debug(url + ': A query for this resource is already in progress, returning you a promise');
                        return obj.waitForQueryPromiseAndReturnPromiseDict();
                    }

                    // calculate time difference since last query
                    var now = new Date().getTime() / 1000;
                    var diff = now - obj.lastQueryTimeByUrl[emptyHashValue];

                    console.debug(url + ": lastQueryTime=" + obj.lastQueryTimeByUrl[emptyHashValue] + ", diff=" + diff);

                    if (diff > obj.cacheTimeoutInSeconds && obj.lastQueryTimeByUrl[emptyHashValue] != -1)
                        obj.invalidateLocalDataStore();

                    // check if there are data in cache
                    if (obj.localDataStore.length == 0 || obj.lastQueryTimeByUrl[emptyHashValue] == -1 || obj.lastQueryTimeByUrl[emptyHashValue] === undefined) {
                        // no data in cache -> query data from REST
                        obj.query();
                        // wait for query promise to resolve
                        return obj.waitForQueryPromiseAndReturnPromiseDict();
                    }

                    console.debug(url + ': Getting data from cache (still valid for '
                        + (obj.cacheTimeoutInSeconds - diff) + ' seconds)');

                    var defer = $q.defer();
                    defer.resolve(obj.localDataStoreByKey);
                    return defer.promise;
                };

                /**
                 * Returns a cached version of the datastore
                 * @returns {*}
                 */
                obj.queryCached = function (args) {
                    console.debug(url + ': queryCached() called');

                    // calculate a hashValue for this args
                    var hashValue = Hashcode.value(args);

                    if (obj.queryInProgressByUrl[hashValue]) {
                        console.log(url + ": A query with args='" + angular.toJson(args) + "' is already in progress --> promise");
                        return obj.queryPromiseByUrl[hashValue];
                    }

                    // calculate time difference since last query
                    var now = new Date().getTime() / 1000;
                    var diff = now - obj.lastQueryTimeByUrl[hashValue];

                    console.debug(url + ": lastQueryTime=" + obj.lastQueryTimeByUrl[hashValue] + ", diff=" + diff);

                    // check if the data store needs to be invalidated
                    if (diff > obj.cacheTimeoutInSeconds && obj.lastQueryTimeByUrl[hashValue] != -1) {
                        obj.invalidateLocalDataStore();
                    }

                    // check if there are data in cache
                    if ( (args && Object.keys(args).length > 0) || // if this query call has arguments
                        obj.localDataStore.length == 0 || // or: local data store is empty
                        obj.lastQueryTimeByUrl[hashValue] == -1 ||  // or: last query time is -1 or undefined
                        obj.lastQueryTimeByUrl[hashValue] == undefined
                    )
                    {
                        // no data in cache
                        console.debug("Query " + url + ": getting obj.query");
                        // no data in cache
                        return obj.query(args);
                    }

                    // else: we have data in cache
                    console.debug(url + ': Getting data from cache (still valid for '
                        + (obj.cacheTimeoutInSeconds - diff) + ' seconds)');

                    var defer = $q.defer();
                    defer.resolve(obj.localDataStore);

                    // return the obj with $promise to have compatibility with $resource
                    obj.localDataStore.$promise = defer.promise;
                    return obj.localDataStore;
                };

                /**
                 * Wraps ng resources query and returns the same thing
                 * additionally stores the result in localDataStore
                 * @param args passed to resource.query
                 * @returns {*}
                 */
                obj.query = function (args) {
                    // calculate hash value for this args
                    var hashValue = Hashcode.value(args);

                    if (obj.queryInProgressByUrl[hashValue]) {
                        console.debug(url + ': A query for this resource is already in progress, returning you the promise');
                        return obj.queryPromiseByUrl[hashValue];
                    }

                    obj.queryInProgressByUrl[hashValue] = true;

                    // query ng resource
                    obj.queryPromiseByUrl[hashValue] = obj.resource.query(args);

                    obj.queryPromiseByUrl[hashValue].$promise.then(
                        function success(response) {
                            // success
                            obj.localDataStore = response;
                            obj.buildLocalDataStoreByKey();

                            obj.queryInProgressByUrl[hashValue] = false;
                            obj.queryPromiseByUrl[hashValue] = undefined;
                            delete obj.queryPromiseByUrl[hashValue];

                            // store last query time
                            obj.lastQueryTimeByUrl[hashValue] = new Date().getTime() / 1000;
                        },
                        function error(rejection) {
                            obj.queryInProgressByUrl[hashValue] = false;
                            obj.queryPromiseByUrl[hashValue] = undefined;
                            delete obj.queryPromiseByUrl[hashValue];
                        }
                    );

                    return obj.queryPromiseByUrl[hashValue];
                };

                /**
                 * Wrapper for ng resources get method
                 * @param args
                 * @returns {*}
                 */
                obj.get = obj.resource.get;


                /**
                 * Method for refreshing an object and making sure the response is stored in our local data store
                 */
                obj.resource.prototype.$getCached = function()
                {
                    return this.$get().then(
                        function (response) {
                            obj.addElementToLocalData(response);
                        }
                    )
                };

                /**
                 * Fetch a single object by id (fetch from local data store if available)
                 * @param keyValue:string - value of the primary key of the object
                 * @param force_update:bool - whether or not we should always query the webservice
                 * @returns {promise}
                 */
                obj.getCached = function (keyValues, force_update) {
                    var elementObj = {};

                    force_update = typeof force_update !== 'undefined' ? force_update : false;

                    var keyValue = keyValues[obj.keyName];

                    // calculate a hashValue for this args
                    var hashValue = Hashcode.value(keyValues);

                    // check if a get promise is already in progress
                    if (obj.getInProgressByUrl[hashValue]) {
                        console.log(url + ": A GET requests with args='" + angular.toJson(keyValues) + "' is already in progress --> promise");
                        return obj.getPromiseByUrl[hashValue];
                    }

                    if (!force_update && obj.localDataStoreByKey[keyValue]) {
                        var defer = $q.defer();
                        console.debug(url + ': returning object with id=' + keyValue + ' from local store');
                        elementObj = angular.copy(obj.localDataStoreByKey[keyValue]);
                        defer.resolve(elementObj);
                        // fake a promise
                        elementObj.$promise = defer.promise;

                        return elementObj;
                    } else {
                        var getPromise = obj.get(keyValues);

                        getPromise.$promise.then(
                            function (response) {
                                delete obj.getInProgressByUrl[hashValue];
                                delete obj.getPromiseByUrl[hashValue];

                                // success, add it to the local dictionary and storage
                                obj.addElementToLocalData(response);
                            }
                        );

                        return getPromise;
                    }
                };

                /**
                 * Builds the local data store by primary key
                 */
                obj.buildLocalDataStoreByKey = function () {

                    for (var i = 0; i < obj.localDataStore.length; i++) {
                        var value = obj.localDataStore[i];
                        obj.localDataStoreByKey[value[obj.keyName]] = value;
                    }

                    // angular.forEach(obj.localDataStore, function (value) {
                    //     obj.localDataStoreByKey[value[obj.keyName]] = value;
                    // });
                };

                /**
                 * Checks if an element with a certain primary key is already in the local data store
                 * @param keyValue value of the primary key
                 * @returns {number} the index of the element or -1 if not found
                 */
                obj.getIndexOfDataByKey = function (keyValue) {
                    var idx = -1, i;
                    for (i = 0; i < obj.localDataStore.length; i++) {
                        if (obj.localDataStore[i][obj.keyName] == keyValue) {
                            idx = i;
                            break;
                        }
                    }

                    return idx;
                };

                /**
                 * Adds an element to the local data store
                 * @param elem
                 */
                obj.addElementToLocalData = function (elem) {
                    // check if data is already in local dictionary
                    if (obj.localDataStoreByKey[elem[obj.keyName]]) {
                        // find in local data and update
                        var idx = obj.getIndexOfDataByKey(elem[obj.keyName]);

                        // found !
                        if (idx != -1) {
                            // update references
                            obj.localDataStore[idx] = elem;
                            obj.localDataStoreByKey[elem[obj.keyName]] = elem;
                        } else {
                            console.error(url + ': Could not find primary key "' + elem[obj.keyName] + '" in ' +
                                'localDataStore although it is set in localDataStoreByKey');
                        }

                    } else {
                        // it is not yet in the dictionary, so we push it to the array
                        obj.localDataStore.push(elem);
                        // and add it to the dictionary
                        obj.localDataStoreByKey[elem[obj.keyName]] = elem;
                    }
                };

                cachedResources[url] = obj;

                return cachedResources[url];
            };
        });

})();
