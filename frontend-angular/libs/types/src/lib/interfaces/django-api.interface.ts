/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface DjangoAPI<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T;
}
