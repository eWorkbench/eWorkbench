/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBooksService, ProjectsService } from '@app/services';
import { LabBook, ModalCallback, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-preview',
  templateUrl: './labbook.component.html',
  styleUrls: ['./labbook.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookPreviewComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public version!: string;

  @Input()
  public versionInProgress?: number | null;

  @Input()
  public modalRef!: DialogRef;

  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public state = ModalState.Unchanged;

  public labBook?: LabBook;

  public descriptionFormControl = this.fb.control<string | null>(null);

  public projectsFormControl = this.fb.control<string[] | null>(null);

  public isTemplateFormControl = this.fb.control<boolean>(false);

  public projects: Project[] = [];

  public loading = true;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly labBooksService: LabBooksService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.labBooksService
      .previewVersion(this.id, this.version)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (labBook: LabBook) => {
          this.labBook = { ...labBook };

          this.isTemplateFormControl.patchValue(labBook.is_template, { emitEvent: false });
          this.isTemplateFormControl.disable({ emitEvent: false });

          this.descriptionFormControl.patchValue(labBook.description, { emitEvent: false });
          this.descriptionFormControl.disable({ emitEvent: false });

          this.loadProjects(labBook.projects);
          this.projectsFormControl.patchValue(labBook.projects, { emitEvent: false });
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

  public onRestoreVersion(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .restoreVersion(this.id, this.version, Boolean(this.versionInProgress))
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
