/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.controller('relationViewReallyDeleteRelationController', function ($uibModalInstance) {
        'ngInject';

        var
            vm = this;

        vm.cancel = function () {
            $uibModalInstance.dismiss();
        };

        vm.yesDelete = function () {
            $uibModalInstance.close(true);
        };
    });
})();