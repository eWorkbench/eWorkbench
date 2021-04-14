/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { UserModule } from '@app/modules/user/user.module';
import { AuthService } from '@app/services';
import { UserService } from '@app/stores/user';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockPrivilegesApi, MockService, mockUser } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { cloneDeep } from 'lodash-es';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { PrivilegesModalComponent } from './privileges.component';

const userId = 1;
const privileges = [mockPrivilegesApi, { ...mockPrivilegesApi, user_pk: 2 }];

describe('PrivilegesModalComponent', () => {
  let spectator: Spectator<PrivilegesModalComponent>;
  const createComponent = createComponentFactory({
    component: PrivilegesModalComponent,
    imports: [
      HttpClientTestingModule,
      FormsModule,
      getTranslocoModule(),
      CollapseModule.forRoot(),
      BsDropdownModule.forRoot(),
      ModalsModule,
      RouterTestingModule,
      UserModule,
      TableModule,
      TooltipModule,
      IconsModule,
      LoadingModule,
    ],
    providers: [
      MockService,
      mockProvider(AuthService, {
        user$: of({ state: { user: mockUser } }),
      }),
      mockProvider(UserService, {
        get$: mockUser,
        check: () => mockUser,
      }),
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
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
        privileges: privileges,
        data: {
          deleted: false,
        },
      },
    });
  }));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call initPrivileges() with mocked user', () => {
    const initPrivilegesSpy = spyOn(spectator.component, 'initPrivileges').and.callThrough();
    spectator.setInput({ currentUser: mockUser });
    spectator.component.initPrivileges();
    expect(initPrivilegesSpy).toHaveBeenCalledTimes(1);
  });

  it('should call addUser()', () => {
    const userIdString = userId.toString();
    const addUserSpy = spyOn(spectator.component, 'addUser').and.callThrough();
    spectator.component.addUser(userIdString);
    expect(addUserSpy).toHaveBeenCalledTimes(1);
    expect(addUserSpy).toHaveBeenCalledWith(userIdString);

    spectator.setInput({ loading: true });
    spectator.component.addUser(userIdString);
    expect(addUserSpy).toHaveBeenCalledTimes(2);
    expect(addUserSpy).toHaveBeenCalledWith(userIdString);
  });

  it('should call onChangePrivilege()', () => {
    const onChangePrivilegeSpy = spyOn(spectator.component, 'onChangePrivilege').and.callThrough();
    spectator.component.onChangePrivilege('full_access_privilege', userId);
    expect(onChangePrivilegeSpy).toHaveBeenCalledTimes(1);
    expect(onChangePrivilegeSpy).toHaveBeenCalledWith('full_access_privilege', userId);

    spectator.component.onChangePrivilege('full_access_privilege', 2);
    expect(onChangePrivilegeSpy).toHaveBeenCalledTimes(2);
    expect(onChangePrivilegeSpy).toHaveBeenCalledWith('full_access_privilege', 2);

    spectator.setInput({ loading: true });
    spectator.component.onChangePrivilege('full_access_privilege', 3);
    expect(onChangePrivilegeSpy).toHaveBeenCalledTimes(3);
    expect(onChangePrivilegeSpy).toHaveBeenCalledWith('full_access_privilege', 3);
  });

  it('should call getNextPrivilegeValue()', () => {
    expect(spectator.component.getNextPrivilegeValue('AL')).toBe('DE');
    expect(spectator.component.getNextPrivilegeValue('DE')).toBe('AL');
    expect(spectator.component.getNextPrivilegeValue('NE')).toBe('AL');
    expect(spectator.component.getNextPrivilegeValue('XX')).toBe('NE');
  });

  it('should call onRestorePrivileges()', () => {
    const onRestorePrivilegesSpy = spyOn(spectator.component, 'onRestorePrivileges').and.callThrough();
    spectator.component.onRestorePrivileges(userId);
    expect(onRestorePrivilegesSpy).toHaveBeenCalledTimes(1);
    expect(onRestorePrivilegesSpy).toHaveBeenCalledWith(userId);

    spectator.setInput({ loading: false, initialPrivileges: cloneDeep(privileges) });
    spectator.component.onRestorePrivileges(0);
    expect(onRestorePrivilegesSpy).toHaveBeenCalledTimes(2);
    expect(onRestorePrivilegesSpy).toHaveBeenCalledWith(0);

    spectator.setInput({ loading: false, initialPrivileges: {} });
    spectator.component.onRestorePrivileges(userId);
    expect(onRestorePrivilegesSpy).toHaveBeenCalledTimes(3);
    expect(onRestorePrivilegesSpy).toHaveBeenCalledWith(userId);

    spectator.setInput({ loading: true });
    spectator.component.onRestorePrivileges(userId);
    expect(onRestorePrivilegesSpy).toHaveBeenCalledTimes(4);
    expect(onRestorePrivilegesSpy).toHaveBeenCalledWith(userId);
  });

  it('should call onDeleteUser()', () => {
    const onDeleteUserSpy = spyOn(spectator.component, 'onDeleteUser').and.callThrough();
    spectator.component.onDeleteUser(userId);
    expect(onDeleteUserSpy).toHaveBeenCalledTimes(1);
    expect(onDeleteUserSpy).toHaveBeenCalledWith(userId);

    spectator.setInput({ loading: true });
    spectator.component.onDeleteUser(userId);
    expect(onDeleteUserSpy).toHaveBeenCalledTimes(2);
    expect(onDeleteUserSpy).toHaveBeenCalledWith(userId);
  });

  it('should call getTooltip()', () => {
    const getTooltipSpy = spyOn(spectator.component, 'getTooltip').and.callThrough();

    let privilege = 'invalid_privilege';
    let privilegeText = spectator.component.getTooltip(privilege);
    expect(getTooltipSpy).toHaveBeenCalledTimes(1);
    expect(getTooltipSpy).toHaveBeenCalledWith(privilege);
    expect(getTooltipSpy).toHaveBeenCalledWith(privilege);
    expect(privilegeText).toBe(null);

    privilege = 'full_access_privilege';
    privilegeText = spectator.component.getTooltip(privilege);
    expect(getTooltipSpy).toHaveBeenCalledTimes(2);
    expect(getTooltipSpy).toHaveBeenCalledWith(privilege);
    expect(privilegeText).toBe('Full access');

    privilege = 'view_privilege';
    privilegeText = spectator.component.getTooltip(privilege);
    expect(getTooltipSpy).toHaveBeenCalledTimes(3);
    expect(getTooltipSpy).toHaveBeenCalledWith(privilege);
    expect(privilegeText).toBe('Viewable');

    privilege = 'edit_privilege';
    privilegeText = spectator.component.getTooltip(privilege);
    expect(getTooltipSpy).toHaveBeenCalledTimes(4);
    expect(getTooltipSpy).toHaveBeenCalledWith(privilege);
    expect(privilegeText).toBe('Editable');

    privilege = 'trash_privilege';
    privilegeText = spectator.component.getTooltip(privilege);
    expect(getTooltipSpy).toHaveBeenCalledTimes(5);
    expect(getTooltipSpy).toHaveBeenCalledWith(privilege);
    expect(privilegeText).toBe('Trashable');

    privilege = 'restore_privilege';
    privilegeText = spectator.component.getTooltip(privilege);
    expect(getTooltipSpy).toHaveBeenCalledTimes(6);
    expect(getTooltipSpy).toHaveBeenCalledWith(privilege);
    expect(privilegeText).toBe('Restoreable');
  });
});
