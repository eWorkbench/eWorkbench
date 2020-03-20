/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared'),

        /**
         * Checks whether the provided item follows the (angular) injection pattern
         * @param item
         * @returns {boolean}
         */
        isInjectionPattern = function (item) {
            return angular.isFunction(item) || // is a function, or
                (
                    // array with injections and function, e.g., ["First", "Second", function(First, Second) {...}]
                    angular.isArray(item) && item.length > 0 &&
                    angular.isFunction(item[item.length - 1])
                );
        };

    /**
     * Compiles the value of the given variable and attaches it to the content of
     * the directive's element.
     */
    module.directive('htmlCompile', function ($compile, $parse, $injector) {
        'ngInject';

        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.$watchGroup([attrs.htmlCompile, attrs.htmlCompileScope], function (newValues) {
                    var
                        innerScope = scope.$new(true), // new scope for loaded template
                        innerScopeCopyTarget = innerScope, // copy target for html-compile-scope values
                        template = newValues[0], // template to load and compile
                        context = newValues[1], // context to pass to template
                        target = attrs.htmlCompileScopeTarget, // set the new child scope to the given variable
                        bind = attrs.htmlCompileScopeBind; // bind prefix for the scope

                    // bind the context values to a object on the scope rather than the scope directly.
                    if (bind) {
                        innerScopeCopyTarget = {};
                        innerScope[bind] = innerScopeCopyTarget;
                    }

                    // set the new inner scope to the target variable
                    if (target) {
                        target = $parse(target);
                        target.assign(scope, innerScope);
                    }

                    // copy the references to the newly created scope
                    for (var item in context) {
                        if (context.hasOwnProperty(item)) {
                            if (isInjectionPattern(context[item])) { // is an injection pattern
                                innerScopeCopyTarget[item] = $injector.invoke(context[item], null, {})
                            } else {
                                innerScopeCopyTarget[item] = context[item];
                            }
                        }
                    }

                    // compile the template
                    element.html(template);
                    $compile(element.contents())(innerScope);
                });
            }
        }
    });
})();
