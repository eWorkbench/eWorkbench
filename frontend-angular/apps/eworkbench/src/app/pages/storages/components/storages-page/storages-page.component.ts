/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { DrivesService, DssContainersService, PageTitleService } from '@app/services';
import { ProjectsService } from '@app/services/projects/projects.service';
import { UserService, UserStore } from '@app/stores/user';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import { DssContainer, ModalCallback, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, map, skip, switchMap, take } from 'rxjs/operators';
import { NewStorageModalComponent } from '../modals/new/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-storages-page',
  templateUrl: './storages-page.component.html',
  styleUrls: ['./storages-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoragesPageComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('containerCellTemplate', { static: true })
  public containerCellTemplate!: TemplateRef<any>;

  public title = '';

  public sidebarItem = ProjectSidebarItem.Storages;

  public loading = false;

  public projectsControl = this.fb.control<string | null>(null);

  public usersControl = this.fb.control<string | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public dssContainersControl = this.fb.control<string | null>(null);

  public users: User[] = [];

  public dssContainers: DssContainer[] = [];

  public listColumns: TableColumn[] = [];

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public usersInput$ = new Subject<string>();

  public showSidebar = false;

  public project?: string;

  public params = new HttpParams();

  public modalRef?: DialogRef;

  public refresh = new EventEmitter<boolean>();

  public constructor(
    public readonly drivesService: DrivesService,
    private readonly userService: UserService,
    private readonly dssContainersService: DssContainersService,
    private readonly router: Router,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly modalService: DialogService,
    private readonly projectsService: ProjectsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly route: ActivatedRoute,
    private readonly userStore: UserStore
  ) {}

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refresh.pipe(untilDestroyed(this)).subscribe(showTrashedItems => {
      this.onFilterItems(showTrashedItems);
    });

    this.initTranslations();
    this.initDetails();
    this.initSidebar();
    this.initSearch(this.showSidebar);
    this.initSearchInput();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('storages.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('storages.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.containerCellTemplate,
            name: column.title,
            key: 'title',
            hideable: false,
          },
        ];
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

  public initDetails(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.dssContainersService
      .getList()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ result => {
          this.dssContainers = result.data;
        }
      );
  }

  public initSearch(project = false): void {
    this.projectsControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const queryParams = new URLSearchParams(window.location.search);

        if (value) {
          this.params = this.params.set('projects_recursive', value);
          this.tableView.loadData(false, this.params);
          if (!project) {
            queryParams.set('projects', value);
            history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
          }
          return;
        }

        this.params = this.params.delete('projects_recursive');
        this.tableView.loadData(false, this.params);
        if (!project) {
          queryParams.delete('projects');
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
        }
      }
    );

    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.set('created_by', value);
          this.tableView.loadData(false, this.params);
          // TODO: Needs endpoint to fetch a user by its id
          /* this.router.navigate(['.'], { relativeTo: this.route, queryParams: { users: value }, queryParamsHandling: 'merge' }); */
          return;
        }

        this.params = this.params.delete('created_by');
        this.tableView.loadData(false, this.params);
        // TODO: Needs endpoint to fetch a user by its id
        /* this.router.navigate(['.'], { relativeTo: this.route, queryParams: { users: null }, queryParamsHandling: 'merge' }); */
      }
    );

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const queryParams = new URLSearchParams(window.location.search);

        if (value) {
          this.params = this.params.set('search', value);
          this.tableView.loadData(false, this.params);
          queryParams.set('search', value);
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
          return;
        }

        this.params = this.params.delete('search');
        this.tableView.loadData(false, this.params);
        queryParams.delete('search');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }
    );

    this.dssContainersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const queryParams = new URLSearchParams(window.location.search);

        if (value) {
          this.params = this.params.set('container', value);
          this.tableView.loadData(false, this.params);
          queryParams.set('container', value);
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
          return;
        }

        this.params = this.params.delete('container');
        this.tableView.loadData(false, this.params);
        queryParams.delete('container');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }
    );

    this.route.queryParamMap.pipe(untilDestroyed(this), take(1)).subscribe(
      /* istanbul ignore next */ queryParams => {
        const projects = queryParams.get('projects');
        const search = queryParams.get('search');
        const container = queryParams.get('container');

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

        if (container) {
          this.dssContainersControl.setValue(container);
        }
      }
    );
  }

  public initSearchInput(): void {
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

    this.usersInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.users = [...users];
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

  public onFilterItems(showTrashedItems: boolean): void {
    if (showTrashedItems) {
      this.params = this.params.set('deleted', 'true');
    } else {
      this.params = this.params.delete('deleted');
    }
    this.tableView.loadData(false, this.params);
  }

  public onRestore(restored: boolean): void {
    if (restored) {
      this.tableView.loadData(false, this.params);
    }
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

  public openNewModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewStorageModalComponent, {
      closeButton: false,
      data: { withSidebar: this.showSidebar, initialState: { projects: this.project ? [this.project] : [] } },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate, { relativeTo: this.route });
    } else if (callback?.state === ModalState.Changed) {
      this.initDetails();
    }
  }
}
