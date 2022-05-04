/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectsService, ResourcesService } from '@app/services';
import type { DropdownElement, Project, Resource, ResourcePayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, mergeMap, switchMap } from 'rxjs/operators';

interface FormResource {
  name: FormControl<string | null>;
  type: FormControl<'ROOM' | 'LABEQ' | 'OFFEQ' | 'ITRES'>;
  contact: string | null;
  responsibleUnit: string | null;
  location: string | null;
  description: string | null;
  projects: FormControl<string[]>;
  ownerAgreement: boolean;
  termsOfUsePDF: File | string | null;
  duplicateMetadata: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-resource-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewResourceModalComponent implements OnInit {
  public initialState?: Resource = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public filePlaceholder = this.translocoService.translate('resource.newModal.termsOfUsePDF.placeholder');

  public types: DropdownElement[] = [];

  public form = this.fb.group<FormResource>({
    name: this.fb.control(null, Validators.required),
    type: this.fb.control('ROOM', Validators.required),
    contact: null,
    responsibleUnit: null,
    location: null,
    description: null,
    projects: this.fb.control([]),
    ownerAgreement: false,
    termsOfUsePDF: null,
    duplicateMetadata: true,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly resourcesService: ResourcesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get resource(): ResourcePayload {
    return {
      name: this.f.name.value!,
      type: this.f.type.value,
      contact: this.f.contact.value ?? '',
      responsible_unit: this.f.responsibleUnit.value ?? '',
      location: this.f.location.value ?? '',
      description: this.f.description.value ?? '',
      projects: this.f.projects.value,
      metadata: this.duplicate && this.f.duplicateMetadata.value ? this.initialState?.metadata : [],
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearchInput();
    this.patchFormValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('resources')
      .pipe(untilDestroyed(this))
      .subscribe(resources => {
        this.types = [
          {
            value: 'ROOM',
            label: resources.type.room,
          },
          {
            value: 'LABEQ',
            label: resources.type.labEquipment,
          },
          {
            value: 'OFFEQ',
            label: resources.type.officeEquipment,
          },
          {
            value: 'ITRES',
            label: resources.type.ITResource,
          },
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
          name: this.initialState.name,
          type: this.initialState.type,
          responsibleUnit: this.initialState.responsible_unit,
          contact: this.initialState.contact,
          location: this.initialState.location,
          description: this.initialState.description,
          projects: this.initialState.projects,
        },
        { emitEvent: false }
      );

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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.resourcesService
      .add(this.resource)
      .pipe(
        untilDestroyed(this),
        switchMap(resource => {
          if (this.f.termsOfUsePDF.dirty && this.f.termsOfUsePDF.value) {
            return this.resourcesService.changeTermsOfUsePDF(resource.pk, this.f.termsOfUsePDF.value).pipe(untilDestroyed(this));
          }

          return of(resource);
        })
      )
      .subscribe(
        resource => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            navigate: [`${this.withSidebar ? '..' : ''}/resources`, resource.pk],
          });
          this.translocoService
            .selectTranslate('resource.newModal.toastr.success')
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

  public onUploadPDF(event: Event): void {
    const files = (event.target as HTMLInputElement).files;

    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        this.form.patchValue({ termsOfUsePDF: files[0] });
        this.f.termsOfUsePDF.markAsDirty();
      };
      reader.readAsBinaryString(files[0]);
    }
  }
}
