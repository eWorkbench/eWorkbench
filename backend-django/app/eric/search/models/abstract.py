#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

import django.db.models.options as options

from django.db import models
from django.db.models import TextField
from django.db.models.signals import pre_save
from django.db.models.expressions import Value, Func
from django.utils.translation import gettext_lazy as _
from django.dispatch import receiver
from django.template.loader import get_template
from django.contrib.postgres.search import SearchVectorField, SearchVector

logger = logging.getLogger(__name__)

# allow the `fts_template` attributes on the `Meta` class of models.
# This field contains the path to a template used to render the content
# of the FTS index field.
options.DEFAULT_NAMES += ('fts_template', )


class FTSMixin(models.Model):
    """
    Mixin model for models with Full-Text-Search capability. Use the `fts_fields` attribute
    on the `Meta` class to define the fields used for populating the FTS index.
    """

    FTS_LANGUAGE_GERMAN = _("German")
    FTS_LANGUAGE_GERMAN_KEY = 'german'
    FTS_LANGUAGE_ENGLISH = _("English")
    FTS_LANGUAGE_ENGLISH_KEY = 'english'

    FTS_LANGUAGES = (
        (FTS_LANGUAGE_GERMAN_KEY, FTS_LANGUAGE_GERMAN, ),
        (FTS_LANGUAGE_ENGLISH_KEY, FTS_LANGUAGE_ENGLISH, ),
    )

    fts_index = SearchVectorField(
        editable=False,
        null=True,
        verbose_name=_("FTS Index"),
    )

    fts_language = models.CharField(
        max_length=64,
        choices=FTS_LANGUAGES,
        default=FTS_LANGUAGE_ENGLISH_KEY,
        verbose_name=_("FTS Language"),
    )

    class Meta:
        abstract = True
        fts_template = None

    def _get_search_vector(self):
        """
        Gets a `SearchVector` instance containing the rendered search document.
        :return: SearchVector
        """
        fts_template = getattr(self._meta, 'fts_template', None)

        # make sure we have a template to generate the content of the FTS index
        if not fts_template:
            logger.warning("'%(model)s' is FTSMixin instance but has no fts_template assigned." % {
                'model': self.__class__.__name__
            })
            return

        # render the FTS document from the FTS template
        fts_template = get_template(fts_template)

        context = {
            'instance': self
        }

        fts_document = fts_template.render(context)

        return SearchVector(Func(
            Value(fts_document), function='unaccent', output_field=TextField()
        ), config=self.fts_language)

    @staticmethod
    @receiver(pre_save)
    def _populate_fts_index(sender, instance, *args, **kwargs):
        """
        Populates the FTS index of the model instance before saving to the DB.
        :return: SearchVector
        """
        # make sure we receive a signal from a FTSMixin inheriting class
        if not isinstance(instance, FTSMixin):
            return

        # populate the FTS index with the `SearchVector` containing the
        # rendered search document
        instance.fts_index = instance._get_search_vector()
