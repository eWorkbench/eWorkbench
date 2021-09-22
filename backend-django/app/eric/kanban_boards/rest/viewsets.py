#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import os
import re

from django.conf import settings
from django.db import transaction
from django.db.models import F, Max, Q, Count, FloatField
from django.http import QueryDict, FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound

from eric.core.models import disable_permission_checks
from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn, BaseAuthenticatedReadOnlyModelViewSet
from eric.kanban_boards.models import KanbanBoard, KanbanBoardColumnTaskAssignment
from eric.kanban_boards.models.models import KanbanBoardUserFilterSetting, KanbanBoardColumn, KanbanBoardUserSetting
from eric.kanban_boards.rest.filters import KanbanBoardFilter
from eric.kanban_boards.rest.serializers import KanbanBoardSerializer, KanbanBoardColumnTaskAssignmentSerializer, \
    MinimalisticKanbanBoardColumnTaskAssignmentSerializer, KanbanBoardUserFilterSettingSerializer, \
    KanbanBoardUserSettingSerializer
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    BaseAuthenticatedModelViewSet, LockableViewSetMixIn
from eric.relations.models import Relation
from eric.shared_elements.models import Task, Comment

logger = logging.getLogger("eric.kanban_boards")


class TaskKanbanBoardAssignmentsViewSet(
    BaseAuthenticatedReadOnlyModelViewSet
):
    serializer_class = MinimalisticKanbanBoardColumnTaskAssignmentSerializer

    search_fields = ()
    ordering_fields = ()

    # disable paignation for this endpoint
    pagination_class = None

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(TaskKanbanBoardAssignmentsViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        """

        return get_object_or_404(Task.objects.viewable(), pk=kwargs['task_pk'])

    def get_queryset(self):
        if not hasattr(self, 'parent_object') or not self.parent_object:
            return KanbanBoardColumnTaskAssignment.objects.none()

        return KanbanBoardColumnTaskAssignment.objects.viewable().filter(
            task=self.parent_object
        ).prefetch_related('kanban_board_column', 'kanban_board_column__kanban_board')


class KanbanBoardViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ Handles Kanban boards (task boards). """

    serializer_class = KanbanBoardSerializer
    filterset_class = KanbanBoardFilter

    search_fields = ()
    ordering_fields = ('title', 'created_at', 'created_by', 'last_modified_at', 'last_modified_by')

    def get_queryset(self):
        """
        Returns the queryset for viewable Kanban Boards
        :return:
        """
        return KanbanBoard.objects.viewable().prefetch_common(). \
            prefetch_related(
            'projects',
        )

    def update(self, request, *args, **kwargs):
        self.handle_background_style(request)
        return super(KanbanBoardViewSet, self).update(request, *args, **kwargs)

    def handle_background_style(self, request):
        """ Background color removes background image, but not vice versa """
        if 'background_color' in request.data:
            bg_color = request.data['background_color']
            if bg_color is not None and bg_color != '':
                self.clear_background_image(request)

    @action(methods=['PATCH'], url_path='clear_background_image', detail=True)
    def clear_background_image(self, request, *args, **kwargs):
        obj = self.get_object()

        obj.background_image = None
        obj.background_image_thumbnail = None
        obj.save()

        return HttpResponse(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['GET'], url_path='background_image.png', url_name='background-image.png')
    def download_background_image(self, request, format=None, *args, **kwargs):
        """ Responds with the background image of the board. """

        # get the picture
        picture_object = self.get_object()
        # get original file name for the header
        original_file_name = "background_image.png"

        if picture_object.background_image:
            # create a file response
            file_path = os.path.join(settings.MEDIA_ROOT, picture_object.background_image.name)
            response = FileResponse(open(file_path, 'rb'))
        else:
            # no file available, send an empty response
            response = HttpResponse("[]")

        # set filename in header
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(original_file_name)
        # set mime type to the stored mime type
        response['Content-Type'] = 'application/json;'

        return response

    @action(detail=True, methods=['GET'], url_path='background_image_thumbnail.png',
            url_name='background-image-thumbnail.png')
    def download_background_image_thumbnail(self, request, format=None, *args, **kwargs):
        """ Respondes with a thumbnail of the background image of the board. """

        # get the picture
        picture_object = self.get_object()
        # get original file name for the header
        original_file_name = "background_image_thumbnail.png"

        if picture_object.background_image_thumbnail:
            # create a file response
            file_path = os.path.join(settings.MEDIA_ROOT, picture_object.background_image_thumbnail.name)
            response = FileResponse(open(file_path, 'rb'))
        else:
            # no file available, send an empty response
            response = HttpResponse("[]")

        # set filename in header
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(original_file_name)
        # set mime type to the stored mime type
        response['Content-Type'] = 'application/json;'

        return response

    @action(methods=['PATCH'], url_path='set_columns_transparency', detail=True)
    def set_columns_transparency(self, request, *args, **kwargs):
        # extracts all values from an rgba string, e.g.: rgba(33, 66, 99, 0.75)
        rgba_regex = r"^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d{0,1}(?:\.\d+)?))?\)$"

        kanban_board_columns = self.get_object().kanban_board_columns.all()
        try:
            alpha = float(request.data.get("alpha", 1))
        except ValueError:
            alpha = 1

        for column in kanban_board_columns:
            rgba = re.findall(rgba_regex, column.color, re.IGNORECASE)

            if rgba:
                red = rgba[0][0]
                green = rgba[0][1]
                blue = rgba[0][2]
                alpha = 1 if alpha > 1 or alpha < 0 else alpha

                column.color = f"rgba({red},{green},{blue},{alpha})"
                column.save()

        return HttpResponse(status=status.HTTP_204_NO_CONTENT)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """ Creates a task board. """

        # check if board for provided pk exists
        duplicate_board_pk = self.request.GET.get("duplicate_tasks_from_board", None)
        board_to_duplicate = None
        if duplicate_board_pk:
            queryset = KanbanBoard.objects.viewable()
            board_to_duplicate = get_object_or_404(queryset, pk=duplicate_board_pk)

        response = super(KanbanBoardViewSet, self).create(request, *args, **kwargs)

        # duplicate board columns and tasks too
        if board_to_duplicate:
            from eric.shared_elements.models import Task, TaskCheckList

            new_board = KanbanBoard.objects.filter(pk=response.data["pk"]).first()
            if not new_board:
                raise NotFound

            # delete all auto-generated columns first
            columns = KanbanBoardColumn.objects.filter(kanban_board__pk=new_board.pk)
            for column in columns:
                column.delete()

            # duplicate columns from other board
            columns = KanbanBoardColumn.objects.filter(kanban_board__pk=duplicate_board_pk).order_by("ordering")
            for column in columns:
                new_column = KanbanBoardColumn.objects.create(
                    title=column.title,
                    kanban_board=new_board,
                    color=column.color,
                    icon=column.icon,
                    ordering=column.ordering,
                )

                # duplicate tasks for this column
                task_assignments = KanbanBoardColumnTaskAssignment.objects.filter(kanban_board_column__pk=column.pk)
                for task_assignment in task_assignments:
                    task = task_assignment.task
                    new_task = Task.objects.create(
                        title=task.title,
                        priority=task.priority,
                        state=Task.TASK_STATE_NEW,
                        description=task.description,
                    )
                    new_task.labels.set(task.labels.all())
                    new_task.projects.set(new_board.projects.all())

                    # duplicate checklist items for this task
                    checklists = TaskCheckList.objects.filter(task__pk=task.pk)
                    for checklist in checklists:
                        TaskCheckList.objects.create(
                            title=checklist.title,
                            checked=False,
                            task=new_task,
                            ordering=checklist.ordering,
                        )

                    # assign duplicated task to new column
                    KanbanBoardColumnTaskAssignment.objects.create(
                        kanban_board_column=new_column,
                        task=new_task,
                    )

        return response


class KanbanBoardColumnTaskAssignmentViewSet(BaseAuthenticatedModelViewSet):
    """ Handles task assignments to boards. """

    serializer_class = KanbanBoardColumnTaskAssignmentSerializer
    ordering_fields = ('ordering',)

    # disable pagination for this endpoint
    pagination_class = None

    def get_serializer(self, *args, **kwargs):
        """ if an array is passed, set serializer to many """
        if isinstance(kwargs.get('data', {}), list):
            kwargs['many'] = True
        return super(KanbanBoardColumnTaskAssignmentViewSet, self).get_serializer(*args, **kwargs)

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(KanbanBoardColumnTaskAssignmentViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        """

        return get_object_or_404(KanbanBoard.objects.viewable(), pk=kwargs['kanbanboard_pk'])

    @action(detail=False, methods=['POST'])
    def create_many(self, *args, **kwargs):
        """ Assigns multiple tasks to a board. """

        # verify that we are getting an array of data
        assert isinstance(self.request.data, list), "Expected array"

        # collect task_ids and column_ids of assignment
        task_ids = []
        column_ids = []

        for assignment in self.request.data:
            task_ids.append(assignment['task_id'])
            column_ids.append(assignment['kanban_board_column'])

        # the task ids should be unique, lets verify that we actually have access on those tasks
        if Task.objects.viewable().filter(pk__in=task_ids).count() != len(task_ids):
            # the number of tasks in task_ids differs from the number of tasks that the current user is allowed to
            # view
            raise NotFound

        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(self.request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            self.request.data._mutable = True

        # for each column we need to determine the currently highest ordering, and the expected next ordering
        max_ordering_qs = KanbanBoardColumnTaskAssignment.objects.filter(
            kanban_board_column__kanban_board=self.parent_object
        ).order_by('kanban_board_column').values('kanban_board_column').annotate(
            max_ordering=Max('ordering', output_field=FloatField())
        )

        # convert max_ordering_qs into a dict, where the kanban_board_column is the primary key and the index field
        max_ordering = {}

        for result in max_ordering_qs:
            max_ordering[str(result['kanban_board_column'])] = result['max_ordering']

        # now fill in the max ordering
        for assignment in self.request.data:
            column_id = assignment['kanban_board_column']

            if column_id not in max_ordering:
                # column_id not found in our max_ordering dict, setting value to 0
                max_ordering[column_id] = 0
            else:
                # found! increase by 1 for the new assignment
                max_ordering[column_id] += 1

            assignment['ordering'] = max_ordering[column_id]

        serializer = self.get_serializer(data=self.request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # return the QUERY/LIST api call
        from django_changeset.models import RevisionModelMixin

        # temporarily disable revision model mixin for the list api call
        RevisionModelMixin.set_enabled(False)
        response = self.list(self.request, *args, **kwargs)
        RevisionModelMixin.set_enabled(True)

        return response

    def create(self, request, *args, **kwargs):
        """ Assigns a task to a board. """

        # verify that a create request contains only columns that belong to the parent board
        # verify that a create request contains only a task id that the current user has access to

        # verify that the user has access to the task they are trying to add
        task = get_object_or_404(Task.objects.viewable(), pk=request.data['task_id'])
        # verify that the user has access to the kanban column they are trying to add the task to
        column = get_object_or_404(
            self.parent_object.kanban_board_columns.all(), pk=request.data['kanban_board_column']
        )

        # check of ordering is in request.data, if not, fill it
        if 'ordering' not in request.data:
            # ordering not specified, append to bottom of the current column
            max_ordering = KanbanBoardColumnTaskAssignment.objects.filter(
                kanban_board_column=column
            ).aggregate(
                max_ordering=Max('ordering', output_field=FloatField())
            )['max_ordering']

            if max_ordering is None:
                max_ordering = 0
            else:
                max_ordering = max_ordering + 1

            # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
            if isinstance(request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
                request.data._mutable = True

            request.data['ordering'] = max_ordering

        return super(KanbanBoardColumnTaskAssignmentViewSet, self).create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Updates a board assignment.
        """

        # verify that an update request contains only columns that belong to the parent board
        # verify that an update request contains only a task id that the current user has access to

        if 'task_id' in request.data:
            # verify that the user has access to the task they are trying to add
            task = get_object_or_404(Task.objects.viewable(), pk=request.data['task_id'])

        if 'kanban_board_column' in request.data:
            # verify that the user has access to the kanban column they are trying to add the task to
            column = get_object_or_404(
                self.parent_object.kanban_board_columns.all(), pk=request.data['kanban_board_column']
            )

        return super(KanbanBoardColumnTaskAssignmentViewSet, self).update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """ Removes a task from a board. """

        # On destroy the ordering of the preceeding tasks in the same column needs to be decreased
        obj = self.get_object()

        # Step 1: Decrease
        task_assignments = KanbanBoardColumnTaskAssignment.objects.filter(
            kanban_board_column_id=obj.kanban_board_column,
            ordering__gte=obj.ordering
        ).exclude(
            pk=obj.pk
        )

        # Step 2: Let super class handle the real delete
        response = super(KanbanBoardColumnTaskAssignmentViewSet, self).destroy(request, *args, **kwargs)

        task_assignments.update(ordering=F('ordering') - 1)

        return response

    def get_queryset(self, *args, **kwargs):
        """
        Returns the queryset for viewable tasks of a given kanban board
        Note: We are returning all tasks, even those that are soft_deleted,
        so that the frontend can take care of this information
        """
        if not hasattr(self, 'parent_object') or not self.parent_object:
            return KanbanBoardColumnTaskAssignment.objects.none()

        assignments = KanbanBoardColumnTaskAssignment.objects.viewable().filter(
            kanban_board_column__kanban_board=self.parent_object.pk
        ).select_related('task', 'kanban_board_column', 'kanban_board_column__kanban_board').prefetch_related(
            'task__projects',
            'task__created_by', 'task__created_by__userprofile', 'task__last_modified_by',
            'task__last_modified_by__userprofile',
            'task__assigned_users', 'task__assigned_users__userprofile', 'task__checklist_items'
        )

        tasks = []

        for task_assignment in assignments:
            tasks.append(task_assignment.task.id)

        comment_content_type_id = Comment.get_content_type().id
        task_content_type_id = Task.get_content_type().id

        related_left_comments = dict(
            (str(x['pk']), x['num_related_left_comments']) for x in
            Relation.objects.filter(
                Q(
                    right_content_type=task_content_type_id,
                    right_object_id__in=tasks

                ) & Q(
                    left_content_type=comment_content_type_id
                )
            ).order_by(
                'right_object_id', 'right_content_type'
            ).values(
                'right_object_id', 'right_content_type'
            ).annotate(
                num_related_left_comments=Count('left_object_id'),
                pk=F('right_object_id')
            ).values('pk', 'num_related_left_comments')
        )

        related_right_comments = dict(
            (str(x['pk']), x['num_related_right_comments']) for x in
            Relation.objects.filter(
                Q(
                    left_content_type=task_content_type_id,
                    left_object_id__in=tasks
                ) & Q(
                    right_content_type=comment_content_type_id
                )
            ).order_by(
                'left_object_id', 'left_content_type'
            ).values(
                'left_object_id', 'left_content_type'
            ).annotate(
                num_related_right_comments=Count('right_object_id'),
                pk=F('left_object_id')
            ).values('pk', 'num_related_right_comments')
        )

        # iterate over child elements and set the child_object
        for task_assignment in assignments:
            task_assignment.num_related_comments = \
                related_left_comments.get(str(task_assignment.task.id), 0) + \
                related_right_comments.get(str(task_assignment.task.id), 0)
            task_assignment.num_relations = task_assignment.task.relations.count() - \
                task_assignment.num_related_comments

        return assignments

    def get_object(self):
        """ Gets a task-board assignment. """

        queryset = KanbanBoardColumnTaskAssignment.objects.viewable().filter(
            kanban_board_column__kanban_board=self.parent_object.pk
        ).select_related('task', 'kanban_board_column', 'kanban_board_column__kanban_board').prefetch_related(
            'task__projects',
            'task__created_by', 'task__created_by__userprofile', 'task__last_modified_by',
            'task__last_modified_by__userprofile',
            'task__assigned_users', 'task__assigned_users__userprofile', 'task__checklist_items'
        )

        # Perform the lookup filtering (usually not needed, but we leave it here as the original get_object also has it)
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert lookup_url_kwarg in self.kwargs, ('Expected view %s to be called with a URL keyword argument '
                                                 'named "%s". Fix your URL conf, or set the `.lookup_field` '
                                                 'attribute on the view correctly.' %
                                                 (self.__class__.__name__, lookup_url_kwarg)
                                                 )

        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)

        comment_content_type_id = Comment.get_content_type().id
        task_content_type_id = Task.get_content_type().id

        # count number of related comments
        num_related_comments = Relation.objects.filter(
            Q(
                Q(
                    left_content_type_id=task_content_type_id,
                    left_object_id=obj.task.id
                ) & Q(
                    right_content_type=comment_content_type_id
                )
            ) | Q(
                Q(
                    right_content_type_id=task_content_type_id,
                    right_object_id=obj.task.id
                ) & Q(
                    left_content_type=comment_content_type_id
                )
            )
        ).count()

        obj.num_related_comments = num_related_comments

        # count number of all other relations
        obj.num_relations = obj.task.relations.count() - obj.num_related_comments

        return obj

    @action(detail=False, methods=['PUT'])
    def move_assignment(self, *args, **kwargs):
        """ Moves a task from one column to another, also updates the ordering if necessary. """
        from timeit import default_timer as timer

        start = timer()

        to_column = self.request.data['to_column']
        to_index = self.request.data['to_index']
        assignment_pk = self.request.data['assignment_pk']

        # Check if to_column is in the same kanban board (if not, this will raise an exception)
        real_column = self.parent_object.kanban_board_columns.filter(pk=to_column).first()

        if not real_column:
            raise NotFound

        # get the assignment that we need to change (no need to call viewable here; if the user is allowed to access
        # the parent object, the user is also allowed to access the column)
        assignment = KanbanBoardColumnTaskAssignment.objects.filter(pk=assignment_pk).select_related('task').first()

        if not assignment:
            raise NotFound

        # store current ordering (this is the index where the assignment is moved FROM)
        from_index = assignment.ordering
        # store current column of assignment
        from_column = str(assignment.kanban_board_column_id)

        if from_index == to_index and from_column == to_column:
            # no changes
            return self.list(self.request, *args, **kwargs)

        if from_column != to_column:
            # easy: if from_column != to_column, we just need to make space in to_column and fill the gap in from_column
            # step 1: make space in the to_column: Shift everything in the to_column that is below to_index down by 1
            task_assignments = KanbanBoardColumnTaskAssignment.objects.filter(
                kanban_board_column_id=to_column,
                ordering__gte=to_index
            ).exclude(
                pk=assignment_pk
            )

            task_assignments.update(ordering=F('ordering') + 1)

            # step 2: now that we have made some room, we can set the ordering of our assignment
            assignment.ordering = to_index
            assignment.kanban_board_column_id = to_column

            assignment.save()

            # step 3: now that the original element was removed, close the gap in from_column by decreasing ordering
            # of the assignments in from_column
            task_assignments = KanbanBoardColumnTaskAssignment.objects.filter(
                kanban_board_column_id=from_column,
                ordering__gte=from_index
            ).exclude(
                pk=assignment_pk
            )

            task_assignments.update(ordering=F('ordering') - 1)

        else:  # from_column == to_column
            # move within the same column
            logger.debug(
                "KanbanBoardColumnTaskAssignmentViewSet.move_assignment(board_id={}): Moving assignment "
                "within the same column ".format(
                    self.parent_object.pk
                )
            )

            ########################################################################################################
            # step 1: make space in the to_column: Shift everything in the to_column after to_index down by 1
            ########################################################################################################
            task_assignments = KanbanBoardColumnTaskAssignment.objects.viewable().filter(
                kanban_board_column_id=to_column
            ).exclude(
                pk=assignment_pk
            )

            if from_index < to_index:
                # as we are moving down, we need to decrease to_index - else we move it too far
                to_index -= 1
                # move down within the same column
                task_assignments = task_assignments.filter(
                    ordering__gte=from_index,
                    ordering__lte=to_index
                )

                # just mass-decrease the ordering by 1
                task_assignments.update(ordering=F('ordering') - 1)
            else:
                # move up within the same column
                task_assignments = task_assignments.filter(
                    ordering__gte=to_index,
                    ordering__lte=from_index,
                )

                # just mass-increase the ordering by 1
                task_assignments.update(ordering=F('ordering') + 1)

            ########################################################################################################
            # step 2: now that we have made some room, we can set the ordering of the current assignment without
            #         causing a DB/consistency conflict (uniqueness of ordering + kanban_board_column)
            ########################################################################################################
            assignment.ordering = to_index
            assignment.kanban_board_column_id = to_column

            assignment.save()

            ########################################################################################################
            # step 3: Consistency check - make sure the from_column has a consistent ordering again
            #         in an optimal world, this should not never happen - so worst case it's just a READ QUERY, and
            #         not an UPDATE QUERY
            ########################################################################################################
            task_assignments = KanbanBoardColumnTaskAssignment.objects.viewable().filter(
                kanban_board_column_id=from_column
            ).order_by('ordering')

            # iterate over all task assignments of the current column and fix ordering (in case it needs to be fixed)
            i = 0

            with disable_permission_checks(KanbanBoardColumnTaskAssignment):
                for a in task_assignments:
                    # for this assignment we expect the ordering to be i
                    if a.ordering != i:
                        # wrong ordering detected, fix it
                        logger.debug(
                            "KanbanBoardColumnTaskAssignmentViewSet.move_assignment():  "
                            "Detected ordering of assignment is {}, but expected it to be {}".format(
                                a.ordering, i
                            )
                        )

                        a.ordering = i
                        a.save(update_fields=['ordering'])

                    i = i + 1

        end = timer()

        logger.debug(
            "KanbanBoardColumnTaskAssignmentViewSet.move_assignment(board_id={}): "
            "Moving took {} seconds".format(
                self.parent_object.pk,
                (end - start)
            )
        )

        # return the QUERY/LIST api call
        from django_changeset.models import RevisionModelMixin

        # temporarily disable revision model mixin for the list api call
        RevisionModelMixin.set_enabled(False)
        response = self.list(self.request, *args, **kwargs)
        RevisionModelMixin.set_enabled(True)

        return response


class KanbanBoardUserFilterSettingViewSet(BaseAuthenticatedModelViewSet):
    """ Handles filter settings for kanban boards. """
    serializer_class = KanbanBoardUserFilterSettingSerializer

    search_fields = ()
    ordering_fields = ('created_at', 'last_modified_at')

    # disable paignation for this endpoint
    pagination_class = None

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(KanbanBoardUserFilterSettingViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        """
        return get_object_or_404(KanbanBoard.objects.viewable(), pk=kwargs['kanbanboard_pk'])

    def get_queryset(self):
        if not hasattr(self, 'parent_object') or not self.parent_object:
            return KanbanBoardUserFilterSetting.objects.none()

        return KanbanBoardUserFilterSetting.objects.viewable().filter(
            kanban_board=self.parent_object
        ).prefetch_related('kanban_board')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # check if the current user is allowed to access the kanban board
        self.check_object_permissions(request, KanbanBoardUserFilterSetting)
        return super(KanbanBoardUserFilterSettingViewSet, self).create(request, *args, **kwargs)


class KanbanBoardUserSettingViewSet(BaseAuthenticatedModelViewSet):
    """ Handles user settings for kanban boards. """
    serializer_class = KanbanBoardUserSettingSerializer

    search_fields = ()
    ordering_fields = ('created_at', 'last_modified_at')

    # disable paignation for this endpoint
    pagination_class = None

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(KanbanBoardUserSettingViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        """
        return get_object_or_404(KanbanBoard.objects.viewable(), pk=kwargs['kanbanboard_pk'])

    def get_queryset(self):
        if not hasattr(self, 'parent_object') or not self.parent_object:
            return KanbanBoardUserSetting.objects.none()

        return KanbanBoardUserSetting.objects.viewable().filter(
            kanban_board=self.parent_object
        ).prefetch_related('kanban_board')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # check if the current user is allowed to access the kanban board
        self.check_object_permissions(request, KanbanBoardUserSetting)
        return super(KanbanBoardUserSettingViewSet, self).create(request, *args, **kwargs)
