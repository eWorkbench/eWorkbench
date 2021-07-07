/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBookSectionsService } from '@app/services';
import { DropdownElement, LabBookElementEvent, LabBookSectionPayload, ModalCallback } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { format } from 'date-fns';
import { ToastrService } from 'ngx-toastr';

interface FormElement {
  position: 'top' | 'bottom';
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-labbook-section-element-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewLabBookSectionElementModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public projectsList: string[] = this.modalRef.data.projects ?? [];

  public state = ModalState.Unchanged;

  public loading = false;

  public readonly dateFormat = 'yyyy-MM-dd';

  public position: DropdownElement[] = [];

  public form = this.fb.group<FormElement>({
    position: ['bottom', [Validators.required]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly labBookSectionsService: LabBookSectionsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public get f(): FormGroup<FormElement>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get element(): any {
    const element = {
      position: this.f.position.value,
    };

    return element;
  }

  public get section(): LabBookSectionPayload {
    const section = {
      date: format(new Date(), this.dateFormat),
      title: this.translocoService.translate('labBook.newSectionElementModal.title.placeholder'),
      projects: this.projectsList,
    };

    return section;
  }

  public ngOnInit(): void {
    this.initTranslations();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('labBook.newSectionElementModal.position')
      .pipe(untilDestroyed(this))
      .subscribe(position => {
        this.position = [
          { value: 'top', label: position.top },
          { value: 'bottom', label: position.bottom },
        ];
      });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBookSectionsService
      .add(this.section)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ section => {
          this.state = ModalState.Changed;
          const event: LabBookElementEvent = {
            childObjectId: section.pk,
            childObjectContentType: section.content_type,
            childObjectContentTypeModel: section.content_type_model,
            parentElement: 'labBook',
            position: this.element.position,
          };
          this.modalRef.close({ state: this.state, data: event });
          this.translocoService
            .selectTranslate('labBook.newSectionElementModal.toastr.success')
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
}
