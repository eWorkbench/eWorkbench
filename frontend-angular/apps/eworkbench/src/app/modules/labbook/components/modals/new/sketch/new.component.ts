/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBooksService, PicturesService, ProjectsService } from '@app/services';
import { SaveSketchEvent } from '@eworkbench/picture-editor';
import { DropdownElement, LabBookElementEvent, ModalCallback, Project, SketchPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, mergeMap, switchMap } from 'rxjs/operators';

interface FormElement {
  parentElement: string | null;
  position: 'top' | 'bottom';
  title: string | null;
  height: number | null;
  width: number | null;
  rendered_image: globalThis.File | Blob | string | null;
  shapes_image: globalThis.File | Blob | string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-labbook-sketch-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewLabBookSketchModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;

  public projects: string[] = this.modalRef.data.projects ?? [];

  public loading = true;

  public step = 1;

  public state = ModalState.Unchanged;

  public parentElement: DropdownElement[] = [];

  public position: DropdownElement[] = [];

  public projectsList: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group<FormElement>({
    parentElement: ['labBook', [Validators.required]],
    position: ['bottom', [Validators.required]],
    title: [null, [Validators.required]],
    height: [null],
    width: [null],
    rendered_image: [null],
    shapes_image: [null],
    projects: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labBooksService: LabBooksService,
    private readonly projectsService: ProjectsService,
    private readonly picturesService: PicturesService,
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

  public get picture(): SketchPayload {
    return {
      title: this.f.title.value!,
      height: 600,
      width: 600,
      rendered_image: this.f.rendered_image.value!,
      shapes_image: this.f.shapes_image.value,
      projects: this.f.projects.value,
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearchInput();
    this.initDetails();
    this.patchFormValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('labBook.newPictureElementModal')
      .pipe(untilDestroyed(this))
      .subscribe(newPictureElementModal => {
        this.parentElement = [{ value: 'labBook', label: newPictureElementModal.currentLabBook }];

        this.position = [
          { value: 'top', label: newPictureElementModal.position.top },
          { value: 'bottom', label: newPictureElementModal.position.bottom },
        ];
      });
  }

  public initSearchInput(): void {
    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          if (projects.length) {
            this.projectsList = [...projects];
            this.cdr.markForCheck();
          }
        }
      );
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

  public patchFormValues(): void {
    /* istanbul ignore next */
    if (this.projects.length) {
      from(this.projects)
        .pipe(
          untilDestroyed(this),
          mergeMap(id =>
            this.projectsService.get(id).pipe(
              untilDestroyed(this),
              catchError(() => {
                return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject') } as Project);
              })
            )
          )
        )
        .subscribe(
          /* istanbul ignore next */ project => {
            this.projectsList = [...this.projectsList, project];
            this.cdr.markForCheck();
          }
        );
    }

    this.form.patchValue(
      {
        projects: this.projects,
      },
      { emitEvent: false }
    );
  }

  public onSubmit(event: SaveSketchEvent): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.form.patchValue({
      rendered_image: event.file,
      shapes_image: event.shapes,
    });

    this.picturesService
      .add(this.picture)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ picture => {
          this.state = ModalState.Changed;
          const event: LabBookElementEvent = {
            childObjectId: picture.pk,
            childObjectContentType: picture.content_type,
            childObjectContentTypeModel: picture.content_type_model,
            parentElement: this.element.parentElement,
            position: this.element.position,
          };
          this.modalRef.close({ state: this.state, data: event });
          this.translocoService
            .selectTranslate('labBook.newSketchModal.toastr.success')
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

  public onChangeStep(step: number): void {
    this.step = step;
  }
}
