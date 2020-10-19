#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import uuid

from ckeditor.fields import RichTextField
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import models
from django.utils.translation import ugettext_lazy as _
from django_changeset.models import RevisionModelMixin

from eric.core.models import LockMixin, BaseModel, UploadToPathAndRename
from eric.core.models.abstract import WorkbenchEntityMixin, SoftDeleteMixin, ChangeSetMixIn
from eric.metadata.models.fields import MetadataRelation
from eric.metadata.models.models import Metadata
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.plugins.models.managers import PluginManager, PluginInstanceManager
from eric.projects.models import Project
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin

METADATA_VERSION_KEY = "metadata_version"
UNHANDLED_VERSION_ERROR = NotImplementedError("Unhandled metadata version")

logger = logging.getLogger(__name__)


class Plugin(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """
    Defines the Plugins, which is a list of available plugins referred to by the PluginInstance-Model
    """
    objects = PluginManager()

    # define user availability types
    GLOBAL = "GLB"
    SELECTED_USERS = "USR"
    # define user availability choices
    USER_AVAILABILITY_CHOICES = (
        (GLOBAL, "Global"),
        (SELECTED_USERS, "Only selected users and groups"),
    )

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = "Plugin"
        verbose_name_plural = "Plugins"
        ordering = ["title"]
        permissions = ()
        track_fields = ('title', 'short_description', 'long_description', 'path', 'responsible_users')

        def get_default_serializer(*args, **kwargs):
            from eric.plugins.rest.serializers import PluginSerializer
            return PluginSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the plugin")
    )

    short_description = models.CharField(
        max_length=256,
        verbose_name=_("Short description of the plugin")
    )

    long_description = RichTextField(
        verbose_name=_("Long description of the plugin"),
        config_name='awesome_ckeditor',
        blank=True,
    )

    notes = RichTextField(
        verbose_name=_("Notes on this plugin (Only viewable in administration interface)"),
        config_name='awesome_ckeditor',
        blank=True,
    )

    logo = models.ImageField(
        verbose_name=_("A logo for the plugin"),
        upload_to=UploadToPathAndRename('plugin_logos'),
        max_length=255,
        default='unknown_plugin.gif'
    )

    responsible_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
    )

    path = models.CharField(
        verbose_name=_("path where the app-root resides"),
        max_length=1950  # https://stackoverflow.com/questions/417142
    )

    placeholder_picture = models.ImageField(
        verbose_name=_("A placeholder image, used when the 3rd-party app doesn't provide a screenshot"),
        upload_to='plugin/',
        blank=True,
        null=True,
        max_length=512,
        default='unknown_plugin.gif'
    )

    placeholder_picture_mime_type = models.CharField(
        max_length=255,
        verbose_name=_("Mime type of the placeholder picture"),
        default="image/png"
    )

    user_availability = models.CharField(
        max_length=3,
        choices=USER_AVAILABILITY_CHOICES,
        default=GLOBAL,
        verbose_name=_("User availability for this plugin"),
        blank=False,
    )

    # reference to many user groups (can be 0 user groups, too)
    user_availability_selected_user_groups = models.ManyToManyField(
        Group,
        verbose_name=_("The selected user groups this plugin is available for"),
        related_name="plugins",
        blank=True,
    )

    user_availability_selected_users = models.ManyToManyField(
        get_user_model(),
        verbose_name=_("The selected users this plugin is available for"),
        related_name="plugins",
        blank=True,
    )

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        """
        Set mime type of the uploaded placeholder picture
        """

        # check if placeholder picture has been added/changed
        if self.placeholder_picture and hasattr(self.placeholder_picture.file, 'content_type'):
            # store mime type
            self.placeholder_picture_mime_type = self.placeholder_picture.file.content_type
            # store picture file size
            self.picture_size = self.placeholder_picture.file.size

        super(Plugin, self).save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields
        )

        # make sure that files are always closed (hasattr on self.placeholder_picture.file actually opens the file)
        if self.placeholder_picture:
            self.placeholder_picture.file.close()

    def __str__(self):
        return "Plugin {title}".format(title=self.title)


class UploadedPluginInstanceFileEntry(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """
    An entry for uploaded rawdata and picture representations of rawdata
    This entity is an additional storage of the entity "PluginInstance", such that one "PluginInstance" can have
    multiple UploadedPluginInstanceFileEntry
    """

    class Meta:
        ordering = ['file', 'id']
        track_fields = ()

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    plugininstance = models.ForeignKey(
        'PluginInstance',
        on_delete=models.CASCADE,
        verbose_name=_('Which plugininstance this entry is related to'),
        related_name='plugininstance_entries'
    )

    file = models.FileField(
        verbose_name=_("File representation of the instance rawdata/picture"),
        upload_to='plugin/',
        null=True,
        blank=True
    )

    mime_type = models.CharField(
        max_length=255,
        verbose_name=_("Mime type of the uploaded rawdata/picutre"),
        default="application/octet-stream"
    )

    size = models.BigIntegerField(
        verbose_name=_("Size of rawdata/picture"),
        default=0
    )

    def __str__(self):
        return self.plugininstance.title


class PluginInstance(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn,
                     LockMixin, ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """
    Defines Plugin Instances, which are instances of Plugins used in Labbooks
    """

    objects = PluginInstanceManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = "Plugin Instance"
        verbose_name_plural = "Plugin Instances"
        ordering = ["title"]
        permissions = (
            ("trash_plugininstance", "Can trash a plugin instance"),
            ("restore_plugininstance", "Can restore a plugin instance"),
            ("add_plugininstance_without_project", "Can add a plugin instance without a project"),
            ("change_project_plugininstance", "Can change the project of a plugin instance")
        )
        track_fields = ('title', 'rawdata', 'picture', 'projects', 'deleted')
        track_related_many = (
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/plugin_instance.html'
        export_template = 'export/plugin_instance.html'

        def get_default_serializer(*args, **kwargs):
            from eric.plugins.rest.serializers import PluginInstanceSerializer
            return PluginInstanceSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the plugin")
    )

    plugin = models.ForeignKey(
        Plugin,
        on_delete=models.CASCADE,
    )

    rawdata = models.FileField(
        verbose_name=_("File representation of the instance"),
        upload_to='plugin/',
        null=True,
        blank=True
    )

    rawdata_mime_type = models.CharField(
        max_length=255,
        verbose_name=_("Mime type of the uploaded rawdata"),
        default="application/octet-stream"
    )

    rawdata_size = models.BigIntegerField(
        verbose_name=_("Size of rawdata"),
        default=0
    )

    uploaded_rawdata_entry = models.OneToOneField(
        'plugins.UploadedPluginInstanceFileEntry',
        verbose_name=_("Reference to the archived data"),
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='+',  # no reverse field, since there is one already
    )

    picture = models.ImageField(
        verbose_name=_("A graphic rendition of the rawdata returned by the 3rd-party app"),
        upload_to='plugin/',
        blank=True,
        null=True,
        max_length=512,
    )

    picture_mime_type = models.CharField(
        max_length=255,
        verbose_name=_("Mime type of the picture representation"),
        default="image/png"
    )

    picture_size = models.BigIntegerField(
        verbose_name=_("Size of picture representation"),
        default=0
    )

    uploaded_picture_entry = models.OneToOneField(
        'plugins.UploadedPluginInstanceFileEntry',
        verbose_name=_("Reference to the archived data"),
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='+',  # no reverse field, since there is one already
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this plugin instance associated to"),
        related_name="plugininstances",
        blank=True
    )

    metadata = MetadataRelation()

    def __str__(self):
        return self.title

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        """
        Set mime type of the uploaded rawdata and picture
        :param force_insert:
        :param force_update:
        :param using:
        :param update_fields:
        :return:
        """
        store_uploaded_rawdata_entry = False
        store_uploaded_picture_entry = False
        # check if rawdata has been added/changed
        if self.rawdata and hasattr(self.rawdata.file, 'content_type'):
            # mark True to store uploaded rawdata entry
            store_uploaded_rawdata_entry = True
            # store mime type
            self.rawdata_mime_type = self.rawdata.file.content_type
            # store rawdata file size
            self.rawdata_size = self.rawdata.file.size

        if store_uploaded_rawdata_entry:
            self.uploaded_rawdata_entry = self.create_uploaded_rawdata_entry()

        # check if picture has been added/changed
        if self.picture and hasattr(self.picture.file, 'content_type'):
            # mark True to store uploaded picture entry
            store_uploaded_picture_entry = True
            # store mime type
            self.picture_mime_type = self.picture.file.content_type
            # store picture file size
            self.picture_size = self.picture.file.size

        if store_uploaded_picture_entry:
            self.uploaded_picture_entry = self.create_uploaded_picture_entry()

        super(PluginInstance, self).save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields
        )

        # make sure that files are always closed (hasattr on self.rawdata.file actually opens the file)
        if self.rawdata:
            self.rawdata.file.close()
        if self.picture:
            self.picture.file.close()

    def create_uploaded_rawdata_entry(self):
        entry = UploadedPluginInstanceFileEntry(
            plugininstance=self,
            file=self.rawdata,
            mime_type=self.rawdata_mime_type,
            size=self.rawdata_size
        )
        entry.save()
        return entry

    def create_uploaded_picture_entry(self):
        entry = UploadedPluginInstanceFileEntry(
            plugininstance=self,
            file=self.picture,
            mime_type=self.picture_mime_type,
            size=self.picture_size
        )
        entry.save()
        return entry

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "title": self.title,
            "uploaded_rawdata_entry": self.uploaded_rawdata_entry_id,
            "uploaded_picture_entry": self.uploaded_picture_entry_id,
            "projects": [p.pk for p in self.projects.all()],
            "metadata": Metadata.export_all_from_entity(self),
        }

    def restore_metadata(self, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            self.__restore_metadata_v1(metadata)
        else:
            raise UNHANDLED_VERSION_ERROR

    def __restore_metadata_v1(self, metadata):
        self.title = metadata.get("title")
        self.uploaded_rawdata_entry_id = metadata.get("uploaded_rawdata_entry")
        self.uploaded_picture_entry_id = metadata.get("uploaded_picture_entry")

        self.projects.clear()
        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        self.restore_from_uploaded_rawdata_entry(self.uploaded_rawdata_entry_id)
        self.restore_from_uploaded_picture_entry(self.uploaded_picture_entry_id)
        Metadata.restore_all_from_entity(self, metadata.get("metadata"))

    def restore_from_uploaded_rawdata_entry(self, entry_pk):
        entry = UploadedPluginInstanceFileEntry.objects.filter(pk=entry_pk).first()
        if entry:
            self.rawdata = entry.file
            self.rawdata_mime_type = entry.mime_type
            self.rawdata_size = entry.size

    def restore_from_uploaded_picture_entry(self, entry_pk):
        entry = UploadedPluginInstanceFileEntry.objects.filter(pk=entry_pk).first()
        if entry:
            self.picture = entry.file
            self.picture_mime_type = entry.mime_type
            self.picture_size = entry.size

    def export_rawdata(self):
        with open(self.rawdata.path) as fp:
            return fp.read().replace('\n', '<br>')
