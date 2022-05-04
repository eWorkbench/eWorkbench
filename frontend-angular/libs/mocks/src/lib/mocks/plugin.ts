/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type {
  DjangoAPI,
  PluginDetails,
  PluginFeedbackPayload,
  PluginInstance,
  PluginInstancePayload,
  RecentChanges,
} from '@eworkbench/types';
import { mockMetadata } from './metadata';
import { mockUser } from './user';

export const mockPluginDetails: PluginDetails = {
  created_at: '2020-07-09T10:58:11.288704+02:00',
  last_modified_by: mockUser,
  responsible_users: [mockUser],
  display: 'Plugin Only User',
  title: 'Only User',
  placeholder_picture_mime_type: 'image/png',
  url: 'http://workbench.local:8000/api/plugins/f76b6f87-1076-4ce8-8150-3ac928118845/',
  long_description: '<p>User onlyUser</p>',
  created_by: mockUser,
  content_type_model: 'plugins.plugin',
  short_description: 'User only',
  pk: 'f76b6f87-1076-4ce8-8150-3ac928118845',
  responsible_users_pk: [134],
  content_type: 79,
  path: '/plugins/svg_editor/index.html',
  last_modified_at: '2020-07-09T16:46:52.702899+02:00',
  logo: 'http://workbench.local:8000/static/uploaded_media/unknown_plugin.gif',
  download_placeholder_picture:
    'http://workbench.local:8000/api/plugins/f76b6f87-1076-4ce8-8150-3ac928118845/picture.png/?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXRoIjoiL2FwaS9wbHVnaW5zL2Y3NmI2Zjg3LTEwNzYtNGNlOC04MTUwLTNhYzkyODExODg0NS9waWN0dXJlLnBuZy8iLCJ1c2VyIjoxNTAsImp3dF92ZXJpZmljYXRpb25fdG9rZW4iOiIzYzEyM2JmMjNjNjM0MTQwOWMxMTUyYWQ3MWRmNTA0MSIsImV4cCI6MTYxMTI0NDM1M30.vMxpJvVexw4tFz8cEjlF1OSchQXXtyogdrg2FXGqLBU',
  is_accessible: true,
  iframe_height: 500,
};

export const mockPluginInstancePayload: PluginInstancePayload = {
  title: 'Plugin title',
};

export const mockPluginInstance: PluginInstance = {
  created_at: '2020-07-10T08:11:34.878306+02:00',
  last_modified_by: mockUser,
  picture: null,
  display: 'Title',
  version_number: 0,
  metadata: [],
  title: 'Title',
  url: 'http://workbench.local:8000/api/plugininstances/d0729647-f8b9-4ebc-b91a-6593d6b06611/',
  deleted: false,
  created_by: mockUser,
  download_picture: null,
  plugin_details: mockPluginDetails,
  picture_size: 0,
  content_type_model: 'plugins.plugininstance',
  auth_url:
    '/plugins/svg_editor/index.html?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXRoIjoiL2FwaS9wbHVnaW5pbnN0YW5jZXMvZDA3Mjk2NDctZjhiOS00ZWJjLWI5MWEtNjU5M2Q2YjA2NjExLyIsInVzZXIiOjE1MCwiand0X3ZlcmlmaWNhdGlvbl90b2tlbiI6IjNjMTIzYmYyM2M2MzQxNDA5YzExNTJhZDcxZGY1MDQxIiwiZXhwIjoxNjExMTI4MDU2fQ.MjDbbYtNi-rGGBoVVRXKY-51qsE2bp4ekBuOQ5pevQ8&pk=d0729647-f8b9-4ebc-b91a-6593d6b06611&apiBaseUrl=http%3A%2F%2Fworkbench.local:8000%2Fapi%2Fplugininstances%2F',
  plugin: 'f76b6f87-1076-4ce8-8150-3ac928118845',
  rawdata: null,
  pk: 'd0729647-f8b9-4ebc-b91a-6593d6b06611',
  picture_mime_type: 'image/png',
  content_type: 80,
  projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
  last_modified_at: '2020-07-10T08:11:35.130903+02:00',
  rawdata_mime_type: 'application/octet-stream',
  rawdata_size: 0,
  download_rawdata: null,
  is_favourite: false,
};

export const mockPluginInstancesList: DjangoAPI<PluginInstance[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockPluginInstance],
};

export const mockPluginInstanceHistory: DjangoAPI<RecentChanges[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: 'a9b3461e-1994-4a0e-9450-51b7d9b62f54',
      user: mockUser,
      object_type: { id: 80, app_label: 'plugins', model: 'plugininstance' },
      object_uuid: 'f1513975-6651-4dd0-afc7-d279123a1662',
      changeset_type: 'U',
      date: '2021-01-22T08:53:46.115072+01:00',
      change_records: [
        {
          field_name: 'metadata',
          old_value:
            '[{"model": "metadata.metadata", "pk": "dd456898-a6bf-48a3-aebb-f5b642b5ebd2", "fields": {"field": "44f035e9-229d-48cd-86c3-8fbe1bcea00c", "values": {"answers": [{"answer": "A", "selected": false}, {"answer": "B", "selected": true}, {"answer": "C", "selected": false}]}}}]',
          new_value:
            '[{"model": "metadata.metadata", "pk": "dd456898-a6bf-48a3-aebb-f5b642b5ebd2", "fields": {"field": "44f035e9-229d-48cd-86c3-8fbe1bcea00c", "values": {"answers": [{"answer": "A", "selected": false}, {"answer": "B", "selected": true}, {"answer": "C", "selected": true}]}}}]',
        },
        { field_name: 'title', old_value: 'Title1', new_value: 'Title 123!' },
      ],
    },
  ],
};

export const mockPluginInstanceVersion: any = {
  created_at: '2020-07-10T08:13:40.028082+02:00',
  last_modified_by: mockUser,
  picture: null,
  display: 'Title 123!',
  version_number: 6,
  metadata: [mockMetadata],
  title: 'Title 123!',
  url: 'http://workbench.local:8000/api/plugininstances/f1513975-6651-4dd0-afc7-d279123a1662/',
  deleted: false,
  created_by: mockUser,
  download_picture: null,
  plugin_details: mockPluginDetails,
  picture_size: 0,
  content_type_model: 'plugins.plugininstance',
  auth_url:
    '/plugins/svg_editor/index.html?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXRoIjoiL2FwaS9wbHVnaW5pbnN0YW5jZXMvZjE1MTM5NzUtNjY1MS00ZGQwLWFmYzctZDI3OTEyM2ExNjYyLyIsInVzZXIiOjE1MCwiand0X3ZlcmlmaWNhdGlvbl90b2tlbiI6IjNjMTIzYmYyM2M2MzQxNDA5YzExNTJhZDcxZGY1MDQxIiwiZXhwIjoxNjExNDAzMzUwfQ.2kQpfd-JrA0M-Iw6MMZ1Q_GQiVqBlnBvmNvuxF4q7xo&pk=f1513975-6651-4dd0-afc7-d279123a1662&apiBaseUrl=http%3A%2F%2Fworkbench.local:8000%2Fapi%2Fplugininstances%2F',
  plugin: 'e9dd0be8-3019-4bb7-850c-2623f55cef89',
  rawdata: null,
  pk: 'f1513975-6651-4dd0-afc7-d279123a1662',
  picture_mime_type: 'image/png',
  content_type: 80,
  projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
  last_modified_at: '2021-01-22T08:53:46.105537+01:00',
  rawdata_mime_type: 'application/octet-stream',
  rawdata_size: 0,
  download_rawdata: null,
};

export const mockPluginFeedbackPayload: PluginFeedbackPayload = {
  pluginPk: 'f76b6f87-1076-4ce8-8150-3ac928118845',
  subject: 'Test feedback',
  message: '<p>from Workbench</p>',
  type: 'feedback',
};
