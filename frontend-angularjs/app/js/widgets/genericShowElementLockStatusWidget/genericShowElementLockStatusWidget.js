/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('genericShowElementLockStatusWidget', function () {
        return {
            restrict: 'E',
            controller: 'GenericShowElementLockStatusWidgetController',
            templateUrl: 'js/widgets/genericShowElementLockStatusWidget/genericShowElementLockStatusWidget.html',
            scope: {
                baseModel: '=',
                showReloadMessage: '=?',
                showLocked: '=?',
                onLockCb: '&?',
                onUnlockCb: '&?',
                readOnly: '<'
            },
            replace: true,
            bindToController: true,
            controllerAs: 'vm'
        };
    });

    module.controller('GenericShowElementLockStatusWidgetController', function (
        $scope,
        $sce,
        $injector,
        $timeout,
        $transitions,
        $uibModal,
        AuthRestService,
        ElementLockRestService,
        WorkbenchElementChangesWebSocket,
        WorkbenchElementsTranslationsService,
        GenericModelService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.currentUser = {};
            vm.latestVersion = vm.baseModel.version_number;

            var contentType = vm.baseModel.content_type_model;

            if (!contentType) {
                console.error("Could not fetch content type of model");
                console.error(vm.baseModel);

                return;
            }

            var modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[contentType];

            vm.elementLockService = ElementLockRestService(modelName, vm.baseModel.pk);

            vm.lockStatus = null;

            vm.remainingLockTimeSeconds = 0;

            /**
             * Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                modelName, vm.baseModel.pk, function onChange (jsonMessage) {
                    if (jsonMessage['element_changed']) {
                        // changeMessage.version
                        vm.latestVersion = jsonMessage['element_changed'].version;
                    }

                    if (jsonMessage['element_lock_changed']) {
                        vm.lockStatus = jsonMessage['element_lock_changed'];

                        if (vm.lockStatus['lock_details'] && vm.lockStatus['locked']) {
                            // get locked until from backend
                            var lockedUntil = moment(vm.lockStatus['lock_details']['locked_until']);

                            // reset remaining lock time in seconds, and re-calculate it in the next cycle
                            vm.remainingLockTimeSeconds = 0;

                            $timeout(function () {
                                vm.remainingLockTimeSeconds = Math.round(
                                    moment.duration(lockedUntil.diff(moment())).asSeconds()
                                );
                            });

                            // check if the element is locked by someone else
                            if (vm.lockStatus['lock_details']['locked_by'].pk != vm.currentUser.pk) {
                                // call the "on lock callback" function
                                if (vm.onLockCb) {
                                    vm.onLockCb({lockStatus: vm.lockStatus['lock_details']});
                                }
                            } else {
                                // the element appears to be locked,
                                // but the current user might be editing it, so we tell
                                // the user that it is unlocked
                                if (vm.onUnlockCb) {
                                    vm.onUnlockCb();
                                }
                            }

                        } else {
                            vm.remainingLockTimeSeconds = 0;

                            // call the "on unlock callback" function
                            if (vm.onUnlockCb) {
                                vm.onUnlockCb();
                            }
                        }
                    }

                }
            );

            /**
             * Widget displaying the remaining time
             * @type {string}
             */
            vm.remainingTimeWidgetHtml = $sce.trustAsHtml(
                "<time-countdown-widget remaining-time=\"vm.remainingLockTimeSeconds\"></time-countdown-widget>");

            /**
             * Initiate the websocket for the given model
             */
            vm.$ws = WorkbenchElementChangesWebSocket;

            /**
             * On scope destroy: disconnect the websocket
             */
            $scope.$on("$destroy", function () {
                wsUnsubscribeFunction();
            });

            /**
             * Watch for the change_detected message, which is triggered by input fields
             */
            $scope.$on("change_detected", function () {
                // try to lock the element (it might not work though)
                vm.elementLockService.lock();
                // ToDo: Handle errors (e.g., with a modal dialog)
            });

            /**
             * Make sure authentication for the websocket has finished, then get the current lock status
             */
            vm.$ws.waitForAuthentication().then(function () {
                //vm.$ws.getLockStatus();
            });

            AuthRestService.getCurrentUser().$promise.then(
                function (user) {
                    vm.currentUser = user;
                }
            );
        };

        /**
         * Reload the current page
         */
        vm.reloadBaseModel = function () {
            var modalService = GenericModelService.getCreateModalService(vm.baseModel);

            vm.baseModel.$getCached().then(function () {
                modalService.viewElement(vm.baseModel, {reload: true});
            });
        };

        /**
         * Release the lock on the current element
         */
        vm.releaseLock = function () {
            return vm.elementLockService.unlock();
        };
    });
})();
