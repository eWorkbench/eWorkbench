/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Role {
  default_role_on_project_create: boolean;
  default_role_on_project_user_assign: boolean;
  name: string;
  pk: string;
}