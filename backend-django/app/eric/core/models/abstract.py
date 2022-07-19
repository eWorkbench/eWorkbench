#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from functools import lru_cache

from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_changeset.models import ChangeSet, ChangesetVersionField
from django_changeset.models.mixins import CreatedModifiedByMixIn

from eric.core.models import BaseModel

models.options.DEFAULT_NAMES += ('export_template', 'get_default_serializer',)


class OrderingModelMixin(models.Model):
    """
    An abstract model mixin that provides an ``ordering`` field

    Example::

        class YourModel(models.Model, OrderingModelMixin, ...):

            some_field = models.CharField()
    """

    DEFAULT_ORDERING = 0

    class Meta:
        abstract = True

    ordering = models.PositiveIntegerField(
        default=DEFAULT_ORDERING,
        db_index=True,
        verbose_name=_("Ordering"),
    )


class VisibleModelMixin(models.Model):
    """
    An abstract django model mixin that provides a ``visible`` field

    Example::

        class YourModel(models.Model, VisibleModelMixin, ...):

            some_field = models.CharField()
    """

    class Meta:
        abstract = True

    visible = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name=_("Whether this entry is visible or not"),
    )


class ChangeSetMixIn(CreatedModifiedByMixIn):
    """
    An abstract django model mixin that inherits from ``django_changesets`` ``CreatedModifiedByMixIn``
    Combined, these two mixins provide the following things:

    - ``changesets`` - a generic relation to the changesets
    - ``created_by`` - a UserForeignKey to the user that created the element
    - ``last_modified_by`` - a UserForeignKey to the user that has last modified the element
    - ``created_at`` and ``last_modified_at`` - Timestamps when the element was created/last modified
    - ``version_number`` - a version field that automatically increases on every change of the model
    """

    class Meta:
        abstract = True

    # define generic reverse relation for the changeset table
    changesets = GenericRelation(
        ChangeSet,
        content_type_field='object_type',
        object_id_field='object_uuid'
    )

    # define a version field that automatically increases on every change of the model
    version_number = ChangesetVersionField()


class SoftDeleteMixin(models.Model):
    """
    An abstract model mixin that provides a deleted field for soft deletes, aswell as the following two methods:

    - ``trash`` - trashes an element by setting ``deleted = True``
    - ``restore`` - restores an element by setting ``deleted = False``
    """

    class Meta:
        abstract = True

    deleted = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name=_("Whether this entry is deleted or not")
    )

    def trash(self):
        """
        Trash (soft-delete) the object
        """
        if not self.deleted:
            self.deleted = True
            self.save()

    def restore(self):
        """
        Restore (un-delete) the object
        :return:
        """
        self.deleted = False
        self.save()


class ImportedDSSMixin(models.Model):
    """
    An abstract model mixin that provides a imported field, which should only be set to true by a dss import task.
    """
    class Meta:
        abstract = True

    imported = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name=_("Whether this entry was imported by a dss import task or not")
    )


class IsFavouriteMixin(models.Model):
    """
    An abstract model mixin that provides a property that checks if the Element is a favourite for the current user
    """
    class Meta:
        abstract = True

    @property
    def is_favourite(self):
        from django_userforeignkey.request import get_current_user
        user = get_current_user()

        if user.is_anonymous:
            return False

        from eric.favourites.models import Favourite
        return Favourite.objects.filter(
            user=user,
            object_id=self.pk,
            content_type=self.get_content_type(),
        ).exists()


class WorkbenchEntityMixin:
    """
    A mixin that marks an element as a workbench element
    Provides several meta class options, such as ``track_soft_delete_by``, ``aggregate_changesets_within_seconds``,
    ``is_relatable`` and ``can_have_special_permissions``.
    The Meta Class of your Model needs to inherit from ``WorkbenchEntityMixin.Meta``.

    Example::

        class YourModel(BaseModel, ChangeSetMixIn, RevisionModelMixin, SoftDeleteMixin, WorkbenchEntityMixin):

            class Meta(WorkbenchEntityMixin.Meta):
                verbose_name = _("YourModel")
                verbose_name_plural = _("YourModels")

                def get_default_serializer(*args, **kwargs):
                    return YourModelSerializer
    """

    class Meta:
        track_soft_delete_by = "deleted"
        aggregate_changesets_within_seconds = 60
        is_relatable = True  # Can be linked from to other elements?
        is_favouritable = True  # Can be favourited
        can_have_special_permissions = True  # Enable model privileges?

        def get_default_serializer(*args, **kwargs):
            """
            Returns the Default REST Serializer for this model

            This method needs to be implemented with the exact signature as shown here
            """
            raise NotImplementedError


def issubclass_of_list(model, classes):
    """
    Helper method that checks if a model is a subclass of any of the classes provided in the classes list

    Example::

        issubclass_of_list(some_object, [User, Group, SomeOtherModel])

    :param model: the model that needs to be checked
    :type model: django.db.models.Model
    :param classes: a list of classes
    :type classes: []
    :return: True if the model is a subclass of any of the provided classes, else False
    :rtype: bool
    """
    for cls in classes:
        if not issubclass(model, cls):
            return False

    return True


@lru_cache(maxsize=None, typed=True)
def get_all_workbench_models(*args):
    """
    Collects all workbench entities
    Workbench entities are determined by making sure that they inherit from all classes listed in ``*args``

    This method utilizes a python lru cache, as it stores a content type, a class, etc... in it; this is also specific
    to the current instance of the application (e.g., when deployed on a webserver)

    Example::

        get_all_workbench_models(User, Group, SomeModel, WorkbenchEntityMixin)

    :param args: a list of classes
    :type args: []
    :return: a list of workbench models that are a subclass of the provided list of classes
    :rtype: []
    """
    workbench_models = []

    # iterate over all content types
    for ct in ContentType.objects.all():
        model = ct.model_class()

        # check that the model is a workbench entity
        if model and issubclass(model, BaseModel) and issubclass_of_list(model, args):
            workbench_models.append(model)

    return workbench_models


@lru_cache(maxsize=None, typed=True)
def get_workbench_models_with_special_permissions():
    """ Gets all Workbench models that support ModelPrivileges """

    return [
        model for model in get_all_workbench_models(WorkbenchEntityMixin)
        if hasattr(model._meta, "can_have_special_permissions") and model._meta.can_have_special_permissions
    ]


@lru_cache(maxsize=None, typed=True)
def get_all_workbench_models_with_args(*args):
    """
    Collects all workbench entities
    Workbench entities are determined by making sure that they inherit from all classes listed in ``*args``

    This method utilizes a python lru cache, as it stores a content type, a class, etc... in it; this is also specific
    to the current instance of the application (e.g., when deployed on a webserver)

    :return: a dictionary containing all workbench models, indexed by their respective primary key name (e.g., task_pk)
    :rtype: dict
    """
    workbench_models = {}

    # iterate over all content types
    for ct in ContentType.objects.all():
        model = ct.model_class()

        # check that the model is a workbench entity
        if model and issubclass(model, BaseModel) and issubclass_of_list(model, args):
            lowercase_name = model.__name__.lower()
            param = "{}_pk".format(lowercase_name)
            workbench_models[param] = {
                'entity': model,
                'content_type': ct,
                'kwargs_pk': param
            }

    return workbench_models


def parse_parameters_for_workbench_models(*args, **kwargs):
    """
    Parses URL parameters (mostly in kwargs) and returns the respective workbench entity and the primary key

    :param args:
    :param kwargs:
    :return: a tuple containing the entity, the primary key (uuid) and the content type
    :rtype: tuple(WorkbenchEntityMixin, models.UUIDField, ContentType)
    """
    workbench_models = get_all_workbench_models_with_args(WorkbenchEntityMixin)

    for param, model_details in workbench_models.items():
        if param in kwargs:
            # found
            entity = model_details['entity']
            pk = kwargs[param]
            content_type = model_details['content_type']

            return entity, pk, content_type

    return None, None, None
