/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface FAQCategory {
  title: string;
  slug: string;
  public: boolean;
  ordering: number;
}

export interface FAQ {
  question: string;
  answer: string;
  public: boolean;
  ordering: number;
  category: FAQCategory;
  slug: string;
}
