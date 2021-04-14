/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface ContactFormPayload {
  subject: string;
  message: string;
  backend_version: string;
  browser_version: string;
  local_time: string;
  url: string;
}
