/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DrivesService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { Directory, Drive } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';

interface FormDelete {
  doNotShowMessageAgain: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-delete-storage-directory-modal',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteStorageDirectoryModalComponent {
  public directory?: Directory = this.modalRef.data?.directory;

  public storage?: Drive = this.modalRef.data?.storage;

  public loading = false;

  public state = ModalState.Unchanged;

  public form = this.fb.group<FormDelete>({
    doNotShowMessageAgain: [false],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly drivesService: DrivesService,
    private readonly userService: UserService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly userStore: UserStore,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f(): FormGroup<FormDelete>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.drivesService
      .deleteDirectory(this.storage!.pk, this.directory!.pk)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('storages.deleteDirectory.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
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
                  'SkipDialog-RemoveDirectory': this.f.doNotShowMessageAgain.value,
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
            .selectTranslate('trash.deleteModal.toastr.success.doNotShowMessageAgainUpdated')
            .pipe(untilDestroyed(this))
            .subscribe(doNotShowMessageAgainUpdated => {
              this.toastrService.success(doNotShowMessageAgainUpdated);
            });
        }
      );
  }
}
