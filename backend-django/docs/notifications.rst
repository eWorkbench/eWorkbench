Notifications
=============

The notification system within the Workbench is quite simple. For every change on

* Tasks
* Meetings
* Projects

all associated users are notified about the change.

For instance, if a user is added to a Task as an Assignee, we notify the user that is added, aswell as all other users
that the Task has changed.

Handlers/Events
---------------

The events for Tasks, Meetings and Projects are handled in ``app/eric/notifications/models/handlers.py``. E.g.,
the handler for detecting that a user has been added to a task looks as follows:

.. code:: python

    @receiver(post_save, sender=TaskAssignedUser)
    def create_notification_based_on_add_user_to_task(sender, instance, *args, **kwargs):
        """Notifies the assigned user that he was added to the task"""
        if get_current_user().is_anonymous:
            return

        assigned_user = instance.assigned_user

        if assigned_user != get_current_user():
            task = Task.objects.get(pk=instance.task.pk)

            # define attributes for the html message
            context = {
                'user': assigned_user,
                'instance': task
            }

            # render html message
            html_message = render_to_string('notification/task_add_user.html', context)

            Notification.objects.create(
                user=assigned_user,
                title=_("You have been added to task {task}".format(user=str(assigned_user), task=task.title)),
                message=html_message,
                content_type=task.get_content_type(),
                object_id=task.pk,
                notification_type=NotificationConfiguration.NOTIFICATION_CONF_TASK_USER_CHANGED
            )


Basically, we use a ``post_save`` receiver on the desired Model (here ``TaskAssignedUser``), we check that the user
that is affected by this change is not the current user (you would not want to get a notification when you have added
yourself to a task, would you?), and then we render a template with some information. By convention, this template
is always located in the ``notification`` subdirectory of the app where the model lives (so the ``task_add_user.html``
notification template is located in ``app/eric/shared_elements/templates/notification/``.

Creating a notification basically means creating an object with ``Notification.objects.create``. Here you need to
specify the the ``user`` that this notification is for, a ``title``, the rendered ``message``, aswell as the
``content_type`` and ``object_id`` for the element that is notification is about. Last but not least, you need to
specify the ``notification_type``, which is specified in the ``NotificationConfiguration`` model as follows:

.. code:: python

    class NotificationConfiguration(BaseModel, ChangeSetMixIn, RevisionModelMixin):
        """Defines the configuration (allowed notifications) for a user"""

        # Notification configuration states

        # Meeting
        NOTIFICATION_CONF_MEETING_USER_CHANGED = 'NOTIFICATION_CONF_MEETING_USER_CHANGED'
        NOTIFICATION_CONF_MEETING_CHANGED = 'NOTIFICATION_CONF_MEETING_CHANGED'
        NOTIFICATION_CONF_MEETING_RELATION_CHANGED = 'NOTIFICATION_CONF_MEETING_RELATION_CHANGED'

        # Task
        NOTIFICATION_CONF_TASK_USER_CHANGED = 'NOTIFICATION_CONF_TASK_USER_CHANGED'
        NOTIFICATION_CONF_TASK_CHANGED = 'NOTIFICATION_CONF_TASK_CHANGED'
        NOTIFICATION_CONF_TASK_RELATION_CHANGED = 'NOTIFICATION_CONF_TASK_RELATION_CHANGED'

        # Project
        NOTIFICATION_CONF_PROJECT_USER_CHANGED = 'NOTIFICATION_CONF_PROJECT_USER_CHANGED'
        NOTIFICATION_CONF_PROJECT_CHANGED = 'NOTIFICATION_CONF_PROJECT_CHANGED'


Sending notifications via e-mail
--------------------------------

This is not done within the ``post_save`` handlers, but within a separate cron jobs (for obvious reasons like: we don't
 want the application to wait for the e-mail to be sent, we don't want the application to fail if the e-mail server is
 down, etc...).

This cron job is located within a Django Management Command in ``app/eric/notifications/management/commands/send_notifications.py``
 and works as follows:

Get all notifications that have not been sent (``sent__isnull=True``) and not been processed (``processed=False``),
 and exclude all users that have just received a notification.

In addition, we check for each user that the notification that is being processed is within the users
``notification_configuration``.


Viewing Notifications via REST API
----------------------------------

While (most) notifications are sent via e-mail, the frontend is regularly querying the notifications REST API endpoint,
 which also displays notifications. This works via the following API call:
 ``GET /api/notifications/?created_at__gt=2018-02-27T16:30:19.772Z``

The ``created_at__gt``(gt = greater than) should be used with the date of the last notification. This way we only query
 notifications newer than the latest notification that we retrieved.


Marking Notifications as read
-----------------------------

Each notification has a unique identifier (uuid4) which can be used to mark a notification as read via the following
REST API Call:
 ``PUT /api/notifications/4cb91856-3347-4431-9726-22fc837aaf36/read/``

In addition, one can mark all notifications as read via the following API Call:
 ``POST /api/notifications/read_all/``
