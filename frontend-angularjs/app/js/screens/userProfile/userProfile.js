/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('userProfile', {
        templateUrl: 'js/screens/userProfile/userProfile.html',
        controller: 'UserProfileController',
        controllerAs: 'vm'
    });

    /**
     * Userprofile Controller
     *
     * Displays the user profile
     */
    module.controller('UserProfileController', function (
        $scope,
        $q,
        toaster,
        AuthRestService,
        UserRestService,
        gettextCatalog,
        UploadAvatarImage,
        IconImagesService,
        Upload
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * get current user
             */
            vm.user = AuthRestService.getCurrentUser();

            // refresh the user
            vm.user.$get();

            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * define the bootstrap grid columns
             * @type {string}
             */
            vm.cssBootstrapGridColumnClassesLabel = "col-xs-6 col-sm-5 col-md-3 col-lg-2";
            vm.cssBootstrapGridColumnClassesContent = "col-xs-6 col-sm-6 col-md-5 col-lg-4";
            vm.cssBootstrapGridColumnClassesButton =
                "col-sm-offset-5 col-sm-6 col-md-offset-4 col-md-5 col-lg-offset-3 col-lg-4";

            /**
             * gets the correct icons
             */
            vm.projectIcon = IconImagesService.mainElementIcons.project;
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * data url for cropped image
             * @type {string}
             */
            vm.croppedDataUrl = '';

            /**
             * new selected image from 'select file dialog'
             */
            vm.newUserProfileAvatar = null;

            /**
             * determines if the cropping view is currently opened or not
             * @type {boolean}
             */
            vm.croppingImageActive = false;

            /**
             * determines if upload is in progress or not
             * @type {boolean}
             */
            vm.uploadInProgress = false;

            /**
             * User Profile LDAP Attribute Message
             * @type {string}
             */
            vm.ldapAttributeMessage = gettextCatalog.getString("Some details, like your name and affiliation, " +
                "etc., are provided by the IT register and cannot be changed.");
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly;
        };

        /**
         * update current user
         */
        vm.saveUserProfile = function () {
            vm.readOnly = true;
            //reset
            vm.errors = {};
            delete vm.user.userprofile.avatar;

            var defer = $q.defer();

            vm.user.$update().then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("User profile updated"));
                    vm.userView = 'view';
                    // delete current user from UserRestService to prevent seeing old results for the current user
                    UserRestService.getCached({pk: vm.user.pk}, true);

                    defer.resolve(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to update user profile"));
                    console.log(rejection);
                    vm.errors = rejection.data;

                    defer.reject(rejection.data);
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return defer.promise;
        };

        /**
         * is called when the user selected a new image from 'select file dialog'
         * when croppingImageActive is set to true the user has the possibility to cropping the new image
         */
        vm.selectImage = function () {
            vm.croppingImageActive = true;
        };

        /**
         * update the avatar profile picture
         */
        vm.saveProfilePicture = function () {
            vm.readOnly = true;
            vm.errors = {};

            if (vm.croppedDataUrl) {
                vm.uploadInProgress = true;

                vm.user.userprofile.avatar = null;

                vm.file = Upload.dataUrltoBlob(vm.croppedDataUrl, "image.png");

                UploadAvatarImage.upload(vm.file).then(
                    function success (responseObj) {
                        var response = responseObj.data;

                        vm.newUserProfileAvatar = null;
                        vm.croppingImageActive = false;
                        vm.uploadInProgress = false;
                        toaster.pop('success', gettextCatalog.getString("Profile picture updated"));


                        vm.user.userprofile.avatar = response.userprofile.avatar;
                        vm.profileView = 'view';
                    }, function error (rejection) {
                        toaster.pop('error', gettextCatalog.getString("Failed to update profile picture"));
                        console.log(rejection);
                        vm.uploadInProgress = false;

                        vm.errors = rejection.data;
                    }, function status (evt) {
                        vm.progress = window.parseInt(100.0 * evt.loaded / evt.total);
                    }
                ).finally(function () {
                    vm.readOnly = false;
                });
            }
        };

        /**
         * user canceled cropping the image and so the old picture is restored
         */
        vm.restoreProfilePicture = function () {
            vm.croppingImageActive = false;
            vm.croppedDataUrl = '';
            vm.newUserProfileAvatar = null;
        };

        /**
         * Reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Cancel user profile changes
         * Cancels all changes by reloading the element from the REST API
         */
        vm.cancelChangesUser = function () {
            vm.user.$get();
            vm.errors = {};
        };


        /**
         * Cancel profile picture changes
         */
        vm.cancelChangesProfile = function () {
            vm.profileView = 'view';
            //reset
            vm.errors = {};
        };

        /**
         * calculates the used storage in percentage (round to 2 decimals)
         */
        vm.calculateUsedStorageInPercentage = function () {
            var percentage = 100 * vm.user.used_storage_megabyte / vm.user.available_storage_megabyte;

            return percentage.toFixed(1);
        }
    });
})();
