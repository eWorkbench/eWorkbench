# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django.db.models.deletion
from django.db import migrations, models

from django_changeset.models.mixins import RevisionModelMixin


def create_bookingrule(model, item, weekday, db_alias):
    model.objects.using(db_alias).create(
        weekday=weekday,
        time_start=item.time_start,
        time_end=item.time_end,
        full_day=item.full_day,
        resource=item.resource,
    )


def refactor_bookingrules(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    ResourceBookingRuleBookableHours = apps.get_model("projects", "ResourceBookingRuleBookableHours")
    for item in ResourceBookingRuleBookableHours.objects.using(db_alias).all():
        if item.tuesday:
            create_bookingrule(ResourceBookingRuleBookableHours, item, "TUE", db_alias)
        if item.wednesday:
            create_bookingrule(ResourceBookingRuleBookableHours, item, "WED", db_alias)
        if item.thursday:
            create_bookingrule(ResourceBookingRuleBookableHours, item, "THU", db_alias)
        if item.friday:
            create_bookingrule(ResourceBookingRuleBookableHours, item, "FRI", db_alias)
        if item.saturday:
            create_bookingrule(ResourceBookingRuleBookableHours, item, "SAT", db_alias)
        if item.sunday:
            create_bookingrule(ResourceBookingRuleBookableHours, item, "SUN", db_alias)
        if not item.monday:
            item.delete()
    RevisionModelMixin.set_enabled(True)


def reverse_refactor_bookingrules(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    ResourceBookingRuleBookableHours = apps.get_model("projects", "ResourceBookingRuleBookableHours")
    Resource = apps.get_model("projects", "Resource")

    for resource_item in Resource.objects.using(db_alias).all():
        old_bookingrule = ResourceBookingRuleBookableHours(
            resource=resource_item
        )
        for bookingrule in ResourceBookingRuleBookableHours.objects.using(db_alias).filter(resource=resource_item):
            old_bookingrule.time_start = bookingrule.time_start
            old_bookingrule.time_end = bookingrule.time_end
            old_bookingrule.full_day = bookingrule.full_day
            if bookingrule.weekday == "MON":
                old_bookingrule.monday = True
            if bookingrule.weekday == "TUE":
                old_bookingrule.tuesday = True
            if bookingrule.weekday == "WED":
                old_bookingrule.wednesday = True
            if bookingrule.weekday == "THU":
                old_bookingrule.thursday = True
            if bookingrule.weekday == "FRI":
                old_bookingrule.friday = True
            if bookingrule.weekday == "SAT":
                old_bookingrule.saturday = True
            if bookingrule.weekday == "SUN":
                old_bookingrule.sunday = True
            bookingrule.delete()
        if old_bookingrule.time_start:
            old_bookingrule.save()


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0107_mptt_rebuild_project_order'),
    ]

    operations = [
        migrations.AlterField(
            model_name='resourcebookingrulebookablehours',
            name='time_end',
            field=models.TimeField(null=True, verbose_name='Time end'),
        ),
        migrations.AlterField(
            model_name='resourcebookingrulebookablehours',
            name='time_start',
            field=models.TimeField(null=True, verbose_name='Time start'),
        ),
        migrations.AddField(
            model_name='resourcebookingrulebookablehours',
            name='weekday',
            field=models.CharField(choices=[('MON', 'Monday'), ('TUE', 'Tuesday'), ('WED', 'Wednesday'), ('THU', 'Thursday'), ('FRI', 'Friday'), ('SAT', 'Saturday'), ('SUN', 'Sunday')], default="MON", max_length=3, verbose_name='Weekday'),
        ),
        migrations.AlterUniqueTogether(
            name='resourcebookingrulebookablehours',
            unique_together={('weekday', 'resource')},
        ),
        migrations.AlterField(
            model_name='resourcebookingrulebookablehours',
            name='resource',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                                    related_name='booking_rule_bookable_hours', to='projects.Resource',
                                    verbose_name='Booked resource'),
        ),
        migrations.RunPython(refactor_bookingrules, reverse_refactor_bookingrules),
    ]
