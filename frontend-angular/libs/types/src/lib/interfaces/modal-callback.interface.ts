/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ModalState } from '@app/enums/modal-state.enum';

export interface ModalCallback {
  state?: ModalState;
  navigate?: string[];
  external?: string;
  data?: any;
}
