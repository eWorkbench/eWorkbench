/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Injector,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { PrivilegesModalComponent } from '@app/modules/details-dropdown/components/modals/privileges/privileges.component';
import { ExportModalComponent } from '@app/modules/schedule/components/modals/export/export.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import {
  AuthService,
  CalendarAccessPrivilegesService,
  MyScheduleService,
  PageTitleService,
  ProjectsService,
  ResourceBookingsService,
  ResourcesService,
} from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { CalendarCustomButtons } from '@eworkbench/calendar';
import { Appointment, CalendarAccessPrivileges, ModalCallback, Project, Resource, Task, User } from '@eworkbench/types';
import { DateSelectArg, DatesSetArg, EventClickArg, EventContentArg, EventHoveringArg, EventInput, MountArg } from '@fullcalendar/angular';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { format, set } from 'date-fns';
import { CalendarComponent } from 'libs/calendar/src/lib/components/calendar/calendar.component';
import { CalendarPopoverWrapperComponent } from 'libs/calendar/src/lib/components/popover/popover.component';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, map, skip, switchMap, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-calendar-page',
  templateUrl: './calendar-page.component.html',
  styleUrls: ['./calendar-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPageComponent implements OnInit {
  public title = '';

  public sidebarItem = ProjectSidebarItem.Calendar;

  @ViewChild('calendar', { static: true })
  public calendar!: CalendarComponent;

  @ViewChild('popoverTemplate', { static: true })
  public popoverTemplate!: TemplateRef<any>;

  @Input()
  public customButtons: CalendarCustomButtons = {
    export: {
      text: this.translocoService.translate('calendar.export')!,
      click: () => {
        this.openExportModal();
      },
    },
  };

  public currentUser: User | null = null;

  public iCalExportUrl?: string;

  public modalRef?: DialogRef;

  public readonly dateFormat = "yyyy-MM-dd HH':'mm";

  public activeRangeStart: Date = new Date();

  public activeRangeEnd: Date = new Date();

  public projectsControl = this.fb.control<string | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public myAppointmentsCheckbox = this.fb.control<boolean>(true);

  public myTasksCheckbox = this.fb.control<boolean>(true);

  public params = new HttpParams();

  public users: User[] = [];

  public usersInput$ = new Subject<string>();

  public usersControl = this.fb.control<string | null>(null);

  public selectedUsers: User[] = [];

  public selectedUsersControl = this.fb.control<number[]>([]);

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public resources: Resource[] = [];

  public favoriteResources: Resource[] = [];

  public resourcesInput$ = new Subject<string>();

  public resourcesControl = this.fb.control<string | null>(null);

  public selectedResources: Resource[] = [];

  public selectedResourcesControl = this.fb.control<string[]>([]);

  public calendarAccessPrivileges!: CalendarAccessPrivileges;

  public showSidebar = false;

  public project?: string;

  private readonly popoversMap = new Map<any, ComponentRef<CalendarPopoverWrapperComponent>>();

  private readonly popoverFactory = this.resolver.resolveComponentFactory(CalendarPopoverWrapperComponent);

  public userColors: string[] = [
    '#C2ED98',
    '#8f97cf',
    '#F7F570',
    '#98A9D7',
    '#d66b67',
    '#B243B6',
    '#F1F487',
    '#F59B7C',
    '#FED776',
    '#F363B1',
    '#FDBF3B',
    '#E08963',
    '#93EE81',
    '#FFBFA3',
  ];

  public resourceColors: string[] = [
    '#F1E0B0',
    '#97F2F3',
    '#F1CDB0',
    '#E7CFC8',
    '#F3D1DC',
    '#F6A7C1',
    '#FCF0CF',
    '#FDCF76',
    '#B16E4B',
    '#38908F',
    '#B2EBE0',
    '#5E96AE',
    '#FFBFA3',
    '#E08963',
  ];

  public constructor(
    public readonly myScheduleService: MyScheduleService,
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly projectsService: ProjectsService,
    private readonly resourcesService: ResourcesService,
    private readonly resourceBookingsService: ResourceBookingsService,
    private readonly calendarAccessPrivilegesService: CalendarAccessPrivilegesService,
    private readonly userService: UserService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly userStore: UserStore,
    private readonly resolver: ComponentFactoryResolver,
    private readonly injector: Injector,
    private readonly appRef: ApplicationRef
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;

      /* istanbul ignore next */
      if (this.currentUser) {
        this.params = this.params.set('show_meetings_for', this.currentUser.pk!.toString());
      }
    });

    this.initTranslations();
    this.initSidebar();
    this.initSearch(this.showSidebar);
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('calendar.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });
  }

  public initSidebar(): void {
    this.route.params.subscribe(params => {
      if (params.projectId) {
        this.showSidebar = true;

        this.projectsService.get(params.projectId).subscribe(
          /* istanbul ignore next */ project => {
            this.projects = [...this.projects, project]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.projectsControl.setValue(params.projectId);
            this.project = params.projectId;
          }
        );
      }
    });
  }

  public initSearch(project = false): void {
    this.projectsControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const queryParams = new URLSearchParams(window.location.search);

        if (value) {
          this.params = this.params.set('projects_recursive', value);
          this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
          if (!project) {
            queryParams.set('projects', value);
            history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
          }
          return;
        }

        this.params = this.params.delete('projects_recursive');
        this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
        if (!project) {
          queryParams.delete('projects');
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
        }
      }
    );

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const queryParams = new URLSearchParams(window.location.search);

        if (value) {
          this.params = this.params.set('search', value);
          this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
          queryParams.set('search', value);
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
          return;
        }

        this.params = this.params.delete('search');
        this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
        queryParams.delete('search');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }
    );

    this.myAppointmentsCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value && this.currentUser) {
          this.params = this.params.set('show_meetings_for', this.currentUser.pk!.toString());
          this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
          return;
        }

        this.params = this.params.delete('show_meetings_for');
        this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
      }
    );

    this.myTasksCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (!value) {
          this.params = this.params.set('show_tasks', String(Number(value)));
          this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
          return;
        }

        this.params = this.params.delete('show_tasks');
        this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
      }
    );

    this.route.queryParamMap.pipe(untilDestroyed(this), take(1)).subscribe(
      /* istanbul ignore next */ queryParams => {
        const projects = queryParams.get('projects');
        const search = queryParams.get('search');

        if (projects && !project) {
          this.projectsService
            .get(projects)
            .pipe(untilDestroyed(this))
            .subscribe(
              /* istanbul ignore next */ project => {
                this.projects = [...this.projects, project];
                this.cdr.markForCheck();
              }
            );
          this.projectsControl.setValue(projects);
        }

        if (search) {
          this.searchControl.setValue(search);
        }
      }
    );

    this.selectedUsersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ users => {
        this.params = this.params.delete('show_meetings_for');
        if (this.currentUser) {
          this.params = this.params.append('show_meetings_for', this.currentUser.pk!.toString());
        }

        if (users.length) {
          users.forEach(userPk => {
            this.params = this.params.append('show_meetings_for', userPk.toString());
          });
          this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
          return;
        }

        this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
      }
    );

    this.selectedResourcesControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ () => {
        this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
      }
    );
  }

  public initSearchInput(): void {
    this.usersInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input, this.currentUser?.pk) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.users = this.getUnusedUsers(users);
            this.cdr.markForCheck();
          }
        }
      );

    this.resourcesInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.resourcesService.search(input) : of([...this.favoriteResources])))
      )
      .subscribe(
        /* istanbul ignore next */ resources => {
          this.resources = this.getUnusedResources([...resources].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite)));
          this.cdr.markForCheck();
        }
      );

    this.projectsInput$
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

    this.resourcesService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ resources => {
          if (resources.data.length) {
            this.favoriteResources = [...resources.data];
            this.resources = [...this.resources, ...this.favoriteResources]
              .filter((value, index, array) => array.map(resource => resource.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          }
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

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public initDetails(): void {
    this.calendarAccessPrivilegesService
      .getList()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ calendarAccessPrivileges => {
          this.calendarAccessPrivileges = calendarAccessPrivileges[0];
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.cdr.markForCheck();
        }
      );
  }

  public get selectedUsersIds(): number[] {
    return this.selectedUsersControl.value;
  }

  public get selectedResourcesIds(): string[] {
    return this.selectedResourcesControl.value;
  }

  public refreshAppointments(rangeStart: Date, rangeEnd: Date): void {
    this.calendar.removeAllEvents();
    this.getMySchedules(rangeStart, rangeEnd);
    this.getResourceBookings(rangeStart, rangeEnd);
  }

  public onDatesSet(event: DatesSetArg): void {
    this.activeRangeStart = event.view.activeStart;
    this.activeRangeEnd = event.view.activeEnd;
    this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
  }

  public getMySchedules(rangeStart: Date, rangeEnd: Date): void {
    this.params = this.params.set('end_date__gte', rangeStart.toISOString());
    this.params = this.params.set('start_date__lte', rangeEnd.toISOString());

    this.myScheduleService
      .getList(this.params)
      .pipe(untilDestroyed(this))
      .subscribe(schedules => {
        schedules.forEach(schedule => {
          const event: EventInput = {
            id: schedule.pk,
            title: schedule.title,
          };

          if (schedule.content_type_model === 'shared_elements.task') {
            event.start = (schedule as Task).start_date!;
            event.end = (schedule as Task).due_date!;
            event.allDay = (schedule as Task).full_day;
            event.url = ['/tasks', schedule.pk].join('/');
            event.extendedProps = { ...schedule };
          } else {
            event.start = (schedule as Appointment).date_time_start!;
            event.end = (schedule as Appointment).date_time_end!;
            event.allDay = (schedule as Appointment).full_day;
            event.url = ['/appointments', schedule.pk].join('/');
            event.borderColor = this.getUserColor(schedule as Appointment);
            event.backgroundColor = this.getUserColor(schedule as Appointment);
            event.extendedProps = { ...schedule };
          }

          /* istanbul ignore next */
          this.calendar.addEvent(event);
        });
      });
  }

  public getResourceBookings(rangeStart: Date, rangeEnd: Date): void {
    const params = new HttpParams().set('end_date__gte', rangeStart.toISOString()).set('start_date__lte', rangeEnd.toISOString());

    this.selectedResourcesIds.forEach(resource => {
      this.resourceBookingsService
        .getAll(resource, params)
        .pipe(untilDestroyed(this))
        .subscribe(schedules => {
          schedules.forEach(schedule => {
            const event: EventInput = {
              id: schedule.pk,
              title: schedule.title,
            };

            event.start = schedule.date_time_start!;
            event.end = schedule.date_time_end!;
            event.allDay = schedule.full_day;
            event.url = ['/appointments', schedule.pk].join('/');
            event.borderColor = this.getResourceColor(schedule);
            event.backgroundColor = this.getResourceColor(schedule);
            event.extendedProps = { ...schedule };

            /* istanbul ignore next */
            this.calendar.addEvent(event);
          });
        });
    });
  }

  public canDeactivate(): Observable<boolean> {
    if (this.showSidebar) {
      const userStoreValue = this.userStore.getValue();
      const userSetting = 'SkipDialog-LeaveProject';

      /* istanbul ignore next */
      const skipLeaveDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.[userSetting]);

      if (skipLeaveDialog) {
        return of(true);
      }

      this.modalRef = this.modalService.open(LeaveProjectModalComponent, {
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

  public openExportModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(ExportModalComponent, { closeButton: false });
  }

  public openNewModal(startDate?: string, endDate?: string, allDay?: boolean): void {
    this.modalRef = this.modalService.open(NewAppointmentModalComponent, {
      closeButton: false,
      data: {
        selectedStartDate: startDate,
        selectedEndDate: endDate,
        selectedFullDay: allDay,
        initialState: { projects: this.project ? [this.project] : [] },
      },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenPrivilegesModal(): void {
    this.modalRef = this.modalService.open(PrivilegesModalComponent, {
      closeButton: false,
      data: {
        service: this.calendarAccessPrivilegesService,
        id: this.calendarAccessPrivileges.pk,
        data: this.calendarAccessPrivileges,
      },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed && callback.data) {
      /* istanbul ignore next */
      if (callback.data?.event) {
        this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
      }
    }
  }

  public onSelect(range: DateSelectArg): void {
    let startDate;
    let endDate;

    if (range.allDay) {
      startDate = format(set(range.start, { hours: 0, minutes: 0, seconds: 0 }), this.dateFormat);
      endDate = format(set(range.end, { hours: 0, minutes: 0, seconds: 0 }), this.dateFormat);
    } else {
      startDate = format(range.start, this.dateFormat);
      endDate = format(range.end, this.dateFormat);
    }

    this.openNewModal(startDate, endDate, range.allDay);
  }

  public onEventClicked(event: EventClickArg): void {
    /* istanbul ignore next */
    event.jsEvent.preventDefault();

    /* istanbul ignore next */
    if (event.event.url) {
      this.router.navigate([event.event.url]);
    }
  }

  public onEventDidMount(event: MountArg<EventContentArg>): void {
    const projectableNodes = Array.from(event.el.childNodes);

    const compRef = this.popoverFactory.create(this.injector, [projectableNodes], event.el);
    compRef.instance.template = this.popoverTemplate;

    this.appRef.attachView(compRef.hostView);
    this.popoversMap.set(event.el, compRef);
  }

  public onEventWillUnmount(event: MountArg<EventContentArg>): void {
    const popover = this.popoversMap.get(event.el);
    if (popover) {
      this.appRef.detachView(popover.hostView);
      popover.destroy();
      this.popoversMap.delete(event.el);
    }
  }

  public onEventMouseEnter(event: EventHoveringArg): void {
    const popover = this.popoversMap.get(event.el);
    if (popover) {
      popover.instance.popover.popoverTitle = event.event.title;
      popover.instance.popover.popover = this.popoverTemplate;
      popover.instance.popover.popoverContext = { event: event.event };
      popover.instance.popover.show();
    }
  }

  public onEventMouseLeave(event: EventHoveringArg): void {
    const popover = this.popoversMap.get(event.el);
    popover?.instance.popover.hide();
  }

  public onSelectUser(user?: User): void {
    if (user?.pk) {
      const users: User[] = [...this.users];
      const selectedUsers: User[] = [...this.selectedUsers];
      const selectedUsersIds = this.selectedUsersIds;
      const index: number = this.users.indexOf(user);

      selectedUsers.push(user);
      this.selectedUsers = selectedUsers;
      this.updateSelectedUsersColor();
      this.usersControl.setValue(null);
      selectedUsersIds.push(user.pk);
      this.selectedUsersControl.setValue(selectedUsersIds);
      if (index !== -1) {
        users.splice(index, 1);
        this.users = users;
      }
    }
  }

  public onRemoveSelectedUser(user: User): void {
    const selectedUsers: User[] = [...this.selectedUsers];
    const selectedUsersIds = this.selectedUsersIds;
    const index = this.selectedUsers.indexOf(user);

    selectedUsers.splice(index, 1);
    selectedUsersIds.splice(index, 1);
    this.selectedUsers = selectedUsers;
    this.selectedUsersControl.setValue(selectedUsersIds);
  }

  public getUnusedUsers(users: User[]): User[] {
    const unusedUsers: User[] = [];

    users.forEach(user => {
      if (!this.selectedUsers.length || !this.selectedUsers.find(x => x.pk === user.pk)) {
        unusedUsers.push(user);
      }
    });

    return unusedUsers;
  }

  public updateSelectedUsersColor(): void {
    this.selectedUsers.map((user, index) => {
      user.color = this.userColors[index];
    });
  }

  public getUserColor(schedule: Appointment): string {
    let color = '';

    this.selectedUsers.forEach(user => {
      schedule.attending_users.forEach(attendingUser => {
        if (user.pk === attendingUser.pk) {
          color = user.color!;
        }
      });
    });

    return color;
  }

  public onSelectResource(resource?: Resource): void {
    if (resource?.pk) {
      const resources: Resource[] = [...this.resources];
      const selectedResources: Resource[] = [...this.selectedResources];
      const selectedResourcesIds = this.selectedResourcesIds;
      const index: number = this.resources.indexOf(resource);

      selectedResources.push(resource);
      this.selectedResources = selectedResources;
      this.updateSelectedResourcesColor();
      this.resourcesControl.setValue(null);
      selectedResourcesIds.push(resource.pk);
      this.selectedResourcesControl.setValue(selectedResourcesIds);
      if (index !== -1) {
        resources.splice(index, 1);
        this.resources = resources;
      }
    }
  }

  public onRemoveSelectedResource(resource: Resource): void {
    const selectedResources: Resource[] = [...this.selectedResources];
    const selectedResourcesIds = this.selectedResourcesIds;
    const index = this.selectedResources.indexOf(resource);

    selectedResources.splice(index, 1);
    selectedResourcesIds.splice(index, 1);
    this.selectedResources = selectedResources;
    this.selectedResourcesControl.setValue(selectedResourcesIds);
  }

  public getUnusedResources(resources: Resource[]): Resource[] {
    const unusedResources: Resource[] = [];

    resources.forEach(resource => {
      if (!this.selectedResources.length || !this.selectedResources.find(x => x.pk === resource.pk)) {
        unusedResources.push(resource);
      }
    });

    return unusedResources;
  }

  public updateSelectedResourcesColor(): void {
    this.selectedResources.map((resource, index) => {
      resource.color = this.resourceColors[index];
    });
  }

  public getResourceColor(schedule: Appointment): string {
    let color = '';

    this.selectedResources.forEach(resource => {
      if (resource.pk === schedule.resource_pk) {
        color = resource.color!;
      }
    });

    return color;
  }
}
