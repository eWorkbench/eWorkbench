#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import ldap
from django_auth_ldap.config import LDAPSearch, PosixGroupType, GroupOfNamesType

from eric.settings.base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '$$bk6ptiw@jcab1#y%cb^h-+nhjf_-lpokk@jqs-s7fh@3682t'

ANX_MONITORING_ACCESS_TOKEN = 'none'

DEBUG = True

NOTIFICATIONS_SETTINGS['MINIMUM_TIME_BETWEEN_EMAILS'] = timedelta(seconds=10)

# CORS Configuration
CORS_ORIGIN_REGEX_WHITELIST = (
    # localhost without port:
    r'^(http?://)?localhost$',
    r'^(http?://)?127\.0\.0\.1$',
    r'^(http?://)?0\.0\.0\.0$',
    # localhost with port:
    r'^(http?://)?localhost:(\d+)$',
    r'^(http?://)?127\.0\.0\.1:(\d+)$',
    r'^(http?://)?0\.0\.0\.0:(\d+)$',
    # workbench.local:
    r'^(http?://)?workbench.local:(\d+)$',  # localhost:any port
    # private network ranges:
    r'^(http?://)?10\.(\d+)\.(\d+)\.(\d+):(\d+)$',  # 10.x.x.x:any port
    r'^(http?://)?192\.168\.(\d+)\.(\d+):(\d+)$',  # 192.168.x.x:any port
)

AUTHENTICATION_BACKENDS = \
    ('django_auth_ldap.backend.LDAPBackend',) + AUTHENTICATION_BACKENDS

CACHES = {
    'default': {
        'BACKEND': 'redis_cache.RedisCache',
        'LOCATION': 'redis://redis:6379/0',
    },
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'HOST': 'db',
        'PORT': '5432',
        'NAME': 'eric',
        'USER': 'eric',
        'PASSWORD': 'eric'
    }
}

INTERNAL_IPS = ('127.0.0.1', '10.0.28.1')

# LDAP Configuration
AUTH_LDAP_SERVER_URI = "ldap://ldap-service"
AUTH_LDAP_BIND_DN = "cn=admin,dc=workbench,dc=local"
AUTH_LDAP_BIND_PASSWORD = "admin"
AUTH_LDAP_USER_SEARCH = LDAPSearch("ou=People,dc=workbench,dc=local", ldap.SCOPE_SUBTREE, "(uid=%(user)s)")

# assign all users that have organizational name (o) set to "employee" the group "User"
AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE = {
    "o": [
        {
            "value_regex": "^employee$",
            "group_name": "User"
        },
        {
            "value_regex": "^external$",
            "group_name": "External"
        }
    ]
}

# required attributes that are missing will cause an error log
AUTH_LDAP_REQUIRED_ATTRIBUTES = [
]

# user ldap attributes
# "user_attribute": "ldap_attribute"
AUTH_LDAP_USER_ATTR_MAP = {
}

# user profile ldap attributes
# "userprofile_attribute": "ldap_attribute"
AUTH_LDAP_PROFILE_ATTR_MAP = {
    "first_name": "description",
}

# defines workbench settings
WORKBENCH_SETTINGS.update({
    'url': 'http://localhost:4200/',
    'password_reset_url': 'http://localhost:4200/reset-password/{token}',
})

ADMINS = [
    ('First Admin', 'admin1@workbench.local'),
    ('Second Admin', 'admin2@workbench.local'),
]

CONTACT_ADMIN = [
    ('First Contact Admin', 'contact1@workbench.local'),
    ('Second Contact Admin', 'contact2@workbench.local'),
]

# EMail Settings (maildump server)
EMAIL_HOST = 'maildump'
EMAIL_PORT = 1025
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''

# increase DATA_UPLOAD_MAX_MEMORY_SIZE such that we can properly test WebDav
DATA_UPLOAD_MAX_MEMORY_SIZE = 500000000  # !!! DO NOT DO THIS IN PRODUCTION

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],
        },
    },
}

DSS_SETTINGS['CHECK_MOUNT_STATUS'] = False

# Celery and RabbitMQ Config
RABBITMQ_URL = 'amqp://admin:mypass@broker:5672'
CELERY_BROKER_URL = RABBITMQ_URL
CELERY_RESULT_BACKEND = 'rpc://'

# debug toolbar always enabled
DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': lambda x: DEBUG
}

# If set to true, a resource is made available which can be used to delete all workbench models
# Only use if you know what you are doing - data is permanently lost when called!
# CLEAN_ALL_WORKBENCH_MODELS = False
