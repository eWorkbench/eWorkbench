/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { TaskBoardsService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { TaskBoardColumn } from '@eworkbench/types';
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
  selector: 'eworkbench-delete-column-modal',
  templateUrl: './delete-column.component.html',
  styleUrls: ['./delete-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteColumnModalComponent {
  public column = this.modalRef.data.column;

  public columns = this.modalRef.data.columns;

  public taskBoardId = this.modalRef.data.taskBoardId;

  public state = ModalState.Unchanged;

  public loading = false;

  public form = this.fb.group<FormDelete>({
    doNotShowMessageAgain: [false],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly taskBoardsService: TaskBoardsService,
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

  public onDelete(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    let order = 1;
    const columns: TaskBoardColumn[] = this.columns
      .filter(/* istanbul ignore next */ (col: TaskBoardColumn) => col.pk !== this.column.pk)
      .map(
        /* istanbul ignore next */ (col: TaskBoardColumn) => {
          col.ordering = order++;
          return col;
        }
      );

    this.taskBoardsService
      .moveColumn(this.taskBoardId, columns)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
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
                  'SkipDialog-DeleteColumn': this.f.doNotShowMessageAgain.value,
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
            .selectTranslate('taskBoard.deleteColumnModal.toastr.success.doNotShowMessageAgainUpdated')
            .pipe(untilDestroyed(this))
            .subscribe(doNotShowMessageAgainUpdated => {
              this.toastrService.success(doNotShowMessageAgainUpdated);
            });
        }
      );
  }
}
