#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import abc
import json

from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync
from django_userforeignkey.request import get_current_user, get_current_request, set_current_request

from eric.core.models.abstract import get_all_workbench_models
from eric.search.models import FTSMixin
from eric.websockets.authentication import fake_rest_auth


class AuthenticatedWorkbenchJsonWebsocketConsumer(JsonWebsocketConsumer):
    """
    Abstract Workbench Websocket Consumer that handles authentication
    """
    def connect(self, **kwargs):
        raise NotImplemented

    def disconnect(self, **kwargs):
        raise NotImplemented

    def receive_json(self, content, **kwargs):
        # all authenticated messages need to be forwarded to the receive_json_authenticated method
        # however, we should set the current request, so we can rely on the get_current_user() method in our app
        if 'is_authenticated' in self.scope and self.scope['is_authenticated']:
            request = self.scope['request']
            set_current_request(request)
            return self.receive_json_authenticated(content, **kwargs)

        # check for auth requests
        if 'authorization' in content:
            self.scope['is_authenticated'] = False
            # check auth
            auth_token = content['authorization']

            # fake the auth request
            user, auth, request = fake_rest_auth(auth_token, self.scope)

            self.scope['request'] = request
            self.scope['user'] = user

            set_current_request(request)

            if user and not user.is_anonymous:
                self.scope['is_authenticated'] = True
                self.authentication_success(user)
                # send auth_success
                self.send_json({'auth_success': True})

            return

        # else: got unauthorized message
        print("Got an unauthorized message")
        print(content)

    def authentication_success(self, user):
        raise NotImplemented

    @abc.abstractmethod
    def receive_json_authenticated(self, content, **kwargs):
        """
        Called when json data is sent after authentication
        :param content: object constructed from json
        :param kwargs:
        :return:
        """
        pass


class GenericWorkbenchElementConsumer(AuthenticatedWorkbenchJsonWebsocketConsumer):
    """
    A generic consumer for workbench elements, which selects the workbench element based on the URL params. The
    element is then stored in self.element, the model class in self.model_class

    To use it, define ALLOWED_ACTIONS and define methods that are called the same

    Example:

        class LockWorkbenchElementConsumer(GenericWorkbenchElementConsumer):
            ALLOWED_ACTIONS = [
                'get_lock_status',
                'lock',
                'unlock'
            ]

            def get_lock_status(self, data):
                pass

            def lock(self, data):
                pass

            def unlock(self, data):
                pass
    """
    ALLOWED_ACTIONS = []

    def connect(self):
        """
        Connect to the websocket
        Takes the scope (element name and element pk)
        :return:
        """
        workbench_searchable_elements = get_all_workbench_models(FTSMixin)
        available_models = dict([(model.__name__.lower(), model) for model in workbench_searchable_elements])

        model_name = self.scope['url_route']['kwargs']['model_name']
        model_pk = self.scope['url_route']['kwargs']['model_pk']

        self.room_name = "elements_{model_name}_{model_pk}".format(model_name=model_name, model_pk=model_pk)
        self.room_group_name = "char_{}".format(self.room_name)

        print("Listening to {}".format(self.channel_name))

        if model_name in available_models:
            model = available_models[model_name]

            element = model.objects.filter(pk=model_pk)

            if element.exists():
                # store element and model class
                self.element = element.first()
                self.model_class = model

                # Join room group for this element
                async_to_sync(self.channel_layer.group_add)(
                    self.room_group_name,
                    self.channel_name
                )

                self.accept()

                return

        # else:
        print("rejecting")
        self.reject()

    def authentication_success(self, user):
        pass

    def disconnect(self, close_code):
        # leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def send_to_room_group(self, message):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'test_message',
                'message': message
            }
        )

    def receive_json_authenticated(self, content):
        """
        Data is being received on the websocket and dispatched to the appropriate sub-methods
        :param content:
        :return:
        """
        print(content, get_current_user())

        if 'action' in content:
            action = content['action'].lower()

            if action not in self.ALLOWED_ACTIONS:
                # method not in allowed actions
                print("Method {} not in allowed actions".format(action))
            else:
                if hasattr(self, action) and callable(getattr(self, action)):
                    # call it
                    action_method = getattr(self, action)
                    action_method(content)
                else:
                    # method not found
                    print("Method {} not found".format(action))
        else:
            print("Please use the 'action' attribute in your JSON")
