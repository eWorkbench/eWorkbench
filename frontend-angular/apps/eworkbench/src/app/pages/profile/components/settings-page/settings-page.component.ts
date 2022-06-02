/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NotificationConfigurationService, PageTitleService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import type { NotificationConfiguration, ProfileDialogSettings, User, UserProfileInfo } from '@eworkbench/types';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap, take } from 'rxjs/operators';

interface FormSettings {
  notificationAppointments: FormControl<boolean>;
  NOTIFICATION_CONF_MEETING_USER_CHANGED: FormControl<boolean>;
  NOTIFICATION_CONF_MEETING_CHANGED: FormControl<boolean>;
  NOTIFICATION_CONF_MEETING_RELATION_CHANGED: FormControl<boolean>;
  NOTIFICATION_CONF_MEETING_REMINDER: FormControl<boolean>;
  MAIL_CONF_MEETING_CONFIRMATION: FormControl<boolean>;

  notificationTasks: FormControl<boolean>;
  NOTIFICATION_CONF_TASK_USER_CHANGED: FormControl<boolean>;
  NOTIFICATION_CONF_TASK_CHANGED: FormControl<boolean>;
  NOTIFICATION_CONF_TASK_RELATION_CHANGED: FormControl<boolean>;

  notificationProjects: FormControl<boolean>;
  NOTIFICATION_CONF_PROJECT_USER_CHANGED: FormControl<boolean>;
  NOTIFICATION_CONF_PROJECT_CHANGED: FormControl<boolean>;
  NOTIFICATION_CONF_PROJECT_COMMENT: FormControl<boolean>;

  notificationDSS: FormControl<boolean>;
  NOTIFICATION_DSS_IMPORT_IN_PROGRESS: FormControl<boolean>;
  NOTIFICATION_DSS_IMPORT_FINISHED: FormControl<boolean>;
  NOTIFICATION_DSS_IMPORT_FAILED: FormControl<boolean>;

  confirmationPrompts: FormControl<boolean>;
  confirmationPromptRemoveDirectory: FormControl<boolean>;
  confirmationPromptTrash: FormControl<boolean>;
  confirmationPromptConvertTiff: FormControl<boolean>;
  confirmationPromptLeaveProject: FormControl<boolean>;
  confirmationPromptMoveElementOutOfSection: FormControl<boolean>;
  confirmationPromptDuplicateProject: FormControl<boolean>;
  confirmationPromptDuplicateDMP: FormControl<boolean>;
  confirmationPromptRemoveElementFromLabbook: FormControl<boolean>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit {
  public title = '';

  public loading = false;

  private notificationsPk = '';

  public userProfileInfo?: UserProfileInfo;

  public initialStateNotifications?: NotificationConfiguration;

  public initialStateUser?: User;

  public form = this.fb.group<FormSettings>({
    notificationAppointments: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_MEETING_USER_CHANGED: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_MEETING_CHANGED: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_MEETING_RELATION_CHANGED: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_MEETING_REMINDER: this.fb.control({ value: false, disabled: this.loading }),
    MAIL_CONF_MEETING_CONFIRMATION: this.fb.control({ value: false, disabled: this.loading }),

    notificationTasks: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_TASK_USER_CHANGED: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_TASK_CHANGED: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_TASK_RELATION_CHANGED: this.fb.control({ value: false, disabled: this.loading }),

    notificationProjects: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_PROJECT_USER_CHANGED: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_PROJECT_CHANGED: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_CONF_PROJECT_COMMENT: this.fb.control({ value: false, disabled: this.loading }),

    notificationDSS: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_DSS_IMPORT_IN_PROGRESS: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_DSS_IMPORT_FINISHED: this.fb.control({ value: false, disabled: this.loading }),
    NOTIFICATION_DSS_IMPORT_FAILED: this.fb.control({ value: false, disabled: this.loading }),

    confirmationPrompts: this.fb.control({ value: false, disabled: this.loading }),
    confirmationPromptRemoveDirectory: this.fb.control({ value: false, disabled: this.loading }),
    confirmationPromptTrash: this.fb.control({ value: false, disabled: this.loading }),
    confirmationPromptConvertTiff: this.fb.control({ value: false, disabled: this.loading }),
    confirmationPromptLeaveProject: this.fb.control({ value: false, disabled: this.loading }),
    confirmationPromptMoveElementOutOfSection: this.fb.control({ value: false, disabled: this.loading }),
    confirmationPromptDuplicateProject: this.fb.control({ value: false, disabled: this.loading }),
    confirmationPromptDuplicateDMP: this.fb.control({ value: false, disabled: this.loading }),
    confirmationPromptRemoveElementFromLabbook: this.fb.control({ value: false, disabled: this.loading }),
  });

  public constructor(
    private readonly userService: UserService,
    private readonly notificationConfigurationService: NotificationConfigurationService,
    private readonly fb: FormBuilder,
    private readonly userStore: UserStore,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  private get f() {
    return this.form.controls;
  }

  private get notificationConfiguration(): NotificationConfiguration {
    const notifications = [];

    if (this.f.NOTIFICATION_CONF_MEETING_USER_CHANGED.value) {
      notifications.push('NOTIFICATION_CONF_MEETING_USER_CHANGED');
    }
    if (this.f.NOTIFICATION_CONF_MEETING_CHANGED.value) {
      notifications.push('NOTIFICATION_CONF_MEETING_CHANGED');
    }
    if (this.f.NOTIFICATION_CONF_MEETING_RELATION_CHANGED.value) {
      notifications.push('NOTIFICATION_CONF_MEETING_RELATION_CHANGED');
    }
    if (this.f.NOTIFICATION_CONF_MEETING_REMINDER.value) {
      notifications.push('NOTIFICATION_CONF_MEETING_REMINDER');
    }
    if (this.f.MAIL_CONF_MEETING_CONFIRMATION.value) {
      notifications.push('MAIL_CONF_MEETING_CONFIRMATION');
    }
    if (this.f.NOTIFICATION_CONF_TASK_USER_CHANGED.value) {
      notifications.push('NOTIFICATION_CONF_TASK_USER_CHANGED');
    }
    if (this.f.NOTIFICATION_CONF_TASK_CHANGED.value) {
      notifications.push('NOTIFICATION_CONF_TASK_CHANGED');
    }
    if (this.f.NOTIFICATION_CONF_TASK_RELATION_CHANGED.value) {
      notifications.push('NOTIFICATION_CONF_TASK_RELATION_CHANGED');
    }
    if (this.f.NOTIFICATION_CONF_PROJECT_USER_CHANGED.value) {
      notifications.push('NOTIFICATION_CONF_PROJECT_USER_CHANGED');
    }
    if (this.f.NOTIFICATION_CONF_PROJECT_CHANGED.value) {
      notifications.push('NOTIFICATION_CONF_PROJECT_CHANGED');
    }
    if (this.f.NOTIFICATION_CONF_PROJECT_COMMENT.value) {
      notifications.push('NOTIFICATION_CONF_PROJECT_COMMENT');
    }
    if (this.f.NOTIFICATION_DSS_IMPORT_IN_PROGRESS.value) {
      notifications.push('NOTIFICATION_DSS_IMPORT_IN_PROGRESS');
    }
    if (this.f.NOTIFICATION_DSS_IMPORT_FINISHED.value) {
      notifications.push('NOTIFICATION_DSS_IMPORT_FINISHED');
    }
    if (this.f.NOTIFICATION_DSS_IMPORT_FAILED.value) {
      notifications.push('NOTIFICATION_DSS_IMPORT_FAILED');
    }

    const config: NotificationConfiguration = {
      allowed_notifications: notifications,
      pk: this.notificationsPk,
    };

    return config;
  }

  private get dialogSettings(): ProfileDialogSettings {
    return {
      'SkipDialog-ConvertTiff': !this.f.confirmationPromptConvertTiff.value,
      'SkipDialog-DuplicateProject': !this.f.confirmationPromptDuplicateProject.value,
      'SkipDialog-DuplicateDMP': !this.f.confirmationPromptDuplicateDMP.value,
      'SkipDialog-LeaveProject': !this.f.confirmationPromptLeaveProject.value,
      'SkipDialog-MoveElementOutOfSection': !this.f.confirmationPromptMoveElementOutOfSection.value,
      'SkipDialog-RemoveDirectory': !this.f.confirmationPromptRemoveDirectory.value,
      'SkipDialog-RemoveElementFromLabbook': !this.f.confirmationPromptRemoveElementFromLabbook.value,
      'SkipDialog-Trash': !this.f.confirmationPromptTrash.value,
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
    this.initPageTitle();
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('profileSettings.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
      });
  }

  public initDetails(): void {
    this.loading = true;

    this.notificationConfigurationService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        config => {
          this.initialStateNotifications = { ...config };
          this.notificationsPk = config.pk;

          config.allowed_notifications.forEach((notification: string) => {
            this.form.patchValue({ [notification]: true }, { emitEvent: false });
          });
          this.onToggleParentEmailNotificationCheckboxes();

          this.loading = false;

          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

    this.userService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        user => {
          this.initialStateUser = { ...user };

          const userSettings = user.userprofile.ui_settings;
          if (userSettings?.confirm_dialog) {
            const prompts = userSettings.confirm_dialog;

            if ('SkipDialog-ConvertTiff' in prompts) {
              this.form.patchValue({
                confirmationPromptConvertTiff: !prompts['SkipDialog-ConvertTiff'],
              });
            }

            if ('SkipDialog-DuplicateProject' in prompts) {
              this.form.patchValue({
                confirmationPromptDuplicateProject: !prompts['SkipDialog-DuplicateProject'],
              });
            }

            if ('SkipDialog-DuplicateDMP' in prompts) {
              this.form.patchValue({
                confirmationPromptDuplicateDMP: !prompts['SkipDialog-DuplicateDMP'],
              });
            }

            if ('SkipDialog-LeaveProject' in prompts) {
              this.form.patchValue({
                confirmationPromptLeaveProject: !prompts['SkipDialog-LeaveProject'],
              });
            }

            if ('SkipDialog-MoveElementOutOfSection' in prompts) {
              this.form.patchValue({
                confirmationPromptMoveElementOutOfSection: !prompts['SkipDialog-MoveElementOutOfSection'],
              });
            }

            if ('SkipDialog-RemoveDirectory' in prompts) {
              this.form.patchValue({
                confirmationPromptRemoveDirectory: !prompts['SkipDialog-RemoveDirectory'],
              });
            }

            if ('SkipDialog-RemoveElementFromLabbook' in prompts) {
              this.form.patchValue({
                confirmationPromptRemoveElementFromLabbook: !prompts['SkipDialog-RemoveElementFromLabbook'],
              });
            }

            if ('SkipDialog-Trash' in prompts) {
              this.form.patchValue({
                confirmationPromptTrash: !prompts['SkipDialog-Trash'],
              });
            }
          }

          this.onToggleParentDialogSettingsCheckbox();
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

    this.userService
      .getUserProfileInfo()
      .pipe(untilDestroyed(this))
      .subscribe(userProfileInfo => {
        this.userProfileInfo = userProfileInfo;
        this.cdr.markForCheck();
      });
  }

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public onSaveEmailNotifications(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.notificationConfigurationService
      .put(this.notificationConfiguration)
      .pipe(untilDestroyed(this))
      .subscribe(
        config => {
          this.notificationsPk = config.pk;
          this.onToggleParentEmailNotificationCheckboxes();
          this.updateStore();
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onSaveDialogSettings(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.userService
      .get()
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(user =>
          this.userService.changeSettings({
            userprofile: {
              ui_settings: {
                ...user.userprofile.ui_settings,
                confirm_dialog: {
                  ...user.userprofile.ui_settings?.confirm_dialog,
                  ...this.dialogSettings,
                },
              },
            },
          })
        )
      )
      .subscribe(
        () => {
          this.onToggleParentDialogSettingsCheckbox();
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onToggleEmailNotificationsAppointments(): void {
    const toggleValue = this.f.notificationAppointments.value;
    this.form.patchValue({
      NOTIFICATION_CONF_MEETING_USER_CHANGED: toggleValue,
      NOTIFICATION_CONF_MEETING_CHANGED: toggleValue,
      NOTIFICATION_CONF_MEETING_RELATION_CHANGED: toggleValue,
      NOTIFICATION_CONF_MEETING_REMINDER: toggleValue,
      MAIL_CONF_MEETING_CONFIRMATION: toggleValue,
    });
    this.onSaveEmailNotifications();
  }

  public onToggleEmailNotificationsTasks(): void {
    const toggleValue = this.f.notificationTasks.value;
    this.form.patchValue({
      NOTIFICATION_CONF_TASK_USER_CHANGED: toggleValue,
      NOTIFICATION_CONF_TASK_CHANGED: toggleValue,
      NOTIFICATION_CONF_TASK_RELATION_CHANGED: toggleValue,
    });
    this.onSaveEmailNotifications();
  }

  public onToggleEmailNotificationsProjects(): void {
    const toggleValue = this.f.notificationProjects.value;
    this.form.patchValue({
      NOTIFICATION_CONF_PROJECT_USER_CHANGED: toggleValue,
      NOTIFICATION_CONF_PROJECT_CHANGED: toggleValue,
      NOTIFICATION_CONF_PROJECT_COMMENT: toggleValue,
    });
    this.onSaveEmailNotifications();
  }

  public onToggleEmailNotificationsDSS(): void {
    const toggleValue = this.f.notificationDSS.value;
    this.form.patchValue({
      NOTIFICATION_DSS_IMPORT_IN_PROGRESS: toggleValue,
      NOTIFICATION_DSS_IMPORT_FINISHED: toggleValue,
      NOTIFICATION_DSS_IMPORT_FAILED: toggleValue,
    });
    this.onSaveEmailNotifications();
  }

  public onToggleDialogSettingsConfirmationPrompts(): void {
    const toggleValue = this.f.confirmationPrompts.value;
    this.form.patchValue({
      confirmationPromptRemoveDirectory: toggleValue,
      confirmationPromptTrash: toggleValue,
      confirmationPromptConvertTiff: toggleValue,
      confirmationPromptLeaveProject: toggleValue,
      confirmationPromptMoveElementOutOfSection: toggleValue,
      confirmationPromptDuplicateProject: toggleValue,
      confirmationPromptDuplicateDMP: toggleValue,
      confirmationPromptRemoveElementFromLabbook: toggleValue,
    });
    this.onSaveDialogSettings();
  }

  public onToggleParentEmailNotificationCheckboxes(): void {
    let toggleValue: boolean;

    toggleValue =
      this.f.NOTIFICATION_CONF_MEETING_USER_CHANGED.value &&
      this.f.NOTIFICATION_CONF_MEETING_CHANGED.value &&
      this.f.NOTIFICATION_CONF_MEETING_RELATION_CHANGED.value &&
      this.f.NOTIFICATION_CONF_MEETING_REMINDER.value &&
      this.f.MAIL_CONF_MEETING_CONFIRMATION.value;
    this.form.patchValue({
      notificationAppointments: toggleValue,
    });

    toggleValue =
      this.f.NOTIFICATION_CONF_TASK_USER_CHANGED.value &&
      this.f.NOTIFICATION_CONF_TASK_CHANGED.value &&
      this.f.NOTIFICATION_CONF_TASK_RELATION_CHANGED.value;
    this.form.patchValue({
      notificationTasks: toggleValue,
    });

    toggleValue =
      this.f.NOTIFICATION_CONF_PROJECT_USER_CHANGED.value &&
      this.f.NOTIFICATION_CONF_PROJECT_CHANGED.value &&
      this.f.NOTIFICATION_CONF_PROJECT_COMMENT.value;
    this.form.patchValue({
      notificationProjects: toggleValue,
    });

    toggleValue =
      this.f.NOTIFICATION_DSS_IMPORT_IN_PROGRESS.value &&
      this.f.NOTIFICATION_DSS_IMPORT_FINISHED.value &&
      this.f.NOTIFICATION_DSS_IMPORT_FAILED.value;
    this.form.patchValue({
      notificationDSS: toggleValue,
    });
  }

  public onToggleParentDialogSettingsCheckbox(): void {
    const toggleValue =
      this.f.confirmationPromptRemoveDirectory.value &&
      this.f.confirmationPromptTrash.value &&
      this.f.confirmationPromptConvertTiff.value &&
      this.f.confirmationPromptLeaveProject.value &&
      this.f.confirmationPromptDuplicateProject.value &&
      this.f.confirmationPromptDuplicateDMP.value &&
      this.f.confirmationPromptRemoveElementFromLabbook.value;
    this.form.patchValue({
      confirmationPrompts: toggleValue,
    });
  }

  public updateStore(): void {
    this.userService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(user => {
        this.userStore.update(() => ({ user }));
        this.cdr.markForCheck();
      });
  }
}
