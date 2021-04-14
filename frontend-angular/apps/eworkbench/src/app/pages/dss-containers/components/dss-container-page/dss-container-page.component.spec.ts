/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { AuthService, DssContainersService, PageTitleService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockDssContainer, mockPageTitle, mockPrivileges, mockUser } from '@eworkbench/mocks';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { DssContainerPageComponent } from './dss-container-page.component';

describe('DssContainerPageComponent', () => {
  let spectator: Spectator<DssContainerPageComponent>;
  const createComponent = createComponentFactory({
    component: DssContainerPageComponent,
    imports: [
      getTranslocoModule(),
      RouterTestingModule,
      HttpClientTestingModule,
      HeaderModule,
      FormsModule,
      FormHelperModule,
      RecentChangesModule,
      SharedModule,
      SkeletonsModule,
      IconsModule,
      UserModule,
      LockModule,
    ],
    providers: [
      mockProvider(DssContainersService, {
        get: () => of({ privileges: mockPrivileges, data: mockDssContainer }),
        patch: () => of([]),
        history: () => of([]),
        lock: () => of([]),
        unlock: () => of([]),
        getUserPrivileges: () => of(mockPrivileges),
      }),
      mockProvider(AuthService, {
        user$: of({ state: { user: mockUser } }),
      }),
      mockProvider(PageTitleService, {
        get: () => of(mockPageTitle),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call initDetails()', () => {
    const initDetailsSpy = spyOn(spectator.component, 'initDetails').and.callThrough();
    spectator.component.initDetails();
    expect(initDetailsSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({ currentUser: mockUser });
    spectator.component.initDetails();
    expect(initDetailsSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
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
