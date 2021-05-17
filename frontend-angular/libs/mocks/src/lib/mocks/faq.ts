/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DjangoAPI, FAQ, FAQCategory } from '@eworkbench/types';

export const mockFAQCategory: FAQCategory = {
  title: 'Category 1',
  slug: 'category-1',
  public: true,
};

export const mockFAQ: FAQ = {
  question: 'Q1',
  answer: '<p>q1 entry</p>',
  public: true,
  category: mockFAQCategory,
};

export const mockFAQList: DjangoAPI<FAQ[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockFAQ],
};
