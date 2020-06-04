#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.management.base import BaseCommand
from django.db.models import Q

from eric.projects.models import ContentType
from eric.relations.models import Relation
from eric.shared_elements.models import File


def log(group, model, key, value, comment=''):
    app_label = model._meta.app_label
    log_simple(group, model.__name__, app_label, key, value, comment)


def log_simple(group, model, app, key, value, comment=''):
    print("{0}\t{1}\t{2}\t{3}\t{4}\t{5}".format(group, model, app, key, value, comment))


def sort_models(models):
    models.sort(key=lambda m: m.__name__)
    return models


class Command(BaseCommand):
    help = 'Prints some metrics'

    def handle(self, *args, **options):
        log_simple('GROUP', 'MODEL', 'APP', 'KEY', 'VALUE', 'COMMENT')

        group = 'counts'
        all_models = sort_models([
            ct.model_class() for ct in ContentType.objects.all() if ct.model_class()
        ])
        for model in all_models:
            log(group, model, 'count', model.objects.all().count())

        # non-WebDAV files
        log(group, File, 'count_without_directory', File.objects.filter(directory__isnull=True).count())

        group = 'relations'
        relatable_models = sort_models([
            model for model in all_models
            if hasattr(model._meta, 'is_relatable') and model._meta.is_relatable
        ])
        for model in relatable_models:
            ct = model.get_content_type()
            relations_left = Relation.objects.filter(left_content_type=ct)
            relations_right = Relation.objects.filter(right_content_type=ct)
            relations = Relation.objects.filter(Q(right_content_type=ct) | Q(left_content_type=ct))
            log(group, model, 'relations', relations.count())
            # relation: left=target, right=base model
            log(group, model, 'relations_from', relations_right.count())
            log(group, model, 'relations_to', relations_left.count())
            log(group, model, 'relations_private', relations.filter(private=True).count())
