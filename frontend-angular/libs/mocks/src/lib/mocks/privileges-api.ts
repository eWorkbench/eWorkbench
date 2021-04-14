/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PrivilegesApi } from '@eworkbench/types';
import { mockUser } from './user';

export const mockPrivilegesApi: PrivilegesApi = {
  content_type: 25,
  content_type_model: 'model_privileges.modelprivilege',
  content_type_pk: 27,
  delete_privilege: 'NE',
  display: 'User permissions for data: []',
  edit_privilege: 'NE',
  full_access_privilege: 'NE',
  object_id: '17200f04-e862-4a67-938c-86739403984e',
  pk: '4a053c08-4bee-425c-9381-87c85d49daaa',
  restore_privilege: 'NE',
  trash_privilege: 'NE',
  user: mockUser,
  user_pk: 1,
  view_privilege: 'NE',
};
