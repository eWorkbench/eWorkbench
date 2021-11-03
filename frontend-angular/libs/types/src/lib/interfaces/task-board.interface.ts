/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TaskBoardColumn } from './task-board-column.interface';
import { TaskUser } from './task-user.interface';

export interface TaskBoardPayload {
  title?: string;
  description?: string;
  projects?: string[];
  background_color?: string;
  kanban_board_columns?: TaskBoardColumn[];
}

export interface TaskBoard {
  background_color: string | null;
  background_image_thumbnail: string | null;
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: TaskUser;
  deleted: boolean;
  display: string;
  download_background_image: string | null;
  download_background_image_thumbnail: string | null;
  kanban_board_columns: TaskBoardColumn[];
  last_modified_at: string;
  last_modified_by: TaskUser;
  pk: string;
  projects: string[];
  title: string;
  description: string;
  url: string;
  version_number: number;
  is_favourite: boolean;
}

export interface TaskBoardFilter {
  assignee: number | null;
  user: number | null;
  project: string | null;
  search: string | null;
  priority: string[] | null;
  state: string[] | null;
  favorite: boolean | null;
}
