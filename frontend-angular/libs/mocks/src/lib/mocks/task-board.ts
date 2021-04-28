/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TaskBoard, TaskBoardColumn, TaskBoardPayload } from '@eworkbench/types';
import { mockUser } from './user';

export const mockTaskBoardColumn: TaskBoardColumn = {
  title: 'New column',
  display: 'Kanban Board Column New column belonging to Board Test',
  pk: '24bbca96-da34-4dfd-9ce5-88295152ef1f',
  color: 'rgba(224,224,224,0.65)',
  content_type: 44,
  icon: '',
  content_type_model: 'kanban_boards.kanbanboardcolumn',
  ordering: 1,
};

export const mockTaskBoardPayload: TaskBoardPayload = {
  title: 'Test',
  projects: [],
  background_color: 'rgba(69,89,163,0.68)',
  kanban_board_columns: [mockTaskBoardColumn],
};

export const mockTaskBoard: TaskBoard = {
  background_color: 'rgba(69,89,163,0.68)',
  background_image_thumbnail: null,
  download_background_image: null,
  deleted: false,
  content_type: 43,
  content_type_model: 'kanban_boards.kanbanboard',
  title: 'Test',
  version_number: 236,
  download_background_image_thumbnail: null,
  created_at: '2020-05-09T20:05:23.623552+02:00',
  last_modified_at: '2020-06-24T10:07:41.537826+02:00',
  kanban_board_columns: [mockTaskBoardColumn],
  projects: [],
  display: 'Test',
  pk: '470ddfdc-6180-4cb3-91b8-6b27a8b760fc',
  url: 'http://workbench.local:8000/api/kanbanboards/470ddfdc-6180-4cb3-91b8-6b27a8b760fc/',
  created_by: mockUser,
  last_modified_by: mockUser,
  is_favourite: false,
};
