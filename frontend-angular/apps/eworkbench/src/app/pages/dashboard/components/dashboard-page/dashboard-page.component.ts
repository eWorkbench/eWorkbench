/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { NewTaskModalComponent } from '@app/modules/task/components/modals/new/new.component';
import { NewContactModalComponent } from '@app/pages/contacts/components/modals/new/new.component';
import { NewDMPModalComponent } from '@app/pages/dmps/components/modals/new/new.component';
import { NewFileModalComponent } from '@app/pages/files/components/modals/new.component';
import { NewProjectModalComponent } from '@app/pages/projects/components/modals/new/new.component';
import { NewResourceModalComponent } from '@app/pages/resources/components/modals/new/new.component';
import { AuthService, DashboardService, MyScheduleService, PageTitleService } from '@app/services';
import { TableColumn } from '@eworkbench/table';
import { Appointment, Dashboard, ModalCallback, Task, User } from '@eworkbench/types';
import { DateSelectArg, DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/angular';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { hierarchy, pack, scaleOrdinal, schemeCategory10, select } from 'd3';
import { format, set } from 'date-fns';
import { CalendarComponent } from 'libs/calendar/src/lib/components/calendar/calendar.component';
import { debounceTime, skip, take } from 'rxjs/operators';
import { DeepPartial } from 'utility-types';

@UntilDestroy()
@Component({
  selector: 'eworkbench-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  public title = '';

  @ViewChild('calendar', { static: true })
  public calendar!: CalendarComponent;

  @ViewChild('taskTitleCellTemplate', { static: true })
  public taskTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('taskPriorityCellTemplate', { static: true })
  public taskPriorityCellTemplate!: TemplateRef<any>;

  @ViewChild('taskStateCellTemplate', { static: true })
  public taskStateCellTemplate!: TemplateRef<any>;

  @ViewChild('taskDueDateCellTemplate', { static: true })
  public taskDueDateCellTemplate!: TemplateRef<any>;

  @ViewChild('projectNameCellTemplate', { static: true })
  public projectNameCellTemplate!: TemplateRef<any>;

  @ViewChild('projectStartDateCellTemplate', { static: true })
  public projectStartDateCellTemplate!: TemplateRef<any>;

  @ViewChild('projectStopDateCellTemplate', { static: true })
  public projectStopDateCellTemplate!: TemplateRef<any>;

  @ViewChild('projectStateCellTemplate', { static: true })
  public projectStateCellTemplate!: TemplateRef<any>;

  @ViewChild('fileNameCellTemplate', { static: true })
  public fileNameCellTemplate!: TemplateRef<any>;

  @ViewChild('fileSizeCellTemplate', { static: true })
  public fileSizeCellTemplate!: TemplateRef<any>;

  @ViewChild('contactNameCellTemplate', { static: true })
  public contactNameCellTemplate!: TemplateRef<any>;

  @ViewChild('contactEmailCellTemplate', { static: true })
  public contactEmailCellTemplate!: TemplateRef<any>;

  @ViewChild('resourceNameCellTemplate', { static: true })
  public resourceNameCellTemplate!: TemplateRef<any>;

  @ViewChild('resourceTypeCellTemplate', { static: true })
  public resourceTypeCellTemplate!: TemplateRef<any>;

  @ViewChild('resourceDescriptionCellTemplate', { static: true })
  public resourceDescriptionCellTemplate!: TemplateRef<any>;

  @ViewChild('dmpTitleCellTemplate', { static: true })
  public dmpTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('dmpStatusCellTemplate', { static: true })
  public dmpStatusCellTemplate!: TemplateRef<any>;

  @ViewChild('dmpCreatedAtCellTemplate', { static: true })
  public dmpCreatedAtCellTemplate!: TemplateRef<any>;

  public tasksListColumns: TableColumn[] = [];

  public projectsListColumns: TableColumn[] = [];

  public filesListColumns: TableColumn[] = [];

  public contactsListColumns: TableColumn[] = [];

  public resourcesListColumns: TableColumn[] = [];

  public dmpsListColumns: TableColumn[] = [];

  public currentUser: User | null = null;

  public dashboard: DeepPartial<Dashboard> = {
    contacts: [],
    dmps: [],
    files: [],
    projects: [],
    resources: [],
    tasks: [],
    summary: {},
  };

  public modalRef?: DialogRef;

  public readonly dateFormat = "yyyy-MM-dd HH':'mm";

  public activeRangeStart: Date = new Date();

  public activeRangeEnd: Date = new Date();

  public loading = true;

  public myAppointmentsCheckbox = this.fb.control<boolean>(true);

  public myTasksCheckbox = this.fb.control<boolean>(true);

  public params = new HttpParams();

  public constructor(
    public readonly myScheduleService: MyScheduleService,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    private readonly dashboardService: DashboardService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;

      /* istanbul ignore next */
      if (this.currentUser) {
        this.params = this.params.set('show_meetings_for', this.currentUser.pk!.toString());
      }
    });

    this.tasksListColumns = [
      {
        cellTemplate: this.taskTitleCellTemplate,
        name: '',
        key: 'title',
      },
      {
        cellTemplate: this.taskPriorityCellTemplate,
        name: '',
        key: 'priority',
      },
      {
        cellTemplate: this.taskStateCellTemplate,
        name: '',
        key: 'state',
      },
      {
        cellTemplate: this.taskDueDateCellTemplate,
        name: '',
        key: 'due_date',
      },
    ];

    this.projectsListColumns = [
      {
        cellTemplate: this.projectNameCellTemplate,
        name: '',
        key: 'name',
      },
      {
        cellTemplate: this.projectStartDateCellTemplate,
        name: '',
        key: 'start_date',
      },
      {
        cellTemplate: this.projectStopDateCellTemplate,
        name: '',
        key: 'stop_date',
      },
      {
        cellTemplate: this.projectStateCellTemplate,
        name: '',
        key: 'project_state',
      },
    ];

    this.filesListColumns = [
      {
        cellTemplate: this.fileNameCellTemplate,
        name: '',
        key: 'name',
      },
      {
        cellTemplate: this.fileSizeCellTemplate,
        name: '',
        key: 'file_size',
      },
    ];

    this.contactsListColumns = [
      {
        cellTemplate: this.contactNameCellTemplate,
        name: '',
        key: 'full_name',
      },
      {
        name: '',
        key: 'company',
      },
      {
        cellTemplate: this.contactEmailCellTemplate,
        name: '',
        key: 'email',
      },
    ];

    this.resourcesListColumns = [
      {
        cellTemplate: this.resourceNameCellTemplate,
        name: '',
        key: 'name',
      },
      {
        cellTemplate: this.resourceTypeCellTemplate,
        name: '',
        key: 'type',
      },
      {
        cellTemplate: this.resourceDescriptionCellTemplate,
        name: '',
        key: 'description',
      },
    ];

    this.dmpsListColumns = [
      {
        cellTemplate: this.dmpTitleCellTemplate,
        name: '',
        key: 'title',
      },
      {
        cellTemplate: this.dmpStatusCellTemplate,
        name: '',
        key: 'status',
      },
      {
        cellTemplate: this.dmpCreatedAtCellTemplate,
        name: '',
        key: 'created_at',
      },
    ];

    this.initTranslations();
    this.initDetails();
    this.initSearch();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('dashboard.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });
  }

  public initDetails(): void {
    this.dashboardService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ dashboard => {
          this.dashboard = { ...dashboard };
          this.renderBubbleChart();
          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public initSearch(): void {
    this.myAppointmentsCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value && this.currentUser) {
          this.params = this.params.set('show_meetings_for', this.currentUser.pk!.toString());
          this.getMySchedules(this.activeRangeStart, this.activeRangeEnd);
          return;
        }

        this.params = this.params.delete('show_meetings_for');
        this.getMySchedules(this.activeRangeStart, this.activeRangeEnd);
      }
    );

    this.myTasksCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (!value) {
          this.params = this.params.set('show_tasks', String(Number(value)));
          this.getMySchedules(this.activeRangeStart, this.activeRangeEnd);
          return;
        }

        this.params = this.params.delete('show_tasks');
        this.getMySchedules(this.activeRangeStart, this.activeRangeEnd);
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

  public renameBubbleKeys(key: string): string {
    if (key === 'notes') {
      return 'comments';
    } else if (key === 'drives') {
      return 'storages';
    } else if (key === 'kanbanboards') {
      return 'taskboards';
    } else if (key === 'meetings') {
      return 'appointments';
    }

    return key;
  }

  public renderBubbleChart(): void {
    const width = 500;
    const height = 300;
    const color = scaleOrdinal(schemeCategory10);
    const bubble = pack().size([width, height]).padding(5);
    const svg = select('#chart').append('svg').attr('width', width).attr('height', height);

    const nodes = hierarchy({
      children: Object.entries(this.dashboard.summary!).map(([key, value]) => ({ name: this.renameBubbleKeys(key), count: value })),
    }).sum((d: any) => d.count);

    const node = svg
      .selectAll('.node')
      .data(bubble(nodes).leaves())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x * 1.5 - width / 4},${d.y})`)
      .append('a')
      .attr('role', 'button')
      .attr('xlink:href', (d: any) => `${window.location.origin}/${d.data.name as string}`);

    node
      .append('circle')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('r', d => d.r)
      .style('fill', (d: any) => color(d.data.name));

    node
      .append('text')
      .attr('dy', '1.3em')
      .style('text-anchor', 'middle')
      .text((d: any) => d.data.count);

    node
      .append('text')
      .attr('dy', '.2em')
      .style('text-anchor', 'middle')
      .text((d: any) => (d.data.name as string).charAt(0).toUpperCase() + (d.data.name as string).slice(1));
  }

  public onDatesSet(event: DatesSetArg): void {
    this.activeRangeStart = event.view.activeStart;
    this.activeRangeEnd = event.view.activeEnd;

    this.getMySchedules(this.activeRangeStart, this.activeRangeEnd);
  }

  public getMySchedules(rangeStart: Date, rangeEnd: Date): void {
    this.params = this.params.set('end_date__gte', rangeStart.toISOString());
    this.params = this.params.set('start_date__lte', rangeEnd.toISOString());

    this.myScheduleService
      .getList(this.params)
      .pipe(untilDestroyed(this))
      .subscribe(schedules => {
        this.calendar.removeAllEvents();

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
          } else {
            event.start = (schedule as Appointment).date_time_start!;
            event.end = (schedule as Appointment).date_time_end!;
            event.allDay = (schedule as Appointment).full_day;
            event.url = ['/appointments', schedule.pk].join('/');
          }

          /* istanbul ignore next */
          this.calendar.addEvent(event);
        });
      });
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

    this.openNewAppointmentModal(startDate, endDate, range.allDay);
  }

  public openNewAppointmentModal(startDate?: string, endDate?: string, allDay?: boolean): void {
    this.modalRef = this.modalService.open(NewAppointmentModalComponent, {
      closeButton: false,
      data: {
        selectedStartDate: startDate,
        selectedEndDate: endDate,
        selectedFullDay: allDay,
      },
    });

    /* istanbul ignore next */
    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: { state: ModalState; event: any }) => this.onAppointmentModalClose(callback));
  }

  public onAppointmentModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      /* istanbul ignore next */
      const event = callback.data?.event;
      if (event) {
        this.calendar.addEvent({
          id: event.pk,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.fullDay,
          url: event.url,
        });
        this.cdr.markForCheck();
      }
    }
  }

  public onOpenNewFileModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewFileModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewContactModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewContactModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewTaskModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewTaskModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewResourceModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewResourceModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewDMPModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewDMPModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewProjectModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewProjectModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate);
    }
  }

  public onEventClicked(event: EventClickArg): void {
    /* istanbul ignore next */
    event.jsEvent.preventDefault();

    /* istanbul ignore next */
    if (event.event.url) {
      this.router.navigate([event.event.url]);
    }
  }

  public onRenderCalendar(collapsed: boolean): void {
    if (!collapsed) {
      this.calendar.render();
    }
  }
}