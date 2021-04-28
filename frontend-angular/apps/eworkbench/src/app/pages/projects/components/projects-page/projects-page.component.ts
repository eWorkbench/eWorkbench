/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { RestoreModalComponent } from '@app/modules/trash/components/modals/restore/restore.component';
import { AuthService, PageTitleService, ProjectsService } from '@app/services';
import { UserService } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TreeViewComponent } from '@eworkbench/table';
import { ModalCallback, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash-es';
import { switchMap, take } from 'rxjs/operators';
import { NewProjectModalComponent } from '../modals/new/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-projects-page',
  templateUrl: './projects-page.component.html',
  styleUrls: ['./projects-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  @ViewChild('treeView')
  public treeView!: TreeViewComponent;

  @ViewChild('nameCellTemplate', { static: true })
  public nameCellTemplate!: TemplateRef<any>;

  @ViewChild('progressCellTemplate', { static: true })
  public progressCellTemplate!: TemplateRef<any>;

  @ViewChild('startDateCellTemplate', { static: true })
  public startDateCellTemplate!: TemplateRef<any>;

  @ViewChild('stopDateCellTemplate', { static: true })
  public stopDateCellTemplate!: TemplateRef<any>;

  @ViewChild('taskStatusCellTemplate', { static: true })
  public taskStatusCellTemplate!: TemplateRef<any>;

  @ViewChild('projectStateCellTemplate', { static: true })
  public projectStateCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public state: Record<string, string> = {};

  public serviceParams = new HttpParams().set('parent_projects_and_orphans', 'true');

  public modalRef?: DialogRef;

  public restoreEmitter = new EventEmitter<ModalCallback>();

  public constructor(
    public readonly projectsService: ProjectsService,
    public readonly translocoService: TranslocoService,
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ state => {
        this.currentUser = state.user;
      }
    );

    this.initTranslations();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('projects.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('projects.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.nameCellTemplate,
            name: column.name,
            key: 'name',
            sortable: true,
          },
          {
            cellTemplate: this.progressCellTemplate,
            name: column.progress,
            key: 'progress',
          },
          {
            cellTemplate: this.startDateCellTemplate,
            name: column.startDate,
            key: 'start_date',
            sortable: true,
          },
          {
            cellTemplate: this.stopDateCellTemplate,
            name: column.stopDate,
            key: 'stop_date',
            sortable: true,
          },
          {
            cellTemplate: this.taskStatusCellTemplate,
            name: column.done,
            key: 'tasks_status',
          },
          {
            cellTemplate: this.projectStateCellTemplate,
            name: column.status,
            key: 'project_state',
            sortable: true,
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
          },
        ];

        if (this.currentUser?.userprofile.ui_settings?.tables?.projects) {
          const merged = merge(
            keyBy(this.currentUser.userprofile.ui_settings.tables.projects, 'key'),
            keyBy(
              this.defaultColumns.map(column => ({
                cellTemplate: column.cellTemplate,
                name: column.name,
                key: column.key,
                sortable: column.sortable,
                hideable: column.hidden,
              })),
              'key'
            )
          );
          this.listColumns = values(merged);
        } else {
          this.listColumns = [...this.defaultColumns];
        }
      });

    this.translocoService
      .selectTranslateObject('projects.state')
      .pipe(untilDestroyed(this))
      .subscribe(state => {
        this.state = {
          INIT: state.new,
          START: state.inProgress,
          FIN: state.done,
          PAUSE: state.paused,
          CANCE: state.canceled,
        };
      });
  }

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public onColumnsChanged(event: TableColumnChangedEvent): void {
    const merged = merge(
      keyBy(event, 'key'),
      keyBy(
        this.defaultColumns.map(column => ({
          cellTemplate: column.cellTemplate,
          key: column.key,
        })),
        'key'
      )
    );

    this.listColumns = values(merged);
    const settings = this.listColumns.map(col => ({ key: col.key, sort: col.sort, hidden: col.hidden }));

    this.authService.user$
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(
          /* istanbul ignore next */ state => {
            const currentUser = state.user;
            return this.userService.changeSettings({
              userprofile: {
                ui_settings: {
                  ...currentUser?.userprofile.ui_settings,
                  tables: {
                    ...currentUser?.userprofile.ui_settings?.tables,
                    projects: settings,
                  },
                },
              },
            });
          }
        )
      )
      .subscribe();
  }

  public openNewModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewProjectModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openTrashModal(): void {
    /* istanbul ignore next */
    const subscription = this.restoreEmitter.pipe(untilDestroyed(this)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(RestoreModalComponent, {
      closeButton: false,
      data: { service: this.projectsService, routerBaseLink: '/projects', restoreEmitter: this.restoreEmitter },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe(() => subscription.unsubscribe());
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.treeView.loadData();
    }
  }
}
