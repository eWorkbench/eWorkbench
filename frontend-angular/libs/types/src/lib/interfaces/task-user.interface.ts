/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { User } from './user.interface';

export type TaskUser = Exclude<User, 'available_storage_megabyte' | 'used_storage_megabyte' | 'permissions' | 'url'>;
