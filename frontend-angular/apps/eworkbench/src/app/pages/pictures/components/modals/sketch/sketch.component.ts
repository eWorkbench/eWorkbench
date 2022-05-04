/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { PicturesService, ProjectsService } from '@app/services';
import type { SaveSketchEvent } from '@eworkbench/picture-editor';
import type { Project, SketchPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

interface FormSketch {
  title: FormControl<string | null>;
  height: number | null;
  width: number | null;
  rendered_image: globalThis.File | Blob | string | null;
  shapes_image: globalThis.File | Blob | string | null;
  projects: FormControl<string[]>;
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

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group<FormSketch>({
    title: this.fb.control(null, Validators.required),
    height: null,
    width: null,
    rendered_image: null,
    shapes_image: null,
    projects: this.fb.control([]),
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

  public get f() {
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
        switchMap(input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(projects => {
        this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
        this.cdr.markForCheck();
      });

    this.projectsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(projects => {
        if (projects.data.length) {
          this.favoriteProjects = [...projects.data];
          this.projects = [...this.projects, ...this.favoriteProjects]
            .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      });
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
        file => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, navigate: ['/pictures', file.pk] });
          this.translocoService
            .selectTranslate('picture.sketchModal.toastr.success')
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
}
