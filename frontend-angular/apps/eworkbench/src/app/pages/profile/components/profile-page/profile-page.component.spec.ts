/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { PageTitleService } from '@app/services';
import { UserService } from '@app/stores/user';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { AngularCropperjsModule, CropperComponent } from '@crawl/angular-cropperjs';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockPageTitle, mockUser } from '@eworkbench/mocks';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { ProfilePageModule } from '../../profile-page.module';
import { ProfilePageComponent } from './profile-page.component';

describe('ProfilePageComponent', () => {
  let spectator: Spectator<ProfilePageComponent>;
  const createComponent = createComponentFactory({
    component: ProfilePageComponent,
    imports: [
      ProfilePageModule,
      HeaderModule,
      FormsModule,
      FormHelperModule,
      HttpClientTestingModule,
      RouterTestingModule,
      getTranslocoModule(),
      AngularCropperjsModule,
      IconsModule,
      SkeletonsModule,
      TooltipModule.forRoot(),
    ],
    providers: [
      mockProvider(UserService, {
        get: () => of(mockUser),
        put: () => of(mockUser),
        updateAvatar: () => of(mockUser),
      }),
      mockProvider(PageTitleService, {
        get: () => of(mockPageTitle),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        initialState: mockUser,
        avatarCropper: new CropperComponent(),
      },
    });
  });

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });

  it('should add and remove additional fields for employee affiliation', () => {
    const onAddEmployeeAffiliationSpy = spyOn(spectator.component, 'onAddEmployeeAffiliation').and.callThrough();
    const onRemoveEmployeeAffiliationSpy = spyOn(spectator.component, 'onRemoveEmployeeAffiliation').and.callThrough();
    expect(spectator.component.employeeAffiliation.controls.length).toBe(3);
    spectator.component.onAddEmployeeAffiliation();
    expect(onAddEmployeeAffiliationSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.employeeAffiliation.controls.length).toBe(4);
    spectator.component.onRemoveEmployeeAffiliation(0);
    expect(onRemoveEmployeeAffiliationSpy).toHaveBeenCalledWith(0);
    expect(onRemoveEmployeeAffiliationSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.employeeAffiliation.controls.length).toBe(3);
  });

  it('should add and remove additional fields for student affiliation', () => {
    const onAddStudentAffiliationSpy = spyOn(spectator.component, 'onAddStudentAffiliation').and.callThrough();
    const onRemoveStudentAffiliationSpy = spyOn(spectator.component, 'onRemoveStudentAffiliation').and.callThrough();
    expect(spectator.component.studentAffiliation.controls.length).toBe(3);
    spectator.component.onAddStudentAffiliation();
    expect(onAddStudentAffiliationSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.studentAffiliation.controls.length).toBe(4);
    spectator.component.onRemoveStudentAffiliation(0);
    expect(onRemoveStudentAffiliationSpy).toHaveBeenCalledWith(0);
    expect(onRemoveStudentAffiliationSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.studentAffiliation.controls.length).toBe(3);
  });

  it('should call onCancelEmployeeAffiliation()', () => {
    expect(spectator.component.employeeAffiliation.controls.length).toBe(3);
    spectator.component.onAddEmployeeAffiliation();
    expect(spectator.component.employeeAffiliation.controls.length).toBe(4);
    spectator.component.onCancelEmployeeAffiliation();
    expect(spectator.component.employeeAffiliation.controls.length).toBe(3);

    spectator.component.initialState = undefined;
    spectator.component.onCancelEmployeeAffiliation();
    expect(spectator.component.employeeAffiliation.controls.length).toBe(0);
  });

  it('should call onCancelStudentAffiliation()', () => {
    expect(spectator.component.studentAffiliation.controls.length).toBe(3);
    spectator.component.onAddStudentAffiliation();
    expect(spectator.component.studentAffiliation.controls.length).toBe(4);
    spectator.component.onCancelStudentAffiliation();
    expect(spectator.component.studentAffiliation.controls.length).toBe(3);

    spectator.component.initialState = undefined;
    spectator.component.onCancelStudentAffiliation();
    expect(spectator.component.studentAffiliation.controls.length).toBe(0);
  });

  it('should toggle between displaying the avatar and the cropper', () => {
    let ngContent = spectator.query<HTMLDivElement>('.profile > div > div > img');
    expect(ngContent).toBeDefined();

    spectator.component.newAvatar = 'test';
    expect(spectator.component.newAvatar).not.toBeUndefined();

    ngContent = spectator.query<HTMLDivElement>('.profile > div > div > img');
    expect(ngContent).toBeNull();

    spectator.component.onCancelAvatarChange();
    expect(spectator.component.newAvatar).toBeUndefined();

    ngContent = spectator.query<HTMLDivElement>('.profile > div > div > img');
    expect(ngContent).toBeDefined();
  });

  it('should convert a file to a base64 string', () => {
    const file = new File([], 'avatar.jpg');
    spectator.component.fileToBase64(file).subscribe(base64 => expect(base64).toBe('data:application/octet-stream;base64,'));
  });
});
