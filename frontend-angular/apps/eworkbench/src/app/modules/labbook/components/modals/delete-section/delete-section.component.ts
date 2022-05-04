/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBookSectionsService, LabBooksService } from '@app/services';
import type { LabBookSection } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

interface FormDelete {
  childElements: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-delete-labbook-section-element-modal',
  templateUrl: './delete-section.component.html',
  styleUrls: ['./delete-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteLabBookSectionElementModalComponent implements OnInit {
  public labBookId = this.modalRef.data.labBookId;

  public sectionId = this.modalRef.data.sectionId;

  public elementId = this.modalRef.data.elementId;

  public section?: LabBookSection;

  public state = ModalState.Unchanged;

  public loading = true;

  public form = this.fb.group<FormDelete>({
    childElements: 'remove',
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly labBooksService: LabBooksService,
    private readonly labBookSectionsService: LabBookSectionsService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.labBookSectionsService
      .get(this.elementId)
      .pipe(
        untilDestroyed(this),
        map(labBookSection => (this.section = labBookSection))
      )
      .subscribe(
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    if (this.f.childElements.value === 'remove') {
      this.removeChildElements();
    } else if (this.f.childElements.value === 'move') {
      this.moveChildElements();
    } else {
      this.loading = false;
    }
  }

  public removeChildElements(): void {
    const childElements = this.section?.child_elements ?? [];

    void Promise.all([
      ...childElements.map(elementId =>
        lastValueFrom(this.labBooksService.deleteElement(this.labBookId, elementId).pipe(untilDestroyed(this)))
      ),
    ]).then(() => this.deleteSectionElement(this.translocoService.translate('labBook.deleteSectionModal.removed.toastr.success')));
  }

  public moveChildElements(): void {
    this.labBooksService
      .getElements(this.labBookId)
      .pipe(
        untilDestroyed(this),
        map(elements => {
          if (elements.length) {
            return Math.max(...elements.map(element => element.position_y + element.height));
          }

          return 0;
        })
      )
      .subscribe(
        maxYPosition => {
          this.labBooksService
            .getElements(this.labBookId, this.elementId)
            .pipe(untilDestroyed(this))
            .subscribe(labBookElements => {
              void Promise.all([
                ...labBookElements.map(element =>
                  lastValueFrom(
                    this.labBooksService
                      .patchElement(this.labBookId, element.pk, {
                        ...element,
                        position_y: maxYPosition + element.position_y,
                      })
                      .pipe(untilDestroyed(this))
                  )
                ),
              ]).then(() => {
                void lastValueFrom(
                  this.labBookSectionsService
                    .patch(this.elementId, {
                      pk: this.elementId,
                      child_elements: [],
                    })
                    .pipe(untilDestroyed(this))
                ).then(() => {
                  this.deleteSectionElement(this.translocoService.translate('labBook.deleteSectionModal.moved.toastr.success'), true);
                });
              });
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public deleteSectionElement(message: string, gridReload?: boolean): void {
    this.labBooksService
      .deleteElement(this.labBookId, this.sectionId)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, data: { gridReload: Boolean(gridReload) } });
          this.toastrService.success(message);
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
