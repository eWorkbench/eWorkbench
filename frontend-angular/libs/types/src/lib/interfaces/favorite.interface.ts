/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Favorite<T> {
  content_object: T;
  content_type: number;
  content_type_model: string;
  content_type_pk: number;
  created_at: string;
  display: string;
  object_id: string;
  pk: string;
  user_id: number;
}
