#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import calendar
import logging
import math
import os
import uuid

import vobject
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import Q
from django.db.models.fields.files import FieldFile
from django.urls import reverse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.timezone import datetime, timedelta
from django.utils.timezone import localtime, localdate
from django.utils.translation import gettext_lazy as _
from django_changeset.models import RevisionModelMixin
from django_changeset.models.mixins import CreatedModifiedByMixIn
from django_cleanhtmlfield.fields import HTMLField
from django_userforeignkey.request import get_current_user


from eric.base64_image_extraction.models import ExtractedImage
from eric.core.models import BaseModel, LockMixin, disable_permission_checks
from eric.core.models.abstract import SoftDeleteMixin, ChangeSetMixIn, WorkbenchEntityMixin, ImportedDSSMixin
from eric.core.models.fields import AutoIncrementIntegerWithPrefixField
from eric.core.utils import convert_html_to_text
from eric.dss.models.models import get_upload_to_path, dss_storage, DSSContainer
from eric.metadata.models.fields import MetadataRelation
from eric.metadata.models.models import Metadata
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.projects.models import FileSystemStorageLimitByUser, Project, MyUser, Resource
from eric.projects.models.exceptions import ContainerReadWriteException
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin
from eric.shared_elements.models.managers import ContactManager, NoteManager, FileManager, TaskManager, \
    TaskAssignedUserManager, TaskCheckListManager, MeetingManager, UserAttendsMeetingManager, \
    ContactAttendsMeetingManager, ElementLabelManager, CalendarAccessManager

METADATA_VERSION_KEY = "metadata_version"
UNHANDLED_VERSION_ERROR = NotImplementedError("Unhandled metadata version")

logger = logging.getLogger(__name__)

User = get_user_model()

rgba_color_validator = RegexValidator(
    r"^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$",
    _("Not a valid RGBA color")
)


def datetime_to_iso_string(date_time):
    return date_time.astimezone(timezone.utc).isoformat() if date_time is not None else None


def datetime_from_iso_string(string):
    return parse_datetime(string) if string is not None and string != "" else None


def scramble_uploaded_filename(filename):
    """ scramble/uglify the filename of the uploaded file, keep the file extension """
    if "." in filename:
        extension = filename.split(".")[-1]
        return "{}.{}".format(uuid.uuid4(), extension)
    else:
        return str(uuid.uuid4())


class Contact(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
              ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """ Defines a contact, which is associated to a project """
    objects = ContactManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = "Contact"
        verbose_name_plural = "Contacts"
        ordering = ["last_name", "first_name", "email"]
        permissions = (
            ("trash_contact", "Can trash a contact"),
            ("restore_contact", "Can restore a contact"),
            ("change_project_contact", "Can change the project of a contact"),
            ("add_contact_without_project", "Can add a contact without a project")
        )
        track_fields = (
            'academic_title', 'first_name', 'last_name',
            'email', 'phone', 'company', 'notes',
            'projects', 'deleted'
        )
        track_related_many = (
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/contact.html'
        export_template = 'export/contact.html'

        def get_default_serializer(*args, **kwargs):
            from eric.shared_elements.rest.serializers import ContactSerializer
            return ContactSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    academic_title = models.CharField(
        max_length=128,
        default="",
        blank=True,
        verbose_name=_("Academic title of the contact")
    )

    first_name = models.CharField(
        max_length=128,
        verbose_name=_("First name of the contact"),
        db_index=True
    )

    last_name = models.CharField(
        max_length=128,
        verbose_name=_("Last name of the contact")
    )

    email = models.EmailField(
        verbose_name=_("Email of the contact"),
        blank=True
    )

    phone = models.CharField(
        max_length=128,
        verbose_name=_("Phone number of the contact"),
        blank=True
    )

    company = models.CharField(
        max_length=128,
        verbose_name=_("Company of the contact"),
        blank=True
    )

    notes = HTMLField(
        verbose_name=_("Notes about the contact"),
        blank=True,
        strip_unsafe=True,
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this contact associated to"),
        related_name="contacts",
        blank=True
    )

    metadata = MetadataRelation()

    def __str__(self):
        str = "%(firstname)s %(lastname)s" % {
            'firstname': self.first_name, 'lastname': self.last_name
        }

        if self.academic_title != "":
            str = "%(academic_title)s %(rest)s" % {
                'academic_title': self.academic_title,
                'rest': str
            }

        return str

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v2()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "academic_title": self.academic_title,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "company": self.company,
            "projects": [p.pk for p in self.projects.all()],
            "metadata": Metadata.export_all_from_entity(self),
        }

    def __export_metadata_v2(self):
        data = self.__export_metadata_v1()
        data.update({
            METADATA_VERSION_KEY: 2,
            "notes": self.notes,
        })
        return data

    def restore_metadata(self, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            self.__restore_metadata_v1(metadata)
        if version == 2:
            self.__restore_metadata_v2(metadata)
        else:
            raise UNHANDLED_VERSION_ERROR

    def __restore_metadata_v1(self, metadata):
        self.academic_title = metadata.get("academic_title")
        self.first_name = metadata.get("first_name")
        self.last_name = metadata.get("last_name")
        self.email = metadata.get("email")
        self.phone = metadata.get("phone")
        self.company = metadata.get("company")

        self.projects.clear()
        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        Metadata.restore_all_from_entity(self, metadata.get("metadata"))

    def __restore_metadata_v2(self, metadata):
        self.__restore_metadata_v1(metadata)
        self.notes = metadata.get("notes")


class Note(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
           ModelPrivilegeMixIn, WorkbenchEntityMixin):
    # """ Defines a note, which can be associated to ANYTHING (project, contact, milestone, ...) """
    """ Defines a note, which can be associated to a Project """
    objects = NoteManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = "Note"
        verbose_name_plural = "Notes"
        ordering = ["subject", "content"]
        permissions = (
            ("trash_note", "Can trash a note"),
            ("restore_note", "Can restore a note"),
            ("change_project_note", "Can change the project of a note"),
            ("add_note_without_project", "Can add a note without a project")
        )
        track_fields = ('subject', 'content', 'projects', 'deleted')
        track_related_many = (
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/note.html'
        export_template = 'export/note.html'

        def get_default_serializer(*args, **kwargs):
            from eric.shared_elements.rest.serializers import NoteSerializer
            return NoteSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    subject = models.CharField(
        max_length=128,
        verbose_name=_("Subject of the note"),
        db_index=True
    )

    content = HTMLField(
        verbose_name=_("Content of the note"),
        blank=True,
        strip_unsafe=True,
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this note associated to"),
        related_name="notes",
        blank=True
    )

    extracted_images = GenericRelation(ExtractedImage)

    metadata = MetadataRelation()

    def __str__(self):
        return self.subject

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "subject": self.subject,
            "content": self.content,
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
        self.subject = metadata.get("subject")
        self.content = metadata.get("content")

        self.projects.clear()
        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        Metadata.restore_all_from_entity(self, metadata.get("metadata"))


class DynamicStorageFieldFile(FieldFile):
    """
    attr_class for DynamicStorageFileField
    This class checks if the instance is a dss File or not and sets the storage to be used accordingly.
    """
    def __init__(self, instance, field, name):
        super(DynamicStorageFieldFile, self).__init__(
            instance, field, name
        )
        if instance.is_dss_file:
            self.storage = dss_storage
        else:
            self.storage = FileSystemStorageLimitByUser()


class DynamicStorageFileField(models.FileField):
    """
    Custom FileField to be used for the path of File and UploadedFileEntry.
    This class checks if the instance is a dss File or not and sets the storage to be used accordingly.
    """
    attr_class = DynamicStorageFieldFile

    def pre_save(self, model_instance, add):
        if model_instance.is_dss_file:
            self.storage = dss_storage
        else:
            self.storage = FileSystemStorageLimitByUser()
        file = super(DynamicStorageFileField, self).pre_save(model_instance, add)
        return file


class UploadedFileEntry(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """
    An entry for uploaded files
    This entity is an additional storage of the the entity "File", such that one "File" can have multiple
    UploadedFileEntries
    """

    class Meta:
        ordering = ['path', 'id']
        track_fields = ('path', 'mime_type', 'file_size', 'original_filename')

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    file = models.ForeignKey(
        'File',
        on_delete=models.CASCADE,
        verbose_name=_('Which file is this entry related to'),
        related_name='file_entries'
    )

    path = DynamicStorageFileField(
        verbose_name=_("Path of the file"),
        max_length=4096,
        upload_to=get_upload_to_path,
    )

    mime_type = models.CharField(
        max_length=255,
        verbose_name=_("Mime type of the uploaded file"),
        default="application/octet-stream"
    )

    file_size = models.BigIntegerField(
        verbose_name=_("Size of the file")
    )

    original_filename = models.CharField(
        max_length=255,
        verbose_name=_("Original name of the file")
    )

    @property
    def is_dss_file(self):
        return self.file.is_dss_file

    @property
    def download_url(self):
        return "%(url)s?version=%(version)s" % {
            'url': reverse(
                'file-download',
                kwargs={'pk': self.file.pk, 'project_pk': self.file.project.pk}
            ),
            'version': self.pk
        }

    def __str__(self):
        return self.file.name


class File(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
           ModelPrivilegeMixIn, WorkbenchEntityMixin, ImportedDSSMixin):
    """ Defines a file, which is associated to a project """
    objects = FileManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("File")
        verbose_name_plural = _("Files")
        ordering = ["name", "original_filename"]
        permissions = (
            ("trash_file", "Can trash a file"),
            ("restore_file", "Can restore a file"),
            ("change_project_file", "Can change the project of a file"),
            ("add_file_without_project", "Can add a file without a project")
        )
        track_fields = (
            'title', 'description', 'projects', 'deleted', 'directory',
            'name', 'original_filename', 'mime_type', 'file_size', 'path',
        )
        track_related_many = (
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/file.html'
        export_template = 'export/file.html'

        def get_default_serializer(*args, **kwargs):
            from eric.shared_elements.rest.serializers import FileSerializer
            return FileSerializer

    DEFAULT_MIME_TYPE = "application/octet-stream"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=255,
        verbose_name=_("Title of the file")
    )

    name = models.CharField(
        max_length=255,
        verbose_name=_("Current name of the file")
    )

    description = HTMLField(
        verbose_name=_("Description of the file"),
        blank=True,
        strip_unsafe=True,
    )

    directory = models.ForeignKey(
        'drives.Directory',
        verbose_name=_("Directory of a Drive where the file is stored at"),
        related_name='files',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )

    path = DynamicStorageFileField(
        verbose_name=_("Path of the file"),
        max_length=4096,
        blank=True,
        null=True,
        upload_to=get_upload_to_path,
    )

    mime_type = models.CharField(
        max_length=255,
        verbose_name=_("Mime type of the uploaded file"),
        default=DEFAULT_MIME_TYPE
    )

    file_size = models.BigIntegerField(
        verbose_name=_("Size of the file"),
        default=0
    )

    original_filename = models.CharField(
        max_length=255,
        verbose_name=_("Original name of the file")
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this file associated to"),
        related_name="files",
        blank=True
    )

    uploaded_file_entry = models.OneToOneField(
        'shared_elements.UploadedFileEntry',
        verbose_name=_("Reference to the archived data"),
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='+'  # no reverse field, since there is one already
    )

    extracted_images = GenericRelation(ExtractedImage)

    metadata = MetadataRelation()

    @property
    def is_dss_file(self):
        """
        Returns True if a File is in a directory where the storage is in a DSS envelope
        """
        if self.directory and self.directory.drive and self.directory.drive.envelope:
            return True
        return False

    @property
    def location(self):
        if self.directory and self.directory.drive and self.directory.drive.envelope \
                and self.directory.drive.envelope.container:
            return "DSS: {}".format(self.directory.drive.envelope.container.path)
        return ''

    @staticmethod
    def generate_file_name(cur_file_name):
        new_file_name = scramble_uploaded_filename(cur_file_name)

        new_file_path = settings.WORKBENCH_SETTINGS['project_file_upload_folder'] % {
            'filename': new_file_name
        }

        return new_file_path

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        """
        Set original file name and mime type of the uploaded file
        :param force_insert:
        :param force_update:
        :param using:
        :param update_fields:
        :return:
        """
        store_uploaded_file_entry = False
        # check if file has changed
        if self.path and hasattr(self.path.file, 'content_type'):
            # mark True for store uploaded file entry
            store_uploaded_file_entry = True
            # store original filename
            self.original_filename = os.path.basename(self.path.name)
            # store mime type
            self.mime_type = self.path.file.content_type
            # store file size
            self.file_size = self.path.file.size

            if not self.is_dss_file:
                # move the file to a project folder
                new_file_path = File.generate_file_name(self.path.name)

                # create folder if it does not exist
                if not os.path.exists(os.path.dirname(new_file_path)):
                    os.makedirs(os.path.dirname(new_file_path))

                # make sure the path we use is relative to the MEDIA_ROOT, we dont want to store the whole path
                new_file_path = os.path.relpath(new_file_path, settings.MEDIA_ROOT)

                # rename old file path to the new file path
                # os.rename(self.path.path, new_file_path)

                self.path.name = new_file_path

        # when a file is uploaded from webdav, give it a title
        if self.title == "":
            self.title = self.name

        if store_uploaded_file_entry:
            self.uploaded_file_entry = UploadedFileEntry.objects.create(
                file=self,
                path=self.path,
                mime_type=self.mime_type,
                original_filename=self.name,
                file_size=self.file_size
            )

        super(File, self).save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields
        )

        # make sure that the file is always closed (hasattr on self.path.file actually opens the file)
        if self.path:
            self.path.file.close()

    def __str__(self):
        return self.name

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v2()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "name": self.name,
            "description": self.description,
            "directory": self.directory_id,
            "uploaded_file_entry": self.uploaded_file_entry.pk,
            "projects": [p.pk for p in self.projects.all()],
            "metadata": Metadata.export_all_from_entity(self),
        }

    def __export_metadata_v2(self):
        metadata = self.__export_metadata_v1()
        metadata.update({
            METADATA_VERSION_KEY: 2,
            "title": self.title,
        })
        return metadata

    def restore_metadata(self, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            self.__restore_metadata_v1(metadata)
        elif version == 2:
            self.__restore_metadata_v2(metadata)
        else:
            raise UNHANDLED_VERSION_ERROR

    def __restore_metadata_v1(self, metadata):
        self.title = metadata.get("name")  # new field
        self.name = metadata.get("name")
        self.description = metadata.get("description")

        directory_pk = metadata.get("directory")
        self.directory_id = directory_pk if directory_pk is not None and directory_pk != '' else None
        self.uploaded_file_entry_id = metadata.get("uploaded_file_entry")

        self.projects.clear()
        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        file_entry_pk = metadata.get("uploaded_file_entry")
        self.restore_from_uploaded_file_entry(file_entry_pk)

        Metadata.restore_all_from_entity(self, metadata.get("metadata"))

    def __restore_metadata_v2(self, metadata):
        self.__restore_metadata_v1(metadata)
        self.title = metadata.get("title")

    def restore_from_uploaded_file_entry(self, uploaded_file_entry_pk):
        entry = UploadedFileEntry.objects.get(pk=uploaded_file_entry_pk)
        self.path = entry.path
        self.mime_type = entry.mime_type
        self.file_size = entry.file_size
        self.original_filename = entry.original_filename
        self.uploaded_file_entry = entry


class TaskAssignedUser(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """ Defines assigned users on Tasks (through model, many to many) """
    objects = TaskAssignedUserManager()

    class Meta:
        verbose_name = _("Task Assignee")
        verbose_name_plural = _("Task Assignees")
        ordering = ["task__task_id", "assigned_user__username"]
        # track the assigned user on the task entity
        # track_fields = ('assigned_user', )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    assigned_user = models.ForeignKey(
        "projects.MyUser",
        verbose_name=_("Which user is the task assigned to"),
        on_delete=models.CASCADE
    )

    # reference to a task
    task = models.ForeignKey(
        'shared_elements.Task',
        verbose_name=_("Which task is the user assigned to"),
        blank=True,
        null=True,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return "User {user} is assigned to task {task}".format(user=self.assigned_user, task=self.task)


class TaskCheckList(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """ Defines the checklist for a task """
    objects = TaskCheckListManager()

    class Meta:
        verbose_name = _("Task Checklist Item")
        verbose_name_plural = _("Task Checklist Items")
        ordering = ["task__task_id", "created_at"]
        track_fields = ('title', 'checked', 'task',)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=2000,
        verbose_name=_("Title of the checklist item")
    )

    checked = models.BooleanField(
        default=False,
        verbose_name=_("Whether this checklist item has been checked or not")
    )

    # reference to a task
    task = models.ForeignKey(
        'shared_elements.Task',
        related_name="checklist_items",
        verbose_name=_("Which task this checklist item belongs to"),
        blank=True,
        null=True,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return _("Task") + " {task_title}: [{checked}] {checklist_title}".format(
            task_title=self.task.title,
            checked=self.checked,
            checklist_title=self.title
        )


class Task(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn, LockMixin,
           ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """ Defines a task, which is associated to a project """
    objects = TaskManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = "Task"
        verbose_name_plural = "Tasks"
        ordering = ["task_id", "title", "priority", "due_date", "state"]
        permissions = (
            ("trash_task", "Can trash a task"),
            ("restore_task", "Can restore a task"),
            ("change_project_task", "Can change the project of a task"),
            ("add_task_without_project", "Can add a task without a project"),
        )
        track_fields = (
            'title', 'start_date', 'due_date', 'priority', 'state', 'description', 'projects', 'assigned_users',
            'labels', 'deleted'
        )
        track_related_many = (
            ('checklist_items', ('title', 'checked')),
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/task.html'
        export_template = 'export/task.html'

        def get_default_serializer(*args, **kwargs):
            from eric.shared_elements.rest.serializers import TaskSerializer
            return TaskSerializer

    # Task State Choices
    TASK_STATE_NEW = 'NEW'
    TASK_STATE_PROGRESS = 'PROG'
    TASK_STATE_DONE = 'DONE'

    TASK_STATE_CHOICES = (
        (TASK_STATE_NEW, 'New'),
        (TASK_STATE_PROGRESS, 'In Progress'),
        (TASK_STATE_DONE, 'Done'),
    )

    # Task Priority
    TASK_PRIORITY_NORMAL = 'NORM'
    TASK_PRIORITY_HIGH = 'HIGH'
    TASK_PRIORITY_VERY_HIGH = 'VHIGH'
    TASK_PRIORITY_LOW = 'LOW'
    TASK_PRIORITY_VERY_LOW = 'VLOW'

    TASK_PRIORITY_CHOICES = (
        (TASK_PRIORITY_VERY_HIGH, 'Very High'),
        (TASK_PRIORITY_HIGH, 'High'),
        (TASK_PRIORITY_NORMAL, 'Normal'),
        (TASK_PRIORITY_LOW, 'Low'),
        (TASK_PRIORITY_VERY_LOW, 'Very Low')
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    task_id = AutoIncrementIntegerWithPrefixField(
        verbose_name=_("Ticket Identifier"),
        db_index=True
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the task")
    )

    start_date = models.DateTimeField(
        verbose_name=_("Task start date"),
        db_index=True,
        null=True,
        blank=True
    )

    due_date = models.DateTimeField(
        verbose_name=_("Task due date"),
        db_index=True,
        null=True,
        blank=True
    )

    priority = models.CharField(
        max_length=5,
        choices=TASK_PRIORITY_CHOICES,
        verbose_name=_("Priority of the task"),
        default=TASK_PRIORITY_NORMAL
    )

    state = models.CharField(
        max_length=5,
        choices=TASK_STATE_CHOICES,
        verbose_name=_("State of the task"),
        default=TASK_STATE_NEW,
        db_index=True
    )

    description = HTMLField(
        verbose_name=_("Description of the task"),
        blank=True,
        strip_unsafe=True,
    )

    assigned_users = models.ManyToManyField(
        "projects.MyUser",
        through="TaskAssignedUser"
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this task associated to"),
        related_name="tasks",
        blank=True
    )

    labels = models.ManyToManyField(
        'shared_elements.ElementLabel',
        verbose_name=_("Which labels are assigned to this task"),
        related_name="tasks",
        blank=True
    )

    extracted_images = GenericRelation(ExtractedImage)

    metadata = MetadataRelation()

    def __str__(self):
        return self.title

    def validate_date_time_start_end(self):
        """
        Validates that the tasks `start_time` is before or equal `due_date`
        :return:
        """
        start_date = self.start_date
        end_date = self.due_date

        if end_date and start_date and end_date < start_date:
            raise ValidationError({
                'start_date': ValidationError(
                    _('Start date must be before end date'),
                    code='invalid'
                ),
                'due_date': ValidationError(
                    _('End date must be after start date'),
                    code='invalid'
                ),
            })

    def clean(self):
        """ validate the meetings date_time  """
        self.validate_date_time_start_end()

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v1()

    def __export_metadata_v1(self):
        checklist = []
        for item in TaskCheckList.objects.filter(task=self):
            checklist.append({
                "title": item.title,
                "checked": item.checked
            })

        return {
            METADATA_VERSION_KEY: 1,
            "title": self.title,
            "start_date": datetime_to_iso_string(self.start_date),
            "due_date": datetime_to_iso_string(self.due_date),
            "priority": self.priority,
            "state": self.state,
            "description": self.description,
            "assigned_users": [au.pk for au in self.assigned_users.all()],
            "projects": [p.pk for p in self.projects.all()],
            "labels": [label.pk for label in self.labels.all()],
            "checklist": checklist,
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
        self.start_date = datetime_from_iso_string(metadata.get("start_date"))
        self.due_date = datetime_from_iso_string(metadata.get("due_date"))
        self.priority = metadata.get("priority")
        self.state = metadata.get("state")
        self.description = metadata.get("description")

        self.projects.clear()
        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        with disable_permission_checks(TaskAssignedUser):
            TaskAssignedUser.objects.filter(task=self).delete()
            user_pks = metadata.get("assigned_users")
            for user in User.objects.filter(pk__in=user_pks):
                TaskAssignedUser.objects.create(task=self, assigned_user=user)

        self.labels.clear()
        label_pks = metadata.get("labels")
        if label_pks is not None and len(label_pks) > 0:
            labels = ElementLabel.objects.filter(pk__in=label_pks)
            self.labels.add(*labels)

        self.checklist_items.all().delete()
        for item in metadata.get("checklist"):
            model_item = TaskCheckList(title=item['title'], checked=item['checked'], task=self)
            model_item.save()

        Metadata.restore_all_from_entity(self, metadata.get("metadata"))

    def duplicate(self, *args, **kwargs):
        """
        Duplicates the Task and removes all non-relevant variables (such as Django ChangeSet __original_data__)
        """

        from django.forms import model_to_dict
        task_dict = model_to_dict(self)

        # duplicated task should not be soft deleted, even if the original task is
        del task_dict['deleted']

        # related projects will be added separately after the duplicated task has been saved
        del task_dict['projects']

        # element labels will be added separately after the duplicated task has been saved
        element_labels = task_dict['labels']
        del task_dict['labels']

        # assigned users will be added separately after the duplicated task has been saved
        assigned_users = task_dict['assigned_users']
        del task_dict['assigned_users']

        # variables are generated automatically
        del task_dict['version_number']
        del task_dict['fts_language']

        # rename to "Copy of <tasktitle>"
        task_dict['title'] = ("Copy of {}".format(task_dict['title']))
        task_dict['state'] = "NEW"

        # create a new task object and save it
        new_task_object = Task(**task_dict)
        new_task_object.save()

        # assign duplicated task to projects
        projects = kwargs['projects']
        if len(projects) > 0:
            for project in projects:
                new_task_object.projects.add(project)

        # assign previously saved elements to duplicated task
        if len(assigned_users) > 0:
            for user in assigned_users:
                TaskAssignedUser.objects.create(task=new_task_object, assigned_user=user)

        if len(element_labels) > 0:
            for label in element_labels:
                new_label = ElementLabel.objects.create(name=label.name, color=label.color)
                new_task_object.labels.add(new_label)

        checklist = self.export_metadata()['checklist']
        if len(checklist) > 0:
            for item in checklist:
                new_item = TaskCheckList.objects.create(**item)
                new_task_object.checklist_items.add(new_item)

        return new_task_object


def get_duration_parts(duration):
    """
    Calculates the days, hours, minutes of a given duration (datetime.timedelta)
    A datetime.timedelta has .days and .total_seconds() that are relevant here
    duration.days gives the days easily
    duration.total_seconds() gives you the total amount of seconds, so we need to subtract the days
    first so we can calculate the hours and minutes correctly
    :param duration:
    :return: tuple
    """
    days = duration.days
    rest_seconds = duration.total_seconds() - (days * 24 * 3600)
    hours = int(rest_seconds // 3600)
    minutes = int((rest_seconds % 3600) // 60)
    return days, hours, minutes


def get_duration_str(duration):
    """
    This first gets the duration parts and then sets up the strings according to the numbers
    :param duration:
    :return: str
    """
    days, hours, minutes = get_duration_parts(duration)

    hour_unit = "hours"
    day_unit = "days"
    if days == 1:
        day_unit = "day"

    if days > 0:
        return "{days} {day_unit}, {hours}:{minutes:02} {hour_unit}".format(
            days=days,
            hours=hours,
            minutes=minutes,
            day_unit=day_unit,
            hour_unit=hour_unit,
        )
    return "{hours}:{minutes:02} {hour_unit}".format(
        hours=hours,
        minutes=minutes,
        hour_unit=hour_unit,
    )


class Meeting(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, LockMixin, SoftDeleteMixin, RelationsMixIn,
              ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """
    Appointment, previously known as Meeting or ResourceBooking.
    Represents an event with start date, end date and attendees.
    Represents a resource booking, if a resource is referenced.
    """
    objects = MeetingManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("Meeting")
        verbose_name_plural = _("Meetings")
        ordering = ["title", "date_time_start", "date_time_end", "text"]
        permissions = (
            ("trash_meeting", "Can trash a meeting"),
            ("restore_meeting", "Can restore a meeting"),
            ("change_project_meeting", "Can change the project of a meeting"),
            ("add_meeting_without_project", "Can add a meeting without a project")
        )
        track_fields = (
            'title', 'date_time_start', 'date_time_end', 'text', 'location', 'projects', 'resource',
            'attending_users', 'attending_contacts', 'deleted'
        )
        track_related_many = (
            ('metadata', ('field', 'values',)),
        )
        fts_template = 'fts/meeting.html'
        export_template = 'export/meeting.html'

        def get_default_serializer(*args, **kwargs):
            from eric.shared_elements.rest.serializers import MeetingSerializer
            return MeetingSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=128,
        verbose_name=_("Title of the meeting")
    )

    date_time_start = models.DateTimeField(
        verbose_name=_("Meeting start date time"),
        db_index=True
    )

    date_time_end = models.DateTimeField(
        verbose_name=_("Meeting end date time"),
        db_index=True
    )

    text = HTMLField(
        verbose_name=_("Description of the meeting"),
        blank=True,
        strip_unsafe=True,
    )

    location = models.CharField(
        max_length=128,
        verbose_name=_("Where the meeting takes place"),
        null=True,
        blank=True,
    )

    resource = models.ForeignKey(
        'projects.Resource',
        verbose_name=_("Which resource is booked for this meeting"),
        related_name="meetings",
        blank=True,
        null=True,
        on_delete=models.CASCADE
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this meeting associated to"),
        related_name="meetings",
        blank=True
    )

    attending_users = models.ManyToManyField(
        "projects.MyUser",
        through="UserAttendsMeeting"
    )

    attending_contacts = models.ManyToManyField(
        "contact",
        through="ContactAttendsMeeting"
    )

    extracted_images = GenericRelation(ExtractedImage)

    metadata = MetadataRelation()

    @property
    def exclusive_date_time_end(self):
        """
        Gets the exclusive end, like used in iCal / CalDav.
        """
        if self.date_time_end:
            return self.date_time_end + timedelta(minutes=1)
        else:
            return None

    @property
    def is_full_day(self):
        start = localtime(self.date_time_start)
        end = localtime(self.date_time_end)
        start_is_zero = start.hour == 0 and start.minute == 0
        end_is_zero = end.hour == 0 and end.minute == 0
        is_inclusive_full_day = start_is_zero and end.hour == 23 and end.minute == 59
        is_exclusive_full_day = start_is_zero and end >= start + timedelta(days=1) and end_is_zero
        return is_inclusive_full_day or is_exclusive_full_day

    @property
    def ical_datetime_start(self):
        start = localtime(self.date_time_start)
        if self.is_full_day:
            start = start.date()
        return start

    @property
    def ical_datetime_end(self):
        end = localtime(self.exclusive_date_time_end)
        if self.is_full_day:
            end = end.date()
        return end

    def export_as_ical(self, calendar=None, event=None):
        """
        Export the current meeting as an ical object
        :param calendar: vobject.iCalendar - optional
        :param event: optional - an existing event
        :return:
        """
        if not calendar:
            calendar = vobject.iCalendar()

        if not event:
            event = calendar.add('vevent')

        # create all the entries for ical
        attr_list = [
            'created',
            'last_modified',
            'dtstamp',
            'dtstart',
            'dtend',
            'summary',
            'uid',
            'description',
            'x-alt-desc',  # description in alternate format (HTML or RTF)
            'location',
            'organizer'
        ]

        event_dict = {}

        for attr in attr_list:
            if hasattr(event, attr):
                event_dict[attr] = getattr(event, attr)
            else:
                event_dict[attr] = event.add(attr.replace('_', '-'))

        # meta information: created, last modified, dtstamp (ical creation)
        event_dict['created'].value = localtime(self.created_at)  # created_at modification timestamp
        event_dict['last_modified'].value = localtime(self.last_modified_at)  # last modification timestamp

        # when the ical information is being created (so basically now)
        event_dict['dtstamp'].value = timezone.now()  # self.last_modified_at
        # dtstamp is important for external programs to know that something has changed
        # Hence we are using the last modified date

        # workbench specifies events as (start-inclusive, end-inclusive)
        # caldav specifies events as (start-inclusive, end-exclusive)
        event_dict['dtstart'].value = localtime(self.date_time_start)
        event_dict['dtend'].value = localtime(self.date_time_end)

        from eric.caldav.utils import get_or_create_caldav_item_for_meeting
        caldav_item = get_or_create_caldav_item_for_meeting(self)
        event_dict['uid'].value = str(caldav_item.pk)

        event_dict['summary'].value = self.title

        # must avoid setting None here, otherwise restoring a version without location won't work
        # because the None value can't be serialized
        event_dict['location'].value = self.location or ''

        event_dict['x-alt-desc'].value = self.text
        event_dict['x-alt-desc'].params = {
            "FMTTYPE": ['text/html', ]
        }
        event_dict['description'].value = convert_html_to_text(self.text)  # description (without html)

        # creator of the meeting
        event_dict['organizer'].value = "MAILTO:%(organizer_mail)s" % {'organizer_mail': self.created_by.email}
        event_dict['organizer'].CN_param = MyUser.__str__(self.created_by)  # use MyUser's str() method
        event_dict['organizer'].CUTYPE_param = ["INDIVIDUAL"]
        event_dict['organizer'].PK_param = str(self.created_by.pk)
        event_dict['organizer'].TYPE_param = "user"

        attending_user_pk_list = []

        # add all attending users
        for user in self.attending_users.all():
            mailto_value = "MAILTO:%(attendee_mail)s" % {'attendee_mail': user.email}
            found_existing_attendee = False

            # find out whether this user is already an attendee
            if 'attendee' in event.contents:
                for existing_attendee in event.contents['attendee']:
                    if existing_attendee.value == mailto_value:
                        # found
                        found_existing_attendee = True
                        attendee_value = existing_attendee
                        break

            # if the user is not an existing attendee
            if not found_existing_attendee:
                # create a new attendee
                attendee_value = event.add('attendee')

            # set the mailto value
            attendee_value.value = mailto_value

            # set the canoncial name of the user
            attendee_value.CN_param = _("User '%(attendee_name)s'") % {
                'attendee_name': str(user)
            }

            # set the CUTYPE to INDIVIDUAL
            attendee_value.CUTYPE_param = ["INDIVIDUAL"]

            # also store user pk and a type, so that we can identify the users later
            attendee_value.DIR_param = "database://user/{}".format(user.pk)

            # add this user pk to the attending_user_pk_list
            attending_user_pk_list.append(str(user.pk))

        attending_contact_pk_list = []

        # add all attending contacts
        for contact in self.attending_contacts.all():
            mailto_value = "MAILTO: %(attendee_mail)s" % {'attendee_mail': contact.email}

            found_existing_attendee = False

            # find out whether this contact is already an attendee
            if 'attendee' in event.contents:
                for existing_attendee in event.contents['attendee']:
                    if existing_attendee.value == mailto_value:
                        # found
                        found_existing_attendee = True
                        attendee_value = existing_attendee
                        break

            # if the contact is not an existing attendee
            if not found_existing_attendee:
                # create a new attendee
                attendee_value = event.add('attendee')

            # set the mailto value
            attendee_value.value = mailto_value

            # set the canoncial name of the contact
            attendee_value.CN_param = _("Contact '%(attendee_name)s'") % {
                'attendee_name': str(contact)
            }

            # set the CUTYPE to INDIVIDUAL
            attendee_value.CUTYPE_param = ["INDIVIDUAL"]

            # also store user pk and a type, so that we can identify the users later
            attendee_value.DIR_param = "database://user/{}".format(contact.pk)

            # add this user pk to the attending_contact_pk_list
            attending_contact_pk_list.append(str(contact.pk))

        # iterate over all attendees and make sure that if they are of type "user" or "contact", that they are in
        # either attending_user_pk_list or resp. attending_contact_pk_list
        if 'attendee' in event.contents:
            for attendee in event.contents['attendee']:
                # check that attendee has the "type" and "pk" attributes
                if 'PK' in attendee.params and 'TYPE' in attendee.params:
                    # this is a workbench entity
                    pk = attendee.params['PK'][0]

                    # check for user or contact
                    if attendee.params['TYPE'][0] == "user":
                        if pk not in attending_user_pk_list:
                            print("Need to remove this user attendee!", attendee)
                            event.contents['attendee'].remove(attendee)
                    elif attendee.params['TYPE'][0] == "contact":
                        if pk not in attending_contact_pk_list:
                            print("Need to remove this contact attendee!", attendee)
                            event.contents['attendee'].remove(attendee)
                    else:
                        print("Unknown type", attendee.params['TYPE'])
                else:
                    print("not a workbench entity", attendee)

        return event

    @property
    def local_date_time_start(self):
        return localtime(self.date_time_start)

    @property
    def local_date_time_end(self):
        return localtime(self.date_time_end)

    def __str__(self):
        return self.title

    def validate_date_time_start_end(self):
        """
        Validates that the meetings `date_time_start` is before or equal `date_time_end`
        :return:
        """
        if self.date_time_end < self.date_time_start:
            raise ValidationError({
                'date_time_start': ValidationError(
                    _('Start date must be before end date'),
                    code='invalid'
                ),
                'date_time_end': ValidationError(
                    _('End date must be after start date'),
                    code='invalid'
                ),
            })

    def validate_resource_booking_is_not_in_the_past(self):
        """
        Validates that the ResourceBooking date_time_start is not in the past
        :return:
        """
        if self.resource:
            start_date = localtime(self.date_time_start)
            now = localtime(timezone.now())

            if start_date < now:
                raise ValidationError({
                    'resource': ValidationError(
                        _('Start date must not be in the past when booking a resource'),
                        code='invalid'
                    ),
                })

    def validate_resource_booking_doesnt_exist_already(self):
        """
        Validates that the ResourceBooking doesn't already exist for the resource at this time
        exclude if pk is the same to allow patching (editing)
        filter only if the resource is the same
        then look if times overlap
        if entries exist raise ValidationError on the times
        :return:
        """
        resource_booking_objects = Meeting.objects \
            .exclude(pk=self.pk) \
            .filter(resource=self.resource) \
            .filter(date_time_start__lt=self.date_time_end) \
            .filter(date_time_end__gt=self.date_time_start)

        if resource_booking_objects.exists():
            raise ValidationError({
                'resource': ValidationError(
                    _('This resource is already booked at this time'),
                    code='invalid'
                )
            })

    def validate_resource_booking_rule_minimum_duration(self):
        """
        Validates the booking rule for minimum duration if it exists
        raise ValidationError on the times
        :return:
        """
        try:
            minimum_duration = self.resource.booking_rule_minimum_duration.duration
        except AttributeError:
            return

        booking_duration = self.date_time_end - self.date_time_start

        if minimum_duration and booking_duration < minimum_duration:
            duration_str = get_duration_str(minimum_duration)
            raise ValidationError({
                'resource': ValidationError(
                    _('This resource has a minimum booking duration of {duration_str}').format(
                        duration_str=duration_str
                    ),
                    code='invalid'
                )
            })

    def validate_resource_booking_rule_maximum_duration(self):
        """
        Validates the booking rule for maximum duration if it exists
        raise ValidationError on the times
        :return:
        """
        try:
            maximum_duration = self.resource.booking_rule_maximum_duration.duration
        except AttributeError:
            return

        booking_duration = self.date_time_end - self.date_time_start

        if maximum_duration and booking_duration > maximum_duration:
            duration_str = get_duration_str(maximum_duration)
            raise ValidationError({
                'resource': ValidationError(
                    _('This resource has a maximum booking duration of {duration_str}').format(
                        duration_str=duration_str
                    ),
                    code='invalid'
                )
            })

    @staticmethod
    def check_bookable_weekdays_and_times(bookable_days, bookable_times, date_time_start, date_time_end):
        """
        Check if the weekdays and times are bookable
        raise ValidationError on the times
        :return:
        """
        start_time = localtime(date_time_start).time()
        end_time = localtime(date_time_end).time()

        if localtime(date_time_start).isoweekday() not in bookable_days:
            raise ValidationError({
                'resource': ValidationError(
                    _('This resource cannot be booked on this day'),
                    code='invalid'
                ),
            })

        if start_time < bookable_times.time_start or start_time > bookable_times.time_end:
            raise ValidationError({
                'resource': ValidationError(
                    _('The start time is outside the bookable times'),
                    code='invalid'
                ),
            })

        if localtime(date_time_end).isoweekday() not in bookable_days:
            raise ValidationError({
                'resource': ValidationError(
                    _('This resource cannot be booked on this day'),
                    code='invalid'
                ),
            })

        if end_time < bookable_times.time_start or end_time > bookable_times.time_end:
            raise ValidationError({
                'resource': ValidationError(
                    _('The end time is outside the bookable times'),
                    code='invalid'
                ),
            })

    @staticmethod
    def check_if_bookable_for_period(bookable_days, date_time_start, date_time_end):
        """
        Find days and times that are in between start date and end date that are not bookable
        raise ValidationError on the times
        :return:
        """
        in_between_days = []
        start_date = localdate(date_time_start)
        end_date = localdate(date_time_end)
        start_time = localtime(date_time_start).time()
        end_time = localtime(date_time_end).time()

        # only check if the start date is different to the end date
        if start_date == end_date:
            return

        # using the delta between end and start date we set up a list of days that are in between
        delta = end_date - start_date
        for i in range(delta.days + 1):
            day = start_date + timedelta(days=i)
            in_between_days.append(day.isoweekday())

        # now we iterate over the in_between_days and raise an error if elements are not in bookable_days
        for in_between_day in in_between_days:
            if in_between_day not in bookable_days:
                raise ValidationError({
                    'resource': ValidationError(
                        _('There are days between the start date and the end date that are not bookable '
                          'for this resource'),
                        code='invalid'
                    )
                })

        # here we find times that are in between start date and end date that are not bookable
        # logically if start and end times exist and the days are different (the if 1 level higher) there must
        # be times that are not bookable
        if start_time and end_time:
            raise ValidationError({
                'resource': ValidationError(
                    _('There are times between the start date and the end date that are not bookable '
                      'for this resource'),
                    code='invalid'
                )
            })

    def validate_resource_booking_rule_bookable_hours(self):
        """
        Validates the booking rule for bookable hours if it exists
        raise ValidationError on the times
        :return:
        """
        try:
            bookable_times = self.resource.booking_rule_bookable_hours
        except AttributeError:
            bookable_times = None

        if not bookable_times:
            return

        # build days list with datetime.isoweekday() (Monday is 1 and Sunday is 7) where the value is True
        weekdays = {
            'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 7
        }
        bookable_days = []
        for day, day_value in weekdays.items():
            if getattr(bookable_times, day):
                bookable_days.append(day_value)

        # check if the weekdays and times are bookable
        self.check_bookable_weekdays_and_times(bookable_days, bookable_times, self.date_time_start, self.date_time_end)

        # find days and times that are in between start date and end date that are not bookable
        self.check_if_bookable_for_period(bookable_days, self.date_time_start, self.date_time_end)

    def validate_resource_booking_rule_minimum_time_before(self):
        """
        Validates the booking rule for time before if it exists
        raise ValidationError on the times
        :return:
        """
        try:
            time_before = self.resource.booking_rule_minimum_time_before.duration
        except AttributeError:
            return

        start_date = localtime(self.date_time_start)
        now = localtime(timezone.now())
        lead_time = start_date - now

        if time_before and lead_time < time_before:
            duration_str = get_duration_str(time_before)
            raise ValidationError({
                'resource': ValidationError(
                    _('This resource must be booked at least {duration_str} in advance').format(
                        duration_str=duration_str
                    ),
                    code='invalid'
                ),
            })

    def validate_resource_booking_rule_maximum_time_before(self):
        """
        Validates the booking rule for time before if it exists
        raise ValidationError on the times
        :return:
        """
        try:
            time_before = self.resource.booking_rule_maximum_time_before.duration
        except AttributeError:
            return

        start_date = localtime(self.date_time_start)
        now = localtime(timezone.now())
        lead_time = start_date - now

        if time_before and lead_time > time_before:
            duration_str = get_duration_str(time_before)
            raise ValidationError({
                'resource': ValidationError(
                    _('This resource cannot be booked more than {duration_str} in advance').format(
                        duration_str=duration_str
                    ),
                    code='invalid'
                ),
            })

    def validate_resource_booking_rule_time_between(self):
        """
        Validates the booking rule for time between if it exists
        raise ValidationError on the times
        :return:
        """
        try:
            time_between = self.resource.booking_rule_time_between.duration
        except AttributeError:
            time_between = None

        if not time_between:
            return

        q_not_enough_time_between = Q(
            # Looks for bookings before the new booking that don't have enough time between
            date_time_end__lte=self.date_time_start,
            date_time_end__gt=self.date_time_start - time_between
        ) | Q(
            # Looks for bookings after the new booking that don't have enough time between
            date_time_start__gte=self.date_time_end,
            date_time_start__lt=self.date_time_end + time_between
        )

        resource_booking_objects = Meeting.objects \
            .exclude(pk=self.pk) \
            .filter(resource=self.resource) \
            .filter(q_not_enough_time_between)

        if resource_booking_objects.exists():
            duration_str = get_duration_str(time_between)
            raise ValidationError({
                'resource': ValidationError(
                    _('This resource needs at least {duration_str} between bookings').format(
                        duration_str=duration_str
                    ),
                    code='invalid'
                )
            })

    @staticmethod
    def get_resource_booking_count_per_user(pk, resource, user, date_time_start, unit):
        resource_booking_objects = 0

        date_time_start = localtime(date_time_start)

        if unit == 'DAY':
            # calculate the start datetime of the day in relation to date_time_start
            start_of_the_day = datetime(date_time_start.year, date_time_start.month, date_time_start.day)
            # calculate the end datetime of the day in relation to date_time_start
            end_of_the_day = start_of_the_day + timedelta(days=1) - timedelta(seconds=1)
            # now get the objects that are relevant to the day of date_time_start
            resource_booking_objects = Meeting.objects \
                .exclude(pk=pk) \
                .filter(resource=resource) \
                .filter(created_by=user) \
                .filter(date_time_start__gte=start_of_the_day) \
                .filter(date_time_start__lte=end_of_the_day)

        elif unit == 'WEEK':
            # calculate the start datetime of the week in relation to date_time_start
            start_of_the_week = date_time_start - timedelta(days=date_time_start.weekday())
            start_of_the_week = datetime(start_of_the_week.year, start_of_the_week.month, start_of_the_week.day)
            # calculate the end datetime of the week in relation to date_time_start
            end_of_the_week = start_of_the_week + timedelta(days=7) - timedelta(seconds=1)
            # now get the objects that are relevant to the week of date_time_start
            resource_booking_objects = Meeting.objects \
                .exclude(pk=pk) \
                .filter(resource=resource) \
                .filter(created_by=user) \
                .filter(date_time_start__gte=start_of_the_week) \
                .filter(date_time_start__lte=end_of_the_week)

        elif unit == 'MONTH':
            # calculate the start datetime of the month in relation to date_time_start
            start_of_the_month = datetime(date_time_start.year, date_time_start.month, 1)
            # calculate the end datetime of the month in relation to date_time_start
            days_in_the_month = calendar.monthrange(date_time_start.year, date_time_start.month)[1]
            end_of_the_month = start_of_the_month + timedelta(days=days_in_the_month) - timedelta(seconds=1)
            # now get the objects that are relevant to the month of date_time_start
            resource_booking_objects = Meeting.objects \
                .exclude(pk=pk) \
                .filter(resource=resource) \
                .filter(created_by=user) \
                .filter(date_time_start__gte=start_of_the_month) \
                .filter(date_time_start__lte=end_of_the_month)

        return resource_booking_objects.count()

    def validate_resource_booking_rule_bookings_per_user(self):
        """
        Validates the booking rule for bookings per user if it exists
        raise ValidationError on the start time
        :return:
        """
        try:
            bookings_per_user_list = self.resource.booking_rule_bookings_per_user
        except AttributeError:
            bookings_per_user_list = None

        if not bookings_per_user_list:
            return

        user = get_current_user()
        bookings_per_user_list = bookings_per_user_list.all()

        # check if there is a bookings_per_user_list, then iterate through the list to get
        # the count and unit objects to compare with what already exists for this user
        for bookings_per_user in bookings_per_user_list:
            unit = bookings_per_user.unit.upper()

            db_count = self.get_resource_booking_count_per_user(
                self.pk, self.resource, user, self.date_time_start, unit
            )
            if db_count >= bookings_per_user.count:
                error = _('You have reached the maximum amount of bookings for this resource for this {}'
                          .format(unit.lower()))

                raise ValidationError({
                    'resource': ValidationError(
                        error,
                        code='invalid'
                    ),
                })

    def clean(self):
        """ validate the meetings date_time  """
        self.validate_date_time_start_end()
        # if there is a resource in the data, lets validate if bookings are possible
        if self.resource:
            # self.validate_resource_booking_is_not_in_the_past()
            self.validate_resource_booking_doesnt_exist_already()
            self.validate_resource_booking_rule_minimum_duration()
            self.validate_resource_booking_rule_maximum_duration()
            self.validate_resource_booking_rule_bookable_hours()
            self.validate_resource_booking_rule_minimum_time_before()
            self.validate_resource_booking_rule_maximum_time_before()
            self.validate_resource_booking_rule_time_between()
            self.validate_resource_booking_rule_bookings_per_user()

    def export_metadata(self):
        """ Exports in the latest format """
        return self.__export_metadata_v2()

    def __export_metadata_v1(self):
        return {
            METADATA_VERSION_KEY: 1,
            "title": self.title,
            "start_date_time": datetime_to_iso_string(self.date_time_start),
            "end_date_time": datetime_to_iso_string(self.date_time_end),
            "text": self.text,
            "resource": self.resource_id,
            "projects": [p.pk for p in self.projects.all()],
            "attending_users": [u.pk for u in self.attending_users.all()],
            "attending_contacts": [c.pk for c in self.attending_contacts.all()],
            "metadata": Metadata.export_all_from_entity(self),
        }

    def __export_metadata_v2(self):
        metadata = self.__export_metadata_v1()
        metadata.update({
            METADATA_VERSION_KEY: 2,
            "location": self.location,
        })
        return metadata

    def restore_metadata(self, metadata):
        version = metadata.get(METADATA_VERSION_KEY)
        if version == 1:
            self.__restore_metadata_v1(metadata)
        elif version == 2:
            self.__restore_metadata_v2(metadata)
        else:
            raise UNHANDLED_VERSION_ERROR

    def __restore_metadata_v1(self, metadata):
        self.title = metadata.get("title")
        self.date_time_start = datetime_from_iso_string(metadata.get("start_date_time"))
        self.date_time_end = datetime_from_iso_string(metadata.get("end_date_time"))
        self.location = metadata.get("location", None)  # new field, can be undefined on old data
        self.text = metadata.get("text")

        self.projects.clear()
        project_pks = metadata.get("projects")
        if project_pks is not None and len(project_pks) > 0:
            projects = Project.objects.filter(pk__in=project_pks).viewable()
            self.projects.add(*projects)

        resource_pk = metadata.get("resource")
        resource = Resource.objects.filter(pk=resource_pk).first()
        if resource is not None:
            self.resource = resource

        with disable_permission_checks(UserAttendsMeeting):
            self.attending_users.clear()
            pks = metadata.get("attending_users")
            if pks is not None and len(pks) > 0:
                users = MyUser.objects.filter(pk__in=pks)
                for user in users:
                    UserAttendsMeeting.objects.create(user=user, meeting=self)

        with disable_permission_checks(ContactAttendsMeeting):
            self.attending_contacts.clear()
            pks = metadata.get("attending_contacts")
            if pks is not None and len(pks) > 0:
                for contact in Contact.objects.filter(pk__in=pks):
                    ContactAttendsMeeting.objects.create(contact=contact, meeting=self)

        Metadata.restore_all_from_entity(self, metadata.get("metadata"))

    def __restore_metadata_v2(self, metadata):
        self.__restore_metadata_v1(metadata)
        self.location = metadata.get("location")


class UserAttendsMeeting(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    objects = UserAttendsMeetingManager()

    class Meta:
        verbose_name = _("User Meeting Attendance")
        verbose_name_plural = _("User Meeting Attendances")
        ordering = ["user", "meeting"]
        unique_together = (
            ('user', 'meeting',),
        )
        # track_related = ('meeting', )
        # track_fields = ('user', )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        "projects.MyUser",
        verbose_name=_("Attending User"),
        related_name="attending_meetings",
        on_delete=models.CASCADE
    )

    meeting = models.ForeignKey(
        'Meeting',
        verbose_name=_("Attending Meeting"),
        on_delete=models.CASCADE
    )

    def __str__(self):
        return _("User %(username)s attends meeting %(meeting_title)s") % {
            'username': self.user.username, 'meeting_title': self.meeting.title
        }


class ContactAttendsMeeting(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    objects = ContactAttendsMeetingManager()

    class Meta:
        verbose_name = _("Contact Meeting Attendance")
        verbose_name_plural = _("Contact Meeting Attendances")
        ordering = ["contact", "meeting"]
        unique_together = (
            ('contact', 'meeting',),
        )
        # track_fields = ('contact', 'meeting')

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    contact = models.ForeignKey(
        "Contact",
        verbose_name="Attending Contact",
        related_name="attending_meetings",
        on_delete=models.CASCADE
    )

    meeting = models.ForeignKey(
        "Meeting",
        verbose_name="Attending Meeting",
        on_delete=models.CASCADE
    )

    def __str__(self):
        return _("Contact %(first_name)s %(last_name)s attends meeting %(meeting_title)s") % {
            'first_name': self.contact.first_name, 'last_name': self.contact.last_name,
            'meeting_title': self.meeting.title
        }


class ElementLabel(BaseModel, RevisionModelMixin, ChangeSetMixIn):
    """
    Label of a Task Element
    """

    objects = ElementLabelManager()

    class Meta:
        verbose_name = _("Element Label")
        verbose_name_plural = _("Element Labels")
        track_fields = ('name', 'color',)
        ordering = ('name',)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=128,
        verbose_name=_("Title of the meeting"),
        blank=True,
        default=""
    )

    color = models.CharField(
        max_length=30,
        verbose_name=_("RGBA color the label"),
        default="rgba(255,255,255,1)",  # white
        validators=[rgba_color_validator]
    )

    @property
    def font_color(self):
        r, g, b, x = self.color.replace('rgba(', '').split(',')
        brightness = math.sqrt(
            0.299 * math.pow(int(r), 2) +
            0.587 * math.pow(int(g), 2) +
            0.114 * math.pow(int(b), 2)
        )

        if brightness < 128:
            return '#FFF'

        return '#000'

    def __str__(self):
        return self.name


# TODO: Refactor to not use WorkbenchEntityMixin
class CalendarAccess(BaseModel, CreatedModifiedByMixIn, ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """
    We are using the created_by field coming from the CreatedModifiedByMixIn to identify the owner of the Calendar.
    This could be rewritten to use a OneToOne field to the User model in the future.
    """

    objects = CalendarAccessManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("Calendar Access Privilege")
        verbose_name_plural = _("Calendar Access Privileges")
        ordering = ('created_by',)
        is_relatable = False
        is_favouritable = False

        def get_default_serializer(*args, **kwargs):
            from eric.shared_elements.rest.serializers import CalendarAccessSerializer
            return CalendarAccessSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    def __str__(self):
        return _("Access for the Calendar of User {created_by}").format(created_by=self.created_by.username)
