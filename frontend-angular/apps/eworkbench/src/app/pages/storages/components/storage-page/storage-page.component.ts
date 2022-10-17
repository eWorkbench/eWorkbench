/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { CommentsComponent } from '@app/modules/comment/components/comments/comments.component';
import { NewCommentModalComponent } from '@app/modules/comment/components/modals/new/new.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, DrivesService, DssContainersService, PageTitleService, ProjectsService } from '@app/services';
import { UserStore } from '@app/stores/user';
import type { Drive, DrivePayload, Envelope, Metadata, ModalCallback, Privileges, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { NewStorageModalComponent } from '../modals/new/new.component';

interface FormStorage {
  title: FormControl<string | null>;
  projects: FormControl<string[]>;
  dssEnvelope: string | null;
  location: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-storage-page',
  templateUrl: './storage-page.component.html',
  styleUrls: ['./storage-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoragePageComponent implements OnInit {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.Storages;

  public currentUser: User | null = null;

  public initialState?: Drive;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();

  public newModalComponent = NewStorageModalComponent;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public dssEnvelopes: Envelope[] = [];

  public selectedDssEnvelope?: Envelope;

  public form = this.fb.group<FormStorage>({
    title: this.fb.control(null, Validators.required),
    projects: this.fb.control([]),
    dssEnvelope: null,
    location: null,
  });

  public constructor(
    public readonly drivesService: DrivesService,
    private readonly dssContainersService: DssContainersService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly modalService: DialogService,
    private readonly userStore: UserStore
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get envelope(): string | null {
    return this.f.dssEnvelope.value;
  }

  public get location(): string | null {
    return this.f.location.value;
  }

  public get storage(): DrivePayload {
    return {
      title: this.f.title.value ?? '',
      projects: this.f.projects.value,
      dss_envelope_id: this.f.dssEnvelope.value,
      metadata: this.metadata!,
    };
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initSidebar();
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();
  }

  public initSidebar(): void {
    this.route.params.subscribe(params => {
      if (params.projectId) {
        this.showSidebar = true;

        this.projectsService.get(params.projectId).subscribe(project => {
          this.projects = [...this.projects, project]
            .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        });
      }
    });
  }

  public initSearchInput(): void {
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
    if (!this.currentUser?.pk) {
      return;
    }

    this.drivesService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const storage = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              title: storage.title,
              projects: storage.projects,
              dssEnvelope: storage.envelope_path,
              location: storage.location,
            },
            { emitEvent: false }
          );

          if (!privileges.edit) {
            this.form.disable({ emitEvent: false });
          }

          return privilegesData;
        }),
        switchMap(privilegesData => {
          if (privilegesData.data.projects.length) {
            return from(privilegesData.data.projects).pipe(
              mergeMap(id =>
                this.projectsService.get(id).pipe(
                  untilDestroyed(this),
                  catchError(() =>
                    of({
                      pk: id,
                      name: this.translocoService.translate('formInput.unknownProject'),
                      is_favourite: false,
                    } as Project)
                  )
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
        }),
        switchMap(privilegesData => {
          const storage = privilegesData.data;

          return this.dssContainersService.getList().pipe(
            untilDestroyed(this),
            map(result => {
              const dssContainers = result.data;

              dssContainers.forEach(dssContainer => {
                dssContainer.envelopes.forEach(envelope => {
                  envelope.container_path = dssContainer.path;
                  if (envelope.pk === storage.dss_envelope_id) {
                    this.selectedDssEnvelope = { ...envelope };
                  }
                  this.dssEnvelopes.push(envelope);
                });
              });
            }),
            switchMap(() => of(privilegesData))
          );
        })
      )
      .subscribe(
        privilegesData => {
          const storage = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = storage.display;
          void this.pageTitleService.set(storage.display);

          this.initialState = { ...storage };
          this.privileges = { ...privileges };

          this.loading = false;

          this.cdr.markForCheck();
        },
        (error: HttpErrorResponse) => {
          if (error.status === 404) {
            void this.router.navigate(['/not-found']);
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

    this.drivesService
      .patch(this.id, this.storage)
      .pipe(untilDestroyed(this))
      .subscribe(
        storage => {
          this.detailsTitle = storage.title;
          void this.pageTitleService.set(storage.title);

          this.initialState = { ...storage };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('storage.details.toastr.success')
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

  public canDeactivate(): Observable<boolean> {
    if (this.showSidebar) {
      const userStoreValue = this.userStore.getValue();
      const userSetting = 'SkipDialog-LeaveProject';

      const skipLeaveDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.[userSetting]);

      if (skipLeaveDialog) {
        return of(true);
      }

      this.modalRef = this.modalService.open(LeaveProjectModalComponent, {
        closeButton: false,
      });

      return this.modalRef.afterClosed$.pipe(
        untilDestroyed(this),
        take(1),
        map(val => Boolean(val))
      );
    }

    return of(true);
  }

  public pendingChanges(): Observable<boolean> {
    if (this.form.dirty) {
      this.modalRef = this.modalService.open(PendingChangesModalComponent, {
        closeButton: false,
      });

      return this.modalRef.afterClosed$.pipe(
        untilDestroyed(this),
        take(1),
        map(val => Boolean(val))
      );
    }

    return of(true);
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }

  public onOpenNewCommentModal(): void {
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.drivesService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }
}
