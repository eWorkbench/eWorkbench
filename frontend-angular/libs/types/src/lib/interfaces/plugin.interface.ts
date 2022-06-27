/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Metadata } from './metadata.interface';
import type { User } from './user.interface';

export interface PluginInstancePayload {
  pk?: string;
  title: string;
  plugin?: string;
  projects?: string[];
  metadata?: Metadata[];
}

export interface PluginDetails {
  created_at: string;
  last_modified_by: User;
  responsible_users: User[];
  display: string;
  title: string;
  placeholder_picture_mime_type: string;
  url: string;
  long_description: string;
  created_by: User;
  content_type_model: string;
  short_description: string;
  pk: string;
  responsible_users_pk: number[];
  content_type: number;
  path: string;
  last_modified_at: string;
  logo: string;
  download_placeholder_picture: string;
  is_accessible: boolean;
  iframe_height: number;
}

export interface PluginInstance {
  created_at: string | null;
  last_modified_by: User;
  picture: string | null;
  display: string;
  version_number: number;
  metadata: Metadata[];
  title: string;
  url: string;
  deleted: boolean;
  created_by: User;
  download_picture: string | null;
  plugin_details: PluginDetails;
  picture_size: number;
  content_type_model: string;
  auth_url: string;
  plugin: string;
  rawdata: string | null;
  pk: string;
  picture_mime_type: string;
  content_type: number;
  projects: string[];
  last_modified_at: string;
  rawdata_mime_type: string;
  rawdata_size: number;
  download_rawdata: string | null;
  is_favourite: boolean;
}

export interface PluginFeedbackPayload {
  pluginPk: string;
  subject: string;
  message: string;
  type: string;
}
