/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { PicturesService, ProjectsService } from '@app/services';
import { SaveSketchEvent } from '@eworkbench/picture-editor';
import { Project, SketchPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

interface FormSketch {
  title: string | null;
  height: number | null;
  width: number | null;
  rendered_image: globalThis.File | Blob | string | null;
  shapes_image: globalThis.File | Blob | string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-sketch-file-modal',
  templateUrl: './sketch.component.html',
  styleUrls: ['./sketch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SketchPictureModalComponent implements OnInit {
  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group<FormSketch>({
    title: [null, [Validators.required]],
    height: [null],
    width: [null],
    rendered_image: [null],
    shapes_image: [null],
    projects: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly picturesService: PicturesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService
  ) {}

  public get f(): FormGroup<FormSketch>['controls'] {
    return this.form.controls;
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
    this.initSearchInput();
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
            this.projects = [...projects];
            this.cdr.markForCheck();
          }
        }
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
        /* istanbul ignore next */ file => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, navigate: ['/pictures', file.pk] });
          this.translocoService
            .selectTranslate('picture.sketchModal.toastr.success')
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
