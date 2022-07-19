#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import ldap
from django_auth_ldap.config import LDAPSearch

from eric.settings.base import *

# !!! You need to change this !!! Never copy a valid secret key in your GIT Repo !!!
# !!! see https://docs.djangoproject.com/en/1.10/ref/settings/#std:setting-SECRET_KEY
SECRET_KEY = ''
# !!! You need to change this !!! Never copy a valid secret key in your GIT Repo !!!

# the same is true for the monitoring access token
ANX_MONITORING_ACCESS_TOKEN = ''

# E-Mail Settings (maildump fake smtp server)
EMAIL_HOST = 'maildump.workbench.local'
EMAIL_PORT = 1025
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''

# ALLOWED_HOSTS = [
#     "myworkbenchdomain.com"
# ]

ADMINS = [
    ('My Admin Name', 'myadmin@mydomain.com'),
]

CONTACT_ADMIN = [
    ('My Workbench Team', 'contact@myworkbenchdomain.com'),
]

SERVER_EMAIL = "contact@myworkbenchdomain.com"

# disable debug mode for production environments
# DEBUG = False

# storage space quota for uploads (files, pictures)
# DEFAULT_QUOTA_PER_USER_MEGABYTE = 1000

# Database Config
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'HOST': 'db.workbench.local',
        'NAME': 'eric',
        'USER': 'eric',
        'PASSWORD': 'eric',
    }
}

# CORS Whitelist
CORS_ORIGIN_REGEX_WHITELIST = (
    '^(http?://)workbench\.local$',
    '^(http?://)workbench\.local:(\d+)$',  # workbench.local:any port
    '^(http?://)?localhost$',  # localhost
    '^(http?://)?127\.0\.0\.1$',  # 127.0.0.1
    '^(http?://)?0\.0\.0\.0$',  # 0.0.0.0
    '^(http?://)?localhost:(\d+)$',  # localhost:any port
    '^(http?://)?127\.0\.0\.1:(\d+)$',  # 127.0.0.1:any port
    '^(http?://)?0\.0\.0\.0:(\d+)$',  # 0.0.0.0:any port
)


# Workbench Settings
WORKBENCH_SETTINGS.update({
    'url': 'http://workbench.local:8080/app/',
    'project_file_upload_folder': os.path.join(MEDIA_ROOT, '%(filename)s'),
    'password_reset_url': 'http://workbench.local:8080/app/reset-password/{token}',
    'title': 'My Workbench',
    'email_from': SERVER_EMAIL
})

AUTHENTICATION_BACKENDS = (
    'django_auth_ldap.backend.LDAPBackend',
    'django.contrib.auth.backends.ModelBackend',
)

# LDAP Settings (if LDAP Authentication Backend is enabled)
AUTH_LDAP_SERVER_URI = "ldap://ldap.workbench.local"
AUTH_LDAP_BIND_DN = "cn=admin,dc=workbench,dc=local"
AUTH_LDAP_BIND_PASSWORD = "admin"
AUTH_LDAP_USER_SEARCH = LDAPSearch("ou=People,dc=workbench,dc=local", ldap.SCOPE_SUBTREE, "(uid=%(user)s)")
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
    # "ldapFirstNameAttribute",
    # "ldapLastNameAttribute",
]
# user ldap attributes
# "user_attribute": "ldap_attribute"
AUTH_LDAP_USER_ATTR_MAP = {
    # "email": "ldapAttribute"
}
# user profile ldap attributes
# "userprofile_attribute": "ldap_attribute"
AUTH_LDAP_PROFILE_ATTR_MAP = {
    # "first_name": "ldapAttribute",
    # "last_name": "...",
    # "phone": "...",
    # "country": "...",
    # "academic_title": "...",
    # "salutation": "...",
    # "email_others": "...",
    # "org_zug_mitarbeiter": "...",
    # "org_zug_mitarbeiter_lang": "...",
    # "org_zug_student": "...",
    # "org_zug_student_lang": "...",
    # "title_salutation": "...",
    # "title_pre": "...",
    # "title_post": "..."
}

INTERNAL_IPS = (
    '127.0.0.1',
)

# enable redis cache for production environments
# CACHES = {
#     'default': {
#         'BACKEND': 'redis_cache.RedisCache',
#         'LOCATION': '/tmp/redis.sock',
#     },
# }
# enable redis cache for dev environments (docker)
# CACHES = {
#     'default': {
#         'BACKEND': 'redis_cache.RedisCache',
#         'LOCATION': 'redis.workbench.local:6379',
#     },
# }

# activate logging for ldap
logger = logging.getLogger('django_auth_ldap')
logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.DEBUG)

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
