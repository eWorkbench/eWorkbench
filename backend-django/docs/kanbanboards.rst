Kanban Boards / Task Boards
===========================

This section describes special features and functionality of the Kanban Boards (renamed to Task Boards in frontend)
component. For Workbench specific features, such as Delete/Restore, Model Privileges, etc..., please see the more
generic sections.

Feature Description
-------------------

A Board is a Workbench Element, which contains Columns, whereas several Task are assigned to the columns.

A Board has a title and an optional background image (if the background image is set, a thumbnail is also stored).

A Column can only be assigned to one Board, and contains a title and an icon, aswell as an ordering (columns are ordered).

Each column can then contain assignments (a through-table between column and task).


Technical Description
---------------------

In the backend we store the relation between a Board Column and a Task in the ``KanbanBoardColumnTaskAssignment`` model.
If a column is deleted, the assignment is also deleted (using ``on_delete=models.CASCADE`` on the assignment.


Privileges and Permissions
--------------------------

Each Task within a Board can be viewed by each user that is allowed to view the Board.

This privilege is inherited within ``app/eric/kanban_boards/models/model_privileges.py`` aswell as ``app/eric/kanban_boards/models/querysets.py``.


View all Kanban Boards that a Task is in
----------------------------------------

An additional endpoint is available for querying all Boards/Columns that a task is in. This can be accomplished by calling
``GET /api/tasks/{task_pk}/kanbanboard_assignments/`` and returns a very minimalistic list of boards and columns.


Frontend
--------

The following widgets are available for the frontend to work with:

- KanbanboardColumnWidget - renders a column of a board
- KanbanboardColumnTaskDisplay - renders the task of a column of a board

Those two widgets are responsible for rendering a column and the task within the columns, and also handle the main
drag-and-drop functionality for the Kanban Board.


Background Image of a Board
---------------------------

The background image of a board is configured using a ``BackgroundImageService``, which basically injects the image
URL into the HTML ``<body>`` tag (see ``index.html``).

Adding one or many Tasks to a Board
-----------------------------------

This is accomplished using the API call ``create_many`` on the ``KanbanBoardColumnTaskAssignmentViewSet`` (using
``POST /api/kanbanboards/{kanbanboard_pk}/tasks/create_many/``). As a payload (in body) you need to pass a list of
assignments, e.g.:

.. code:: javascript

    [
        {"task_id":"19742f1c-4e87-4ed4-925c-6c795ee5e7d1","kanban_board_column":"ec44ff3d-17fa-44d7-9d5d-783446c97429"}
    ]
