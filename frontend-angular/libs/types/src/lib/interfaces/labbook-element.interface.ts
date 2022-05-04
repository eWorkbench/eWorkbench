/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface LabBookElement<T> {
  child_object: T;
  child_object_content_type: number;
  child_object_content_type_model: string;
  child_object_id: string;
  content_type: number;
  content_type_model: string;
  display: string;
  lab_book_id: string;
  num_related_comments?: number;
  num_relations?: number;
  pk: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface LabBookElementEvent {
  childObjectId: string;
  childObjectContentType: number;
  childObjectContentTypeModel: string;
  parentElement: string;
  position: 'top' | 'bottom';
  height?: number;
}

export interface LabBookElementPayload {
  pk?: string;
  child_object_content_type?: number;
  child_object_id?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
}
