/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface CMSJsonResponse {
  title: string;
  text: string;
  public: boolean;
}

export interface OSSLicense {
  key: string;
  licenses: string;
  repository: string;
}
