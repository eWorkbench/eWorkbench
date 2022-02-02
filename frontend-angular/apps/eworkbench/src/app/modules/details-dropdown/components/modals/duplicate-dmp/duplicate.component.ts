/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DMPService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';

interface FormDuplicate {
  doNotShowMessageAgain: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-duplicate-dmp-modal',
  templateUrl: './duplicate.component.html',
  styleUrls: ['./duplicate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateDMPModalComponent {
  public id: string = this.modalRef.data.id;

  public userSetting?: string = this.modalRef.data.userSetting;

  public loading = false;

  public state = ModalState.Unchanged;

  public form = this.fb.group<FormDuplicate>({
    doNotShowMessageAgain: [false],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly dmpService: DMPService,
    private readonly userService: UserService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly userStore: UserStore,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f(): FormGroup<FormDuplicate>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.dmpService
      .duplicate(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ dmp => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, navigate: ['/dmps', dmp.pk] });
          this.translocoService
            .selectTranslate('dmp.duplicate.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(message => {
              this.toastrService.success(message);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public saveUserDialogSettings(): void {
    this.userService
      .get()
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(user => {
          return this.userService.changeSettings({
            userprofile: {
              ui_settings: {
                ...user.userprofile.ui_settings,
                confirm_dialog: {
                  ...user.userprofile.ui_settings?.confirm_dialog,
                  'SkipDialog-DuplicateDMP': this.f.doNotShowMessageAgain.value,
                },
              },
            },
          });
        })
      )
      .subscribe(
        /* istanbul ignore next */ user => {
          this.userStore.update(() => ({ user }));
          this.translocoService
            .selectTranslate('detailsDropdown.duplicateDMPModal.toastr.success.doNotShowMessageAgainUpdated')
            .pipe(untilDestroyed(this))
            .subscribe(doNotShowMessageAgainUpdated => {
              this.toastrService.success(doNotShowMessageAgainUpdated);
            });
        }
      );
  }
}
