/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FavoritesModule } from '@app/modules/favorites/favorites.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LinkModule } from '@app/modules/link/link.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { PluginModule } from '@app/modules/plugin/plugin.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { VersionsModule } from '@app/modules/versions/versions.module';
import { AuthService, PageTitleService, PluginInstancesService, ProjectsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import {
  mockMetadata,
  mockPageTitle,
  mockPluginInstance,
  mockPluginInstanceHistory,
  mockPluginInstanceVersion,
  mockPrivileges,
  mockProject,
  mockRelationList,
  mockUser,
} from '@eworkbench/mocks';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { PluginPageComponent } from './plugin-page.component';

describe('PluginPageComponent', () => {
  let spectator: Spectator<PluginPageComponent>;
  const createComponent = createComponentFactory({
    component: PluginPageComponent,
    imports: [
      RouterTestingModule,
      HeaderModule,
      FormsModule,
      FormHelperModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      VersionsModule,
      RecentChangesModule,
      SharedModule,
      UserModule,
      DetailsDropdownModule,
      WysiwygEditorModule,
      MetadataModule,
      SkeletonsModule,
      PluginModule,
      LinkModule,
      IconsModule,
      LockModule,
      FavoritesModule,
    ],
    providers: [
      mockProvider(PluginInstancesService, {
        get: () => of({ privileges: mockPrivileges, data: mockPluginInstance }),
        patch: () => of(mockPluginInstance),
        history: () => of([mockPluginInstanceHistory]),
        versions: () => of([mockPluginInstanceVersion]),
        lock: () => of([]),
        unlock: () => of([]),
        getUserPrivileges: () => of(mockPrivileges),
        getRelations: () => of(mockRelationList),
      }),
      mockProvider(ProjectsService, {
        getList: () => of({ total: 1, data: [mockProject] }),
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

  beforeEach(
    () =>
      (spectator = createComponent({
        props: {
          currentUser: mockUser,
        },
      }))
  );

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

  it('should call onVersionChanged()', () => {
    const onVersionChangedSpy = spyOn(spectator.component, 'onVersionChanged').and.callThrough();
    spectator.component.onVersionChanged();
    expect(onVersionChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onUpdateMetadata()', () => {
    const onUpdateMetadataSpy = spyOn(spectator.component, 'onUpdateMetadata').and.callThrough();
    expect(spectator.component.metadata).toBeUndefined();
    spectator.component.onUpdateMetadata([mockMetadata]);
    expect(onUpdateMetadataSpy).toHaveBeenCalledTimes(1);
    expect(onUpdateMetadataSpy).toHaveBeenCalledWith([mockMetadata]);
    expect(spectator.component.metadata).toEqual([mockMetadata]);
  });
});
