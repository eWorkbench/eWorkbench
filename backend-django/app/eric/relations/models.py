#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid
import logging

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch.dispatcher import receiver
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _

from django_changeset.models import RevisionModelMixin, ChangeSet

from eric.core.models import BaseModel, disable_permission_checks, permission_checks_disabled
from eric.core.models.abstract import get_all_workbench_models_with_args, WorkbenchEntityMixin, ChangeSetMixIn
from eric.relations.managers import RelationManager


logger = logging.getLogger(__name__)


class Relation(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """ Model used to build generic relations """

    objects = RelationManager()

    class Meta:
        verbose_name = _("Relation")
        verbose_name_plural = _("Relations")
        track_fields = ('left_content_type', 'left_object_id', 'right_content_type', 'right_object_id', 'private')
        index_together = (
            ('left_content_type', 'left_object_id', ),
            ('right_content_type', 'right_object_id', )
        )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    left_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name='left_content_type',
        verbose_name=_('Left content type of the relation'),
    )
    left_object_id = models.UUIDField(
        verbose_name=_('Left object id of the relation'),
    )
    left_content_object = GenericForeignKey('left_content_type', 'left_object_id')

    right_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name='right_content_type',
        verbose_name=_('Right content type of the relation'),
    )
    right_object_id = models.UUIDField(
        verbose_name=_('Right object id of the relation'),
    )
    right_content_object = GenericForeignKey('right_content_type', 'right_object_id')

    private = models.BooleanField(
        verbose_name=_('Private Field of the relation'),
        default=False
    )

    def __str__(self):
        return f"Left object id {self.left_object_id}, right object id {self.right_object_id}"

    def check_if_relation_is_allowed(self):
        """
            A relation is only allowed when in the specific model the attribute 'is_relatable' was set to True
            and the left content object is not the same object as the right content object
        """
        # checks if the left_content_object exists
        if self.left_content_object is None:
            raise ValidationError({
                'left_content_object': ValidationError(
                    _('can not be none'),
                    params={'relation': self},
                    code='invalid'
                )
            })

        # checks if the right_content_object exists
        if self.right_content_object is None:
            raise ValidationError({
                'right_content_object': ValidationError(
                    _('can not be none'),
                    params={'relation': self},
                    code='invalid'
                )
            })

        # checks if the right_content_object is not the same as the left_content_object
        if self.right_content_object == self.left_content_object or self.right_object_id == self.left_object_id:
            raise ValidationError({
                'left_content_object': ValidationError(
                    _('is not allowed to be the same object as the right_content_object'),
                    params={'relation': self},
                    code='invalid'
                )
            })

        # checks if in left_content_object is_relatable is set to True
        if not hasattr(self.left_content_object._meta, "is_relatable") or \
                not self.left_content_object._meta.is_relatable:
            raise ValidationError({
                'left_content_object': ValidationError(
                    _('can not be related (must set is_relatable in meta class of object)'),
                    params={'relation': self},
                    code='invalid'
                )
            })

        # checks if in right_content_object is_relatable is set to True
        if not hasattr(self.right_content_object._meta, "is_relatable") or \
                not self.right_content_object._meta.is_relatable:
            raise ValidationError({
                'right_content_object': ValidationError(
                    _('can not be related (must set is_relatable in meta class of object)'),
                    params={'relation': self},
                    code='invalid'
                )
            })

    def clean(self):
        self.check_if_relation_is_allowed()


@receiver(pre_save, sender=Relation)
def on_save_relation(sender, instance, *args, **kwargs):
    """
    On save of a relation, verify that the current user actually has access to the left and right content object
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    if permission_checks_disabled(instance):
        return

    # ignore raw
    if kwargs.get('raw'):
        return

    # verify that the current user has access to left and right content object
    left = instance.left_content_object
    right = instance.right_content_object

    if not left._meta.model.objects.viewable().filter(pk=left.pk).exists():
        raise ValidationError({
            'left_content_object': ValidationError(
                _('You do not have permission to relate to this object'),
                params={'relation': instance},
                code='invalid'
            )
        })

    if not right._meta.model.objects.viewable().filter(pk=right.pk).exists():
        raise ValidationError({
            'right_content_object': ValidationError(
                _('You do not have permission to relate to this object'),
                params={'relation': instance},
                code='invalid'
            )
        })


@receiver(post_delete)
def on_delete_relations(sender, instance, *args, **kwargs):
    """ Followup on a delete of a model that is relatable
    All relations that use this object need to be deleted too
    !!! Note: objects should never be deleted;
    !!! This receiver is only meant as a fallback, to make sure database relations are kept intact when a superuser
        deletes anything in the database (via django admin)
    """

    # check if the current instance is relatable
    if hasattr(instance._meta, "is_relatable") and instance._meta.is_relatable:
        with disable_permission_checks(Relation):
            # find all Relations where this instance is used as left or right object, and delete those relations
            Relation.objects.filter(
                left_object_id=instance.pk,
                left_content_type=instance.get_content_type()
            ).delete()

            Relation.objects.filter(
                right_object_id=instance.pk,
                right_content_type=instance.get_content_type()
            ).delete()


class RelationsMixIn(models.Model):
    """
    Mixin for relations
    provides a property called "relations" which provides all relations for the current object
    """
    class Meta:
        abstract = True
        is_relatable = None

    def get_relations(self, filter_by_pk=None):
        # get all relations and prefetch the changesets
        relations = Relation.objects.viewable().for_model(self.__class__, self.pk).prefetch_related(
            'created_by', 'created_by__userprofile',
            'last_modified_by', 'last_modified_by__userprofile'
        )

        if filter_by_pk:
            relations = relations.filter(pk__in=filter_by_pk)

        workbench_models = get_all_workbench_models_with_args(WorkbenchEntityMixin)

        pks_by_ct = {}
        model_by_ct = {}
        prefetched_objects_by_ct = {}

        for param, model_details in workbench_models.items():
            ct = model_details['content_type'].id
            pks_by_ct[ct] = []
            model_by_ct[ct] = model_details['entity']

        from eric.projects.models import Project
        # add projects to the list
        project_content_type_id = Project.get_content_type().id
        pks_by_ct[project_content_type_id] = []
        model_by_ct[project_content_type_id] = Project

        # collect all PKs of related objects
        for relation in relations:
            assert relation.left_content_type_id in pks_by_ct, "Left Content Type ID is not valid"
            assert relation.right_content_type_id in pks_by_ct, "Right Content Type ID is not valid"

            pks_by_ct[relation.left_content_type_id].append(relation.left_object_id)
            pks_by_ct[relation.right_content_type_id].append(relation.right_object_id)

        # prefetch all models
        for ct in pks_by_ct:
            pks = pks_by_ct[ct]
            if len(pks) > 0:
                prefetched_objects_by_ct[ct] = model_by_ct[ct].objects.related_viewable().filter(
                    pk__in=pks
                ).prefetch_common()

                # prefetch projects (for most relations)
                if ct != project_content_type_id:
                    prefetched_objects_by_ct[ct] = prefetched_objects_by_ct[ct].prefetch_related('projects')

                # retrieve the prefetched objects (via in_bulk)
                prefetched_objects_by_ct[ct] = prefetched_objects_by_ct[ct].in_bulk()

        # iterate over all relations and fill in the prefetched elements in left_content_object/right_content_object
        for relation in relations:
            # prefetch the left content object
            relation.left_content_object = prefetched_objects_by_ct[relation.left_content_type_id].get(
                relation.left_object_id, None  # get the object, or None if not available
            )
            # prefetch the right content object
            relation.right_content_object = prefetched_objects_by_ct[relation.right_content_type_id].get(
                relation.right_object_id, None  # get the object, or None if not available
            )

        return relations

    @property
    def relations(self):
        """
        Returns a QuerySet with all relations of the current object
        :return: RelationsQuerySet
        """
        return self.get_relations()
