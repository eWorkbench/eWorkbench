/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule } from '@angular/common/http';
import { inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { IconsModule } from '@eworkbench/icons';
import { mockNoteHistory, MockService } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { cloneDeep } from 'lodash';
import { RecentChangesComponent } from './recent-changes.component';

describe('RecentChangesComponent', () => {
  let spectator: Spectator<RecentChangesComponent>;
  const createComponent = createComponentFactory({
    component: RecentChangesComponent,
    imports: [
      HttpClientModule,
      RouterTestingModule,
      getTranslocoModule(),
      ModalsModule,
      TableModule,
      SharedModule,
      MetadataModule,
      IconsModule,
      SkeletonsModule,
    ],
    providers: [MockService],
  });

  beforeEach(() => (spectator = createComponent()));

  beforeEach(inject([MockService], (service: MockService) => {
    spectator.setInput({
      changesId: '5b8487ec-06e6-4c17-8138-50689a1c1b76',
      service: service,
    });
  }));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should parse JSON', () => {
    const obj = [{ a: 'Test' }, { b: 'Another test' }];
    const str = JSON.stringify(cloneDeep(obj));

    expect(spectator.component.parseJSON(str)).toEqual(obj);
  });

  it('should format a field name', () => {
    expect(spectator.component.formatFieldName('name')).toBe('name');
    expect(spectator.component.formatFieldName('FirstName')).toBe('FirstName');
    expect(spectator.component.formatFieldName('last_name')).toBe('last name');
  });

  it('should toggle the row details visibility', () => {
    const recentChanges = cloneDeep(mockNoteHistory.results[0]);
    expect(recentChanges.expanded).toBeUndefined();
    spectator.component.onToggleExpanded(recentChanges);
    expect(recentChanges.expanded).toBe(true);
    spectator.component.onToggleExpanded(recentChanges);
    expect(recentChanges.expanded).toBe(false);
  });

  it('should check if the element is trashed or restored', () => {
    expect(spectator.component.isTrashedOrRestored('U')).toBe(false);
    expect(spectator.component.isTrashedOrRestored('R')).toBe(true);
    expect(spectator.component.isTrashedOrRestored('S')).toBe(true);
    expect(spectator.component.isTrashedOrRestored('I')).toBe(false);
  });
});
