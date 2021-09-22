/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CommentModule } from '@app/modules/comment/comment.module';
import { FavoritesModule } from '@app/modules/favorites/favorites.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ProjectsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockProject, mockUser } from '@eworkbench/mocks';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { mockProvider, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { StoragePageComponent } from './storage-page.component';

describe('StoragePageComponent', () => {
  let spectator: Spectator<StoragePageComponent>;
  const createComponent = createComponentFactory({
    component: StoragePageComponent,
    imports: [
      getTranslocoModule(),
      HttpClientTestingModule,
      RouterTestingModule,
      HeaderModule,
      SkeletonsModule,
      FavoritesModule,
      CommentModule,
      LoadingModule,
    ],
    providers: [
      mockProvider(ProjectsService, {
        getList: () => of({ total: 1, data: [mockProject] }),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call initDetails()', () => {
    const initDetailsSpy = jest.spyOn(spectator.component, 'initDetails');
    spectator.component.initDetails();
    expect(initDetailsSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({ currentUser: mockUser });
    spectator.component.initDetails();
    expect(initDetailsSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.setInput({
      loading: false,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });
});
