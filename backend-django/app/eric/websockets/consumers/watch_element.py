#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework.exceptions import ValidationError

from asgiref.sync import async_to_sync
from django_userforeignkey.request import get_current_user

from eric.core.models import LockMixin
from eric.core.models.abstract import get_all_workbench_models
from eric.projects.rest.serializers.element_lock import ElementLockSerializer
from eric.websockets.consumers.core import AuthenticatedWorkbenchJsonWebsocketConsumer


class WorkbenchElementConsumer(AuthenticatedWorkbenchJsonWebsocketConsumer):
    """
    WebSocket Consumer that allows subscribing to a workbench element and propagates those changes to the user
    """

    ALLOWED_ACTIONS = ["subscribe", "unsubscribe", "unsubscribe_all", "lock", "unlock"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.group_names = []

    def authentication_success(self, user):
        pass

    def receive_json_authenticated(self, content):
        """
        Data is being received on the websocket and dispatched to the appropriate sub-methods
        :param content:
        :return:
        """
        if "action" in content:
            action = content["action"].lower()

            if action not in self.ALLOWED_ACTIONS:
                # method not in allowed actions
                print(f"Method {action} not in allowed actions")
            else:
                if hasattr(self, action) and callable(getattr(self, action)):
                    # call it
                    action_method = getattr(self, action)
                    action_method(content)
                else:
                    # method not found
                    print(f"Method {action} not found")
        else:
            print("Please use the 'action' attribute in your JSON")

    def connect(self, **kwargs):
        # we're accepting any connection, auth is handled in the `authentication_success` method in
        # `AuthenticatedWorkbenchJsonWebsocketConsumer`
        self.accept()

    def disconnect(self, *args, **kwargs):
        # remove the channel from all groups it is listening on
        print("Disconnecting...")

        for group_name in self.group_names:
            print(f"Removing channel from group {group_name}")

            # Leave group with this channel
            async_to_sync(self.channel_layer.group_discard)(group_name, self.channel_name)

    @staticmethod
    def check_workbench_params(data, check_viewable=True):
        """
        Validates model_name and model_pk with workbench models

        E.g., data['model_name'] = 'note' will map to the Note model
        In addition, data['model_pk'] = 'abcd-1234' will map to Note.objects.filter(pk='abcd-1234')
        :param dict data: dictionary containing model_name and model_pk
        :param bool check_viewable: whether or not .viewable() of the queryset should be checked
        :return:
        """
        if "model_name" not in data:
            raise ValidationError("Expected 'model_name' to be set")
        if "model_pk" not in data:
            raise ValidationError("Exepcted 'model_pk' to be set")

        model_name = data["model_name"]
        model_pk = data["model_pk"]

        # ToDo: Move this to a static method and initialize it once for better performance
        workbench_searchable_elements = get_all_workbench_models(LockMixin)
        available_models = {model.__name__.lower(): model for model in workbench_searchable_elements}

        # check that model_name is within available models
        if model_name in available_models:
            model = available_models[model_name]

            element = model.objects.filter(pk=model_pk)

            # make sure this element exists and is viewable by the current user
            if element.exists():
                # get the element
                element = element.first()

                # make sure the element is viewable (if check_viewable is true)
                if not check_viewable or element.is_viewable():
                    # generate group name
                    # ToDo: this should be a static method somewhere, as it's also used in handlers.py
                    group_name = f"elements_{model_name}_{model_pk}"

                    return element, group_name
        else:
            print(f"Could not find {model_name} in {available_models}")

        # else:
        return None, None

    def subscribe(self, text_data_json):
        """
        Subscribe to an element
        :param text_data_json: contains the model_name and the model_pk that the user wants to subscribe to
        :return:
        """
        element, group_name = self.check_workbench_params(text_data_json)

        if element and group_name:
            self.group_names.append(group_name)

            print(f"subscribing to {group_name}")

            # Join room group for this element with this channel
            async_to_sync(self.channel_layer.group_add)(group_name, self.channel_name)

            # Figure out whether this element is locked and send a lock message
            element_lock = element.get_lock_element()

            model_name = element.__class__.__name__.lower()

            if element_lock.exists():
                # element is currently locked, send out a message
                element_lock = element_lock.first()

                self.send(
                    text_data=json.dumps(
                        {
                            "element_lock_changed": {
                                "locked": True,
                                "lock_details": ElementLockSerializer(
                                    element_lock, context={"request": self.scope["request"]}
                                ).data,
                                "model_name": model_name,
                                "model_pk": str(element.pk),
                            }
                        }
                    )
                )

            return

        # else:
        print(f"Can not subscribe to {text_data_json}")

    def unsubscribe(self, text_data_json):
        """
        Unsubscribe from an element
        :param text_data_json:
        :return:
        """
        element, group_name = self.check_workbench_params(text_data_json, check_viewable=False)

        if element and group_name:
            if group_name in self.group_names:
                self.group_names.remove(group_name)

                print(f"User is unsubscribing from {group_name}")

                # Leave group with this channel
                async_to_sync(self.channel_layer.group_discard)(group_name, self.channel_name)
            else:
                print(f"Group_name {group_name} is not in self.group_names")
        else:
            print("Trying to unsubscribe from an element that does not exist...")

    def unsubscribe_all(self, text_data_json):
        """
        Unsubscribe from all subscribed elements (probably in preparation of a disconnect)
        :param text_data_json:
        :return:
        """
        for group_name in self.group_names:
            print(f"Removing channel from group {group_name}")

            # Leave group with this channel
            async_to_sync(self.channel_layer.group_discard)(group_name, self.channel_name)

    def element_lock_changed(self, event):
        """
        Event fired when an element lock has changed
        :param event:
        :return:
        """
        message = event["message"]

        print("Element lock has changed:", message)

        if message["locked"]:
            # this message contains a model_name and model_pk, let's find out what model this is
            element, group_name = self.check_workbench_params(message, check_viewable=False)

            element_lock = element.get_lock_element()

            if element_lock.exists():
                element_lock = element_lock.first()

                # serialize all the necessary details about the lock
                message["lock_details"] = ElementLockSerializer(
                    element_lock, context={"request": self.scope["request"]}
                ).data

                self.send(text_data=json.dumps({"element_lock_changed": message}))
            else:
                # message['locked’] says that it is locked, but apparently it is not locked.. or at least not in the db
                raise ValidationError("Model should be locked, but is not locked...")

        self.send(text_data=json.dumps({"element_lock_changed": message}))

    def element_changed(self, event):
        """
        Event fired when an element has changed

        Notifies the user that this element has changed
        :param event:
        :return:
        """
        message = event["message"]

        self.send(text_data=json.dumps({"element_changed": message}))

    def kanbanboard_task_assignment_deleted(self, event):
        message = event["message"]

        self.send(text_data=json.dumps({"kanbanboard_task_assignment_deleted": message}))

    def kanbanboard_task_assignment_changed(self, event):
        message = event["message"]

        self.send(text_data=json.dumps({"kanbanboard_task_assignment_changed": message}))

    def kanbanboard_column_changed(self, event):
        message = event["message"]

        self.send(text_data=json.dumps({"kanbanboard_column_changed": message}))

    def element_relations_changed(self, event):
        """
        Event fired when the relations of an element have changed
        :param event:
        :return:
        """
        message = event["message"]

        self.send(text_data=json.dumps({"element_relations_changed": message}))

    def labbook_child_element_changed(self, event):
        """
        Event fired when the child element of a labbook has changed
        :param event:
        :return:
        """
        message = event["message"]

        self.send(text_data=json.dumps({"labbook_child_element_changed": message}))

    def lock(self, text_data_json):
        print("locking")

        element, group_name = self.check_workbench_params(text_data_json)

        element_lock = element.get_lock_element()

        if not element_lock.exists():
            # not locked, try to lock it
            element.lock()

    def unlock(self, text_data_json):
        print("trying to unlock...")

        element, group_name = self.check_workbench_params(text_data_json)

        element_lock = element.get_lock_element()

        if element_lock.exists():
            element_lock = element_lock.first()
            if element_lock.locked_by == get_current_user():
                print("Unlocking...")

                # this should trigger a notification to all users that are currently listening to this channel
                element.unlock()
            else:
                print("Locked by another user, can not unlock")
        else:
            print("Trying to unlock an element that is not locked... this should not happen")
