/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Label, LabelPayload } from '@eworkbench/types';
import { mockUser } from './user';

export const mockLabelPayload: LabelPayload = {
  color: 'rgba(50,50,50,1)',
  name: 'asd',
};

export const mockLabel: Label = {
  color: 'rgba(50,50,50,1)',
  content_type: 56,
  content_type_model: 'shared_elements.elementlabel',
  created_at: '2020-06-09T18:09:19.795623+02:00',
  created_by: mockUser,
  display: 'asd',
  font_color: '#FFF',
  last_modified_at: '2020-06-09T18:09:19.795681+02:00',
  last_modified_by: mockUser,
  name: 'asd',
  pk: 'dd75b0bc-7106-4b48-8da0-33f2dddcd1a9',
};
