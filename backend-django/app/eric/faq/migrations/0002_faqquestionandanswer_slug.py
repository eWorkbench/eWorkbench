# Generated by Django 2.2.25 on 2022-02-07 09:24

from django.db import migrations, models
from django.utils.text import slugify


def set_defaults(apps, schema_editor):
    faqs = apps.get_model('faq', 'FAQQuestionAndAnswer')
    for faq in faqs.objects.all().iterator():
        faq.slug = slugify(faq.question)
        faq.save()


class Migration(migrations.Migration):

    dependencies = [
        ('faq', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='faqquestionandanswer',
            name='slug',
            field=models.SlugField(
                null=True,
                max_length=512,
                unique=False,
                db_index=False,
                verbose_name='Unique slug for linking to this question',
            ),
        ),
        migrations.RunPython(set_defaults, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='faqquestionandanswer',
            name='slug',
            field=models.SlugField(
                null=False,
                max_length=512,
                unique=True,
                db_index=True,
                verbose_name='Unique slug for linking to this question',
            ),
        ),
    ]
