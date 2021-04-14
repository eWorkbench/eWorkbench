/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { DropdownElement, Metadata, Project, Resource, User } from '@eworkbench/types';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
  termsOfUsePDF: File | string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-study-room-details',
  templateUrl: './study-room-details.component.html',
  styleUrls: ['./study-room-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyRoomDetailsComponent implements OnInit {
  @Input()
  public initialState!: Resource;

  public editable = false;

  public userAvailabilitySelectedUsers: User[] = [];

  public projects: Project[] = [];

  public metadata?: Metadata[];

  public types: DropdownElement[] = [];

  public userAvailabilityChoices: DropdownElement[] = [];

  public userAvailabilitySelectedUserGroupsChoices: DropdownElement[] = [];

  public form: FormGroup<FormResource> = this.fb.group({
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
    termsOfUsePDF: [null],
  });

  public constructor(private readonly fb: FormBuilder, private readonly translocoService: TranslocoService) {}

  public get f(): FormGroup<FormResource>['controls'] {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initTranslations();
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

  public patchFormValues(): void {
    this.form.patchValue(
      {
        name: this.initialState.name,
        type: this.initialState.type,
        contact: this.initialState.contact,
        responsibleUnit: this.initialState.responsible_unit,
        location: this.initialState.location,
        description: this.initialState.description,
        userAvailability: this.initialState.user_availability,
        userAvailabilitySelectedUserGroups: this.initialState.user_availability_selected_user_group_pks?.length
          ? this.initialState.user_availability_selected_user_group_pks[0].toString()
          : null,
        userAvailabilitySelectedUsers: this.initialState.user_availability_selected_user_pks,
        projects: this.initialState.projects,
        termsOfUsePDF: this.initialState.terms_of_use_pdf,
      },
      { emitEvent: false }
    );

    this.form.disable({ emitEvent: false });
  }
}
