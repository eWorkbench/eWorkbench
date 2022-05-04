/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DjangoAPI, FAQ, FAQCategory } from '@eworkbench/types';

export const mockFAQCategory: FAQCategory = {
  title: 'Category 1',
  slug: 'category-1',
  public: true,
  ordering: 1,
};

export const mockFAQ: FAQ = {
  question: 'Q1',
  answer: '<p>q1 entry</p>',
  public: true,
  category: mockFAQCategory,
  ordering: 1,
  slug: 'q1',
};

export const mockFAQList: DjangoAPI<FAQ[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockFAQ],
};
