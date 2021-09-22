/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBooksService, NotesService } from '@app/services';
import { DropdownElement, LabBookElementEvent, ModalCallback, NotePayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormElement {
  parentElement: string | null;
  position: 'top' | 'bottom';
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-labbook-note-element-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewLabBookNoteElementModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;

  public projectsList: string[] = this.modalRef.data.projects ?? [];

  public loading = true;

  public state = ModalState.Unchanged;

  public parentElement: DropdownElement[] = [];

  public position: DropdownElement[] = [];

  public form = this.fb.group<FormElement>({
    parentElement: ['labBook', [Validators.required]],
    position: ['bottom', [Validators.required]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly notesService: NotesService,
    private readonly labBooksService: LabBooksService,
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
      parentElement: this.f.parentElement.value,
      position: this.f.position.value,
    };

    return element;
  }

  public get note(): NotePayload {
    const note = {
      subject: this.translocoService.translate('labBook.newNoteElementModal.subject.placeholder'),
      content: '<p></p>',
      projects: this.projectsList,
    };

    return note;
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('labBook.newNoteElementModal')
      .pipe(untilDestroyed(this))
      .subscribe(newNoteElementModal => {
        this.parentElement = [{ value: 'labBook', label: newNoteElementModal.currentLabBook }];

        this.position = [
          { value: 'top', label: newNoteElementModal.position.top },
          { value: 'bottom', label: newNoteElementModal.position.bottom },
        ];
      });
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

          this.parentElement = [...this.parentElement, ...sections];
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
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.notesService
      .add(this.note)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ note => {
          this.state = ModalState.Changed;
          const event: LabBookElementEvent = {
            childObjectId: note.pk,
            childObjectContentType: note.content_type,
            childObjectContentTypeModel: note.content_type_model,
            parentElement: this.element.parentElement,
            position: this.element.position,
          };
          this.modalRef.close({ state: this.state, data: event });
          this.translocoService
            .selectTranslate('labBook.newNoteElementModal.toastr.success')
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
