/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const mockGenericTableViewDataList = {
  count: 3,
  next: null,
  previous: null,
  results: [
    {
      pk: 'c5659862-b4b1-4a96-9148-8304db8b12c8',
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      project_tree: [
        {
          pk: '7ee1f24c-b387-487b-9316-a1d45c9e3ae4',
          parent_project: 'c5659862-b4b1-4a96-9148-8304db8b12c8',
        },
      ],
    },
    {
      pk: '83dd103f-0c85-46e6-bb61-1fabfcb7c33b',
      username: 'superuser',
      name: 'Super User',
      email: 'superuser@example.com',
      project_tree: [
        {
          pk: '7ee1f24c-b387-487b-9316-a1d45c9e3ae4',
          parent_project: 'c5659862-b4b1-4a96-9148-8304db8b12c8',
        },
      ],
    },
    {
      pk: 'b309a130-7acf-447c-a175-db955538060d',
      username: 'user',
      name: 'Regular User',
      email: 'regularuser@example.com',
      project_tree: [],
    },
  ],
};

export const mockGenericTableViewChildDataList = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: '7ee1f24c-b387-487b-9316-a1d45c9e3ae4',
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
    },
  ],
};
