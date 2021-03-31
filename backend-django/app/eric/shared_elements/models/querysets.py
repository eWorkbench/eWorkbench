#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.db.models import Q, QuerySet
from django.utils import timezone
from django_changeset.models.queryset import ChangeSetQuerySetMixin
from django_userforeignkey.request import get_current_user

from eric.core.models.abstract import get_all_workbench_models, WorkbenchEntityMixin
from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet, extend_queryset

logger = logging.getLogger(__name__)


class ContactQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Contacts
    """

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        """
        return super(ContactQuerySet, self).prefetch_common().prefetch_metadata()


class NoteQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    Queryset for Notes
    """

    def directly_viewable(self):
        return super().viewable().distinct()

    def viewable(self, *args, **kwargs):
        """
        Notes are viewable if they have a related viewable element or are defined viewable for themselves
        (via privileges or permissions)
        """
        from eric.relations.models import Relation
        from eric.shared_elements.models import Note

        # exclude notes from models to check to avoid endless recursion
        workbench_models_except_notes = [
            model for model in get_all_workbench_models(WorkbenchEntityMixin)
            if model is not Note
        ]

        # query for viewable elements that are in a relation and put them in a union-queryset ("conditions")
        related_element_viewable = Q()
        for model in workbench_models_except_notes:
            viewable_element_pks = model.objects.viewable().values_list('pk', flat=True)
            related_element_viewable |= Q(
                Q(left_object_id__in=viewable_element_pks) | Q(right_object_id__in=viewable_element_pks)
            )

        # add directly viewable notes (to avoid endless recursion)
        viewable_element_pks = Note.objects.directly_viewable().values_list('pk', flat=True)
        related_element_viewable |= Q(
            Q(left_object_id__in=viewable_element_pks) | Q(right_object_id__in=viewable_element_pks)
        )

        # Either return the inherited viewable or create a filter that returns all of the Notes
        # whose pk is in the "related_element_viewable"-queryset and which are not flagged private

        # adding distinct to all Qs is a necessity, as the super-viewable returns distinct
        # or not distinct-Qs, which causes Django to throw an assertion-error
        # ("AssertionError at /api/notes/ Cannot combine a unique query with a non-unique query.")

        viewable_relations = Relation.objects.filter(related_element_viewable, private=False)
        viewable_relations_left = viewable_relations.values_list('left_object_id', flat=True)
        viewable_relations_right = viewable_relations.values_list('right_object_id', flat=True)
        viewable_notes_via_relations = self.filter(
            Q(pk__in=viewable_relations_left) | Q(pk__in=viewable_relations_right)
        ).distinct()

        return (self.directly_viewable() | viewable_notes_via_relations).distinct()

    def related_viewable(self, *args, **kwargs):
        """
        Notes are always viewable if they are related
        :param args:
        :param kwargs:
        :return:
        """
        return self.all()

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        """
        return super(NoteQuerySet, self).prefetch_common() \
            .prefetch_metadata()


class FileQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Files
    """

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        """
        return super(FileQuerySet, self).prefetch_common() \
            .prefetch_related('file_entries',
                              'file_entries__created_by', 'file_entries__created_by__userprofile',
                              'file_entries__last_modified_by', 'file_entries__last_modified_by__userprofile',
                              'uploaded_file_entry', ) \
            .prefetch_metadata()


class TaskQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Tasks
    """

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        """
        return super(TaskQuerySet, self).prefetch_common() \
            .with_assignee() \
            .with_checklist() \
            .with_labels() \
            .prefetch_metadata()

    def not_done(self, *args, **kwargs):
        """
        Returns all tasks that are not done
        """
        from eric.shared_elements.models import Task

        return self.exclude(
            state=Task.TASK_STATE_DONE
        )

    def assigned(self, *args, **kwargs):
        """
        Returns all tasks that are assigned to the current user.
        """
        user = get_current_user()
        if user.is_anonymous:
            self.none()

        return self.filter(
            assigned_users=user,
        )

    def has_started(self, *args, **kwargs):
        """
        Returns all tasks that have a start_date > now
        """
        now = timezone.now()

        return self.filter(
            start_date__lte=now
        )

    def with_assignee(self, *args, **kwargs):
        """
        selects the related assigned user and assigned user profile
        """
        return self.prefetch_related('assigned_users', 'assigned_users__userprofile')

    def with_checklist(self, *args, **kwargs):
        """
        selects the related checklsit items
        """
        return self.prefetch_related('checklist_items')

    def with_labels(self):
        """
        prefetches the related labels
        """
        return self.prefetch_related('labels')


class BaseTaskPermissionQuerySet(BaseProjectEntityPermissionQuerySet):
    """
    This QuerySet is for Models that are related to Tasks, e.g. Assigned Users aswell as Checklist Items
    It forms the Base and basically works like this:
    An item that is related is viewable, if the task is viewable
    An item that is related is editable, if the task is editable
    An item that is related is deletable, if the task is editable (! editable is used on purpose)
    """

    def viewable(self, *args, **kwargs):
        """
        Returns all elements where the related task is viewable
        """
        from eric.shared_elements.models import Task

        return self.filter(task__pk__in=Task.objects.viewable().values_list('pk'))

    def editable(self, *args, **kwargs):
        """
        Returns all elements where the related task is editable
        """
        from eric.shared_elements.models import Task

        return self.filter(task__pk__in=Task.objects.editable().values_list('pk'))

    def deletable(self, *args, **kwargs):
        """
        Returns all elements where the related task is editable (! editable is used on purpose)
        """
        from eric.shared_elements.models import Task

        return self.filter(task__pk__in=Task.objects.editable().values_list('pk'))


class TaskAssignedUserQuerySet(BaseTaskPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Task Assigned Users
    """
    pass


class TaskCheckListQuerySet(BaseTaskPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Task CheckLists
    """
    pass


class MeetingQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    def prefetch_common(self, *args, **kwargs):
        return super(MeetingQuerySet, self).prefetch_common(*args, **kwargs) \
            .with_attending_contacts() \
            .with_attending_users() \
            .prefetch_related('resource') \
            .select_related('resource__study_room_info') \
            .prefetch_metadata()

    def attending(self, *args, **kwargs):
        """
        Returns all meetings that the current user is attending.
        """
        user = get_current_user()
        if user.is_anonymous:
            self.none()

        return self.filter(
            attending_users=user,
        )

    def with_attending_users(self, *args, **kwargs):
        """
        selects the related attending user and attending user profile
        """
        return self.prefetch_related('attending_users', 'attending_users__userprofile')

    def with_attending_contacts(self, *args, **kwargs):
        """
        selects the related attending contacts
        """
        return self.prefetch_related('attending_contacts')

    def resource_bookings(self):
        return self.filter(resource__isnull=False).select_related('resource')

    def study_room_bookings(self):
        return self.resource_bookings().filter(resource__study_room_info__isnull=False)

    def my_bookings(self):
        """ Own bookings for an accessible resource """
        from eric.projects.models.models import Resource

        return self.viewable().filter(
            resource__in=Resource.objects.viewable(),
            created_by=get_current_user(),
        )

    def intersecting_interval(self, dt_start, dt_end):
        return self.filter(date_time_start__lte=dt_end, date_time_end__gte=dt_start)

    def fully_viewable(self):
        """ Bookings where all information can be provided. """
        from eric.projects.models.models import Resource

        is_resource_editor = Q(resource__in=Resource.objects.editable())
        booking_where_user_is_resource_editor = self.filter(is_resource_editor)

        return self.viewable().union(booking_where_user_is_resource_editor)


class BaseMeetingPermissionQuerySet(BaseProjectEntityPermissionQuerySet):
    """
    Base QuerySet for Elements that are directly related to a meeting (e.g., attending users, attending contacts)
    """

    def viewable(self, *args, **kwargs):
        """
        Returns all element where the related meeting is viewable
        """
        from eric.shared_elements.models import Meeting

        return self.filter(meeting__pk__in=Meeting.objects.viewable().values_list('pk'))

    def editable(self, *args, **kwargs):
        """
        Returns all element where the related meeting is editable
        """
        from eric.shared_elements.models import Meeting

        return self.filter(meeting__pk__in=Meeting.objects.editable().values_list('pk'))

    def deletable(self, *args, **kwargs):
        """
        Returns all element where the related meeting is editable (! editable is used on purpose here)
        """
        from eric.shared_elements.models import Meeting

        return self.filter(meeting__pk__in=Meeting.objects.editable().values_list('pk'))


class UserAttendsMeetingQuerySet(BaseMeetingPermissionQuerySet, ChangeSetQuerySetMixin):
    pass


class ContactAttendsMeetingQuerySet(BaseMeetingPermissionQuerySet, ChangeSetQuerySetMixin):
    pass


@extend_queryset(ContactQuerySet)
class ExtendedMeetingContactQuerySet:
    """
    Extending Contact QuerySet for Meetings
    If a Contact is in a Meeting that the user is allowed to view, that contact can also be viewed
    """

    @staticmethod
    def _viewable():
        from eric.shared_elements.models import Meeting
        # get all contacts of meetings that are viewable
        contact_pks = Meeting.objects.viewable().values_list("attending_contacts__pk")

        return Q(
            pk__in=contact_pks
        )


@extend_queryset(TaskQuerySet)
class TaskAssignedUsersViewableEditableQuerySet:
    """
    Extending Task QuerySet for Assigned Users
    If a user is assigned to a task, the user is allowed to view and edit the task
    """

    @staticmethod
    def _viewable():
        from eric.shared_elements.models import Task
        user = get_current_user()

        # get all tasks that the current user is assigned to
        task_pks = Task.objects.filter(assigned_users=user).values_list('pk')

        return Q(
            pk__in=task_pks
        )

    @staticmethod
    def _editable():
        from eric.shared_elements.models import Task
        user = get_current_user()

        # get all tasks that the current user is assigned to
        task_pks = Task.objects.filter(assigned_users=user).values_list('pk')

        return Q(
            pk__in=task_pks
        )


@extend_queryset(MeetingQuerySet)
class MeetingAttendingUsersViewableEditableQuerySet:
    """
    Extending Meeting QuerySet for Attending Users
    If a user is attending to a meeting, the user is allowed to view, edit, trash and restore the meeting
    """

    @staticmethod
    def _viewable():
        user = get_current_user()
        return Q(
            attending_users=user
        )

    @staticmethod
    def _editable():
        user = get_current_user()
        return Q(
            attending_users=user
        )

    @staticmethod
    def _trashable():
        user = get_current_user()
        return Q(
            attending_users=user
        )

    @staticmethod
    def _restoreable():
        user = get_current_user()
        return Q(
            attending_users=user
        )


def get_meetings_where_the_booked_resource_is_editable():
    from eric.projects.models import Resource

    return Q(resource__in=Resource.objects.editable())


@extend_queryset(MeetingQuerySet)
class MeetingResourceAdministratorViewableEditableTrashableQuerySet:
    """
    Extending Meeting QuerySet for Resource Administrators
    If a user can edit a resource, the user is allowed to view, edit and trash and restore meetings where
    this resource is booked in
    """

    @staticmethod
    def _viewable():
        return get_meetings_where_the_booked_resource_is_editable()

    @staticmethod
    def _editable():
        return get_meetings_where_the_booked_resource_is_editable()

    @staticmethod
    def _trashable():
        return get_meetings_where_the_booked_resource_is_editable()

    @staticmethod
    def _restoreable():
        return get_meetings_where_the_booked_resource_is_editable()


class ElementLabelQuerySet(QuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Element Labels
    """

    def viewable(self):
        return self.all()

    def editable(self):
        current_user = get_current_user()

        return self.filter(created_by=current_user)

    def deletable(self):
        current_user = get_current_user()

        return self.filter(created_by=current_user)

    def prefetch_common(self):
        return self.prefetch_related('created_by', 'created_by__userprofile',
                                     'last_modified_by', 'last_modified_by__userprofile')


class CalendarAccessQuerySet(QuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Calendar Access Privileges
    """

    def for_user(self, user):
        return self.filter(created_by=user)

    def for_current_user(self):
        user = get_current_user()
        return self.for_user(user)

    def viewable(self):
        return self.for_current_user()

    def editable(self):
        return self.for_current_user()

    def deletable(self):
        return self.for_current_user()

    def prefetch_common(self):
        return self.prefetch_related('created_by', 'created_by__userprofile',
                                     'last_modified_by', 'last_modified_by__userprofile')


@extend_queryset(MeetingQuerySet)
class MeetingCalendarAccessQuerySet:
    """
    If a user gets a permissions for a Calendar, the user should have the same for Meetings
    """

    @staticmethod
    def _viewable():
        from eric.shared_elements.models import CalendarAccess
        from eric.model_privileges.models import ModelPrivilege
        user = get_current_user()

        calendar_access_privilege_content_type_id = CalendarAccess.get_content_type().id
        model_privilege_users = ModelPrivilege.objects.all().filter(
            Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                view_privilege=ModelPrivilege.ALLOW
            ) | Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                full_access_privilege=ModelPrivilege.ALLOW
            )
        ).values('created_by')

        return Q(
            created_by__in=model_privilege_users
        )

    @staticmethod
    def _editable():
        from eric.shared_elements.models import CalendarAccess
        from eric.model_privileges.models import ModelPrivilege
        user = get_current_user()

        calendar_access_privilege_content_type_id = CalendarAccess.get_content_type().id
        model_privilege_users = ModelPrivilege.objects.all().filter(
            Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                edit_privilege=ModelPrivilege.ALLOW
            ) | Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                full_access_privilege=ModelPrivilege.ALLOW
            )
        ).values('created_by')

        return Q(
            created_by__in=model_privilege_users
        )

    @staticmethod
    def _trashable():
        from eric.shared_elements.models import CalendarAccess
        from eric.model_privileges.models import ModelPrivilege
        user = get_current_user()

        calendar_access_privilege_content_type_id = CalendarAccess.get_content_type().id
        model_privilege_users = ModelPrivilege.objects.all().filter(
            Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                trash_privilege=ModelPrivilege.ALLOW
            ) | Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                full_access_privilege=ModelPrivilege.ALLOW
            )
        ).values('created_by')

        return Q(
            created_by__in=model_privilege_users
        )

    @staticmethod
    def _restoreable():
        from eric.shared_elements.models import CalendarAccess
        from eric.model_privileges.models import ModelPrivilege
        user = get_current_user()

        calendar_access_privilege_content_type_id = CalendarAccess.get_content_type().id
        model_privilege_users = ModelPrivilege.objects.all().filter(
            Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                restore_privilege=ModelPrivilege.ALLOW
            ) | Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                full_access_privilege=ModelPrivilege.ALLOW
            )
        ).values('created_by')

        return Q(
            created_by__in=model_privilege_users
        )

    @staticmethod
    def _deletable():
        from eric.shared_elements.models import CalendarAccess
        from eric.model_privileges.models import ModelPrivilege
        user = get_current_user()

        calendar_access_privilege_content_type_id = CalendarAccess.get_content_type().id
        model_privilege_users = ModelPrivilege.objects.all().filter(
            Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                delete_privilege=ModelPrivilege.ALLOW
            ) | Q(
                content_type=calendar_access_privilege_content_type_id,
                user=user,
                full_access_privilege=ModelPrivilege.ALLOW
            )
        ).values('created_by')

        return Q(
            created_by__in=model_privilege_users
        )
