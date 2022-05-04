/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBookSectionsService, LabBooksService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import type { LabBookElement, ModalCallback } from '@eworkbench/types';
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
  selector: 'eworkbench-move-labbook-element-to-labbook-modal',
  templateUrl: './element-to-labbook.component.html',
  styleUrls: ['./element-to-labbook.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveLabBookElementToLabBookModalComponent {
  @Input()
  public projects?: string[] = [];

  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;

  public elementId = this.modalRef.data.elementId;

  public sectionId = this.modalRef.data.sectionId;

  public loading = false;

  public state = ModalState.Unchanged;

  public form = this.fb.group<FormRemove>({
    doNotShowMessageAgain: false,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labBooksService: LabBooksService,
    private readonly labBookSectionsService: LabBookSectionsService,
    private readonly cdr: ChangeDetectorRef,
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
                  'SkipDialog-MoveElementOutOfSection': this.f.doNotShowMessageAgain.value,
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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    // 1. Get all elements of section
    this.labBooksService
      .getElements(this.labBookId, this.sectionId)
      .pipe(
        untilDestroyed(this),
        switchMap(elements => {
          // 2. Filter elements of the section and patch it with the selected element removed
          const childElements = elements.filter(element => element.pk !== this.elementId).map(element => element.pk);

          return this.labBookSectionsService
            .patch(this.sectionId, {
              pk: this.sectionId,
              child_elements: [...childElements],
            })
            .pipe(untilDestroyed(this));
        }),
        switchMap(() =>
          // 3. Get all elements of main LabBook grid to calculate the new Y position in the next step
          this.labBooksService.getElements(this.labBookId).pipe(untilDestroyed(this))
        ),
        switchMap(elements => {
          // 4. Calculate and patch the new Y position for formerly removed element from the section
          const filteredElements = elements.filter(element => element.pk !== this.elementId);

          return this.labBooksService
            .patchElement(this.labBookId, this.elementId, {
              position_y: this.getMaxYPosition(filteredElements),
            })
            .pipe(untilDestroyed(this));
        })
      )
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, data: { id: this.elementId, gridReload: false } });
          this.translocoService
            .selectTranslate('labBook.moveElementToLabBookModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public getMaxYPosition(elements: LabBookElement<any>[]): number {
    if (!elements.length) {
      return 0;
    }

    return Math.max(...elements.map(element => element.position_y + element.height));
  }
}
