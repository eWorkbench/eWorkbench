/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ContactFormPayload } from '@eworkbench/types';
import { mockAppVersion } from './app-version';

export const mockContactFormPayload: ContactFormPayload = {
  subject: 'Subject',
  message: 'Message',
  backend_version: mockAppVersion,
  browser_version:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.146 Safari/537.36',
  local_time: '2021-02-24T12:48:00.000Z',
  url: 'http://workbench.local:8000/',
};
