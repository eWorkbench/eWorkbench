/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBookSectionsService, LabBooksService } from '@app/services';
import { DropdownElement, ModalCallback } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap } from 'rxjs/operators';

interface FormSection {
  section: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-move-labbook-element-to-section-modal',
  templateUrl: './element-to-section.component.html',
  styleUrls: ['./element-to-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveLabBookElementToSectionModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;

  public elementId = this.modalRef.data.elementId;

  public loading = true;

  public state = ModalState.Unchanged;

  public sections: DropdownElement[] = [];

  public form = this.fb.group<FormSection>({
    section: [null, [Validators.required]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labBooksService: LabBooksService,
    private readonly labBookSectionsService: LabBookSectionsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public get f(): FormGroup<FormSection>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.labBooksService
      .getElements(this.labBookId)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ labBookElements => {
          const sections: DropdownElement[] = [];

          labBookElements.map(element => {
            if (element.child_object_content_type_model === 'labbooks.labbooksection') {
              sections.push({
                value: element.child_object.pk,
                label: `${element.child_object.date as string}: ${element.child_object.title as string}`,
              });
            }
          });

          this.sections = sections;
          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading || !this.f.section.value) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .getElements(this.labBookId, this.f.section.value)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ elements => {
          let maxYPosition = 0;

          if (elements.length) {
            maxYPosition = Math.max(...elements.map(element => element.position_y + element.height));
          }

          return this.labBookSectionsService
            .patch(this.f.section.value!, {
              pk: this.f.section.value!,
              child_elements: [...elements.map(element => element.pk), this.elementId], // TODO ???
            })
            .pipe(
              untilDestroyed(this),
              switchMap(
                /* istanbul ignore next */ () => {
                  return this.labBooksService
                    .patchElement(this.labBookId, this.elementId, {
                      position_y: maxYPosition,
                    })
                    .pipe(untilDestroyed(this));
                }
              )
            )
            .subscribe(
              /* istanbul ignore next */ () => {
                this.state = ModalState.Changed;
                this.modalRef.close({ state: this.state, data: { id: this.elementId, gridReload: false } });
                this.translocoService
                  .selectTranslate('labBook.moveElementToSectionModal.toastr.success')
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
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
