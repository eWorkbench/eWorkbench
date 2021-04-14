import { mockUser } from '@eworkbench/mocks';
import { DssContainer } from '@eworkbench/types';

export const mockDssContainer: DssContainer = {
  last_modified_at: '2021-03-09T13:59:49.090272+01:00',
  is_mounted: false,
  content_type: 83,
  display: 'aster-test2',
  deleted: false,
  content_type_model: 'dss.dsscontainer',
  envelopes: [],
  import_option: 'ION',
  last_modified_by: mockUser,
  path: 'dssfs01/pr53ve/aster-test',
  pk: 'ae514c61-c116-4742-9531-3c42c934c7c9',
  created_by: mockUser,
  projects: [],
  url: 'http://workbench.local:8000/api/dsscontainers/ae514c61-c116-4742-9531-3c42c934c7c9/',
  name: 'aster-test2',
  created_at: '2021-03-03T12:57:33.630625+01:00',
  read_write_setting: 'RWA',
};
