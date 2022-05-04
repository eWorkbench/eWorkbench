/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { UserState } from '@eworkbench/types';
import { mockUser } from './user';

export const mockUserState: UserState = {
  user: mockUser,
  token: 'sometoken',
  loggedIn: true,
};
