/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { CMSSettingsMaintenance } from '@app/stores/cms';

export const mockCMSMaintenance: CMSSettingsMaintenance = { text: '<p>Maintenance text</p>', visible: true };

export const mockCMSMaintenanceInvisible: CMSSettingsMaintenance = { text: '<p>Maintenance text</p>', visible: false };
