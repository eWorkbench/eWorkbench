/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { DrivesService, FilesService, ProjectsService } from '@app/services';
import { Directory, File, FilePayload, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap } from 'rxjs/operators';

interface FormFile {
  title: string | null;
  name: string | null;
  file: globalThis.File | string | null;
  storage: string | null;
  description: string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-file-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewFileModalComponent implements OnInit {
  public initialState?: File = this.modalRef.data?.initialState;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public directories: Directory[] = [];

  public filePlaceholder = this.translocoService.translate('file.newModal.file.placeholder');

  public form = this.fb.group<FormFile>({
    title: [null, [Validators.required]],
    name: [null],
    file: [null, [Validators.required]],
    storage: [null],
    description: [null],
    projects: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly filesService: FilesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService,
    private readonly drivesService: DrivesService
  ) {}

  public get f(): FormGroup<FormFile>['controls'] {
    return this.form.controls;
  }

  public get file(): FilePayload {
    return {
      title: this.f.title.value!,
      name: this.f.name.value!,
      path: this.f.file.value!,
      directory_id: this.f.storage.value ?? undefined,
      description: this.f.description.value ?? '',
      projects: this.f.projects.value,
    };
  }

  public ngOnInit(): void {
    this.initDetails();
    this.initSearchInput();
    this.patchFormValues();
  }

  public initDetails(): void {
    this.drivesService
      .getList()
      .pipe(
        untilDestroyed(this),
        map(drives => {
          this.directories = this.flattenTree(
            this.createTree(
              drives.data
                .flatMap(dir => dir.sub_directories)
                .flatMap(d =>
                  d.is_virtual_root ? { ...d, display: drives.data.find(drive => drive.pk === d.drive_id)?.display ?? d.display } : d
                )
            )
          );
          this.cdr.markForCheck();
        })
      )
      .subscribe();
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

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          title: this.initialState.title,
          name: this.initialState.name,
          file: this.initialState.pk,
          storage: this.initialState.directory_id,
          description: this.initialState.description,
          projects: this.initialState.projects,
        },
        { emitEvent: false }
      );

      this.f.file.disable({ emitEvent: false });

      /* istanbul ignore next */
      if (this.initialState.projects.length) {
        from(this.initialState.projects)
          .pipe(
            untilDestroyed(this),
            mergeMap(id =>
              this.projectsService.get(id).pipe(
                catchError(() => {
                  return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject') } as Project);
                })
              )
            )
          )
          .subscribe(
            /* istanbul ignore next */ project => {
              this.projects = [...this.projects, project];
              this.cdr.markForCheck();
            }
          );
      }
    }
  }

  public onUpload(event: Event): void {
    /* istanbul ignore next */
    const files = (event.target as HTMLInputElement).files;
    /* istanbul ignore next */
    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        this.filePlaceholder = files[0].name;
        this.form.patchValue({ name: files[0].name, file: files[0] });
        this.f.file.markAsDirty();
        this.cdr.markForCheck();
      };
      reader.readAsBinaryString(files[0]);
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.filesService
      .add(this.file)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ file => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, data: { newContent: file }, navigate: ['/files', file.pk] });
          this.translocoService
            .selectTranslate('file.newModal.toastr.success')
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

  public createTree(items: any[], id = null, level = 0): any[] {
    return items.filter(dir => dir.directory === id).map(d => ({ ...d, level, children: this.createTree(items, d.pk, level + 1) }));
  }

  public flattenTree(items: any[], res: any[] = []): any[] {
    if (items.length === 0) return res;
    const top = items.shift();
    if (!top) return res;
    res.push(top);
    if (top.children?.length) {
      res = this.flattenTree(top.children, res);
    }
    return this.flattenTree(items, res);
  }
}
