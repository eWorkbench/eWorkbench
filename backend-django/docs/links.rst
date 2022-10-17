.. _Links:

Links
=====

Links (formerly called *Relations*) are a workbench feature, which allow to link two elements together.
For instance, a user can create a new Task and link a Meeting, a Comment (formerly called Note) and a File to it.

Links between entities
----------------------

All entities can be linked together. This is handled within the ``eric.relations`` app. The ``RelationViewSet`` can
be nested below each entity, therefore providing the following API call:
``GET /api/tasks/{task_pk}/relations/``.

In addition, the ``RelationViewSet`` provides the possibility to create a new relation between two elements.

Each relation contains a ``left_content_object`` aswell as a ``right_content_object``. Both those objects are
serialized with their respective serializers in ``eric.relations.rest.serializers``. If any of these two objects is
``None``, it means that the current user does not have the rights/privileges/permissions to view the element.

Comments
--------

Comments on objects are also handled via Links. However, Comments are always visible (regardless of permissions/privileges).

Private Links
-------------

Links can be set to private, meaning that only the user that created the link can see the link. For instance, a user
could have the need to write a Comment that only they should see.

Querying Links
--------------

Querying links is implemented in ``eric.relations.models`` in the ``RelationsMixIn``. The method ``relations`` is added
as a property to each model that inherits from the mixin. The workflow of the ``relations`` property is as follows:

1. Collect all relations and prefetch the related changesets for the relation (``created_by``, ``created_at``)
2. Get all Django content types for the relatable models (Tasks, Contacts, ...)
3. Iterate over all relations for the given object and collect primary keys for each model (Tasks, Contacts, ...)
4. Prefetch all those models (using ``viewable()`` method for permissions/privileges and appropriate prefetches)
5. Iterate over all relations for the given object and fill in the prefetched elements for ``left_content_object``
   and ``right_content_object`` (this is done for performance reasons)
