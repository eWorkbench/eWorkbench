#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.apps import apps
from django.core.management import BaseCommand

from eric.search.models import FTSMixin

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Rebuilds the FTS index for all models'

    def handle(self, *args, **options):
        # get all model classes the Django ORM knowns about
        model_classes = apps.get_models(include_auto_created=False)

        for model_class in model_classes:
            # skip model classes that do not inherit FTSMixin
            if not issubclass(model_class, FTSMixin):
                continue

            # get all model instances for each model class
            model_instances = model_class.objects.all()

            for model_instance in model_instances:
                logger.info("Update FTS index for '%(model)s' instance '%(pk)s'." % {
                    'model': model_class.__name__,
                    'pk': model_instance.pk,
                })

                # use `update` to not trigger any model signals
                try:
                    model_class.objects.filter(pk=model_instance.pk).update(**{
                        'fts_index': model_instance._get_search_vector(),
                    })
                except AttributeError as e:
                    # attribute error might be raised for DB rows of models that do not exist anymore in code
                    logger.error(e)
