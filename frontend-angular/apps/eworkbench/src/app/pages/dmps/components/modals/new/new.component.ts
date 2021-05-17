/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { DMPService, ProjectsService } from '@app/services';
import { DMPFormsService } from '@app/services/dmp-forms/dmp-forms.service';
import { DMP, DMPForm, DMPPayload, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, mergeMap, switchMap } from 'rxjs/operators';

interface FormDMP {
  title: string | null;
  dmpForm: string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-dmp-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewDMPModalComponent implements OnInit {
  public initialState?: DMP = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public loading = true;

  public state = ModalState.Unchanged;

  public dmpForms: DMPForm[] = [];

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group<FormDMP>({
    title: [null, [Validators.required]],
    dmpForm: [null, [Validators.required]],
    projects: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly dmpService: DMPService,
    public readonly dmpFormsService: DMPFormsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService
  ) {}

  public get f(): FormGroup<FormDMP>['controls'] {
    return this.form.controls;
  }

  public get dmp(): DMPPayload {
    return {
      title: this.f.title.value!,
      dmp_form: this.f.dmpForm.value!,
      status: 'NEW',
      projects: this.f.projects.value,
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.initDetails();
    this.patchFormValues();
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

  public initDetails(): void {
    this.dmpFormsService
      .getList()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ dmpForms => {
          this.dmpForms = [...dmpForms];
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
    if (this.initialState) {
      this.form.patchValue(
        {
          title: this.initialState.title,
          dmpForm: this.initialState.dmp_form,
          projects: this.initialState.projects,
        },
        { emitEvent: false }
      );

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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.dmpService
      .add(this.dmp)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ dmp => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, data: { newContent: dmp }, navigate: [`${this.withSidebar ? '..' : ''}/dmps`, dmp.pk] });
          this.translocoService
            .selectTranslate('dmp.newModal.toastr.success')
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
