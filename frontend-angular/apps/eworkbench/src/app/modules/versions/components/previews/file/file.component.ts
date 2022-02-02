/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DrivesService, FilesService, ProjectsService } from '@app/services';
import { Directory, File, ModalCallback, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-file-preview',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilePreviewComponent implements OnInit {
  @Input()
  public id?: string;

  @Input()
  public version?: string;

  @Input()
  public versionInProgress?: number | null;

  @Input()
  public modalRef!: DialogRef;

  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public state = ModalState.Unchanged;

  public file?: File;

  public storageFormControl = this.fb.control<string | null>(null);

  public descriptionFormControl = this.fb.control<string | null>(null);

  public projectsFormControl = this.fb.control<string[] | null>(null);

  public projects: Project[] = [];

  public directories: Directory[] = [];

  public loading = true;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly filesService: FilesService,
    private readonly drivesService: DrivesService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.filesService
      .previewVersion(this.id!, this.version!)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (file: File) => {
          this.file = { ...file };

          this.loadStorages();
          this.storageFormControl.patchValue(file.directory_id, { emitEvent: false });
          this.storageFormControl.disable({ emitEvent: false });

          this.descriptionFormControl.patchValue(file.description, { emitEvent: false });
          this.descriptionFormControl.disable({ emitEvent: false });

          this.loadProjects(file.projects);
          this.projectsFormControl.patchValue(file.projects, { emitEvent: false });
          this.projectsFormControl.disable({ emitEvent: false });

          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public loadProjects(projects: string[]): void {
    projects.forEach(id => {
      this.projectsService
        .get(id)
        .pipe(untilDestroyed(this))
        .subscribe(project => {
          this.projects = [...this.projects, project];
          this.cdr.markForCheck();
        });
    });
  }

  public loadStorages(): void {
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
        })
      )
      .subscribe(
        /* istanbul ignore next */ () => {
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

  public onRestoreVersion(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.filesService
      .restoreVersion(this.id!, this.version!, Boolean(this.versionInProgress))
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('versions.toastr.success.versionRestored')
            .pipe(untilDestroyed(this))
            .subscribe(versionRestored => {
              this.toastrService.success(versionRestored);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
