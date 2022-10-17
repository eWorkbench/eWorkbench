AngularJS Frontend Routing
==========================

In this section we provide more information about the frontend applications routing.

Routing is handled via the `Angular UI Router 1 <https://ui-router.github.io/ng1/docs/latest/index.html/>`_ (please note
that there also is a version for Angular 2+, but we require the version for AngularJS 1.*) in ``app/js/app.routes.js``.

Route Structure
---------------

We do not use any sub routes within the project. We have a basic layout which contains the ui-routers ``ui-view`` directive,
which renders the component of the specified route.

We usually have a ``$workbenchitem-list`` (e.g., ``task-list``) route aswell as a ``$workbenchitem-view`` (e.g.,
``task-view``) route, where the ``-list`` route just lists the workbench items of the provided type, and the ``-view``
route acts as a detail route which shows the details of a given element. In addition, we allow editing of the element.


Special Attributes and Functions
--------------------------------

We extend the basic functionality of the ui router with functions and attributes within the state definition. E.g., here
is the state definition for a task:

.. code:: javascript

    $stateProvider.state('main',
        {
            title: function ($queryParams, gettextCatalog) {
                "ngInject";

                return gettextCatalog.getString("Tasks") + " - #" + $queryParams.task.task_id + ": " + $queryParams.task.title;
            },
            simpleTitle: function ($queryParams, gettextCatalog) {
                "ngInject";

                return $queryParams.task.title;
            },
            icon: function ($queryParams, IconImagesService) {
                "ngInject";

                return IconImagesService.mainElementIcons.task;
            },
            breadcrumb: function ($queryParams, $state, gettextCatalog) {
                "ngInject";

                return [
                    $state.target('task-list')
                ];
            },
            url: '/tasks/{task:task}',
            component: 'taskView',
            needsAuth: true,
            resolve: {
                task: function ($stateParams) {
                    'ngInject';

                    return $stateParams.task;
                }
            },
            activeMenuItem: 'task'
        }
    )


The provided attributes work as follows:

* ``title`` is a function with injections, which is called for every state change. The title returned is then displayed
  in the HTML ``<title/>`` tag and the horizontal navigation bar
* ``simpleTitle`` basically works the same as ``title``, but represents a simple/shorter title, which is used within
  the project breadcrumbs
* ``icon`` works in conjunection with the ``title`` function. Returns an icon for the given state. Mainly used for the
  horizontal navigation bar
* ``breadcrumb`` This function provides a list of parent states for the project breadcrumbs.
* ``needsAuth`` Whether this state requires the user to be authenticated or not
* ``activeMenuItem`` The group of the active menu item, used within the project navigation bar and the horizontal
  navigation bar
* ``url``, ``component``, ``resolve`` are the basic attributes used by ui router


Route Handlers
--------------

By using ui routers ``$transitions``, we make sure that the attributes from aboves list are used properly.
For instance, this code from ``app/js/app.js`` handles the ``needsAuth`` property:

.. code:: javascript

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


Basically, the ``onBefore`` transition allows returning a ``promise``. As long as the promise is not resolved, the ui
router suspends the state transition, and waits. This ``promise`` is resolved by the ``AuthRestService`` once the user has
logged in, and then the ui router continues with the transition.
