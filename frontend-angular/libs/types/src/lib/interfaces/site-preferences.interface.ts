/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface SitePreferences {
  site_name: string;
  site_logo: string;
  navbar_background_color: string;
  navbar_border_color: string;
  content_types: Record<string, number>;
}
