/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { AppointmentsService, AuthService, ContactsService, ProjectsService, ResourcesService, SearchService } from '@app/services';
import { UserService } from '@app/stores/user';
import type { CalendarEvent } from '@eworkbench/calendar';
import type {
  Appointment,
  AppointmentPayload,
  Contact,
  DateGroup,
  DropdownElement,
  Project,
  Resource,
  TimeGroup,
  User,
} from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { set } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap } from 'rxjs/operators';

interface FormAppointment {
  title: FormControl<string | null>;
  dateGroup: FormControl<DateGroup>;
  resource: string | null;
  location: string | null;
  attendees: FormControl<number[]>;
  attendingContacts: FormControl<string[]>;
  scheduledNotificationActive: boolean;
  timeGroup: FormControl<TimeGroup>;
  description: string | null;
  projects: FormControl<string[]>;
  createFor: string | null;
  duplicateMetadata: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-appointment-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewAppointmentModalComponent implements OnInit {
  public selectedStartDate?: string = this.modalRef.data?.selectedStartDate;

  public selectedEndDate?: string = this.modalRef.data?.selectedEndDate;

  public selectedFullDay = this.modalRef.data?.selectedFullDay ?? false;

  public resource?: Resource = this.modalRef.data?.resource;

  public initialState?: Appointment = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public id?: string = this.modalRef.data?.id;

  public currentUser: User | null = null;

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

  public favoriteResources: Resource[] = [];

  public resourceInput$ = new Subject<string>();

  public createForUsers: User[] = [];

  public createForInput$ = new Subject<string>();

  public loading = false;

  public remindAttendingUnits: DropdownElement[] = [];

  public form = this.fb.group<FormAppointment>({
    title: this.fb.control(null, Validators.required),
    dateGroup: this.fb.control({ start: null, end: null, fullDay: false }),
    resource: null,
    location: null,
    attendees: this.fb.control([]),
    attendingContacts: this.fb.control([]),
    scheduledNotificationActive: false,
    timeGroup: this.fb.control({
      time: null,
      unit: null,
    }),
    description: null,
    projects: this.fb.control([]),
    createFor: null,
    duplicateMetadata: true,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly appointmentsService: AppointmentsService,
    private readonly resourcesService: ResourcesService,
    private readonly contactsService: ContactsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly searchService: SearchService
  ) {}

  public get f() {
    return this.form.controls;
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
      resource_pk: this.f.resource.value,
      scheduled_notification_writable: {
        active: this.f.scheduledNotificationActive.value,
        timedelta_value: this.f.timeGroup.value.time,
        timedelta_unit: this.f.timeGroup.value.unit,
      },
      text: this.f.description.value ?? '',
      title: this.f.title.value ?? '',
      create_for: this.f.createFor.value ?? '',
      metadata: this.duplicate && this.f.duplicateMetadata.value ? this.initialState?.metadata : [],
    };

    // The property 'scheduled_notification_writable' must not exist if timedelta fields contain null values
    if (!this.f.scheduledNotificationActive.value) {
      // @ts-expect-error
      delete appointment.scheduled_notification_writable;
    }

    return appointment;
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initSearchInput();
    this.initDetails();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('appointments.newModal.remindAttendingUnits')
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

  public initSearchInput(): void {
    this.assigneesInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(users => {
        if (users.length) {
          this.assignees = [...users];
          this.cdr.markForCheck();
        }
      });

    this.contactsInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.searchService.contacts(input) : of([...this.favoriteContacts])))
      )
      .subscribe(contacts => {
        this.contacts = [...contacts].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
        this.cdr.markForCheck();
      });

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

    this.resourceInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.resourcesService.search(input) : of([...this.favoriteResources])))
      )
      .subscribe(resources => {
        this.resources = [...resources].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
        this.cdr.markForCheck();
      });

    this.createForInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input =>
          input ? this.userService.search(input, this.currentUser?.pk, new HttpParams().set('access_editable', 'true')) : of([])
        )
      )
      .subscribe(users => {
        if (users.length) {
          this.createForUsers = [...users];
          this.cdr.markForCheck();
        }
      });

    this.contactsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(contacts => {
        if (contacts.data.length) {
          this.favoriteContacts = [...contacts.data];
          this.contacts = [...this.contacts, ...this.favoriteContacts]
            .filter((value, index, array) => array.map(contact => contact.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
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

    this.resourcesService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(resources => {
        if (resources.data.length) {
          this.favoriteResources = [...resources.data];
          this.resources = [...this.resources, ...this.favoriteResources]
            .filter((value, index, array) => array.map(resource => resource.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      });
  }

  public initDetails(): void {
    if (this.id && this.currentUser?.pk) {
      this.appointmentsService
        .get(this.id, this.currentUser.pk)
        .pipe(
          untilDestroyed(this),
          map(privilegesData => {
            this.initialState = { ...privilegesData.data };
            this.patchFormValues();
          })
        )
        .subscribe(
          () => {
            this.loading = false;
            this.cdr.markForCheck();
          },
          () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    } else {
      this.patchFormValues();
    }
  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue({
        title: this.initialState.title,
        dateGroup: {
          start: this.initialState.date_time_start,
          end: this.initialState.date_time_end,
          fullDay: this.initialState.full_day,
        },
        resource: this.initialState.resource_pk,
        location: this.initialState.location,
        attendees: this.initialState.attending_users_pk,
        attendingContacts: this.initialState.attending_contacts_pk,
        description: this.initialState.text,
        projects: this.initialState.projects,
        scheduledNotificationActive: Boolean(this.initialState.scheduled_notification?.active),
        timeGroup: {
          time: this.initialState.scheduled_notification?.timedelta_value,
          unit: this.initialState.scheduled_notification?.timedelta_unit,
        },
      });

      this.assignees = [...(this.initialState.attending_users ??= [])];
      this.contacts = [...(this.initialState.attending_contacts ??= [])];
      if (this.initialState.resource) {
        this.resources = [this.initialState.resource];
      }

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

    // Specifically for resource bookings: resource must not be changed if it is set directly.
    if (this.resource) {
      this.resources = [this.resource];
      this.form.patchValue({ resource: this.resource.pk });
      this.f.resource.disable({ emitEvent: false });

      if (this.resource.location) {
        this.f.location.setValue(this.resource.location);
      }
    }

    // Custom logic for dates selected via the calendar. Overwrites initial state.
    if (!this.initialState?.date_time_start && !this.initialState?.date_time_end) {
      if (!this.selectedStartDate && !this.selectedEndDate) {
        const date = new Date();
        this.form.patchValue({
          dateGroup: {
            start: set(date, { hours: date.getHours() + 1, minutes: 0, seconds: 0 }).toISOString(),
            end: set(date, { hours: date.getHours() + 2, minutes: 0, seconds: 0 }).toISOString(),
            fullDay: false,
          },
        });
      } else {
        // This is a hack for the faulty backend which can't properly handle correct full day ranges.
        // E.g. 2021-01-01 0:00:00 to 2021-01-02 0:00:00. So we must subtract a millisecond here to get
        // the correct end date day value.
        let selectedEndDate = this.selectedEndDate;
        if (this.selectedFullDay && this.selectedEndDate) {
          selectedEndDate = new Date(Date.parse(this.selectedEndDate) - 1).toISOString();
        }

        this.form.patchValue({
          dateGroup: {
            start: this.selectedStartDate,
            end: selectedEndDate,
            fullDay: this.selectedFullDay,
          },
        });
      }
    }

    this.form.markAllAsDirty();
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.appointmentsService
      .add(this.appointment)
      .pipe(untilDestroyed(this))
      .subscribe(
        appointment => {
          this.state = ModalState.Changed;
          const event: CalendarEvent = {
            id: appointment.pk,
            title: appointment.title,
            start: appointment.date_time_start,
            end: appointment.date_time_end,
            fullDay: appointment.full_day,
            url: ['/appointments', appointment.pk].join('/'),
          };
          this.modalRef.close({
            state: this.state,
            data: { newContent: appointment, event },
            navigate: [`${this.withSidebar ? '..' : ''}/appointments`, appointment.pk],
          });
          this.translocoService
            .selectTranslate('appointments.newModal.toastr.success')
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

  public changeAssignees(assignees: User[]): void {
    this.assignees = [...assignees];
    this.cdr.markForCheck();
  }
}
