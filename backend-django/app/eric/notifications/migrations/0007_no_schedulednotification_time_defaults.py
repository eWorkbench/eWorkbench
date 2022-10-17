#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0006_fix_defaults'),
    ]

    operations = [
        migrations.AlterField(
            model_name='schedulednotification',
            name='timedelta_unit',
            field=models.CharField(choices=[('MINUTE', 'minutes'), ('HOUR', 'hours'), ('DAY', 'days'), ('WEEK', 'weeks')], max_length=6, verbose_name='Time unit when the notification should be created'),
        ),
        migrations.AlterField(
            model_name='schedulednotification',
            name='timedelta_value',
            field=models.IntegerField(verbose_name='Time value when the notification should created'),
        ),
    ]
