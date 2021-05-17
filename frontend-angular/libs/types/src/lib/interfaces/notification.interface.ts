/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ContentTypeModels } from './content-type-model.interface';
import { User } from './user.interface';

export interface Notification {
  content_type: number;
  content_type_model: ContentTypeModels;
  created_at: string;
  created_by: User;
  display: string;
  last_modified_at: string;
  last_modified_by: User;
  message: string;
  object_id: string;
  pk: string;
  read: boolean;
  title: string;
}

export interface NotificationConfiguration {
  allowed_notifications: string[];
  content_type?: number;
  content_type_model?: string;
  display?: string;
  pk: string;
}
