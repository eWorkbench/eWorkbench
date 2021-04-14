/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RecentChanges } from '@eworkbench/types';

export const mockHistory: RecentChanges = {
  pk: 'c67e271b-c3c8-4926-a04a-a4d4a6fbac13',
  user: {
    pk: 150,
    username: 'testuser',
    email: 'testuser@domain.com',
    is_active: true,
    is_staff: true,
    last_login: '2020-08-25T14:43:10.244975+02:00',
    userprofile: {
      first_name: 'Test',
      last_name: 'User',
      anonymized: false,
      academic_title: 'Mag.',
      additional_information: 'Something about me',
      country: 'Österreich',
      email_others: [],
      org_zug_mitarbeiter: [],
      org_zug_mitarbeiter_lang: ['Employee affiliation 1', 'Employee affiliation 2', 'Employee affiliation 3'],
      org_zug_student: [],
      org_zug_student_lang: ['Student affiliation 1', 'Student affiliation 2', 'Student affiliation 3'],
      phone: '+43 123 4567896342',
      salutation: '',
      title_salutation: '',
      title_pre: '',
      title_post: '',
      type: 'u',
      avatar: '',
      website: '',
    },
  },
  object_type: { id: 41, app_label: 'labbooks', model: 'labbook' },
  object_uuid: 'bc7e77f5-bffe-443f-b9c9-a879bd036bc3',
  changeset_type: 'U',
  date: '2020-08-27T14:48:46.037379+02:00',
  change_records: [{ field_name: 'title', old_value: 'LabBook', new_value: 'Big LabBook' }],
};
