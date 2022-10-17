/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from './user.interface';

export interface Metadata {
  id?: string;
  added?: boolean;
  deleted?: boolean;
  content_type?: number;
  content_type_model?: string;
  display?: string;
  field?: string;
  field_info?: MetadataField;
  ordering?: number;
  pk?: string;
  values?: any;
}

export interface MetadataFieldTypeSettings {
  final?: boolean;
  answers?: string[];
  multiple_select?: boolean;
  custom_input?: string | null;
  custom_input_selected?: boolean;
  decimals?: number;
  thousands_separator?: boolean;
  symbol?: string;
}

export interface MetadataPayload {
  name: string | null;
  description: string | null;
  base_type: string | null;
  type_settings: MetadataPayloadTypeSettings;
}

export interface MetadataPayloadTypeSettings {
  final?: boolean;
  answers?: string[];
  multiple_select?: boolean;
  decimals?: number | null;
  thousands_separator?: boolean;
  symbol?: string | null;
}

export interface MetadataField {
  base_type?: string;
  content_type?: number;
  content_type_model?: string;
  created_at?: string;
  created_by?: User;
  description?: string;
  display?: string;
  last_modified_at?: string;
  last_modified_by?: User;
  name?: string;
  pk?: string;
  type_settings?: MetadataFieldTypeSettings;

  uniqueHash?: string;
  added?: boolean;
  showCheckbox?: boolean;
  showRadio?: boolean;
  operator?: string;
  values?: any;
  combinationOperator?: string;
}

export interface MetadataSearchParameterAnswers {
  answer: string;
  selected?: boolean;
}

export interface MetadataSearchParameterValues {
  answers?: MetadataSearchParameterAnswers[];
  value?: string | number;
  custom_input?: string | null;
  single_selected?: boolean;
  custom_input_selected?: boolean;
  numerator?: number;
  denominator?: number;
  x?: string;
  y?: string;
}

export interface MetadataSearchParameter {
  parameter_index: number;
  field: string;
  operator: string;
  values: MetadataSearchParameterValues;
}

export interface MetadataSearchRequestData {
  content_type: string | null;
  parameters: any;
}

export interface MetadataSearchResults {
  created_by?: User;
  notes?: string;
  url?: string;
  content_type_model?: string;
  academic_title?: string;
  last_modified_at?: string;
  version_number?: number;
  created_at?: string;
  email?: string;
  deleted?: boolean;
  first_name?: string;
  projects?: any[];
  company?: string;
  metadata?: any[];
  phone?: string;
  content_type?: number;
  display?: string;
  last_modified_by?: User;
  pk?: string;
  last_name?: string;
}

export interface MetadataSearchParameters {
  [id: string]: MetadataField;
}

export interface MetadataChangedSearchParameter {
  uniqueHash: string;
  id: string;
  type: string;
  operator: string;
  answers?: string | string[];
  combinationOperator: string;
}

export interface MetadataFieldSearchConfigAnswers {
  answer: string;
  selected?: boolean;
}

export interface MetadataFieldSearchConfig {
  answers?: MetadataFieldSearchConfigAnswers[];
  custom_input?: string | null;
  single_selected?: string;
  custom_input_selected?: boolean;
}

export interface MetadataTag {
  pk: string;
  name: string;
  display?: string;
  content_type?: number;
  content_type_model?: string;
}

export interface MetadataTagPayload {
  name: string;
}
