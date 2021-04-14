/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DMPService, ProjectsService } from '@app/services';
import { DMP, DMPFormData, DropdownElement, ModalCallback, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-dmp-preview',
  templateUrl: './dmp.component.html',
  styleUrls: ['./dmp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DMPPreviewComponent implements OnInit {
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

  public dmp?: DMP;

  public formData: DMPFormData[] = [];

  public status: DropdownElement[] = [];

  public statusFormControl = this.fb.control<string | null>(null);

  public projectsFormControl = this.fb.control<string[] | null>(null);

  public projects: Project[] = [];

  public loading = true;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly dmpService: DMPService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('dmps')
      .pipe(untilDestroyed(this))
      .subscribe(dmps => {
        this.status = [
          {
            value: 'NEW',
            label: dmps.status.new,
          },
          {
            value: 'PROG',
            label: dmps.status.inProgress,
          },
          {
            value: 'FIN',
            label: dmps.status.done,
          },
        ];
      });
  }

  public initDetails(): void {
    this.dmpService
      .previewVersion(this.id, this.version)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (dmp: DMP) => {
          this.dmp = { ...dmp };

          this.statusFormControl.patchValue(dmp.status, { emitEvent: false });
          this.statusFormControl.disable({ emitEvent: false });

          this.loadProjects(dmp.projects);
          this.projectsFormControl.patchValue(dmp.projects, { emitEvent: false });
          this.projectsFormControl.disable({ emitEvent: false });

          this.formData = dmp.dmp_form_data;

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

    this.dmpService
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
