/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from '@eworkbench/types';

export const mockUser: User = {
  available_storage_megabyte: 100,
  used_storage_megabyte: 50,
  email: 'alias@domain.com',
  is_active: true,
  is_staff: false,
  permissions: [],
  pk: 1,
  username: 'user',
  userprofile: {
    academic_title: '',
    additional_information: '',
    anonymized: false,
    country: 'Germany',
    first_name: 'User',
    last_name: 'Name',
    org_zug_mitarbeiter_lang: ['Affiliation 1', 'Affiliation 2', 'Affiliation 3'],
    org_zug_student_lang: ['Affiliation 1', 'Affiliation 2', 'Affiliation 3'],
    phone: '',
    website: null,
    ui_settings: {
      confirm_dialog: {
        'SkipDialog-ConvertTiff': false,
        'SkipDialog-DuplicateProject': false,
        'SkipDialog-LeaveProject': false,
        'SkipDialog-RemoveDirectory': false,
        'SkipDialog-RemoveElementFromLabbook': false,
        'SkipDialog-Trash': false,
      },
    },
  },
};

export const mockUserWithoutNames: User = {
  available_storage_megabyte: 100,
  used_storage_megabyte: 50,
  email: 'alias@domain.com',
  is_active: true,
  is_staff: false,
  permissions: [],
  pk: 1,
  username: 'user',
  userprofile: {
    academic_title: '',
    additional_information: '',
    anonymized: false,
    country: 'Germany',
    first_name: '',
    last_name: '',
    org_zug_mitarbeiter_lang: [],
    org_zug_student_lang: [],
    phone: '',
    website: null,
    ui_settings: null,
  },
};

export const mockAnonymousUser: User = {
  available_storage_megabyte: 100,
  used_storage_megabyte: 50,
  email: 'alias@domain.com',
  is_active: true,
  is_staff: false,
  permissions: [],
  pk: 1,
  username: 'user',
  userprofile: {
    academic_title: '',
    additional_information: '',
    anonymized: true,
    country: 'Germany',
    first_name: 'User',
    last_name: 'Name',
    org_zug_mitarbeiter_lang: [],
    org_zug_student_lang: [],
    phone: '',
    website: null,
    ui_settings: null,
  },
};
