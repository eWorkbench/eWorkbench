/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { DrivesService, FilesService, ProjectsService } from '@app/services';
import type { Directory, File, FilePayload, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap } from 'rxjs/operators';

interface FormFile {
  title: FormControl<string | null>;
  name: string | null;
  file: FormControl<globalThis.File | string | null>;
  storage: string | null;
  description: string | null;
  projects: FormControl<string[]>;
  duplicateMetadata: boolean;
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

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public directories: Directory[] = [];

  public filePlaceholder = this.translocoService.translate('file.newModal.file.placeholder');

  public form = this.fb.group<FormFile>({
    title: this.fb.control(null, Validators.required),
    name: null,
    file: this.fb.control(null, Validators.required),
    storage: null,
    description: null,
    projects: this.fb.control([]),
    duplicateMetadata: true,
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

  public get f() {
    return this.form.controls;
  }

  public get file(): FilePayload {
    return {
      title: this.f.title.value!,
      name: this.f.name.value!,
      path: this.f.file.value!,
      directory_id: this.f.storage.value ?? undefined!,
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

      if (this.initialState.projects.length) {
        from(this.initialState.projects)
          .pipe(
            untilDestroyed(this),
            mergeMap(id =>
              this.projectsService.get(id).pipe(
                untilDestroyed(this),
                catchError(() =>
                  of({ pk: id, name: this.translocoService.translate('formInput.unknownProject'), is_favourite: false } as Project)
                )
              )
            )
          )
          .subscribe(project => {
            this.projects = [...this.projects, project]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          });
      }
    }
  }

  public onUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;

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
      .pipe(
        untilDestroyed(this),
        switchMap(file => {
          const metadata = this.duplicate && this.f.duplicateMetadata.value ? this.initialState?.metadata : [];
          return metadata?.length ? this.filesService.patch(file.pk, { metadata }).pipe(untilDestroyed(this)) : of(file);
        })
      )
      .subscribe(
        file => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            data: { newContent: file },
            navigate: [`${this.withSidebar ? '..' : ''}/files`, file.pk],
          });
          this.translocoService
            .selectTranslate('file.newModal.toastr.success')
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
