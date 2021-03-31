#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import threading
from collections import defaultdict
from contextlib import contextmanager

from django.contrib.contenttypes.models import ContentType
from django.db import models, IntegrityError
from django.db.models.fields import FieldDoesNotExist
from django.db.models.signals import *
from django.dispatch import receiver
from django.utils import timezone
from django.utils.deconstruct import deconstructible
from django_userforeignkey.request import get_current_user

from eric.core.models.utils import get_permission_name
from eric.site_preferences.models import options as site_preferences

logger = logging.Logger(__name__)

THREAD_LOCALS_ATTRIBUTE = '__thread_locals__'
DISABLE_PERMISSION_CHECKS_ATTRIBUTE = 'disablePermissionChecks'


def permission_checks_disabled(instance):
    klass = instance.__class__
    if hasattr(klass, THREAD_LOCALS_ATTRIBUTE):
        thread_locals = getattr(klass, THREAD_LOCALS_ATTRIBUTE)
        if hasattr(thread_locals, DISABLE_PERMISSION_CHECKS_ATTRIBUTE):
            return getattr(thread_locals, DISABLE_PERMISSION_CHECKS_ATTRIBUTE)

    return False


@contextmanager
def disable_permission_checks(cls):
    """
    Context Manager that disables permission checks for a model class

    Example::

        with disable_permission_checks(YourModel):
            your_model.some_field = 1
            your_model.save()

    :param cls: the class that permission checks should be disabled for
    :type cls: class
    """
    cls.__thread_locals__ = threading.local()
    setattr(cls.__thread_locals__, DISABLE_PERMISSION_CHECKS_ATTRIBUTE, True)

    try:
        yield
    finally:
        undo_disable_permission_checks(cls)


def undo_disable_permission_checks(cls):
    # because of race conditions between processes the attributes could be deleted already,
    # therefore we have to clean up carefully
    try:
        if hasattr(cls, THREAD_LOCALS_ATTRIBUTE):
            if hasattr(cls.__thread_locals__, DISABLE_PERMISSION_CHECKS_ATTRIBUTE):
                delattr(cls.__thread_locals__, DISABLE_PERMISSION_CHECKS_ATTRIBUTE)
            delattr(cls, THREAD_LOCALS_ATTRIBUTE)
    except AttributeError as e:
        logger.debug(e)


class DisableSignal:
    """
    Context manager to disable a signal for a given context. Useful for unit
    testing if you want to test behavior independently of a models signals.
    Example:
    ```
    with SignalDisconnect(post_save, my_signal_method, myModel):
        # Do work without the signal
    `signal` is a Django Signal objects (post_save, pre_init)
    `method` is the method connected to the signal
    `sender` is the model that calls the connected method
    """

    def __init__(self, signal, method, sender):
        self.signal = signal
        self.method = method
        self.sender = sender

    def __enter__(self):
        self.signal.disconnect(
            self.method,
            sender=self.sender,
        )

    def __exit__(self, *args):
        self.signal.connect(
            self.method,
            sender=self.sender,
        )


class DisableSignals(object):
    """
    Temporarily disables all django signals

    From: https://gist.github.com/shibocuhk/fd0e3f5e2360c64bc9ce2efb254744f7

    with a fix from https://github.com/FactoryBoy/factory_boy/ -
    https://github.com/FactoryBoy/factory_boy/blob/ae780a38c2311cf6d306797889f09db4d395a6d4/factory/django.py#L297-L301

    Example usage:
    with DisableSignals():
        user.save()
    """

    def __init__(self, disabled_signals=None):
        self.stashed_signals = defaultdict(list)
        self.disabled_signals = disabled_signals or [
            pre_init, post_init,
            pre_save, post_save,
            pre_delete, post_delete,
            pre_migrate, post_migrate,
        ]

    def __enter__(self):
        for signal in self.disabled_signals:
            self.disconnect(signal)

    def __exit__(self, exc_type, exc_val, exc_tb):
        for signal in list(self.stashed_signals):
            self.reconnect(signal)

    def disconnect(self, signal):
        self.stashed_signals[signal] = signal.receivers
        signal.receivers = []

    def reconnect(self, signal):
        signal.receivers = self.stashed_signals.get(signal, [])

        # fix an issue with django signals
        # (c) https://github.com/FactoryBoy/factory_boy
        with signal.lock:
            # Django uses some caching for its signals.
            # Since we're bypassing signal.connect and signal.disconnect,
            # we have to keep messing with django's internals.
            signal.sender_receivers_cache.clear()

        del self.stashed_signals[signal]


class BaseModel(models.Model):
    """ Abstract Base Class for all models

    Defines a default ordering (primary key in descending order
    Defines .model_verbose_name() for a class (shortcut for cls._meta.verbose_name)
    Defines .get_content_type() for a class (shortcut for ContentType.objects.get_for_model(cls))
    """

    class Meta:
        abstract = True
        # define default ordering, with newest first (based on the primary key)
        ordering = [
            '-pk',
        ]

    @classmethod
    def model_verbose_name(cls):
        """"
        :returns: the name of the current class as a string (cls._meta.verbose_name_plural)
        :rtype: string
        """
        return cls._meta.verbose_name

    @classmethod
    def model_verbose_name_plural(cls):
        """
        :returns: the plural name of the current class as a string (cls._meta.verbose_name_plural)
        :rtype: string
        """
        return cls._meta.verbose_name_plural

    @classmethod
    def get_content_type(cls):
        """
        Gets the ContentType object (ContentType.objects.get_for_model(cls)) for the current class
        :returns: the ContentType object of the current class
        :rtype: django.contrib.contenttypes.models.ContentType
        """
        # if we are working on a deferred proxy class, we first need to get
        # the real model class, so we can save a new instance if we need.
        if getattr(cls, '_deferred', False):
            cls = cls.__mro__[1]

        try:
            return ContentType.objects.get_for_model(cls)
        except ContentType.DoesNotExist:
            return None

    @classmethod
    def has_field(cls, field_name):
        """
        checks whether the current class has a database field with name field_name

        :returns: True, if exists, else False
        :rtype: bool
        """
        try:
            cls._meta.get_field_by_name(field_name)
            return True
        except FieldDoesNotExist:
            return False

    def clean(self):
        """
        Calls mixin_clean on all mixins of this model (only if mixin_clean method exists)
        """
        # call super-class clean() method
        super(BaseModel, self).clean()  # empty by default

        classes = self.__class__.__bases__

        for klass in classes:
            if not issubclass(klass, BaseModel):
                continue

            mixin_clean = getattr(klass, 'mixin_clean', None)
            if callable(mixin_clean):
                mixin_clean(self)

    def is_editable(self):
        """
        checks whether the current object is editable, by calling the editable() method of the manager
        In the case of editable() not being implemented by the manager object, True is returned

        :return: True if the element is editable, else False
        :rtype: bool
        """
        if self.pk and hasattr(self.__class__.objects, 'editable'):
            return self.__class__.objects.editable().filter(pk=self.pk).exists()

        return True

    def is_deletable(self):
        """
        checks whether the current object is deletable, by calling the deletable() method of the manager
        In the case of deletable() not being implemented by the manager object, True is returned

        :return: True if the element is deletable, else False
        :rtype: bool
        """
        if self.pk and hasattr(self.__class__.objects, 'deletable'):
            return self.__class__.objects.deletable().filter(pk=self.pk).exists()

        return True

    def is_viewable(self):
        """
        checks whether the current object is viewable, by calling the viewable() method of the manager
        In the case of viewable() not being implemented by the manager object, True is returned

        :return: True if the element is viewable, else False
        :rtype: bool
        """
        if self.pk and hasattr(self.__class__.objects, 'viewable'):
            return self.__class__.objects.viewable().filter(pk=self.pk).exists()

        return True

    def is_trashable(self):
        """
        checks whether the current object is trashable, by calling the trashable() method of the manager
        In the case of trashable() not being implemented by the manager object, True is returned

        :return: True if the element is trashable, else False
        :rtype: bool
        """
        if self.pk and hasattr(self.__class__.objects, 'trashable'):
            return self.__class__.objects.trashable().filter(pk=self.pk).exists()

        return True

    def is_restorable(self):
        """
        checks whether the current object is restorable, by calling the restorable() method of the manager
        In the case of restorable() not being implemented by the manager object, True is returned

        :return: True if the element is restorable, else False
        :rtype: bool
        """
        if self.pk and hasattr(self.__class__.objects, 'restorable'):
            return self.__class__.objects.restorable().filter(pk=self.pk).exists()

        return True

    # do not use @python_2_unicode_compatible !!!
    def __unicode__(self):
        return self.__str__()

    # enforce string method to be implemented, else we will end up getting weird errors in the django rest serializers
    def __str__(self):
        raise NotImplementedError


class LockMixin:
    """
    Mixin for elements that can be locked
    """

    def get_lock_element(self):
        """
        Returns the lock element
        :return:
        """
        from eric.projects.models import ElementLock

        return ElementLock.objects.for_model(
            self.__class__, self.pk
        ).filter(
            # must be locked within the last 15 minutes
            locked_at__gte=timezone.now() - timezone.timedelta(minutes=site_preferences.element_lock_time_in_minutes)
        )

    def has_lock(self):
        return self.get_lock_element().exists()

    def is_locked(self):
        """
        Whether this element is currently locked by another user or not
        :return:
        """
        return self.get_lock_element().exclude(
            # ignore if the element is locked by the current user
            locked_by=get_current_user()
        ).exists()

    def lock(self):
        """
        Lock an element
        :return:
        """
        # check if a lock exists already
        lock = self.get_lock_element().first()
        # update the lock if it does exist
        if lock:
            lock = self.update_lock(lock)
        # create a new one if it does not exist
        else:
            from eric.projects.models import ElementLock

            lock = ElementLock.objects.create(
                object_id=self.pk,
                content_type=self.get_content_type(),
                locked_by=get_current_user()
            )

        # remove all existing locks for this element
        self.remove_all_locks(except_pk_list=[lock.pk])

        return lock

    def unlock(self):
        """
        Unlock an element
        :return:
        """
        from eric.projects.models import ElementLock

        ElementLock.objects.for_model(
            self.__class__, self.pk
        ).delete()

    def update_lock(self, lock):
        """
        Update the lock
        :return:
        """
        try:
            lock.locked_at = timezone.now()
            lock.save()
        except IntegrityError as e:
            # ticket-284549 requires some additional debugging,
            # log the current state if there's an error

            from eric.projects.models import ElementLock

            elements = ElementLock.objects.for_model(self.__class__, self.pk)
            logger.error("ERROR: Error while updating lock")
            logger.error("ERROR: Currently there are {0} locks in place for this element".format(elements.count()))
            i = 0
            for el in elements:
                i = i + 1
                logger.error(
                    "    ElementLock {}: \n".format(i) +
                    "        ElementLock-pk = {} \n".format(el.pk) +
                    "        ElementLock-locked_at = {} \n".format(el.locked_at) +
                    "        Parent-object_type = {} \n".format(el.content_type) +
                    "        Parent-object_id = {} \n".format(el.object_id) +
                    "        Element-__str__ = {}".format(el)
                )

        return lock

    def remove_all_locks(self, except_pk_list=None):
        from eric.projects.models import ElementLock

        ElementLock.objects.for_model(
            self.__class__, self.pk
        ).exclude(pk__in=except_pk_list).delete()


class BaseManager(models.Manager):
    """Manager BaseManager

    This is the manager class all other managers should inherit from.
    """
    use_for_related_fields = True


class SoftDeleteQuerySetMixin(object):
    def not_deleted(self, *args, **kwargs):
        """
        Returns all not deleted objects (for soft delete)
        """
        return self.filter(deleted=False)

    def trashed(self, *args, **kwargs):
        """
        Returns all trashed (soft-deleted) objects
        """
        return self.filter(deleted=True)


class BaseQuerySet(models.QuerySet):
    """QuerySet BaseQuerySet

    This is the query set class all other query sets should inherit from.

    This queryset also checks the django permissions as follows:
    First, the permission name is "assembled" by using utils.get_permission_name (which essentially combines the
    name as $appLabel$.$permissionNname$_$modelName$). This means that you are required to implement the following
    three permissions for each model: view, change, delete
    """

    def assigned(self, *args, **kwargs):
        """
        Returns a `none` QuerySet on this implementation. Should be overridden and implemented by the inheriting
        QuerySet classes for modes that can be assigned to an user (e.g. tasks, appointments, ...).

        :rtype: models.QuerySet
        """
        return self.none()

    def viewable(self, *args, **kwargs):
        """
        Returns an `all` QuerySet if current user has the 'APP.view_MODEL' permission (whereas "APP" corresponds to the
        managed models app label and "MODEL" corresponds to the managed models name). Returns a `none` QuerySet else.

        :rtype: models.QuerySet
        """
        user = get_current_user()
        if user.has_perm(get_permission_name(self.model, 'view')):
            return self.all()
        return self.none()

    def editable(self, *args, **kwargs):
        """
        Returns an `all` QuerySet if current user has the 'APP.change_MODEL' permission (whereas "APP" corresponds to
        the managed models app label and "MODEL" corresponds to the managed models name). Returns a `none` QuerySet
        else.

        :rtype: models.QuerySet
        """
        user = get_current_user()
        if user.has_perm(get_permission_name(self.model, 'change')):
            return self.all()
        return self.none()

    def deletable(self, *args, **kwargs):
        """
        Returns an `all` QuerySet if current user has the 'APP.delete_MODEL' permission (whereas "APP" corresponds to
        the managed models app label and "MODEL" corresponds to the managed models name). Returns a `none` QuerySet
        else.

        :rtype: models.QuerySet
        """
        user = get_current_user()
        if user.has_perm(get_permission_name(self.model, 'delete')):
            return self.all()
        return self.none()


@receiver(pre_save)
def auto_clean_on_save(sender, instance, *args, **kwargs):
    """
    Automatically call the clean method aswell as validate_unique method when a .save() is called
    This validates the model and throws an exception if necessary

    WARNING: This is a rather `hacky` way of forcing Django Rest Framework to call the clean/validate_unique
     method for ModelSerializer
    """
    # ignore raw requests
    if kwargs.get('raw'):
        return

    instance.clean()


@deconstructible
class UploadToPathAndRename(object):
    """ Automatically rename the uploaded file to a random UUID.{extension} """

    def __init__(self, path):
        self.sub_path = path

    def __call__(self, instance, filename):
        from uuid import uuid4
        import os
        # get filename extension
        ext = filename.split('.')[-1]
        # set filename as random string
        filename = '{}.{}'.format(uuid4().hex, ext)
        # return the whole path to the file
        return os.path.join(self.sub_path, filename)
