#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.dmp.models import DmpFormData
from eric.shared_elements.models import File, Meeting, Note, Task

__all__ = [
    'DmpFormData',
    'File',
    'Meeting',
    'Note',
    'Task',
    'AFFECTED_MODELS_AND_FIELDS'
]

AFFECTED_MODELS_AND_FIELDS = {
    Note: 'content',
    File: 'description',
    Meeting: 'text',
    Task: 'description',
    DmpFormData: 'value',
}
