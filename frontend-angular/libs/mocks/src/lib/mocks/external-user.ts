/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { User } from '@eworkbench/types';

export const mockExternalUser: User = {
  pk: 163,
  username: 'test',
  email: 'test@gmail.com',
  is_active: true,
  is_staff: false,
  last_login: null,
  userprofile: {
    first_name: '',
    last_name: '',
    anonymized: false,
    academic_title: '',
    additional_information: '',
    country: '',
    email_others: [],
    org_zug_mitarbeiter: [],
    org_zug_mitarbeiter_lang: [],
    org_zug_student: [],
    org_zug_student_lang: [],
    phone: '',
    salutation: '',
    title_salutation: '',
    title_pre: '',
    title_post: '',
    type: 'u',
    avatar: 'http://workbench.local:8000/static/uploaded_media/unknown_user.gif',
    website: null,
  },
};
