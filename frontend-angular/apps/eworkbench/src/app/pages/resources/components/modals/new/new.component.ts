/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectsService, ResourcesService, UserGroupsService } from '@app/services';
import { UserService } from '@app/stores/user';
import { DropdownElement, Project, Resource, ResourcePayload, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, mergeMap, switchMap } from 'rxjs/operators';

interface FormResource {
  name: string | null;
  type: 'ROOM' | 'LABEQ' | 'OFFEQ' | 'ITRES';
  contact: string | null;
  responsibleUnit: string | null;
  location: string | null;
  description: string | null;
  userAvailability: 'GLB' | 'USR' | 'PRJ';
  userAvailabilitySelectedUserGroups: string | null;
  userAvailabilitySelectedUsers: number[] | null;
  projects: string[];
  ownerAgreement: boolean;
  termsOfUsePDF: File | string | null;
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

  public userAvailabilitySelectedUsers: User[] = [];

  public userAvailabilitySelectedUsersInput$ = new Subject<string>();

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public filePlaceholder = this.translocoService.translate('resource.newModal.termsOfUsePDF.placeholder');

  public types: DropdownElement[] = [];

  public userAvailabilityChoices: DropdownElement[] = [];

  public userAvailabilitySelectedUserGroupsChoices: DropdownElement[] = [];

  public form = this.fb.group<FormResource>({
    name: [null, [Validators.required]],
    type: ['ROOM', [Validators.required]],
    contact: [null],
    responsibleUnit: [null],
    location: [null],
    description: [null],
    userAvailability: ['PRJ', [Validators.required]],
    userAvailabilitySelectedUserGroups: [null],
    userAvailabilitySelectedUsers: [[]],
    projects: [[]],
    ownerAgreement: [false],
    termsOfUsePDF: [null],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly resourcesService: ResourcesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly userService: UserService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService,
    private readonly userGroupsService: UserGroupsService
  ) {}

  public get f(): FormGroup<FormResource>['controls'] {
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
      user_availability: this.f.userAvailability.value,
      user_availability_selected_user_group_pks: this.f.userAvailabilitySelectedUserGroups.value
        ? [Number(this.f.userAvailabilitySelectedUserGroups.value)]
        : [],
      user_availability_selected_user_pks: this.f.userAvailabilitySelectedUsers.value,
      projects: this.f.projects.value,
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
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

        this.userAvailabilityChoices = [
          {
            value: 'GLB',
            label: resources.userAvailability.global,
          },
          {
            value: 'PRJ',
            label: resources.userAvailability.project,
          },
          {
            value: 'USR',
            label: resources.userAvailability.user,
          },
        ];
      });
  }

  public initDetails(): void {
    this.userGroupsService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ userGroups => {
          this.userAvailabilitySelectedUserGroupsChoices = userGroups.map(group => ({ value: group.pk.toString(), label: group.name }));
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.cdr.markForCheck();
        }
      );
  }

  public initSearchInput(): void {
    this.userAvailabilitySelectedUsersInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.userAvailabilitySelectedUsers = [...users];
            this.cdr.markForCheck();
          }
        }
      );

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
      this.userAvailabilitySelectedUsers = this.initialState.user_availability_selected_users;

      this.form.patchValue(
        {
          name: this.initialState.name,
          type: this.initialState.type,
          responsibleUnit: this.initialState.responsible_unit,
          contact: this.initialState.contact,
          location: this.initialState.location,
          userAvailability: this.initialState.user_availability,
          userAvailabilitySelectedUserGroups: this.initialState.user_availability_selected_user_group_pks?.length
            ? this.initialState.user_availability_selected_user_group_pks[0].toString()
            : null,
          userAvailabilitySelectedUsers: this.initialState.user_availability_selected_user_pks,
          description: this.initialState.description,
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

    this.resourcesService
      .add(this.resource)
      .pipe(
        untilDestroyed(this),
        switchMap(
          /* istanbul ignore next */ resource => {
            if (this.f.termsOfUsePDF.dirty && /* istanbul ignore next */ this.f.termsOfUsePDF.value) {
              return this.resourcesService.changeTermsOfUsePDF(resource.pk, this.f.termsOfUsePDF.value).pipe(untilDestroyed(this));
            }

            return of(resource);
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ resource => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, navigate: [`${this.withSidebar ? '..' : ''}/resources`, resource.pk] });
          this.translocoService
            .selectTranslate('resource.newModal.toastr.success')
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

  public onUploadPDF(event: Event): void {
    /* istanbul ignore next */
    const files = (event.target as HTMLInputElement).files;
    /* istanbul ignore next */
    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        this.form.patchValue({ termsOfUsePDF: files[0] });
        this.f.termsOfUsePDF.markAsDirty();
      };
      reader.readAsBinaryString(files[0]);
    }
  }

  public changeUserAvailabilitySelectedUsers(userAvailabilitySelectedUsers: User[]): void {
    this.userAvailabilitySelectedUsers = [...userAvailabilitySelectedUsers];
    this.cdr.markForCheck();
  }
}
