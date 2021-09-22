/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { AppointmentsService, AuthService, ContactsService, ProjectsService, SearchService, WebSocketService } from '@app/services';
import { UserService } from '@app/stores/user';
import { CalendarEvent } from '@eworkbench/calendar';
import {
  Appointment,
  AppointmentPayload,
  Contact,
  DateGroup,
  DropdownElement,
  Lock,
  Privileges,
  Project,
  Resource,
  User,
} from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { set } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap } from 'rxjs/operators';

interface FormAppointment {
  title: string | null;
  dateGroup: DateGroup;
  resource: string | null;
  location: string | null;
  attendees: number[];
  attendingContacts: string[];
  scheduledNotificationActive: boolean;
  scheduledNotificationTimedeltaValue: number | null;
  scheduledNotificationTimedeltaUnit: 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | null;
  description: string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-edit-appointment-modal',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAppointmentModalComponent implements OnInit {
  public id: string = this.modalRef.data.id;

  public currentUser: User | null = null;

  public initialState?: Appointment;

  public state = ModalState.Unchanged;

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public contacts: Contact[] = [];

  public favoriteContacts: Contact[] = [];

  public contactsInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public resources: Resource[] = [];

  public modified = false;

  public loading = true;

  public readonly dateFormat = 'yyyy-MM-dd';

  public readonly dateTimeFormat = "yyyy-MM-dd HH':'mm";

  public remindAttendingUnits: DropdownElement[] = [];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public form = this.fb.group<FormAppointment>({
    title: [null, [Validators.required]],
    dateGroup: [{ start: null, end: null, fullDay: false }],
    resource: [null],
    location: [null],
    attendees: [[]],
    attendingContacts: [[]],
    scheduledNotificationActive: [false],
    scheduledNotificationTimedeltaValue: [null],
    scheduledNotificationTimedeltaUnit: [null],
    description: [null],
    projects: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly appointmentsService: AppointmentsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly projectsService: ProjectsService,
    private readonly contactsService: ContactsService,
    private readonly userService: UserService,
    private readonly searchService: SearchService
  ) {}

  public get f(): FormGroup<FormAppointment>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | undefined | null } {
    /* istanbul ignore next */
    if (this.lock) {
      if (this.lock.lock_details?.locked_by.pk === this.currentUser?.pk) {
        return { ownUser: true, user: this.lock.lock_details?.locked_by };
      }

      return { ownUser: false, user: this.lock.lock_details?.locked_by };
    }

    /* istanbul ignore next */
    return { ownUser: false, user: null };
  }

  public get appointment(): AppointmentPayload {
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

    const appointment = {
      attending_contacts_pk: this.f.attendingContacts.value,
      attending_users_pk: this.f.attendees.value,
      date_time_start: dateTimeStart,
      date_time_end: dateTimeEnd,
      full_day: this.f.dateGroup.value.fullDay,
      location: this.f.location.value,
      projects: this.f.projects.value,
      scheduled_notification_writable: {
        active: this.f.scheduledNotificationActive.value,
        timedelta_value: this.f.scheduledNotificationTimedeltaValue.value,
        timedelta_unit: this.f.scheduledNotificationTimedeltaUnit.value,
      },
      text: this.f.description.value ?? '',
      title: this.f.title.value ?? '',
    };

    // The property 'scheduled_notification_writable' must not exist if timedelta fields contain null values
    if (!this.f.scheduledNotificationActive.value) {
      // @ts-ignore
      delete appointment.scheduled_notification_writable;
    }

    return appointment;
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'meeting', pk: this.id }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ (data: any) => {
        /* istanbul ignore next */
        if (data.element_lock_changed?.model_pk === this.id) {
          this.lock = data.element_lock_changed;
          this.cdr.detectChanges();
        }

        /* istanbul ignore next */
        if (data.element_changed?.model_pk === this.id) {
          if (this.lockUser.user && !this.lockUser.ownUser) {
            this.modified = true;
          } else {
            this.modified = false;
          }
          this.cdr.detectChanges();
        }
      }
    );

    this.initTranslations();
    this.initSearchInput();
    this.initDetails();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('appointments.editModal.remindAttendingUnits')
      .pipe(untilDestroyed(this))
      .subscribe(remindAttendingUnits => {
        this.remindAttendingUnits = [
          { value: 'MINUTE', label: remindAttendingUnits.minutes },
          { value: 'HOUR', label: remindAttendingUnits.hours },
          { value: 'DAY', label: remindAttendingUnits.days },
          { value: 'WEEK', label: remindAttendingUnits.weeks },
        ];
      });
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(1),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();
          if (!this.lock?.locked) {
            return this.appointmentsService.lock(this.id);
          }

          return of([]);
        })
      )
      .subscribe();
  }

  public initSearchInput(): void {
    this.assigneesInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.assignees = [...users];
            this.cdr.markForCheck();
          }
        }
      );

    this.contactsInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.searchService.contacts(input) : of([...this.favoriteContacts])))
      )
      .subscribe(
        /* istanbul ignore next */ contacts => {
          this.contacts = [...contacts].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      );

    this.contactsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ contacts => {
          if (contacts.data.length) {
            this.favoriteContacts = [...contacts.data];
            this.contacts = [...this.contacts, ...this.favoriteContacts]
              .filter((value, index, array) => array.map(contact => contact.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          }
        }
      );

    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      );

    this.projectsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ projects => {
          if (projects.data.length) {
            this.favoriteProjects = [...projects.data];
            this.projects = [...this.projects, ...this.favoriteProjects]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          }
        }
      );
  }

  public initDetails(formChanges = true): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.appointmentsService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ privilegesData => {
            const appointment = privilegesData.data;
            const privileges = privilegesData.privileges;

            this.form.patchValue(
              {
                title: appointment.title,
                dateGroup: {
                  start: appointment.date_time_start,
                  end: appointment.date_time_end,
                  fullDay: appointment.full_day,
                },
                resource: appointment.resource_pk,
                location: appointment.location,
                attendees: appointment.attending_users_pk,
                attendingContacts: appointment.attending_contacts_pk,
                description: appointment.text,
                projects: appointment.projects,
                scheduledNotificationActive: Boolean(appointment.scheduled_notification?.active),
                scheduledNotificationTimedeltaValue: appointment.scheduled_notification?.timedelta_value,
                scheduledNotificationTimedeltaUnit: appointment.scheduled_notification?.timedelta_unit,
              },
              { emitEvent: false }
            );

            if (!privileges.edit) {
              this.form.disable({ emitEvent: false });
            }

            this.f.resource.disable({ emitEvent: false });

            return privilegesData;
          }
        ),
        switchMap(
          /* istanbul ignore next */ privilegesData => {
            if (privilegesData.data.projects.length) {
              return from(privilegesData.data.projects).pipe(
                mergeMap(id =>
                  this.projectsService.get(id).pipe(
                    untilDestroyed(this),
                    catchError(() => {
                      return of({
                        pk: id,
                        name: this.translocoService.translate('formInput.unknownProject'),
                        is_favourite: false,
                      } as Project);
                    })
                  )
                ),
                map(project => {
                  this.projects = [...this.projects, project]
                    .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
                    .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
                  this.cdr.markForCheck();
                }),
                switchMap(() => of(privilegesData))
              );
            }

            return of(privilegesData);
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ privilegesData => {
          const appointment = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.initialState = { ...appointment };
          this.privileges = { ...privileges };
          this.assignees = [...appointment.attending_users];
          this.contacts = [...appointment.attending_contacts];
          if (appointment.resource) {
            this.resources = [appointment.resource];
          }

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }

          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.appointmentsService
      .patch(this.id, this.appointment)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ appointment => {
          this.state = ModalState.Changed;
          const event: CalendarEvent = {
            id: appointment.pk,
            title: appointment.title,
            start: appointment.date_time_start,
            end: appointment.date_time_end,
            fullDay: appointment.full_day,
          };
          this.modalRef.close({ state: this.state, data: event });
          this.translocoService
            .selectTranslate('appointments.editModal.toastr.success')
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

  public onDelete(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.appointmentsService
      .delete(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ appointment => {
          this.state = ModalState.Changed;
          const event: CalendarEvent = {
            id: appointment.pk,
            deleted: true,
          };
          this.modalRef.close({ state: this.state, data: event });
          this.translocoService
            .selectTranslate('appointments.editModal.toastr.deleted')
            .pipe(untilDestroyed(this))
            .subscribe(deleted => {
              this.toastrService.success(deleted);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public changeAssignees(assignees: User[]): void {
    this.assignees = [...assignees];
    this.cdr.markForCheck();
  }
}
