# JavaScript Coding Conventions for eRIC Workbench Frontend

## Basics
* Maximum length of a line is 120 characters (exceptions are allowed, if necessary)
* Make strong use of promises (``xyz.then(...)``) and chain promises where possible
* Please use JavaScript docstrings (jsdoc) for functions and variables
* Please use Angular docstrings (ngdoc) for directives and filters
* If you decide to not have a JavaScript or Angular docstring, make sure to leave short comment about what this function/class is about
* Add inline comments to your functions to explain what the next couple lines of code do
* All third party packages should be maintained via ``npm`` and stored in ``package.json``
* Third party packages that are needed for building/compiling should be marked as `dev-dependencies`

## Linting
We make use of eslint, so all your code is automatically linted with eslint.

Some key problems you might come across are:

* When defining functions, use spaces between `function` and `(params)`, e.g.: `function xyz (param1, param2)`` or ``var xyz = function (param1, param2)``
* JavaScript closures (curly brackets, ``{`` and ``}``) should always start in the same line as the last statement, and
end at the beginning of line. Example:
```javascript
// correct usage
if (1 == 1) {
    // do some thing
} else if (1 == 2) {
    // do another thing
} else {
    // do something completely different
}

// wrong usage
if (1 == 1) 
{
    // do some thing
} 
else if (1 == 2)
{
    // do another thing
} 
else 
{
    // do something completely different
}
```
* When defining variables, always initialize them (worst case initialize them with ``null``)
* Use the IIFE pattern for all JavaScript files:
```javascript
(function () {
    "use strict";
    
    // code ...
})();
```
* Always use space before parentheses for functions (e.g., ``function xyz () {``).

### Define Variables and Functions using `var`

Always define variables at the beginning of a function/method/class, like this (one variable per line, separated by comma):
```javascript
var someFunction = function (a) {
    var 
        vm = this,
        x = 1,
        y = 2,
        z = 3;
        
    // some logic
    
    return a + x * y + z;
}
```

The same applies to functions within Angular controllers/directives/services/factories/...:
```javascript
angular.controller('SomeController', ['SomeInjectedParam', function (SomeInjectedParam) {
    var vm = this;
    
    vm.logFunction = function (msg) {
        // do something
    };
}]);
```

Defining variables should be done at the top of the function / controller. The following styles are allowed, 
ordered by preference (the first style is the preferred, the last one is the least preferred):
1.
```javascript
var x = 1,
    y = 2,
    z = 3;
```
2.
```javascript
var x = 1;
var y = 2;
var z = 3;
```

**Note:** The following syntax is not valid for the javascript linter:
```javascript
var 
    x = 1,
    y = 2,
    z = 3;
```

### Avoid Anonymous Functions
Avoid using an anonymous function like this:
```javascript
setTimeout(function () {
    // do something
}, 500);
```

Instead, either use a function pointer or specify a function name:
```javascript
setTimeout(function doSomething () {
    // do something
}, 500);
```

This is especially true for REST API callbacks, which usually have a positive and a negative result:
```javascript
SomeService.query().$promise.then(
    function success (response) {
        // do something
    },
    function error (rejection) {
        // do something else
    }
);
```


# AngularJS Application Basics

## Folder Structure

* ``app`` (Source Code)
* ``tests`` 
* ``docs``
* ``node_modules``
* ``public, wwwroot, htdocs, ...`` (Compiled/Minified/Uglified sources)

## App Folder Structure

* ``index.html`` (main file)
* ``img, assets, static, ...`` (static files)
* ``js`` - for all JavaScript related stuff
* ``theme`` - for all Theme things (bootstrap, patternfly, custom CSS, less, sass, ...)

## JS Folder Structure

* ``js/app.js`` - Modules, Injections, ``app.run``, ...
* ``js/app.routes.js`` - config for routes (e.g., angular ui router)
* ``js/app.rest.js`` - config for rest (e.g., ngResource)
* ``js/modules/`` - contains various angular modules (e.g., very generic directives or factories/services) that might be extracted to another project at some point
* ``js/screens/`` - contains screens (controllers, components)
* ``js/services/`` - contains factories and services (e.g., REST)
* ``js/shared/`` - contains various shared resources like filters, directives (behaviour), ...
* ``js/widgets/`` - contains widgets (directives that render HTML stuff)


In ``app.js`` all modules need to be defined (example below)
```javascript
/**
 * main application module
*/
var app = angular.module('app', [
        'ui.router',
        'ui.bootstrap',
        'ngAnimate',
        'toaster',
        'patternfly',
        'patternfly.charts',
        'screens'
    ]);

/**
 * various shared resources like filters, directives (behaviour), ...
 */
angular.module('shared', [
    // todo: injection stuff
]);

/**
 * widgets (directives that render HTML stuff)
 */
angular.module('widgets', [
    // todo: injection stuff
]);

/**
 * actories and services (e.g. REST)
 */
angular.module('services', [
    'ngResource',
    'ngStorage'
]);

/**
 * screens (controllers, components)
 */
angular.module('screens', [
    'toaster',
    'patternfly',
    'ui.router',
    'ui.bootstrap',
    'ngAnimate',
    'widgets',
    'shared',
    'services'
]);
```


## Angular Components
```javascript
(function () {
    "use strict";
    var module = angular.module('screens');

    /**
     * Projects Component
     *
     * Displays a project list
     */
    module.component('projects', {
        templateUrl: 'js/screens/projects/projects.html',
        controller: 'ProjectsController',
        controllerAs: 'vm'
    });
    
    /**
     * Projects Controller
     *
     * Loads a project list and provides edit and delete buttons
     */
    module.controller('ProjectsController', 
        function (toaster, ProjectsRestService) {
            'ngInject';
            var vm = this;

            vm.projects = {};

            ProjectsRestService.queryCached().then(function (response) {
                vm.projects = response;
            });            
        });
})();
```

Component Definition:
```javascript
(function() {
    "use strict";

    var module = angular.module('screens');

    /**
     * projects edit component definition.
     * @name projectsEdit
     * @ngdoc component
     */
    module.component('projectsEdit', {
        templateUrl: 'js/screens/projects/projectsEdit.html',
        controller: 'ProjectsEditController',
        controllerAs: 'vm',
        bindings: {
            projectId: '@'
            /**
             * '<' - one way binding
             * '@' - two way binding
             * '&' - function callback
             * '=' - pass as string?
             */
        }
    });

    /**
     * Controller Definition.
     * @class SomeController
     * @ngdoc controller
     */
    module.controller('ProjectsEditController', 
        function (ProjectsRestService, $state, toaster) {
            'ngInject';
            
            var vm = this;

            console.log('projectId=' + vm.projectId);
    });

})();
```

**Note:** you can still inject ``$stateParams`` in your controller and access/modify ``$stateParams`` (e.g. for ``?query`` parameters).

## Styling Components
A component (e.g., ``projectsEdit`` from the last example) will create a HTML5 element (e.g., ``<project-edit></project-edit>``). 
This fact can be used to style anything within the component using CSS (or LESS or SASS or ...):
```css
project-edit > div {
    background-color: #000000;
    font-size: 13pt;
    color: #ffffff;
}

project-edit > ul {
    padding-left: 10px;
}

project-edit > li {
    padding-left: 20px;
}
```

We highly recommend putting the file containing the style definitions for a component in the same directory as the JavaScript and HTML files.

## Get familiar with HTML5 DOM Elements
As directives and components create HTML5 elements, you must avoid using those names for your directives AND components!

For instance, do not name your component like this:
 * main
 * nav
 * summary
 * footer
 * details
 * article
 
For a more comprehensive list of HTML5 elements, see [w3schools](http://www.w3schools.com/html/html5_new_elements.asp) or just google it yourself!


## Angular Injection Syntax with ngInject
By using the tool `ngAnnotate` you can avoid having to write the `app.controller('someController', ['someInjectedElement', function(someInjectedElement) ...` syntax.
Instead you can write the following:
```javascript
app.controller('someController', function (someInjectedElement) {
    'ngInject';
    // your code here
});
```
The task `html` in gulp will call `gulpNgAnnotate` for you and add this to the compiled files.


## Angular Injection Syntax with multiple injections
Please order injected components - where possible - by the following rules:
1. Everything with a ``$`` in front first, where as ``$scope`` and ``$rootScope`` should always be at the beginning
2. (Optional) Group by meaning (e.g., REST Service classes)
3. Sort alphabetically

The following injection variants are valid, with a preference for the first:
1.
```javascript
app.controller('someController', 
    function ($scope,
              $rootScope,
              $state,
              $q,    
              someRestService,
              yetAnotherRestService,
              someInjectedElement,
              yetAnotherInjectedElement) {
        'ngInject';
        // your code here
});
```
1.a (less indentation within code block)
```javascript
app.controller('someController', function (
    $scope, 
    $rootScope, 
    $state, 
    $q,    
    someRestService, 
    yetAnotherRestService, 
    someInjectedElement, 
    yetAnotherInjectedElement
) {
    'ngInject';
    // your code here
});
```

2.
```javascript
app.controller('someController', function ($scope, $rootScope, $state, $q,    
                                           someRestService, yetAnotherRestService, 
                                           someInjectedElement, yetAnotherInjectedElement) {
    'ngInject';
    // your code here
});
```

3.
```javascript
app.controller('someController', 
    function ($scope, $rootScope, $state, $q, 
              someRestService, yetAnotherRestService, 
              someInjectedElement, yetAnotherInjectedElement) {
    'ngInject';
    // your code here
});
```


## Angular Init Functions
If you initialize several variables in your controllers or directives, make sure to put those initializations in an
``init`` function.
Since AngularJS 1.6 it is recommended, and since 1.7 it is mandatory, to use the `$onInit` function.
Now bindings become available after the controller is created, when the `$onInit` function is called.
```javascript
/**
 * Controller Definition.
 * @class SomeController
 * @ngdoc controller
 */
app.controller('SomeController', function (someInjectedElement) {
    'ngInject';
    
    var vm = this;
        
    this.$onInit = function () {
        /**
         * Variable 1 
         */
        vm.var1 = vm.variableFromBinding;
        
        /**
        
         * Variable 2
         */            
        vm.var2 = 2;
        
        /**
         * Whether the user can do stuff or not
         */                    
        vm.canDoStuff = false;
    };
    
    /**
     * This function does something
     * @param a
     * @param b
     * @param c
     * @return something
     */
    vm.someFunction = function (a, b, c) {
        // do some stuff here
        return a + b + c;
    };
});
```
