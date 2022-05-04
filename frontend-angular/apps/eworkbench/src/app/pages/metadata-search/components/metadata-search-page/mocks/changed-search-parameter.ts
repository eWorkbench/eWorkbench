/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { MetadataChangedSearchParameter } from '@eworkbench/types';
import { mockMetadataFields } from './metadata-fields';

export const mockChangedSearchParameter: MetadataChangedSearchParameter = {
  id: mockMetadataFields[0].pk!,
  type: mockMetadataFields[0].base_type!,
  operator: '=',
  answers: mockMetadataFields[0].type_settings!.answers,
  combinationOperator: 'AND',
};
