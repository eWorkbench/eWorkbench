/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectsService } from '@app/services';
import type { DateGroup, DropdownElement, Project, ProjectPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { set } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';

interface FormProject {
  name: FormControl<string | null>;
  parentProject: string | null;
  projectState: FormControl<ProjectPayload['project_state'] | null>;
  description: string | null;
  dateGroup: FormControl<DateGroup>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-project-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectModalComponent implements OnInit {
  public initialState?: Project = this.modalRef.data?.initialState;

  public disableProjectField?: boolean = this.modalRef.data?.disableProjectField;

  public newSubproject?: boolean = this.modalRef.data?.newSubproject;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public stateItems: DropdownElement[] = [];

  public form = this.fb.group<FormProject>({
    name: this.fb.control(null, Validators.required),
    parentProject: null,
    description: null,
    projectState: this.fb.control('INIT', Validators.required),
    dateGroup: this.fb.control({ start: null, end: null, fullDay: true }),
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get project(): ProjectPayload {
    let dateTimeStart = null;
    if (this.f.dateGroup.value.start) {
      dateTimeStart = new Date(Date.parse(this.f.dateGroup.value.start));
      if (this.f.dateGroup.value.fullDay) {
        dateTimeStart = set(dateTimeStart, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
      }
      dateTimeStart = dateTimeStart.toISOString();
    }

    let dateTimeEnd = null;
    if (this.f.dateGroup.value.end) {
      dateTimeEnd = new Date(Date.parse(this.f.dateGroup.value.end));
      if (this.f.dateGroup.value.fullDay) {
        dateTimeEnd = set(dateTimeEnd, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
      }
      dateTimeEnd = dateTimeEnd.toISOString();
    }

    return {
      name: this.f.name.value!,
      parent_project: this.f.parentProject.value ?? null,
      description: this.f.description.value ?? '',
      project_state: this.f.projectState.value ?? 'START',
      start_date: dateTimeStart,
      stop_date: dateTimeEnd,
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearchInput();
    this.patchFormValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('projects.state')
      .pipe(untilDestroyed(this))
      .subscribe(state => {
        this.stateItems = [
          { label: state.new, value: 'INIT' },
          { label: state.inProgress, value: 'START' },
          { label: state.done, value: 'FIN' },
          { label: state.paused, value: 'PAUSE' },
          { label: state.canceled, value: 'CANCE' },
        ];
      });
  }

  public initSearchInput(): void {
    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(projects => {
        if (projects.length) {
          this.projects = [...projects];
          this.cdr.markForCheck();
        }
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
          name: this.initialState.name,
          parentProject: this.initialState.parent_project,
          description: this.initialState.description!,
          projectState: this.initialState.project_state,
          dateGroup: {
            start: this.initialState.start_date,
            end: this.initialState.stop_date,
            fullDay: true,
          },
        },
        { emitEvent: false }
      );

      if (this.initialState.parent_project) {
        this.projectsService
          .get(this.initialState.parent_project)
          .pipe(
            untilDestroyed(this),
            catchError(() =>
              of({
                pk: this.initialState!.parent_project,
                name: this.translocoService.translate('formInput.unknownProject'),
                is_favourite: false,
              } as Project)
            )
          )
          .subscribe(project => {
            this.projects = [...this.projects, project]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          });
      }

      if (this.disableProjectField) {
        this.f.parentProject.disable();
      }
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.projectsService
      .add(this.project)
      .pipe(untilDestroyed(this))
      .subscribe(
        project => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            data: { newContent: project },
            navigate: ['/projects', project.pk],
          });
          this.translocoService
            .selectTranslate('project.newModal.toastr.success')
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
