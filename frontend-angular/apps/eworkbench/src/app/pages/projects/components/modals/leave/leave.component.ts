/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserService, UserStore } from '@app/stores/user';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';

interface FormLeaveProject {
  doNotShowMessageAgain: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-leave-project-modal',
  templateUrl: './leave.component.html',
  styleUrls: ['./leave.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveProjectModalComponent {
  public form = this.fb.group<FormLeaveProject>({
    doNotShowMessageAgain: false,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly userStore: UserStore
  ) {}

  public get f() {
    return this.form.controls;
  }

  public saveUserDialogSettings(): void {
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
                  'SkipDialog-LeaveProject': this.f.doNotShowMessageAgain.value,
                },
              },
            },
          })
        )
      )
      .subscribe(user => {
        this.userStore.update(() => ({ user }));
        this.translocoService
          .selectTranslate('project.leaveModal.toastr.success.doNotShowMessageAgainUpdated')
          .pipe(untilDestroyed(this))
          .subscribe(doNotShowMessageAgainUpdated => {
            this.toastrService.success(doNotShowMessageAgainUpdated);
          });
      });
  }
}
