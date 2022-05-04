import type { DjangoAPI, Relation } from '@eworkbench/types';
import { mockAppointment } from './appointment';
import { mockContact } from './contact';
import { mockUser } from './user';

export const mockRelation: Relation = {
  content_type: 26,
  content_type_model: 'relations.relation',
  created_at: '2021-01-29T12:33:17.942043+01:00',
  created_by: mockUser,
  display: 'Left object id 1, right object id 2',
  last_modified_at: '2021-01-29T12:33:17.942089+01:00',
  last_modified_by: mockUser,
  left_content_object: mockContact,
  left_content_type: 27,
  left_content_type_model: 'shared_elements.contact',
  left_object_id: mockContact.pk,
  pk: '48f136b6-80fa-4e1a-adef-95d85455daf4',
  private: false,
  right_content_object: mockAppointment,
  right_content_type: 34,
  right_content_type_model: 'shared_elements.meeting',
  right_object_id: mockAppointment.pk,
  table_object: mockContact,
};

export const mockRelationList: DjangoAPI<Relation[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockRelation],
};
