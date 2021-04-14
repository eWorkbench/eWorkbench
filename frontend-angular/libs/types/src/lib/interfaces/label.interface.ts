/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { User } from './user.interface';

export interface Label {
  color: string;
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  display: string;
  font_color: string;
  last_modified_at: string;
  last_modified_by: User;
  name: string;
  pk: string;
}

export interface LabelPayload {
  name?: string;
  color: string;
}
