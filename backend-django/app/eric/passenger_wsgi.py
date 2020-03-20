#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
WSGI config for app project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/howto/deployment/wsgi/
"""

import os
import sys

env_name = 'venv'
python_version = 'python3.4'
django_settings = 'eric.settings.tum_test'


cwd = os.getcwd()
# set django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", django_settings)
# include virtualenv site-packages
sys.path.insert(0, os.path.join(cwd, '..', env_name, 'lib', python_version, 'site-packages'))

# start django wsgi application as usual
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
