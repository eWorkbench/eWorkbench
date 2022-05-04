/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Metadata } from './metadata.interface';
import type { User } from './user.interface';

export interface PicturePayload {
  title: string;
  height: number;
  width: number;
  aspectRatio: number;
  background_image: globalThis.File | Blob | string | null;
  projects?: string[];
  metadata?: Metadata[];
}

export interface SketchPayload {
  title: string;
  height: number;
  width: number;
  rendered_image: globalThis.File | Blob | string;
  shapes_image?: globalThis.File | Blob | string | null;
  projects?: string[];
}

export interface ConvertTiffPayload {
  file: Blob;
}

export interface PictureEditorPayload {
  background_image: Blob;
  shapes_image: Blob;
  width: number;
  height: number;
  rendered_image: Blob;
}

export interface Picture {
  container_id: string | null;
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  deleted: boolean;
  description: string;
  display: string;
  download_background_image: string;
  download_rendered_image: string;
  download_shapes: string;
  height: number;
  width: number;
  last_modified_at: string;
  last_modified_by: User;
  metadata: Metadata[];
  pk: string;
  projects: string[];
  title: string;
  url: string;
  version_number: number;
  is_favourite: boolean;
}
