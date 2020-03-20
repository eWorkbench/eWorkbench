/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    /**
     * Toggle click events on division when spacebar or enter is pressed by the user
     * the HTML element needs to have the class "clickable"
     * @param e
     */
    window.onkeydown = function (e) {
        // if 32 = space or 13 = enter is pressed
        if (e.keyCode === 32 || e.keyCode === 13) {
            if (e.target.classList.contains("clickable") || e.target.parentElement.classList.contains("clickable")) {
                e.preventDefault();
                e.target.click();
            }
        }
    };

    /**
     * Overwrite Selectize getSearchOptions
     * ToDo: Once this pull request gets merged, we do not need this anymore...
     * ToDo: This has been merged, but is still not in any release / planned release is 0.13.0
     * https://github.com/selectize/selectize.js/pull/1126
     */
    jQuery.extend(Selectize.prototype, {
        getSearchOptions: function () {
            var settings = this.settings;
            var sort = settings.sortField;

            if (typeof sort === 'string') {
                sort = [{field: sort}];
            }

            return {
                fields: settings.searchField,
                conjunction: settings.searchConjunction,
                sort: sort,
                nesting: settings.nesting
            };
        }
    });


    var
        /**
         * main application module
         */
        app = angular.module('app', [
            'ae-datetimepicker', // angular eonasdan datetimepicker
            'angular.filter',
            'ngImageResize',
            'ngCookies',
            'anx.cachedResource',
            'gettext',
            'ngAnimate',
            'ngSanitize',
            'd3Module',
            'ngStorage',
            'ngFileUpload', // file uploads (especially for images)
            'ngResponsiveBreakpoints',
            'selectize',
            'toaster',
            'ui.bootstrap',
            'ui.router',
            'ngResourceUrlTypeFactory',
            'screens',
            'services',
            'shared',
            'templates',
            'widgets',
            'treeGrid',
            'ngFileSaver',
            'angular-loading-bar',
            'dndLists',
            'ui.calendar',
            'angularMoment',
            'ui.tree',
            'gantt',
            'gantt.table',
            'gantt.tree',
            'gantt.tooltips',
            'focus-if', // auto focus for input fields
            'monospaced.elastic', // elastic textareas
            'diff-match-patch', // providing diffs on textfields for our history/recent changes
            'compareFunctions',
            'ngPerms', // permission checks
            'colorpicker.module', // color picker
            'ui.tinymce', // html text editor
            'gridster', // dynamic grid (for labbook)
            'angularResizable', // resizable divisions
            'anxPropagateClick',
            'ngImgCrop',
            'ngclipboard',
            'infinite-scroll',
            'hl.sticky',
            'ngWebSocket',
            'ui.grid',
            'ui.grid.pagination',
            'ui.grid.autoResize',
            'ui.grid.resizeColumns',
            'ui.grid.moveColumns',
            'ui.grid.saveState',
            'ui.grid.expandable'
        ]);

    /**
     * @module screens
     * @description
     * Screens of our AngularJS Application (controllers, components)
     */
    angular.module('screens', []);

    /**
     * @module services
     * @description
     * factories and services (e.g. REST)
     */
    angular.module('services', []);

    /**
     * @module shared
     * @description
     * various shared resources like filters, directives (behaviour), ...
     */
    angular.module('shared', []);

    /**
     * template cache (needed for creating the template cache with gulp ng template cache)
     */
    angular.module('templates', []);

    /**
     * @module widgets
     * @description
     * widgets (re-useable directives that render HTML)
     */
    angular.module('widgets', []);

    //add d3 Module
    angular.module('d3Module', []);

    /**
     * Angular Animations are enabled only when the dom element contains the "ng-animte-enabled" attribute
     */
    app.config(function ($animateProvider) {
        "ngInject";

        $animateProvider.classNameFilter(/ng-animate-enabled/);
    });

    /**
     * configure tinymce default options
     */
    app.config(function (uiTinymceConfigProvider) {
        "ngInject";

        /**
         * Callback that opens a file-picker
         * @param cb
         * @param value
         * @param meta
         */
        var filePickerCallback = function (cb, value, meta) {
            // "fake" an input element of type file
            var input = document.createElement('input');

            // only allow image files
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');

            input.onchange = function () {
                var file = this.files[0];
                var reader = new FileReader();

                reader.readAsDataURL(file);

                reader.onload = function () {
                    // Note: Now we need to register the blob in TinyMCEs image blob registry.
                    // In the next release this part hopefully won't be necessary,
                    // as we are looking to handle it internally.
                    var id = 'blobid' + (new Date()).getTime();
                    var blobCache = window.tinymce.activeEditor.editorUpload.blobCache;
                    var base64 = reader.result.split(',')[1];
                    var blobInfo = blobCache.create(id, file, base64);

                    blobCache.add(blobInfo);

                    // call the callback and populate the Title field with the file name
                    cb(blobInfo.blobUri(), {title: file.name});
                };
            };

            input.click();
        };


        var options = uiTinymceConfigProvider.$get();

        angular.extend(options, {
            'skin_url': '/node_modules/tinymce/skins/lightgray',
            'menubar': false,
            'image_title': true,
            'file_picker_types': 'image',
            'file_picker_callback': filePickerCallback,
            'plugins': 'charmap image textpattern advlist autolink link image lists autoresize textcolor colorpicker' +
                ' formula hr table',
            // toolbars
            'toolbar1': 'formatselect | bold italic underline strikethrough forecolor backcolor | table | removeformat',
            'toolbar2': 'alignleft aligncenter alignright alignjustify | charmap superscript subscript | ' +
                'link image | numlist bullist outdent indent hr | formula',
            // formula plugin
            'formula': {
                path: '/node_modules/tinymce-formula'
            }
        });
    });

    /**
     * configure responsive break points provider, which defines breakpoints for xs, sm, md and lg screens
     *
     * Responsive Breakpoints are used for determining whether the user is on a small screen
     * If the user is on a small screen, we switch the users view from table view to a card view
     * (this functionality is done in ``ScreenHeaderFunctionBarController``)
     */
    app.config(function (responsiveBreakpointsProvider) {
        "ngInject";

        responsiveBreakpointsProvider.setResponsiveBreakpoints([
            {
                code: 'xs',
                value: 767
            },
            {
                code: 'sm',
                value: 992
            },
            {
                code: 'md',
                value: 1280
            },
            {
                code: 'lg',
                value: 1920
            }
        ]);
    });

    app.run(function (
        $rootScope,
        $http,
        $injector,
        $q,
        $state,
        $transitions,
        $uibModalStack,
        $window,
        restApiUrl,
        AuthRestService,
        BackgroundStyleService,
        CalendarConfigurationService,
        SitePreferences,
        ProjectRestService,
        moment,
        toaster,
        gettextCatalog
    ) {
        'ngInject';

        // get current browser language
        var lang = $window.navigator.language || $window.navigator.userLanguage;

        console.log("Browser Language=" + lang);

        /**
         * Switch current language within the app
         * @param lang
         */
        $rootScope.switchLanguage = function (lang) {
            // switch language for gettext library
            gettextCatalog.setCurrentLanguage(lang);
            gettextCatalog.loadRemote("locales/" + lang + "/translations.json").then(
                function success (response) {

                },
                function error (rejection) {
                    console.log('Failed to load language ' + lang + '... defaulting to en');
                    $rootScope.switchLanguage('en');
                }
            );

            // switch language for calendars
            CalendarConfigurationService.defaultOptions.locale = lang;
        };

        // switch momentjs to en-GB
        moment.locale("en-gb");

        //$rootScope.switchLanguage(lang);
        // ToDo: Use the language of the browser for later
        $rootScope.switchLanguage('en');

        // make monday the first day of the week (datepicker)
        moment.lang('en', {
            week : {
                dow : 1 // Monday is the first day of the week
            }
        });

        BackgroundStyleService.subscribe(function (styleInfo) {
            var style = {};

            if (styleInfo.color) {
                style['background-color'] = styleInfo.color;
            }

            if (styleInfo.image) {
                style['background-image'] = 'url("' + styleInfo.image + '")';
            }

            $rootScope.backgroundStyle = style;
        });

        /*
         * UI Router Transitions:
         * Make sure that all routes that need authentication (attribute "needsAuth": true) are checked BEFORE the state
         * is accessed.
         *
         * This is accomplished using ui-router (1.0.0 rc1) onBefore event
         */

        // check state transitions for "needsAuth" flag on the state
        var criteria = {
            to: function (state) {
                return state.needsAuth === true;
            }
        };

        // register transition onBefore
        $transitions.onBefore(criteria, function (trans) {
            // Check if the user is logged in
            if (!AuthRestService.isLoggedIn) {
                // user is not logged in, need to wait for the login promise to be resolved
                console.log('Not allowed to transition to this page, please log in! (loginInProgress=' + AuthRestService.loginInProgress + ')');

                if (!AuthRestService.loginInProgress) {
                    toaster.pop('warning', "Please log in!");
                }

                // use a promise of Auth service to delay the transition
                return AuthRestService.getWaitForLoginPromise();
            }

            // user is logged in --> allow transition
            return true;
        });

        /**
         * UI Router Transition:
         * Change the site title based on the title of the site (preferences.site_name) as well as the state
         *
         * This is accomplished using the onFinish transition of the angular ui router (1.0.0 rc1)
         */
        $transitions.onFinish({}, function (trans) {
            // get site name from the site preferences
            var title = $rootScope.preferences.site_name;

            // check if the target state of the transition has a title in its definition
            if (trans._targetState._definition.title) {
                // get query params and wait for them using $q.all()
                var $queryParams = trans._targetState._params;

                $q.all($queryParams).then(function (newQueryParams) {
                    // title is a function, hence invoke the title function (needs injection pattern)
                    var pageTitle = $injector.invoke(trans._targetState._definition.title, null, {
                        '$queryParams': newQueryParams
                    });

                    // concatenate the page title
                    title = title + " - " + pageTitle;

                    // finally update the site title
                    $rootScope.siteTitle = title;
                });
            }

            $rootScope.siteTitle = title;
        });

        /**
         * On location change, dismiss all modal dialogs
         *
         * This helps closing modal dialogs if the user presses the "back" button in the browser
         */
        $rootScope.$on('$locationChangeStart', function handleLocationChange (event) {
            if ($uibModalStack.getTop()) {
                $uibModalStack.dismissAll();
                event.preventDefault();
            }
        });

        // get site preferences
        $rootScope.preferences = SitePreferences.preferences;
    });

    /**
     * AngularJS Split filter
     * Allows splitting a string within ng-repeat
     * E.g., "a,b,c" would be split into ["a", "b", "c"]
     */
    app.filter('split', function () {
        return function (input, splitChar) {
            return input.split(splitChar);
        }
    });


    /**
     * Simple AngularJS Directive to disable elements (e.g., a button) after a click, re-enable it after 333 ms
     *
     * This helps avoiding accidental double clicks on elements
     */
    app.directive('disableAfterClick', function () {
        return {
            restrict: 'A',
            link: function (scope, ele, attrs) {
                var disableFunction = function () {
                    setTimeout(function () {
                        jQuery(ele).attr('disabled', true);
                        setTimeout(function () {
                            jQuery(ele).attr('disabled', false);
                        }, 333);
                    });
                };

                jQuery(ele).click(disableFunction);
            }
        };
    });
})();
