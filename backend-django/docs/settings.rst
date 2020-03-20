.. _settings:

Settings
========

Basics
------

All settings are stored in :download:`app/eric/settings/base.py <../app/eric/settings/base.py>`. To overwrite settings,
you have to create a new file, e.g., ``production.py`` or ``live.py`` with the following content:

.. code:: python

    from eric.settings.base import *

    SECRET_KEY='please_generate_a_new_secret_key_here'

    # write your settings here

Important: You should ALWAYS define ``SECRET_KEY`` with a random key. You can read more about this on the `official
Django documentation <https://docs.djangoproject.com/en/1.10/ref/settings/#std:setting-SECRET_KEY>`_.

An example configuration is provided in :download:`app/eric/settings/example.py <../app/eric/settings/example.py>`.


Django Settings
---------------
For a full reference of Django specific settings, please consult the `official documentation
<https://docs.djangoproject.com/en/1.10/ref/settings/>`_.

* ``DEBUG`` (Default: ``False``)
   Please make sure to only set ``DEBUG = True`` when you are working on a local development environment.

* ``SECRET_KEY``
    You should ALWAYS define ``SECRET_KEY`` with a random key. You can read more about this on the `official
    Django documentation <https://docs.djangoproject.com/en/1.10/ref/settings/#std:setting-SECRET_KEY>`_.

* ``ALLOWED_HOSTS``
    You need to set the ``ALLOWED_HOSTS`` list to the hostname of the system that you are serving, e.g. ``ALLOWED_HOSTS = ["workbench.local"]``.
    This is to prevent `DNS rebind attacks in Django <https://docs.djangoproject.com/en/1.11/ref/settings/#allowed-hosts>`_.

* ``EMAIL_*`` - EMail Server Config
    ``EMAIL_HOST``, ``EMAIL_PORT``, ``EMAIL_HOST_USER``, ``EMAIL_HOST_PASSWORD``
    For instance, you could configure these to use `Maildump <https://github.com/ThiefMaster/maildump>`_.

* ``CACHES`` - Cache Configuration
    Django Supports Caching out of the box, and has support for caching servers like redis, which we recommend. See
    `Django Cache Configuration <https://docs.djangoproject.com/en/1.11/ref/settings/#std:setting-CACHES>`_.
    
    Example:

    .. code:: python

        CACHES = {
            'default': {
                'BACKEND': 'redis_cache.RedisCache',
                'LOCATION': '/tmp/redis.sock',
            },
        }

* ``DATABASE`` - Database Configuration
    See `Django Database Configuration <https://docs.djangoproject.com/en/1.11/ref/settings/#databases>`_.

* ``CORS_ORIGIN_REGEX_WHITELIST`` - Whitelist for CORS Requests
    This should include all the URLs (as REGEX) that need to access the backend. Example:

    .. code:: python

        CORS_ORIGIN_REGEX_WHITELIST = (
            '^(http?://)workbench\.local$',
            '^(http?://)?localhost$', # localhost
            '^(http?://)?127\.0\.0\.1$', # 127.0.0.1
            '^(http?://)?localhost:(\d+)$', # localhost:any port
        )

* ``ADMIN`` and ``CONTACT_ADMIN``
    Provide a list of admin and contact admins. Contact admins will receive emails when the user fills out the contact form while admins will receive emails on exceptions/errors within the project

    .. code:: python

        ADMIN = [
            ('Server Admin', 'admin@workbench.local'),
        ]

        CONTACT_ADMIN = [
            ('Contact Admin', 'contact@workbench.local'),
        ]

* ``DEFAULT_QUOTA_PER_USER_MEGABYTE`` (e.g., 100) - Default Quota per User in Megabyte (see :ref:`storageQuota`).


eRIC Workbench Settings
-----------------------

eRIC Workbench has a separate configuration object which looks roughly like this:

.. code:: python

    # defines workbench settings
    WORKBENCH_SETTINGS = {
        'url': 'http://workbench.local/ericworkbench-frontend/app/',
        'password_reset_url': 'http://workbench.local/app/#/password_reset/{token}',
        'project_file_upload_folder': os.path.join(MEDIA_ROOT, 'projects_storage', '%(filename)s'),
        'download_token_validity_in_hours': 1,
        'default_menu_entries': [
            ...
        ]
    }

Here we can define the frontend URL as well as the password reset URL, the title and the outgoing e-mail address. To
overwrite these settings, we recommend to use pythons built-in ``update`` method:

.. code:: python

    # Workbench Settings
    WORKBENCH_SETTINGS.update({
        'url': 'http://workbench.local/',
        'password_reset_url': 'http://workbench.local/#/password_reset/{token}',
    })

- ``url``
  Base URL of the workbench, used when sending emails
- ``password_reset_url``
  URL for a password reset; used when sending password reset emails
- ``project_file_upload_folder``
  Where to store files that are uploaded
- ``download_token_validity_in_hours``
  How long a download/export JWT (JSON Web Token) should be valid, see :ref:`downloadAndExports`.
- ``default_menu_entries``
  Default menu entries for the sortable menu, see :ref:`sortableMenu`.


In addition, the global setting ``AVATAR_SIZE`` (default: ``((1024,1024))``) can be changed to change the default avatar size.

LDAP Settings
-------------

We are using the `Django Auth Ldap <https://pythonhosted.org/django-auth-ldap/>`_ package, with the addition of the
following ``AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE`` setting:

.. code:: python

    AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE = {
        "someAttribute": {
            "value_regex": "^someValue$",
            "group_name": "User"
        }
    }

This describes that if the LDAP attribute ``someAttribute`` matches the regular expression ``value_regex``, then group
``User`` should be applied. This also implies that the group should be removed if the attribute does not match.

An example config for the provided :download:`docker compse file <../docker-compose.yml>` looks like this:

.. code:: python

    # LDAP Configuration
    AUTH_LDAP_SERVER_URI = "ldap://0.0.0.0"

    AUTH_LDAP_BIND_DN = "cn=admin,dc=workbench,dc=local"
    AUTH_LDAP_BIND_PASSWORD = "admin"

    AUTH_LDAP_USER_SEARCH = LDAPSearch("ou=People,dc=workbench,dc=local",
        ldap.SCOPE_SUBTREE, "(uid=%(user)s)")

    AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE = {
        "o": {
            "value_regex": "^employee$",
            "group_name": "User"
        }
    }

