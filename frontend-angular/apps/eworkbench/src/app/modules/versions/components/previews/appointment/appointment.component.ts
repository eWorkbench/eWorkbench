/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { AppointmentsService, ProjectsService } from '@app/services';
import type { Appointment, Contact, ModalCallback, Project, Resource, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-appointment-preview',
  templateUrl: './appointment.component.html',
  styleUrls: ['./appointment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentPreviewComponent implements OnInit {
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

  public appointment?: Appointment;

  public fullDayControl = this.fb.control<boolean>(false);

  public resourceFormControl = this.fb.control<string | null>(null);

  public resources: Resource[] = [];

  public descriptionFormControl = this.fb.control<string | null>(null);

  public assigneesFormControl = this.fb.control<number[] | null>(null);

  public assignees: User[] = [];

  public contactsFormControl = this.fb.control<string[] | null>(null);

  public contacts: Contact[] = [];

  public projectsFormControl = this.fb.control<string[] | null>(null);

  public projects: Project[] = [];

  public loading = true;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly appointmentsService: AppointmentsService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.appointmentsService
      .previewVersion(this.id!, this.version!)
      .pipe(untilDestroyed(this))
      .subscribe(
        (appointment: Appointment) => {
          this.appointment = { ...appointment };

          this.fullDayControl.patchValue(appointment.full_day, { emitEvent: false });
          this.fullDayControl.disable({ emitEvent: false });

          this.resources = appointment.resource ? [appointment.resource] : [];
          this.resourceFormControl.patchValue(appointment.resource_pk, { emitEvent: false });
          this.resourceFormControl.disable({ emitEvent: false });

          this.assignees = appointment.attending_users;
          this.assigneesFormControl.patchValue(appointment.attending_users_pk, { emitEvent: false });
          this.assigneesFormControl.disable({ emitEvent: false });

          this.contacts = appointment.attending_contacts;
          this.contactsFormControl.patchValue(appointment.attending_contacts_pk, { emitEvent: false });
          this.contactsFormControl.disable({ emitEvent: false });

          this.descriptionFormControl.patchValue(appointment.text, { emitEvent: false });
          this.descriptionFormControl.disable({ emitEvent: false });

          this.loadProjects(appointment.projects);
          this.projectsFormControl.patchValue(appointment.projects, { emitEvent: false });
          this.projectsFormControl.disable({ emitEvent: false });

          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
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

    this.appointmentsService
      .restoreVersion(this.id!, this.version!, Boolean(this.versionInProgress))
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('versions.toastr.success.versionRestored')
            .pipe(untilDestroyed(this))
            .subscribe(versionRestored => {
              this.toastrService.success(versionRestored);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
