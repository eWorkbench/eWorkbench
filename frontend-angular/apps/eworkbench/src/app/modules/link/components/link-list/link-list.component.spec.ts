/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { AuthService } from '@app/services/auth/auth.service';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockRelationList, MockService, mockUser } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { LinkListComponent } from './link-list.component';

describe('LinkListComponent', () => {
  let spectator: Spectator<LinkListComponent>;
  const createComponent = createComponentFactory({
    component: LinkListComponent,
    imports: [
      getTranslocoModule(),
      ModalsModule,
      HttpClientTestingModule,
      TableModule,
      SharedModule,
      FormsModule,
      RouterTestingModule,
      LoadingModule,
      UserModule,
      IconsModule,
    ],
    providers: [
      MockService,
      mockProvider(AuthService, {
        user$: of({ state: { user: mockUser } }),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(inject([MockService], (service: MockService) => {
    spectator = createComponent({
      props: {
        id: '8147b971-9ab6-4f8b-bbf5-76e8eccae3f8',
        service: service,
        currentUser: mockUser,
      },
    });
  }));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call filterRelations', () => {
    const filterRelationsSpy = jest.spyOn(spectator.component, 'filterRelations');
    spectator.component.filterRelations();
    expect(filterRelationsSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({
      allRelations: mockRelationList.results,
    });
    spectator.component.filterRelations();
    expect(filterRelationsSpy).toHaveBeenCalledTimes(2);
    expect(spectator.component.relations).toStrictEqual(mockRelationList.results);

    spectator.setInput({
      selectedType: 'shared_elements.note',
    });
    spectator.component.filterRelations();
    expect(filterRelationsSpy).toHaveBeenCalledTimes(3);
    expect(spectator.component.relations).toStrictEqual([]);
  });

  it('should call onChangeFilterContentType', () => {
    const onChangeFilterContentTypeSpy = jest.spyOn(spectator.component, 'onChangeFilterContentType');
    spectator.setInput({
      allRelations: mockRelationList.results,
    });
    spectator.component.onChangeFilterContentType({ label: 'test', value: 'shared_elements.note' });
    expect(onChangeFilterContentTypeSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.relations).toStrictEqual([]);
  });
});
