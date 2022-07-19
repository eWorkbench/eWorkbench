Steps necessary when adding a new workbench element
===================================================

When adding a new workbench element, the following steps are necessary for the frontend (AngularJS) and the backend
(Django Rest Framework).

Frontend (AngularJS)
--------------------

* Translations, Icons, ...

  * Define the new element in **app/js/services/workbenchElements/workbenchElements.js**.
  * You can copy most of the configuration options from another element, though make sure to take care of  the following
    attributes:

    * `modelName`
    * `translation`
    * `icon`
    * `labels` (needs to include projects, deleted and all custom attributes of the model)

* Widgets and Services

  * Create a new ``elementLinkDisplayWidget`` for the element in **app/js/widgets/linkDisplay/**
  * Create a new ``elementCardWidget`` for the element in **app/js/widgets/cardDisplay/**
  * Create a new REST Service factory ``ElementRestService`` in **app/js/services/rest/**

* Screens

  * Create a new folder for the new element in **app/js/screens/**
  * Create the following files within the new folder:

    * {element}CardView.html
    * {element}CardView.js
    * {element}CreateModal.html
    * {element}CreateModal.js
    * {element}Form.{attribute}.html for each attribute of {element}
    * {element}List.html
    * {element}List.js
    * {element}TableView.html
    * {element}TableView.js
    * {element}View.html
    * {element}View.js

  * For convenience, you can use these two commands (make sure to replace {element} before you execute the command):
  .. code-block:: bash

      cd app/js/screens/{element}/
      touch {element}{CardView,CreateModal,List,TableView,View}.html
      touch {element}{CardView,CreateModal,List,TableView,View}.js

  * Create components ``elementList`` (with ``elementCardView`` and ``elementTableView``) and ``elementView``
  * Create ``elementCreateModalService`` with the following methods:

    * ``service.open`` - opens the modal dialog for creating a new element
    * ``service.viewElement`` - uses ``$state.go`` to open the detail page of an element
    * ``service.getViewUrl`` - uses ``$state.href`` to generate a hyperlink to the detail page of an element

  * For each attribute of element, create an ``elementForm.attribute_name.html``

* Generic Functions

  * Add the fields that should be displayed in the search results ``vm.searchTableColumnConfig`` in
    **app/js/screens/relation/createRelation.js**

  * Make sure that you have the ability to display relations with the new element as a card in
    **app/js/widgets/displayRelationWidget/displayRelationWidget.html**

  * If you want the element to appear on the dashboard, you need to create a new widget in
    **app/js/widgets/dashboardWidgets** and include aswell as configure it in the dashboard screen
    **app/js/screens/mainDashboard/mainDashboard.js**

  * If you want the element to appear in the bubbles, you need to configure it in
    **app/js/screens/mainDashboard/mainDashboard.js** in ``postProcessSummary``

* Routing

  * Add an URL matcher Type to **app/js/shared/urlMatcherType/**
  * Create route ``element-list`` - lists all elements
  .. code-block:: javascript

      .state('element-list',
          {
              title: function ($queryParams, gettextCatalog) {
                  "ngInject";
                   return gettextCatalog.getString("Elements");
              },
              icon: function ($queryParams, IconImagesService) {
                  "ngInject";
                   return IconImagesService.mainElementIcons.element;
              },
              url: '/elements?showOnlyMyElements&filterProjects',
              component: 'elementList',
              needsAuth: true,
              activeMenuItem: 'element'
          }
      )


  * Create route ``element-view`` - shows details of a given element
  .. code-block:: javascript

      .state('element-view',
          {
              title: function ($queryParams, gettextCatalog) {
                  "ngInject";
                   return gettextCatalog.getString("Element") + " - " +
                      $queryParams.element.title;
              },
              icon: function ($queryParams, IconImagesService) {
                  "ngInject";
                   return IconImagesService.mainElementIcons.element;
              },
              url: '/elements/{element:element}',
              component: 'elementView',
              needsAuth: true,
              'resolve': {
                  element: function ($stateParams) {
                      'ngInject';
                       return $stateParams.element;
                  }
              },
              activeMenuItem: 'element'
          }


* Add all JavaScript files created for this element in the previous steps to index.html

Backend (REST API)
------------------

* (Optional) Create a new app (we assume the app you are working with is called `yourapp`)

* ORM

  * Create the new model (we will refer to the model by the name {Element})

    * with the primary key `id` as a uuid
    * make sure to inherit from ``WorkbenchEntityMixin``, which will mark the model as a workbench entity
    * make sure that the Meta class of your model inherits from ``WorkbenchEntityMixin.Meta``
    * inherit from ``BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, ModelPrivilegeMixIn``
    * make sure that the following permissions are set:

      * ``view_{element}``
      * ``trash_{element}``
      * ``restore_{element}``
      * ``change_project_{element}``
      * ``add_{element}_without_project``

    * Make sure that all fields, including the ``deleted`` field are listed in the meta class option ``track_fields``
    * Set ``fts_template`` and ``export_template``, and create those templates
    * Implement ``get_default_serializer`` in the models meta class, which should return the Default REST serializer.
      Note: use a local import for the serializer to avoid circular references
    * Make sure that your model implements the `__str__` method
    * Example:
    .. code-block:: python

      class {Element}(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, ModelPrivilegeMixIn, WorkbenchEntityMixin):
          objects = {Element}Manager()

          class Meta(WorkbenchEntityMixin.Meta):
              verbose_name = _("Element")
              verbose_name_plural = _("Elements")
              ordering = ["title"]
              permissions = (
                  ("trash_{element}", "Can trash a Element"),
                  ("restore_{element}", "Can restore a Element"),
                  ("change_project_{element}", "Can change the project of a Element"),
                  ("add_{element}_without_project", "Can add a Element without a project"),
              )
              track_fields = (
                  'title', 'projects', 'deleted',
              )
              fts_template = 'fts/{element}.html'
              export_template = 'export/{element}.html'

              def get_default_serializer(*args, **kwargs):
                  from eric.{yourapp}.rest.serializers import {Element}Serializer
                  return {Element}Serializer

          id = models.UUIDField(
              primary_key=True,
              default=uuid.uuid4,
              editable=False
          )

          title = models.CharField(
              max_length=128,
              verbose_name=_("Title of this {Element}")
          )

          # reference to many projects (can be 0 projects, too)
          projects = models.ManyToManyField(
              'projects.Project',
              verbose_name=_("Which projects is this {Element} associated to"),
              related_name="{elements}",
              blank=True
          )

          def __str__(self):
              return self.title


  * Create a migration for the new model (``python manage.py makemigrations``)
  * Create a migration for adding ``create_without_project`` permission to the user group.
    Assuming that the first migration is called 0001_initial (or similar), a good name for this migration is usually
    something like "0002_add_create_without_project_permissin_to_user_group.py". You can copy this migration from
    another app and adapt the content type aswell as permissions to match the name of your new {element}.
  * Create a migration for adding all the relevant permissions (``restore``, ``trash``, ``view``, ``add``, ``change``,
    ``delete``, ``change_project``) to the project manager role.
    Continuing the naming scheme, a good name is something like "0003_pm_add_{element}_permissions.py". You can copy
    this migration from another app and adapt the content type aswell as permissions to match the name of your new
    {element}.
  * Create a migration for adding the ``view`` permission to the observer role.
    Naming: "0004_observer_add_{element}_permissions.py". You can copy this migration from
    another app and adapt the content type aswell as permissions to match the name of your new {element}.
  * Create a new Manager for the model aswell as a queryset (needs to inherit from ``BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin``)
    For the QuerySet, we recommend implementing/overwriting the following two methods:

      * ``prefetch_common``: Prefetches common elements (e.g., tasks would prefetch the assignees) - make sure to call the
        ``super(...,self).prefetch_common()`` method and chain your prefetches after it
      * ``viewable_related``: Called when accessing relations of an element, by default it calls ``viewable()``. The
        exception to this is `Note`. All related Notes are visible in relations.

* REST API

  * Create a new filter (include the fields ``projects`` and ``deleted``)
  .. code-block:: python

      from django.contrib.auth import get_user_model

      from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter, ListFilter
      from eric.{yourapp}.models import {Element}

      User = get_user_model()


      class {Element}Filter(BaseFilter):
          class Meta:
              model = {Element}
              fields = {
                  'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
              }

          deleted = BooleanDefaultFilter()

          projects = ListFilter(field_name='projects')


  * Create a new serializer (inherit from ``BaseModelWithCreatedByAndSoftDeleteSerializer``) which should include
    the following fields:

    * all attributes that are characteristic for this field
    * `url`
    * `created_by`
    * `created_at`
    * `last_modified_by`
    * `last_modified_at`
    * `version_number`

  * Create a new viewset (inherit from ``BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn,
    ExportableViewSetMixIn``) and implement ``get_queryset``
  .. code-block:: python

      class {Element}ViewSet(
          BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn
      ):
          serializer_class = {Element}Serializer
          filter_class = {Element}Filter

          search_fields = ()
          ordering_fields = ('title', )

          # disable pagination for this endpoint
          pagination_class = None

          def get_queryset(self):

              return {Element}.objects.viewable().filter(changesets__changeset_type='I'). \
                  prefetch_related(
                  'projects',
                  'changesets'
              )


  * Add a router for the viewset, aswell as nested routers with ``RelationViewSet``, ``GenericChangeSetViewSet``,
    ``ModelPrivilegeViewSet`` and add the nested urls to ``urlpatterns``
  .. code-block:: python

      from django.conf.urls import include
      from django.urls import re_path
      from rest_framework_nested import routers

      from eric.core.rest.routers import get_api_router
      from eric.projects.rest.viewsets import GenericChangeSetViewSet
      from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
      from eric.relations.rest.viewsets import RelationViewSet

      from eric.{yourapp}.rest.viewsets import {Element}ViewSet

      # register REST API Routers
      router = get_api_router()

      router.register(r'{element_url}', {Element}ViewSet, basename='{element}')

      {element}_router = routers.NestedSimpleRouter(router, r'{element_url}', lookup='{element}')
      {element}_router.register(r'relations', RelationViewSet, basename='{element}-relation')
      {element}_router.register(r'history', GenericChangeSetViewSet,
                                 basename='{element}-changeset-paginated')
      {element}_router.register(r'privileges', ModelPrivilegeViewSet, basename='{element}-privileges')

      urlpatterns = [
          re_path(r'^', include({element}_router.urls)),
      ]


  * Make sure to include the new urls.py in the main urls.py of eRIC Workbench


* General Functions

  * Dashboard

    * If you want the number of elements to be shown in the dashboard, you need to add it into ``MyDashboardViewSet``

  * Full Text Search

    * Again, make sure that your model inherits from ``FTSMixin`` and has ``fts_template`` set in its meta class

  * ChangeSets

    * Again, make sure that ``track_fields``, ``track_soft_delete_by`` etc...  are set in meta options of the new model

  * Relations

    * Again, make sure that your model inherits from ``RelationsMixIn``

  * Model Privileges

    * In case you need to add **special privileges** (e.g., attending users of a meeting), you need to do that in
      the ``ModelPrivilegeViewSet`` in the following methods: ``get_parent_object_or_404`` (add a prefetch),
      and ``get_project_permissions_by_user`` (you need to define what the users can do)

* Tests

  * Write Tests!
  * For testing that all "basic" workbench functions work, you can inherit from ``APITestCase``
  * You need to add calls to the respective rest api test methods in several generic methods in
    ``EntityChangeRelatedProjectTestMixin``
