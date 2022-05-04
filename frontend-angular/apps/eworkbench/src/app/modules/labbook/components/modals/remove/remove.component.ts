/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { UserService, UserStore } from '@app/stores/user';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';

interface FormRemove {
  doNotShowMessageAgain: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-element-remove-modal',
  templateUrl: './remove.component.html',
  styleUrls: ['./remove.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookElementRemoveModalComponent {
  public state = ModalState.Unchanged;

  public form = this.fb.group<FormRemove>({
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

  public onSubmit(): void {
    this.state = ModalState.Changed;
    this.modalRef.close({ state: this.state });
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
                  'SkipDialog-RemoveElementFromLabbook': this.f.doNotShowMessageAgain.value,
                },
              },
            },
          })
        )
      )
      .subscribe(user => {
        this.userStore.update(() => ({ user }));
        this.translocoService
          .selectTranslate('trash.deleteModal.toastr.success.doNotShowMessageAgainUpdated')
          .pipe(untilDestroyed(this))
          .subscribe(doNotShowMessageAgainUpdated => {
            this.toastrService.success(doNotShowMessageAgainUpdated);
          });
      });
  }
}
