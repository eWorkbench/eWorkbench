#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.validators import validate_email

from eric.shared_elements.models import MyUser, Contact, ValidationError


class VObjectWrapper:
    def __init__(self, v_object):
        self.v_object = v_object

    def read(self, key, default=None):
        """
        Reads the first value stored under the given key.
        """
        content_list = self.read_list(key)
        return content_list[0].value if len(content_list) > 0 else default

    def read_first_item(self, key, default=None):
        """
        Reads the first item
        """
        content_list = self.read_list(key)
        return content_list[0] if len(content_list) > 0 else default

    def read_list(self, key):
        return self.contents[key] if self.contains(key) else []

    def read_param(self, key, param_key, default=None):
        item = self.read_first_item(key)
        if item and param_key in item.params:
            params = item.params[param_key]
            if len(params) > 0:
                return params[0]

        return default

    def contains(self, key):
        return key in self.contents

    @property
    def contents(self):
        return self.v_object.contents

    def serialize(self):
        return self.v_object.serialize()


class VEventWrapper(VObjectWrapper):
    def read_attendees(self):
        email_list = self.read_attendee_mail_addresses()

        user_pk_list = []
        contact_pk_list = []
        for email in email_list:
            self.load_attendee(email, user_pk_list, contact_pk_list)

        return contact_pk_list, user_pk_list

    @staticmethod
    def validate_attendee_email(address):
        try:
            validate_email(address)
            return True
        except ValidationError:
            return False

    def read_attendee_mail_addresses(self):
        attendee_list = self.read_list('attendee')
        mail_list = list()
        for attendee in attendee_list:
            email = attendee.value.lower().replace("mailto:", "").strip()
            print("Email lookup in user: '{}'".format(email))
            if self.validate_attendee_email(email):
                mail_list.append(email)
            else:
                print('Ignoring attendee with invalid email address: "{}"'.format(email))

        return mail_list

    @classmethod
    def load_attendee(cls, email, user_pk_list, contact_pk_list):
        # check if this is a user
        users = MyUser.objects.filter(email__iexact=email)
        if users.exists():
            print("Found users")
            print(users)
            user_pk_list.append(users.first().pk)
        else:
            # check if this is a contact
            contacts = Contact.objects.filter(email=email)
            if contacts.exists():
                print("Found contacts")
                print(contacts)
                contact_pk_list.append(contacts.first().pk)
            else:
                # not a user, not a contact => ignore
                print('Ignoring attendee <{mail}> since there is no matching user or contact.'.format(
                    mail=email
                ))
