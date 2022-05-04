/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from './user.interface';

export interface Relation<T = any, U = any> {
  display: string;
  pk: string;
  private: boolean;
  content_type_model: string;
  right_object_id: string;
  right_content_type_model: string;
  left_object_id: string;
  last_modified_at: string;
  right_content_type: number;
  created_at: string;
  right_content_object: T;
  left_content_type: number;
  last_modified_by: User;
  created_by: User;
  left_content_object: U;
  left_content_type_model: string;
  content_type: number;
  table_object: U;
}

export interface RelationPayload {
  left_content_type: number;
  left_object_id: string;
  right_content_type: number;
  right_object_id: string;
  private?: boolean;
}

// TODO: should only be RelationPayload and patch relevant data
export type RelationPutPayload = Relation;
