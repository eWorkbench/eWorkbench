#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
Django settings for app project.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.2/ref/settings/
"""

import logging.config
import os
import sys

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
from datetime import timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = [
    '*',
]

ADMINS = [
]

CONTACT_ADMIN = [
]

# DEFAULT_FROM_EMAIL -- use the following instead:
# from eric.site_preferences.models import options as site_preferences
# sender = site_preferences.email_from

DSS_SETTINGS = {
    'MOUNT_PATH': '/dss',
    'METADATA_FILE_NAME': 'metadata.json',
    'CHECK_MOUNT_STATUS': True,
    'ERROR_EMAIL_RECEIVER_CLIENT': 'eric@ub.tum.de',
    'ERROR_EMAIL_RECEIVER_INTERNAL': 'cus-tum.eworkbench@anx.dev',
    'CHECK_GLOBUS_RABBITMQ_QUEUE': False,
    'GLOBUS_RABBITMQ_HOST': '',
    'GLOBUS_RABBITMQ_PORT': '',
    'GLOBUS_RABBITMQ_VIRTUAL_HOST': '',
    'GLOBUS_RABBITMQ_QUEUE': '',
    'GLOBUS_RABBITMQ_USER': '',
    'GLOBUS_RABBITMQ_PASSWORD': '',
    'GLOBUS_RABBITMQ_SSL_CA_CERT': '',
    'GLOBUS_RABBITMQ_MESSAGE_FETCH_SIZE': '',
}

MAX_FILE_SIZE_PER_USE = "50G"

DEFAULT_QUOTA_PER_USER_MEGABYTE = 100

INSTALLED_APPS = [
    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',

    # django channels
    'channels',

    # dynamic configuration
    'dbsettings',
    'dbbackup',
    'memoize',

    # anexia version monitoring
    'anexia_monitoring',

    # Django REST Framework
    'corsheaders',
    'rest_framework',
    'django_rest_multitokenauth',
    'django_rest_passwordreset',
    'drf_yasg',

    # 3rd party
    'django_filters',
    'django_userforeignkey',
    'django_changeset',

    # Admin
    'django_json_widget',
    'adminsortable2',
    'django_admin_listfilter_dropdown',
    'admin_auto_filters',
    'rangefilter',

    # CalDav
    'djangodav',
    'djradicale',

    # Eric
    'eric.jwt_auth',
    'eric.base64_image_extraction',
    'eric.cms',
    'eric.contact_form',
    'eric.userprofile',
    'eric.core',
    'eric.short_url',
    'eric.user_manual',
    'eric.site_preferences',
    'eric.projects',
    'eric.favourites',
    'eric.model_privileges',
    'eric.relations',
    'eric.shared_elements',
    'eric.dmp',
    'eric.labbooks',
    'eric.kanban_boards',
    'eric.pictures',
    'eric.plugins',
    'eric.texttemplates',
    'eric.drives',
    'eric.search',
    'eric.sortable_menu',
    'eric.dashboard',
    'eric.notifications',
    'eric.websockets',
    'eric.versions',
    'eric.caldav',
    'eric.metadata',
    'eric.third_party_customizations',
    'eric.ms_office_handling',
    'eric.integration',
    'eric.openapi',
    'eric.db_logging',
    'eric.dss',
    'eric.appointments',
    'eric.resources',
    'eric.faq',

    # CKEditor needs to be at the bottom, so eric.core can overwrite the ckeditor-init.js file
    'ckeditor',
    'ckeditor_uploader',

    # django-mptt: Modified Preorder Tree Traversal
    'mptt',
]
# Application definition
ASGI_APPLICATION = "eric.routing.application"

AUTH_USER_MODEL = 'auth.User'

# django middlewares
MIDDLEWARE = [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'eric.core.middlewares.HTTPXForwardedForMiddleware',
]

# do not trust any proxies here
HTTP_X_FORWARDED_FOR_TRUSTED_PROXIES = []

# debug toolbar
try:
    import debug_toolbar

    INSTALLED_APPS.append('debug_toolbar')
    MIDDLEWARE.append('debug_toolbar.middleware.DebugToolbarMiddleware')
except ImportError:
    pass

# custom middlewares
MIDDLEWARE += [
    'django_userforeignkey.middleware.UserForeignKeyMiddleware',
    'eric.core.middlewares.RequestTimeLoggingMiddleware',
    'eric.core.middlewares.DisableClientSideCachingMiddleware',
    'eric.core.middlewares.DisableChangeSetForReadOnlyRequestsMiddleware',
    'django_request_cache.middleware.RequestCacheMiddleware',
]

ROOT_URLCONF = 'eric.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'eric.wsgi.application'

# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/
LANGUAGE_CODE = 'en'
TIME_ZONE = 'Europe/Berlin'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/
STATIC_URL = '/static/'
MEDIA_URL = '/uploaded_media/'

STATIC_ROOT = os.path.join(os.path.dirname(BASE_DIR), 'htdocs', 'static')
MEDIA_ROOT = os.path.join(STATIC_ROOT, 'uploaded_media')

# avatar size
AVATAR_SIZE = (512, 512)

# CORS Configuration (adding localhost per default)
CORS_ORIGIN_REGEX_WHITELIST = (
    r'^(http?://)?localhost$',  # localhost
    r'^(http?://)?127\.0\.0\.1$',  # 127.0.0.1
    r'^(http?://)?0\.0\.0\.0$',  # 0.0.0.0
    r'^(http?://)?localhost:(\d+)$',  # localhost:any port
    r'^(http?://)?workbench\.local:(\d+)$',  # localhost:any port
    r'^(http?://)?127\.0\.0\.1:(\d+)$',  # 127.0.0.1:any port
    r'^(http?://)?0\.0\.0\.0:(\d+)$',  # 0.0.0.0:any port
)

CORS_EXPOSE_HEADERS = (
    'Filename',
    'Content-Type',
    'Content-Disposition'
)

CORS_ALLOW_CREDENTIALS = True

# REST Framework Configuration
REST_FRAMEWORK = {
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend', ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'django_rest_multitokenauth.coreauthentication.MultiTokenAuthentication',
        'eric.jwt_auth.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework_xml.parsers.XMLParser',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
        'rest_framework_xml.renderers.XMLRenderer',
    ),
    'EXCEPTION_HANDLER': 'eric.core.rest.custom_exception_handler.custom_exception_handler',
    # set pagination default stuff
    'PAGE_SIZE': sys.maxsize,
    'MAX_PAGE_SIZE': sys.maxsize,
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'DEFAULT_THROTTLE_RATES': {
        'user': '300/day'
    }
}

ROTATING_FILE_HANDLER_CLASS = 'logging.handlers.RotatingFileHandler'
TIMED_ROTATING_FILE_HANDLER_CLASS = 'logging.handlers.TimedRotatingFileHandler'
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
        'verbose': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: \'%(funcName)s\' in \'%(pathname)s\' line \'%(lineno)d\':'
                      ' %(message)s'
        },
        'django.server': {
            '()': 'django.utils.log.ServerFormatter',
            'format': '[{server_time}] {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'db': {
            'level': 'ERROR',
            'class': 'eric.db_logging.db_log_handler.DatabaseLogHandler',
        },
        'file': {
            'class': TIMED_ROTATING_FILE_HANDLER_CLASS,
            'filename': os.path.join(BASE_DIR, 'logs', 'application.log'),
            'when': 'D',
            'backupCount': 14,
            'formatter': 'verbose',
        },
        'file_request_time_middleware': {
            'class': ROTATING_FILE_HANDLER_CLASS,
            'filename': os.path.join(BASE_DIR, 'logs', 'request_time_middleware.log'),
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 25,
            'formatter': 'simple',
        },
        'ldap': {
            'class': TIMED_ROTATING_FILE_HANDLER_CLASS,
            'filename': os.path.join(BASE_DIR, 'logs', 'ldap.log'),
            'when': 'D',
            'backupCount': 7,
            'formatter': 'standard',
        },
        'console': {
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
        },
        'js_errors': {
            'class': TIMED_ROTATING_FILE_HANDLER_CLASS,
            'when': 'D',
            'backupCount': 7,
            'filename': os.path.join(BASE_DIR, 'logs', 'js_errors.log'),
            'formatter': 'standard',
        },
        'file_contact_form': {
            'class': ROTATING_FILE_HANDLER_CLASS,
            'filename': os.path.join(BASE_DIR, 'logs', 'contact_form.log'),
            'maxBytes': 1024 * 1024 * 5,
            'backupCount': 25,
            'formatter': 'verbose',
        },
        'django.server': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'django.server',
        },
    },
    'loggers': {
        '': {
            'handlers': ['file', 'console', 'db', ],
            'level': 'INFO',
            'formatter': 'standard',
        },
        'eric': {
            'level': 'DEBUG',
            'formatter': 'verbose',
        },
        'js_errors': {
            'handlers': ['js_errors', ],
            'level': 'DEBUG',
        },
        'django.middleware.request_time_logging': {
            'handlers': ['file_request_time_middleware', ],
            'level': 'DEBUG',
            'propagate': False,
        },
        # put LDAP logs into separate file
        'django_auth_ldap': {
            'handlers': ['ldap', 'console', ],
            'level': 'INFO',
            'propagate': False,
        },
        'eric.ldap': {
            'handlers': ['ldap', 'console', ],
            'level': 'WARNING',
            'propagate': False,
        },
        # put ContactForm logs into separate file
        'eric.contact_form.views': {
            'handlers': ['file_contact_form', ],
            'level': 'DEBUG',
        },
        # limit logging of libraries
        'django': {
            'level': 'DEBUG',
            'handlers': ['console', 'file', ],
        },
        'django.server': {
            'handlers': ['django.server', ],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {'level': 'INFO', },
        'django.utils.autoreload': {'level': 'INFO', },
        'django.template': {'level': 'INFO', },
        'django_userforeignkey': {'propagate': False},
        'urllib3.connectionpool': {'level': 'WARNING', },
        'asyncio': {'level': 'INFO', },
        'git.cmd': {'level': 'WARNING', },
    },
}

# completely overwrite default logging settings
# https://docs.djangoproject.com/en/2.2/topics/logging/#disabling-logging-configuration
logging.config.dictConfig(LOGGING)

DB_LOGGING_SETTINGS = {
    'ADMIN_LIST_PER_PAGE': 30,
    'ENABLE_FORMATTER': False,
    'EXCLUDED_LOGGERS': ['django.channels.server', ]
}

AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
)

FILE_UPLOAD_HANDLERS = [
    'eric.projects.models.models.FileSystemStorageLimitByUserUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]

# CKEditor config
# upload path relative to media_root
CKEDITOR_UPLOAD_PATH = "ckeditor_uploads"
CKEDITOR_JQUERY_URL = '//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js'
CKEDITOR_ALLOW_NONIMAGE_FILES = False
CKEDITOR_CONFIGS = {
    'awesome_ckeditor': {
        'skin': 'moono',
        # 'skin': 'office2013',
        'toolbar_DmpFormFieldsEditorConfig': [
            {'name': 'basicstyles',
             'items': ['Bold', 'Italic', 'Underline', 'Strike']},
            {'name': 'paragraph',
             'items': ['NumberedList', 'BulletedList', '-', 'Image', '-', 'Outdent', 'Indent', '-',
                       'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock',
                       '-', 'Blockquote', 'HorizontalRule']
             },
            {'name': 'format', 'items': ['PasteFromWord', '-', 'RemoveFormat']},
            {'name': 'links', 'items': ['Link', 'Unlink']},
            '/',
            {'name': 'styles', 'items': ['Styles', 'Format', 'Font', 'FontSize']},
            {'name': 'colors', 'items': ['TextColor', 'BGColor']},
            {'name': 'view', 'items': [
                'Maximize',
            ]},
        ],
        'toolbar': 'DmpFormFieldsEditorConfig',
        'extraPlugins': ','.join(
            [
                # your extra plugins here
                'autolink',
                'clipboard',
                'widget',
                'lineutils',
                'uploadimage'
            ]),
    }
}

# EMail Settings (maildump server)
EMAIL_HOST = 'localhost'
EMAIL_PORT = 1025
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''

EMAIL_RECIPIENT_FOR_NEW_METADATA_FIELDS = 'metadata-admin@workbench.local'

NOTIFICATIONS_SETTINGS = {
    # the user will not receive emails for new notifications until the defined time between has passed
    'MINIMUM_TIME_BETWEEN_EMAILS': timedelta(minutes=5),

    # notifications that will always be sent in a single email (no aggregation)
    # see `eric.notifications.models.models.NotificationConfiguration` class for all available notification keys
    'SINGLE_MAIL_NOTIFICATIONS': [
        'MAIL_CONF_MEETING_CONFIRMATION',  # appointment confirmation mails for the creator
        'NOTIFICATION_CONF_MEETING_USER_CHANGED',  # appointment confirmation mails for attending users
    ],
}

# Timespan a password reset token is valid (also used for user invites)
DJANGO_REST_MULTITOKENAUTH_RESET_TOKEN_EXPIRY_TIME = 72  # hours

# defines workbench settings
WORKBENCH_SETTINGS = {
    'url': 'http://workbench.local/',
    'password_reset_url': 'http://workbench.local/reset-password/{token}',
    'notification_url': '{workbench_url}notifications/{notification_pk}',
    'project_file_upload_folder': os.path.join(MEDIA_ROOT, 'projects_storage', '%(filename)s'),
    # menu entries for the horizontal menu
    'default_menu_entries': [
        {
            # labbooks
            'route': 'labbook-list',
            'ordering': 0,
            'menu_entry_parameters': [],
            'visible': True
        },
        # {
        #     # my tasks
        #     'route': 'task-list',
        #     'ordering': 1,
        #     'menu_entry_parameters': [
        #         {
        #             'name': 'showOnlyMyElements',
        #             'value': '1'
        #         }
        #     ],
        #     'visible': True
        # },
        {
            # tasks
            'route': 'task-list',
            'ordering': 2,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # kanbanboards
            'route': 'kanbanboard-list',
            'ordering': 3,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # projects
            'route': 'project-list',
            'ordering': 4,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # contacts
            'route': 'contact-list',
            'ordering': 5,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # Schedule / Calendar
            'route': 'schedule',
            'ordering': 6,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # Meetings
            'route': 'meeting-list',
            'ordering': 7,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # pictures
            'route': 'picture-list',
            'ordering': 8,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # drives
            'route': 'drive-list',
            'ordering': 9,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # files
            'route': 'file-list',
            'ordering': 10,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # comments (notes)
            'route': 'note-list',
            'ordering': 11,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # last activities (history)
            'route': 'history-list',
            'ordering': 12,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # DMPs
            'route': 'dmp-list',
            'ordering': 13,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # resources
            'route': 'resource-list',
            'ordering': 14,
            'menu_entry_parameters': [],
            'visible': True
        },
        {
            # plugin instances
            'route': 'plugininstance-list',
            'ordering': 15,
            'menu_entry_parameters': [],
            'visible': True
        },
    ]
}

JWT_AUTH_SETTINGS = {
    'default_expiring_token_validity_in_hours': 1,
}

PLUGINS_SETTINGS = {
    'plugin_api_token_validity_in_hours': 24,
}

# User groups for resource group availability
PUBLIC_USER_GROUPS = ['User', 'Student', 'External']

# some extra configuration parameters for django-changeset
DJANGO_CHANGESET_SELECT_RELATED = ["user", "user__userprofile", "user__user_storage_limit"]

# Backup Config
DBBACKUP_STORAGE = 'django.core.files.storage.FileSystemStorage'
DBBACKUP_STORAGE_OPTIONS = {'location': os.path.join(BASE_DIR, "..", "backups")}

# HTMLField
# Acceptable html tags, attributes and styles. Others are removed before saving
# if the HTML field is marked as safe.
ACCEPTABLE_ELEMENTS = (
    'a', 'abbr', 'acronym', 'address', 'area', 'aria-label', 'b', 'big',
    'blockquote', 'br', 'button', 'caption', 'center', 'cite', 'code', 'col',
    'colgroup', 'dd', 'del', 'dfn', 'dir', 'div', 'dl', 'dt', 'em',
    'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img',
    'ins', 'kbd', 'label', 'legend', 'li', 'map', 'menu', 'ol',
    'p', 'pre', 'q', 's', 'samp', 'small', 'span', 'strike',
    'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th',
    'thead', 'tr', 'tt', 'u', 'ul', 'var', 'iframe', 'section', 'article',
)

ACCEPTABLE_ATTRIBUTES = (
    'abbr', 'accept', 'accesskey',
    'action', 'align', 'alt', 'axis', 'border', 'cellpadding', 'cellspacing',
    'char', 'charoff', 'charset', 'checked', 'cite', 'class', 'clear', 'cols',
    'colspan', 'color', 'compact', 'coords', 'data-mlang', 'data-equation', 'datetime', 'dir',
    'enctype', 'for', 'headers', 'height', 'href', 'hreflang', 'hspace',
    'id', 'ismap', 'label', 'lang', 'longdesc', 'maxlength', 'method',
    'multiple', 'name', 'nohref', 'noshade', 'nowrap', 'prompt',
    'rel', 'rev', 'rows', 'rowspan', 'role', 'rules', 'scope', 'shape', 'size', 'style',
    'span', 'src', 'start', 'summary', 'tabindex', 'target', 'title', 'type',
    'usemap', 'valign', 'value', 'vspace', 'width',
)

ACCEPTABLE_STYLES = (
    'background-color', 'background', 'background-image', 'background-position', 'background-size', 'background-repeat',
    'background-attachment', 'background-origin', 'background-clip',
    'font-family', 'font-size', 'font-weight', 'font-style', 'color',
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'line-height',
    'text-decoration', 'text-transform', 'text-align', 'border', 'border-style', 'border-width',
    'border-top', 'border-bottom', 'border-left', 'border-right', 'border-top-style',
    'border-bottom-style', 'border-left-style', 'border-right-style', 'border-top-width',
    'border-bottom-width', 'border-left-width', 'border-right-width',
    'border-color',
    'border-top-color', 'border-bottom-color', 'border-left-color', 'border-spacing', 'border-collapse',
    'border-right-color',
    'border-radius',
    'vertical-align', 'clear', 'float',
    'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
    'outline',
    'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
    'list-style-type',

)

REMOVE_WITH_CONTENT = ('script', 'object', 'embed', 'style', 'form',)

PRESERVE_STYLES_WHITESPACE = True

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

# Password validation
# https://docs.djangoproject.com/en/1.11/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

# hide weasyprint errors
import warnings

warnings.filterwarnings("ignore", ".*There are known rendering problems with Cairo.*")
warnings.filterwarnings("ignore", ".*There are known rendering problems and missing features with cairo.*")
warnings.filterwarnings("ignore", ".*@font-face support needs Pango.*")

####################################################
# Caldav (Django Radicale) Configuration           #
####################################################
DJRADICALE_CONFIG = {
    'server': {
        'base_prefix': '/caldav/',
        'realm': 'Workbench - Password Required',
    },
    'encoding': {
        'request': 'utf-8',
        'stock': 'utf-8',
    },
    # use our custom auth handler
    'auth': {
        'type': 'custom',
        'custom_handler': 'eric.caldav.authentication',
    },
    # use a custom permission/rights/privileges class
    'rights': {
        'type': 'custom',
        'custom_handler': 'djradicale.rights.django',
    },
    # use our storage class for storing meetings in a database
    'storage': {
        'type': 'custom',
        'custom_handler': 'eric.caldav.storage',
    },
    'well-known': {
        # ToDo: this is not correct
        'carddav': '/pim/%(user)s/addressbook.vcf',
        'caldav': '/pim/%(user)s/calendar.ics',
    },
}

DJRADICALE_RIGHTS = {
    'rw': {
        'user': '.+',
        'collection': r'^%(login)s/[a-z0-9\.\-_]+.(vcf|ics)$',
        'permission': 'rw',
    },
    'rw-root': {
        'user': '.+',
        'collection': 'default',
        'permission': 'rw',
    },
}

from radicale import ical

# what ical types are supported within radicale
DJRADICALE_ICAL_TYPES = (
    ical.Event,
    ical.Todo,
    ical.Journal,
    ical.Card,
    ical.Timezone,
)

SWAGGER_SETTINGS = {
    'DEFAULT_AUTO_SCHEMA_CLASS': 'eric.openapi.customization.CustomAutoSchema',
    'SECURITY_DEFINITIONS': {
        'eWorkbench API Token': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        },
    },
}

# If set to true, a resource is made available which can be used to delete all workbench models
# Only use if you know what you are doing - data is permanently lost when called!
# CLEAN_ALL_WORKBENCH_MODELS = False

LOGIN_URL = '/login/'
LOGOUT_URL = '/logout/'
