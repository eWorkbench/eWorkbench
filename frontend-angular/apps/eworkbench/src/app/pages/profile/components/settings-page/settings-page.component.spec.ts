// @ts-nocheck

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderModule } from '@app/modules/header/header.module';
import { AuthService, NotificationConfigurationService, PageTitleService } from '@app/services';
import { UserService } from '@app/stores/user';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockNotificationConfiguration, mockPageTitle, mockUser, mockUserProfileInfo, mockUserState } from '@eworkbench/mocks';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ProfilePageModule } from '../../profile-page.module';
import { SettingsPageComponent } from './settings-page.component';

describe('SettingsPageComponent', () => {
  let spectator: Spectator<SettingsPageComponent>;
  const createComponent = createComponentFactory({
    component: SettingsPageComponent,
    imports: [
      ProfilePageModule,
      HeaderModule,
      FormsModule,
      HttpClientTestingModule,
      RouterTestingModule,
      getTranslocoModule(),
      SkeletonsModule,
    ],
    providers: [
      mockProvider(NotificationConfigurationService, {
        get: () => of(mockNotificationConfiguration),
        put: () => of(mockNotificationConfiguration),
      }),
      mockProvider(UserService, {
        get: () => of(mockUser),
        changeSettings: () => of([]),
        getUserProfileInfo: () => of(mockUserProfileInfo),
      }),
      mockProvider(PageTitleService, {
        get: () => of(mockPageTitle),
      }),
      mockProvider(AuthService, {
        user$: of(mockUserState),
      }),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  describe('checkboxes unchecked', () => {
    beforeEach(() => {
      spectator.setInput({
        form: new FormGroup<any>({
          notificationAppointments: new FormControl(false),
          NOTIFICATION_CONF_MEETING_USER_CHANGED: new FormControl(false),
          NOTIFICATION_CONF_MEETING_CHANGED: new FormControl(false),
          NOTIFICATION_CONF_MEETING_RELATION_CHANGED: new FormControl(false),
          NOTIFICATION_CONF_MEETING_REMINDER: new FormControl(false),
          MAIL_CONF_MEETING_CONFIRMATION: new FormControl(false),

          notificationTasks: new FormControl(false),
          NOTIFICATION_CONF_TASK_USER_CHANGED: new FormControl(false),
          NOTIFICATION_CONF_TASK_CHANGED: new FormControl(false),
          NOTIFICATION_CONF_TASK_RELATION_CHANGED: new FormControl(false),

          notificationProjects: new FormControl(false),
          NOTIFICATION_CONF_PROJECT_USER_CHANGED: new FormControl(false),
          NOTIFICATION_CONF_PROJECT_CHANGED: new FormControl(false),

          notificationDSS: new FormControl(false),
          NOTIFICATION_DSS_IMPORT_IN_PROGRESS: new FormControl(false),
          NOTIFICATION_DSS_IMPORT_FINISHED: new FormControl(false),
          NOTIFICATION_DSS_IMPORT_FAILED: new FormControl(false),

          confirmationPrompts: new FormControl(false),
          confirmationPromptRemoveDirectory: new FormControl(false),
          confirmationPromptTrashFile: new FormControl(false),
          confirmationPromptConvertTiff: new FormControl(false),
          confirmationPromptLeaveProject: new FormControl(false),
          confirmationPromptMoveElementOutOfSection: new FormControl(false),
          confirmationPromptTrashElementFromDeleteMenu: new FormControl(false),
          confirmationPromptDeleteColumn: new FormControl(false),
          confirmationPromptTrashElementFromDetailView: new FormControl(false),
          confirmationPromptDuplicateProject: new FormControl(false),
          confirmationPromptRemoveElementFromLabbook: new FormControl(false),
          confirmationPromptTrashAndDeleteElementFromLabbook: new FormControl(false),
        }),
      });
    });

    it('should call onSaveEmailNotificationsSpy()', () => {
      const onSaveEmailNotificationsSpy = spyOn(spectator.component, 'onSaveEmailNotifications').and.callThrough();
      spectator.component.onSaveEmailNotifications();
      expect(onSaveEmailNotificationsSpy).toHaveBeenCalledTimes(1);

      spectator.setInput({
        loading: true,
      });
      spectator.component.onSaveEmailNotifications();
      expect(onSaveEmailNotificationsSpy).toHaveBeenCalledTimes(2);
    });

    it('should call onSaveDialogSettings()', () => {
      const onSaveDialogSettingsSpy = spyOn(spectator.component, 'onSaveDialogSettings').and.callThrough();
      spectator.component.onSaveDialogSettings();
      expect(onSaveDialogSettingsSpy).toHaveBeenCalledTimes(1);

      spectator.setInput({
        loading: true,
      });
      spectator.component.onSaveDialogSettings();
      expect(onSaveDialogSettingsSpy).toHaveBeenCalledTimes(2);
    });

    it('should call onToggleEmailNotificationsAppointments()', () => {
      expect(spectator.component.form.controls.notificationAppointments.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_RELATION_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_REMINDER.value).toBe(false);
      expect(spectator.component.form.controls.MAIL_CONF_MEETING_CONFIRMATION.value).toBe(false);

      spectator.component.form.patchValue({
        notificationAppointments: true,
      });
      spectator.component.onToggleEmailNotificationsAppointments();

      expect(spectator.component.form.controls.notificationAppointments.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_RELATION_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_REMINDER.value).toBe(true);
      expect(spectator.component.form.controls.MAIL_CONF_MEETING_CONFIRMATION.value).toBe(true);
    });

    it('should call onToggleEmailNotificationsTasks()', () => {
      expect(spectator.component.form.controls.notificationTasks.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_RELATION_CHANGED.value).toBe(false);

      spectator.component.form.patchValue({
        notificationTasks: true,
      });
      spectator.component.onToggleEmailNotificationsTasks();

      expect(spectator.component.form.controls.notificationTasks.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_RELATION_CHANGED.value).toBe(true);
    });

    it('should call onToggleEmailNotificationsProjects()', () => {
      expect(spectator.component.form.controls.notificationProjects.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_CHANGED.value).toBe(false);

      spectator.component.form.patchValue({
        notificationProjects: true,
      });
      spectator.component.onToggleEmailNotificationsProjects();

      expect(spectator.component.form.controls.notificationProjects.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_CHANGED.value).toBe(true);
    });

    it('should call onToggleEmailNotificationsDSS()', () => {
      expect(spectator.component.form.controls.notificationDSS.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_IN_PROGRESS.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FINISHED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FAILED.value).toBe(false);

      spectator.component.form.patchValue({
        notificationDSS: true,
      });
      spectator.component.onToggleEmailNotificationsDSS();

      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_IN_PROGRESS.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FINISHED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FAILED.value).toBe(true);
    });

    it('should call onToggleDialogSettingsConfirmationPrompts()', () => {
      expect(spectator.component.form.controls.confirmationPrompts.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptRemoveDirectory.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashFile.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptConvertTiff.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptLeaveProject.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptMoveElementOutOfSection.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDeleteMenu.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptDeleteColumn.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDetailView.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptDuplicateProject.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptRemoveElementFromLabbook.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashAndDeleteElementFromLabbook.value).toBe(false);

      spectator.component.form.patchValue({
        confirmationPrompts: true,
      });
      spectator.component.onToggleDialogSettingsConfirmationPrompts();

      expect(spectator.component.form.controls.confirmationPrompts.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptRemoveDirectory.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashFile.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptConvertTiff.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptLeaveProject.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptMoveElementOutOfSection.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDeleteMenu.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptDeleteColumn.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDetailView.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptDuplicateProject.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptRemoveElementFromLabbook.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashAndDeleteElementFromLabbook.value).toBe(true);
    });

    it('should call onToggleParentEmailNotificationCheckboxes()', () => {
      expect(spectator.component.form.controls.notificationAppointments.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_RELATION_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_REMINDER.value).toBe(false);
      expect(spectator.component.form.controls.MAIL_CONF_MEETING_CONFIRMATION.value).toBe(false);

      expect(spectator.component.form.controls.notificationTasks.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_RELATION_CHANGED.value).toBe(false);

      expect(spectator.component.form.controls.notificationProjects.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_CHANGED.value).toBe(false);

      expect(spectator.component.form.controls.notificationDSS.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_IN_PROGRESS.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FINISHED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FAILED.value).toBe(false);

      expect(spectator.component.form.controls.confirmationPrompts.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptRemoveDirectory.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashFile.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptConvertTiff.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptLeaveProject.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptMoveElementOutOfSection.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDeleteMenu.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptDeleteColumn.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDetailView.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptDuplicateProject.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptRemoveElementFromLabbook.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashAndDeleteElementFromLabbook.value).toBe(false);

      spectator.component.form.patchValue({
        NOTIFICATION_CONF_MEETING_USER_CHANGED: true,
        NOTIFICATION_CONF_MEETING_CHANGED: true,
        NOTIFICATION_CONF_MEETING_RELATION_CHANGED: true,
        NOTIFICATION_CONF_MEETING_REMINDER: true,
        MAIL_CONF_MEETING_CONFIRMATION: true,
        NOTIFICATION_CONF_TASK_USER_CHANGED: true,
        NOTIFICATION_CONF_TASK_CHANGED: true,
        NOTIFICATION_CONF_TASK_RELATION_CHANGED: true,
        NOTIFICATION_CONF_PROJECT_USER_CHANGED: true,
        NOTIFICATION_CONF_PROJECT_CHANGED: true,
        NOTIFICATION_DSS_IMPORT_IN_PROGRESS: true,
        NOTIFICATION_DSS_IMPORT_FINISHED: true,
        NOTIFICATION_DSS_IMPORT_FAILED: true,
        confirmationPromptRemoveDirectory: true,
        confirmationPromptTrashFile: true,
        confirmationPromptConvertTiff: true,
        confirmationPromptLeaveProject: true,
        confirmationPromptMoveElementOutOfSection: true,
        confirmationPromptTrashElementFromDeleteMenu: true,
        confirmationPromptDeleteColumn: true,
        confirmationPromptTrashElementFromDetailView: true,
        confirmationPromptDuplicateProject: true,
        confirmationPromptRemoveElementFromLabbook: true,
        confirmationPromptTrashAndDeleteElementFromLabbook: true,
      });
      spectator.component.onToggleParentEmailNotificationCheckboxes();
      spectator.component.onToggleParentDialogSettingsCheckbox();

      expect(spectator.component.form.controls.notificationAppointments.value).toBe(true);
      expect(spectator.component.form.controls.notificationTasks.value).toBe(true);
      expect(spectator.component.form.controls.notificationProjects.value).toBe(true);
      expect(spectator.component.form.controls.notificationDSS.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPrompts.value).toBe(true);
    });
  });

  describe('checkboxes checked', () => {
    beforeEach(() => {
      spectator.setInput({
        form: new FormGroup<any>({
          notificationAppointments: new FormControl(true),
          NOTIFICATION_CONF_MEETING_USER_CHANGED: new FormControl(true),
          NOTIFICATION_CONF_MEETING_CHANGED: new FormControl(true),
          NOTIFICATION_CONF_MEETING_RELATION_CHANGED: new FormControl(true),
          NOTIFICATION_CONF_MEETING_REMINDER: new FormControl(true),
          MAIL_CONF_MEETING_CONFIRMATION: new FormControl(true),

          notificationTasks: new FormControl(true),
          NOTIFICATION_CONF_TASK_USER_CHANGED: new FormControl(true),
          NOTIFICATION_CONF_TASK_CHANGED: new FormControl(true),
          NOTIFICATION_CONF_TASK_RELATION_CHANGED: new FormControl(true),

          notificationProjects: new FormControl(true),
          NOTIFICATION_CONF_PROJECT_USER_CHANGED: new FormControl(true),
          NOTIFICATION_CONF_PROJECT_CHANGED: new FormControl(true),

          notificationDSS: new FormControl(true),
          NOTIFICATION_DSS_IMPORT_IN_PROGRESS: new FormControl(true),
          NOTIFICATION_DSS_IMPORT_FINISHED: new FormControl(true),
          NOTIFICATION_DSS_IMPORT_FAILED: new FormControl(true),

          confirmationPrompts: new FormControl(true),
          confirmationPromptRemoveDirectory: new FormControl(true),
          confirmationPromptTrashFile: new FormControl(true),
          confirmationPromptConvertTiff: new FormControl(true),
          confirmationPromptLeaveProject: new FormControl(true),
          confirmationPromptMoveElementOutOfSection: new FormControl(true),
          confirmationPromptTrashElementFromDeleteMenu: new FormControl(true),
          confirmationPromptDeleteColumn: new FormControl(true),
          confirmationPromptTrashElementFromDetailView: new FormControl(true),
          confirmationPromptDuplicateProject: new FormControl(true),
          confirmationPromptRemoveElementFromLabbook: new FormControl(true),
          confirmationPromptTrashAndDeleteElementFromLabbook: new FormControl(true),
        }),
      });
    });

    it('should call onSaveEmailNotificationsSpy()', () => {
      const onSaveEmailNotificationsSpy = spyOn(spectator.component, 'onSaveEmailNotifications').and.callThrough();
      spectator.component.onSaveEmailNotifications();
      expect(onSaveEmailNotificationsSpy).toHaveBeenCalledTimes(1);

      spectator.setInput({
        loading: true,
      });
      spectator.component.onSaveEmailNotifications();
      expect(onSaveEmailNotificationsSpy).toHaveBeenCalledTimes(2);
    });

    it('should call onSaveDialogSettings()', () => {
      const onSaveDialogSettingsSpy = spyOn(spectator.component, 'onSaveDialogSettings').and.callThrough();
      spectator.component.onSaveDialogSettings();
      expect(onSaveDialogSettingsSpy).toHaveBeenCalledTimes(1);

      spectator.setInput({
        loading: true,
      });
      spectator.component.onSaveDialogSettings();
      expect(onSaveDialogSettingsSpy).toHaveBeenCalledTimes(2);
    });

    it('should call onToggleEmailNotificationsAppointments()', () => {
      expect(spectator.component.form.controls.notificationAppointments.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_RELATION_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_REMINDER.value).toBe(true);
      expect(spectator.component.form.controls.MAIL_CONF_MEETING_CONFIRMATION.value).toBe(true);

      spectator.component.form.patchValue({
        notificationAppointments: false,
      });
      spectator.component.onToggleEmailNotificationsAppointments();

      expect(spectator.component.form.controls.notificationAppointments.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_RELATION_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_REMINDER.value).toBe(false);
      expect(spectator.component.form.controls.MAIL_CONF_MEETING_CONFIRMATION.value).toBe(false);
    });

    it('should call onToggleEmailNotificationsTasks()', () => {
      expect(spectator.component.form.controls.notificationTasks.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_RELATION_CHANGED.value).toBe(true);

      spectator.component.form.patchValue({
        notificationTasks: false,
      });
      spectator.component.onToggleEmailNotificationsTasks();

      expect(spectator.component.form.controls.notificationTasks.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_RELATION_CHANGED.value).toBe(false);
    });

    it('should call onToggleEmailNotificationsProjects()', () => {
      expect(spectator.component.form.controls.notificationProjects.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_CHANGED.value).toBe(true);

      spectator.component.form.patchValue({
        notificationProjects: false,
      });
      spectator.component.onToggleEmailNotificationsProjects();

      expect(spectator.component.form.controls.notificationProjects.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_USER_CHANGED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_CHANGED.value).toBe(false);
    });

    it('should call onToggleEmailNotificationsDSS()', () => {
      expect(spectator.component.form.controls.notificationDSS.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_IN_PROGRESS.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FINISHED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FAILED.value).toBe(true);

      spectator.component.form.patchValue({
        notificationDSS: false,
      });
      spectator.component.onToggleEmailNotificationsDSS();

      expect(spectator.component.form.controls.notificationDSS.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_IN_PROGRESS.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FINISHED.value).toBe(false);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FAILED.value).toBe(false);
    });

    it('should call onToggleDialogSettingsConfirmationPrompts()', () => {
      expect(spectator.component.form.controls.confirmationPrompts.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptRemoveDirectory.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashFile.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptConvertTiff.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptLeaveProject.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptMoveElementOutOfSection.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDeleteMenu.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptDeleteColumn.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDetailView.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptDuplicateProject.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptRemoveElementFromLabbook.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashAndDeleteElementFromLabbook.value).toBe(true);

      spectator.component.form.patchValue({
        confirmationPrompts: false,
      });
      spectator.component.onToggleDialogSettingsConfirmationPrompts();

      expect(spectator.component.form.controls.confirmationPrompts.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptRemoveDirectory.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashFile.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptConvertTiff.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptLeaveProject.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptMoveElementOutOfSection.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDeleteMenu.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptDeleteColumn.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDetailView.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptDuplicateProject.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptRemoveElementFromLabbook.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPromptTrashAndDeleteElementFromLabbook.value).toBe(false);
    });

    it('should call onToggleParentEmailNotificationCheckboxes()', () => {
      expect(spectator.component.form.controls.notificationAppointments.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_RELATION_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_MEETING_REMINDER.value).toBe(true);
      expect(spectator.component.form.controls.MAIL_CONF_MEETING_CONFIRMATION.value).toBe(true);

      expect(spectator.component.form.controls.notificationTasks.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_TASK_RELATION_CHANGED.value).toBe(true);

      expect(spectator.component.form.controls.notificationProjects.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_USER_CHANGED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_CONF_PROJECT_CHANGED.value).toBe(true);

      expect(spectator.component.form.controls.notificationDSS.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_IN_PROGRESS.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FINISHED.value).toBe(true);
      expect(spectator.component.form.controls.NOTIFICATION_DSS_IMPORT_FAILED.value).toBe(true);

      expect(spectator.component.form.controls.confirmationPrompts.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptRemoveDirectory.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashFile.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptConvertTiff.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptLeaveProject.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptMoveElementOutOfSection.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDeleteMenu.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptDeleteColumn.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashElementFromDetailView.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptDuplicateProject.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptRemoveElementFromLabbook.value).toBe(true);
      expect(spectator.component.form.controls.confirmationPromptTrashAndDeleteElementFromLabbook.value).toBe(true);

      spectator.component.form.patchValue({
        NOTIFICATION_CONF_MEETING_USER_CHANGED: false,
        NOTIFICATION_CONF_MEETING_CHANGED: false,
        NOTIFICATION_CONF_MEETING_RELATION_CHANGED: false,
        NOTIFICATION_CONF_MEETING_REMINDER: false,
        MAIL_CONF_MEETING_CONFIRMATION: false,
        NOTIFICATION_CONF_TASK_USER_CHANGED: false,
        NOTIFICATION_CONF_TASK_CHANGED: false,
        NOTIFICATION_CONF_TASK_RELATION_CHANGED: false,
        NOTIFICATION_CONF_PROJECT_USER_CHANGED: false,
        NOTIFICATION_CONF_PROJECT_CHANGED: false,
        NOTIFICATION_DSS_IMPORT_IN_PROGRESS: false,
        NOTIFICATION_DSS_IMPORT_FINISHED: false,
        NOTIFICATION_DSS_IMPORT_FAILED: false,
        confirmationPromptRemoveDirectory: false,
        confirmationPromptTrashFile: false,
        confirmationPromptConvertTiff: false,
        confirmationPromptLeaveProject: false,
        confirmationPromptMoveElementOutOfSection: false,
        confirmationPromptTrashElementFromDeleteMenu: false,
        confirmationPromptDeleteColumn: false,
        confirmationPromptTrashElementFromDetailView: false,
        confirmationPromptDuplicateProject: false,
        confirmationPromptRemoveElementFromLabbook: false,
        confirmationPromptTrashAndDeleteElementFromLabbook: false,
      });
      spectator.component.onToggleParentEmailNotificationCheckboxes();
      spectator.component.onToggleParentDialogSettingsCheckbox();

      expect(spectator.component.form.controls.notificationAppointments.value).toBe(false);
      expect(spectator.component.form.controls.notificationTasks.value).toBe(false);
      expect(spectator.component.form.controls.notificationProjects.value).toBe(false);
      expect(spectator.component.form.controls.notificationDSS.value).toBe(false);
      expect(spectator.component.form.controls.confirmationPrompts.value).toBe(false);
    });
  });
});
