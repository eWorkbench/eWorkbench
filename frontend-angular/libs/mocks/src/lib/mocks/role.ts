/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Role } from '@eworkbench/types';

export const mockRole: Role = {
  pk: '5b488d4b-2902-4731-8cc1-a7437b7a6c7e',
  name: 'Project Manager',
  default_role_on_project_create: true,
  default_role_on_project_user_assign: false,
};

export const mockRoles: Role[] = [
  {
    pk: '5b488d4b-2902-4731-8cc1-a7437b7a6c7e',
    name: 'Project Manager',
    default_role_on_project_create: true,
    default_role_on_project_user_assign: false,
  },
  {
    pk: '6c3a1c5e-6907-4b6a-9b58-0b88b31c588d',
    name: 'No Access',
    default_role_on_project_create: false,
    default_role_on_project_user_assign: true,
  },
  {
    pk: '4536e5f5-b92d-4f49-819b-6ee320cf692c',
    name: 'Observer',
    default_role_on_project_create: false,
    default_role_on_project_user_assign: false,
  },
  {
    pk: '3676b3b2-98a5-48c6-ba3b-55465111dc9f',
    name: 'Project Member',
    default_role_on_project_create: false,
    default_role_on_project_user_assign: false,
  },
];
