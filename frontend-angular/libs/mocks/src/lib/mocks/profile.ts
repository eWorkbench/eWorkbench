/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NotificationConfiguration } from '@eworkbench/types';

export const mockNotificationConfiguration: NotificationConfiguration = {
  allowed_notifications: ['NOTIFICATION_CONF_MEETING_USER_CHANGED', 'NOTIFICATION_CONF_MEETING_RELATION_CHANGED'],
  content_type: 53,
  content_type_model: 'notifications.notificationconfiguration',
  display: 'Notification configuration for Test User',
  pk: '37d45267-0b33-42e1-9ac5-da146ab5ea12',
};
