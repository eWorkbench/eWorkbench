/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { LabBookSection, LabBookSectionPayload } from '@eworkbench/types';
import { mockUser } from './user';

export const mockLabBookSectionPayload: LabBookSectionPayload = {
  title: 'Section Name',
  projects: [],
  date: '2021-01-05',
};

export const mockLabBookSection: LabBookSection = {
  child_elements: [],
  content_type: 72,
  content_type_model: 'labbooks.labbooksection',
  created_at: '2021-01-05T10:46:06.903664+01:00',
  created_by: mockUser,
  date: '2021-01-05',
  deleted: false,
  display: 'LabbookSection 2021-01-05 Section Name',
  last_modified_at: '2021-01-05T11:10:38.335480+01:00',
  last_modified_by: mockUser,
  pk: '5efee26c-8151-43aa-8037-c15ae71bddba',
  projects: [],
  title: 'Section Name',
  url: 'http://localhost:8000/api/labbooksections/5efee26c-8151-43aa-8037-c15ae71bddba/',
  version_number: 1,
};
