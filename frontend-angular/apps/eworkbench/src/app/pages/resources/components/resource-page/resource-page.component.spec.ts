/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FavoritesModule } from '@app/modules/favorites/favorites.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LinkModule } from '@app/modules/link/link.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { AuthService, PageTitleService, ProjectsService, ResourcesService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import {
  mockBookingRulesPayload,
  mockMetadata,
  mockPageTitle,
  mockPrivileges,
  mockRelationList,
  mockResource,
  mockResourceHistory,
  mockUser,
} from '@eworkbench/mocks';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { ResourcePageComponent } from './resource-page.component';

describe('ResourcePageComponent', () => {
  let spectator: Spectator<ResourcePageComponent>;
  const createComponent = createComponentFactory({
    component: ResourcePageComponent,
    imports: [
      RouterTestingModule,
      HeaderModule,
      FormsModule,
      FormHelperModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      RecentChangesModule,
      SharedModule,
      UserModule,
      DetailsDropdownModule,
      WysiwygEditorModule,
      MetadataModule,
      ResourceModule,
      ProjectModule,
      SkeletonsModule,
      CollapseModule.forRoot(),
      LinkModule,
      IconsModule,
      TooltipModule.forRoot(),
      FavoritesModule,
    ],
    providers: [
      mockProvider(ResourcesService, {
        get: () => of({ privileges: mockPrivileges, data: mockResource }),
        patch: () => of(mockResource),
        history: () => of([mockResourceHistory]),
        lock: () => of([]),
        unlock: () => of([]),
        getUserPrivileges: () => of(mockPrivileges),
        changeTermsOfUsePDF: () => of(mockResource),
        getRelations: () => of(mockRelationList),
      }),
      mockProvider(ProjectsService, {
        get: () => of({}),
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

  /* it('should call onSubmit()', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.setInput({
      loading: false,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({ bookingRules: mockBookingRulesPayload });
    spectator.component.form.patchValue({
      name: 'Test',
      type: 'ITRES',
      contact: 'test@domain.com',
      responsibleUnit: 'Test',
      location: 'Test',
      description: 'Test',
      userAvailability: 'GLB',
      userAvailabilitySelectedUserGroups: '1',
      userAvailabilitySelectedUsers: [150],
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);

    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(3);
  }); */

  it('should call onUpdateMetadata()', () => {
    const onUpdateMetadataSpy = spyOn(spectator.component, 'onUpdateMetadata').and.callThrough();
    expect(spectator.component.metadata).toBeUndefined();
    spectator.component.onUpdateMetadata([mockMetadata]);
    expect(onUpdateMetadataSpy).toHaveBeenCalledTimes(1);
    expect(onUpdateMetadataSpy).toHaveBeenCalledWith([mockMetadata]);
    expect(spectator.component.metadata).toEqual([mockMetadata]);
  });

  it('should call onUpdateBookingRules()', () => {
    const onUpdateBookingRulesSpy = spyOn(spectator.component, 'onUpdateBookingRules').and.callThrough();
    expect(spectator.component.bookingRules).toBeUndefined();
    spectator.component.onUpdateBookingRules(mockBookingRulesPayload);
    expect(onUpdateBookingRulesSpy).toHaveBeenCalledTimes(1);
    expect(onUpdateBookingRulesSpy).toHaveBeenCalledWith(mockBookingRulesPayload);
    expect(spectator.component.bookingRules).toEqual(mockBookingRulesPayload);
  });

  it('should call onClearPDF()', () => {
    const onClearPDFSpy = spyOn(spectator.component, 'onClearPDF').and.callThrough();
    spectator.component.onClearPDF();
    expect(onClearPDFSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onRemoveResourcePDFModalClose()', () => {
    const onRemoveResourcePDFModalCloseSpy = spyOn(spectator.component, 'onRemoveResourcePDFModalClose').and.callThrough();
    spectator.component.onRemoveResourcePDFModalClose({ state: ModalState.Unchanged });
    expect(onRemoveResourcePDFModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Unchanged });
    expect(onRemoveResourcePDFModalCloseSpy).toHaveBeenCalledTimes(1);
    spectator.component.onRemoveResourcePDFModalClose({ state: ModalState.Changed });
    expect(onRemoveResourcePDFModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Changed });
    expect(onRemoveResourcePDFModalCloseSpy).toHaveBeenCalledTimes(2);
  });
});
