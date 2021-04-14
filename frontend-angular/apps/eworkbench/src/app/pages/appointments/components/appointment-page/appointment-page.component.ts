/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import {
  AppointmentsService,
  AuthService,
  PageTitleService,
  ProjectsService,
  ResourcesService,
  SearchService,
  WebSocketService,
} from '@app/services';
import { UserService } from '@app/stores/user';
import {
  Appointment,
  AppointmentPayload,
  Contact,
  DateGroup,
  DropdownElement,
  Lock,
  Metadata,
  Privileges,
  Project,
  Resource,
  User,
} from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { set } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap, take } from 'rxjs/operators';

interface FormAppointment {
  title: string | null;
  location: string | null;
  description: string | null;
  projects: string[];
  dateGroup: DateGroup;
  attendingUsers: number[];
  attendingContacts: string[];
  resource: string | null;
  scheduledNotificationActive: boolean;
  scheduledNotificationTimedeltaValue: number | null;
  scheduledNotificationTimedeltaUnit: 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-appointment-page',
  templateUrl: './appointment-page.component.html',
  styleUrls: ['./appointment-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentPageComponent implements OnInit, OnDestroy {
  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: Appointment;

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public contacts: Contact[] = [];

  public contactsInput$ = new Subject<string>();

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public resources: Resource[] = [];

  public resourceInput$ = new Subject<string>();

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public newModalComponent = NewAppointmentModalComponent;

  public remindAttendingUnits: DropdownElement[] = [];

  public form: FormGroup<FormAppointment> = this.fb.group({
    title: [null, [Validators.required]],
    location: [null],
    description: [null],
    projects: [[]],
    dateGroup: [{ start: null, end: null, fullDay: false }],
    attendingUsers: [[]],
    attendingContacts: [[]],
    resource: [null],
    scheduledNotificationActive: [false],
    scheduledNotificationTimedeltaValue: [null],
    scheduledNotificationTimedeltaUnit: [null],
  });

  public constructor(
    public readonly appointmentsService: AppointmentsService,
    private readonly resourcesService: ResourcesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly projectsService: ProjectsService,
    private readonly searchService: SearchService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly modalService: DialogService
  ) {}

  public get f(): FormGroup<FormAppointment>['controls'] {
    return this.form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | null } {
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

  private get appointment(): AppointmentPayload {
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
      title: this.f.title.value ?? '',
      location: this.f.location.value ?? '',
      text: this.f.description.value ?? '',
      projects: this.f.projects.value,
      date_time_start: dateTimeStart,
      date_time_end: dateTimeEnd,
      full_day: this.f.dateGroup.value.fullDay,
      attending_users_pk: this.f.attendingUsers.value,
      attending_contacts_pk: this.f.attendingContacts.value,
      resource_pk: this.f.resource.value,
      scheduled_notification_writable: {
        active: this.f.scheduledNotificationActive.value,
        timedelta_value: this.f.scheduledNotificationTimedeltaValue.value,
        timedelta_unit: this.f.scheduledNotificationTimedeltaUnit.value,
      },
      metadata: this.metadata,
    };

    // The property 'scheduled_notification_writable' must not exist if timedelta fields contain null values
    if (!this.f.scheduledNotificationActive.value) {
      // @ts-ignore
      delete appointment.scheduled_notification_writable;
    }

    return appointment;
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

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
    this.initPageTitle();
  }

  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('appointment.details.remindAttendingUnits')
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
        switchMap(/* istanbul ignore next */ input => (input ? this.searchService.contacts(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ contacts => {
          if (contacts.length) {
            this.contacts = [...contacts];
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

    this.resourceInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.resourcesService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ resources => {
          if (resources.length) {
            this.resources = [...resources];
            this.cdr.markForCheck();
          }
        }
      );
  }

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
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

            this.detailsTitle = appointment.display;
            this.pageTitleService.set(appointment.display);

            this.form.patchValue(
              {
                title: appointment.title,
                attendingUsers: appointment.attending_users_pk,
                attendingContacts: appointment.attending_contacts_pk,
                location: appointment.location,
                description: appointment.text,
                projects: appointment.projects,
                dateGroup: { start: appointment.date_time_start, end: appointment.date_time_end, fullDay: appointment.full_day },
                resource: appointment.resource_pk,
                scheduledNotificationActive: Boolean(appointment.scheduled_notification?.active),
                scheduledNotificationTimedeltaValue: appointment.scheduled_notification?.timedelta_value,
                scheduledNotificationTimedeltaUnit: appointment.scheduled_notification?.timedelta_unit,
              },
              { emitEvent: false }
            );

            if (!privileges.edit) {
              this.form.disable({ emitEvent: false });
            }

            return privilegesData;
          }
        ),
        switchMap(
          /* istanbul ignore next */ privilegesData => {
            if (privilegesData.data.projects.length) {
              return from(privilegesData.data.projects).pipe(
                mergeMap(id =>
                  this.projectsService.get(id).pipe(
                    catchError(() => {
                      return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject') } as Project);
                    })
                  )
                ),
                map(project => {
                  this.projects = [...this.projects, project];
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
        /* istanbul ignore next */ (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.router.navigate(['/not-found']);
          }

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
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.appointmentsService.unlock(this.id);
          }

          this.detailsTitle = appointment.display;
          this.pageTitleService.set(appointment.display);

          this.initialState = { ...appointment };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('appointment.details.toastr.success')
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

  public pendingChanges(): Observable<boolean> {
    if (this.form.dirty) {
      this.modalRef = this.modalService.open(PendingChangesModalComponent, {
        closeButton: false,
      });
      /* istanbul ignore next */
      return this.modalRef.afterClosed$.pipe(
        untilDestroyed(this),
        take(1),
        map(val => Boolean(val))
      );
    }

    return of(true);
  }

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshMetadata.next(true);
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }

  public changeAssignees(assignees: User[]): void {
    this.assignees = [...assignees];
    this.cdr.markForCheck();
  }
}
