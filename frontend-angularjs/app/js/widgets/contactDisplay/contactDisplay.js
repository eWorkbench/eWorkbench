/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name contactDisplayWidget
     *
     * @restrict E
     *
     * @description
     * A directive which displays either a contact object coming from the REST API or fetches a contact based on the
     * parameter contactPk
     *
     * @param {object} contact the contact object (optional)
     * @param {number} contactPk the contacts primary key (optional)
     */
    module.directive('contactDisplayWidget', function () {
        return {
            templateUrl: 'js/widgets/contactDisplay/contactDisplay.html',
            controller: 'ContactDisplayWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                contact: '=?',
                contactPk: '=?'
            }
        }
    });

    module.controller('ContactDisplayWidgetController', function ($scope, ContactRestService, IconImagesService) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * gets the correct edit icon
             */
            vm.contactIcon = IconImagesService.mainElementIcons.contact;

            /**
             * Whether or not the contact was found
             * @type {boolean}
             */
            vm.contactNotFound = false;
        };

        $scope.$watch("vm.contactPk", function (newVal, oldVal) {
            if (vm.contactPk) {
                /**
                 * query contact
                 */
                vm.contactNotFound = false;

                ContactRestService.getCached({pk: vm.contactPk}).$promise.then(
                    function success (response) {
                        vm.contact = response;
                    },
                    function error (rejection) {
                        vm.contactNotFound = true;
                        vm.contact = null;
                    }
                );
            } else if (newVal == null && oldVal != null) {
                vm.contact = null;
            }
        });
    });

})();
