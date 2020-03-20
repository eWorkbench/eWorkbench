#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import re

from django.contrib.postgres.search import SearchQuery


class FollowedBySearchQuery(SearchQuery):
    sql_template_with_config = 'to_tsquery({}::regconfig, unaccent(%s))'
    sql_template_without_config = 'to_tsquery(unaccent(%s))'
    sql_template_invert = '!!({})'

    # only allow -, . and words for our search values
    regex_strip = re.compile('(?!-)(?!\.)[\W]+', re.UNICODE)

    def clean_values(self, raw_values):
        """ Cleans raw search values by removing any non word, non . and non - """
        if not isinstance(raw_values, list):
            raw_values = [raw_values]

        cleaned_values = []

        for value in raw_values:
            value = self.regex_strip.sub('', value)

            if value:
                cleaned_values.append(''.join([value, ':*']))
            else:
                # to avoid http 500 errors, when only a single special character is input
                cleaned_values.append('')

        return cleaned_values

    def as_sql(self, compiler, connection):
        # params of the generated sql
        params = []
        values = self.clean_values(self.value)

        # compile sql with config
        if self.config:
            config_sql, config_params = compiler.compile(self.config)
            templates = []

            for value in values:
                templates.append(self.sql_template_with_config.format(config_sql))
                params += config_params + [value]

            template = ' && '.join(templates)

        # compile sql without config
        else:
            templates = []

            for value in values:
                templates.append(self.sql_template_without_config)
                params += [value]

            template = ' && '.join(templates)

        if self.invert:
            template = self.sql_template_invert.format(template)

        return template, params
