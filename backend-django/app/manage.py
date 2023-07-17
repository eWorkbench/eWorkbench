#!/usr/bin/env python
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eric.settings.docker")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
