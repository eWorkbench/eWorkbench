/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Envelope {
  container: string;
  container_path?: string;
  imported: boolean;
  metadata_file_content: any;
  path: string;
  pk: string;
}
