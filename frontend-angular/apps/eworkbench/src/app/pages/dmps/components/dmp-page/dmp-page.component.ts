/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { CommentsComponent } from '@app/modules/comment/components/comments/comments.component';
import { NewCommentModalComponent } from '@app/modules/comment/components/modals/new/new.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, DMPService, PageTitleService, ProjectsService, WebSocketService } from '@app/services';
import { UserStore } from '@app/stores/user';
import type { DMP, DMPPayload, DropdownElement, Lock, Metadata, ModalCallback, Privileges, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as mime from 'mime';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap, take } from 'rxjs/operators';
import { NewDMPModalComponent } from '../modals/new/new.component';

interface FormDMP {
  title: FormControl<string | null>;
  status: FormControl<'NEW' | 'PROG' | 'FIN'>;
  projects: FormControl<string[]>;
  formData: FormArray<string[]>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-dmp-page',
  templateUrl: './dmp-page.component.html',
  styleUrls: ['./dmp-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DMPPageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.DMPs;

  public currentUser: User | null = null;

  public initialState?: DMP;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();

  public newModalComponent = NewDMPModalComponent;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public status: DropdownElement[] = [];

  public form = this.fb.group<FormDMP>({
    title: this.fb.control(null, Validators.required),
    status: this.fb.control('NEW', Validators.required),
    projects: this.fb.control([]),
    formData: this.fb.array([]),
  });

  public constructor(
    public readonly dmpService: DMPService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly projectsService: ProjectsService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly modalService: DialogService,
    private readonly userStore: UserStore
  ) {}

  public get f(): FormGroup<FormDMP>['controls'] {
    return this.form.controls;
  }

  public get formData(): FormArray<string> {
    return this.form.get('formData') as any;
  }

  public get lockUser(): { ownUser: boolean; user?: User | undefined | null } {
    if (this.lock) {
      if (this.lock.lock_details?.locked_by.pk === this.currentUser?.pk) {
        return { ownUser: true, user: this.lock.lock_details?.locked_by };
      }

      return { ownUser: false, user: this.lock.lock_details?.locked_by };
    }

    return { ownUser: false, user: null };
  }

  private get dmp(): DMPPayload {
    const formData = [...(this.initialState?.dmp_form_data ?? [])];
    for (let index = 0; index < this.formData.length; index++) {
      formData[index].value = this.formData.controls[index].value;
    }

    return {
      title: this.f.title.value ?? '',
      status: this.f.status.value,
      projects: this.f.projects.value,
      metadata: this.metadata!,
      dmp_form_data: formData,
    };
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'dmp', pk: this.id }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      if (data.element_lock_changed?.model_pk === this.id) {
        this.lock = data.element_lock_changed;
        this.cdr.detectChanges();
      }

      if (data.element_changed?.model_pk === this.id) {
        if (this.lockUser.user && !this.lockUser.ownUser) {
          this.modified = true;
        } else {
          this.modified = false;
        }
        this.cdr.detectChanges();
      }
    });

    this.initTranslations();
    this.initSidebar();
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();
  }

  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(2),
        debounceTime(500),
        switchMap(() => {
          if (!this.lock?.locked) {
            return this.dmpService.lock(this.id);
          }

          return of([]);
        })
      )
      .subscribe();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('dmps')
      .pipe(untilDestroyed(this))
      .subscribe(dmps => {
        this.status = [
          {
            value: 'NEW',
            label: dmps.status.new,
          },
          {
            value: 'PROG',
            label: dmps.status.inProgress,
          },
          {
            value: 'FIN',
            label: dmps.status.done,
          },
        ];
      });
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

  public initDetails(formChanges = true): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.dmpService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const dmp = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              title: dmp.title,
              status: dmp.status,
              projects: dmp.projects,
            },
            { emitEvent: false }
          );

          this.onClearFormData();
          dmp.dmp_form_data.forEach(formData => {
            this.formData.push(this.fb.control(formData.value));
          });

          if (!privileges.edit) {
            this.form.disable({ emitEvent: false });
          } else if (dmp.status === 'FIN' && dmp.created_by.pk !== this.currentUser!.pk) {
            this.f.status.disable();
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
        })
      )
      .subscribe(
        privilegesData => {
          const dmp = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = dmp.display;
          void this.pageTitleService.set(dmp.display);

          this.initialState = { ...dmp };
          this.privileges = { ...privileges };

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }

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

    this.dmpService
      .patch(this.id, this.dmp)
      .pipe(untilDestroyed(this))
      .subscribe(
        dmp => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.dmpService.unlock(this.id);
          }

          this.detailsTitle = dmp.display;
          void this.pageTitleService.set(dmp.display);

          this.initialState = { ...dmp };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          if (dmp.status === 'FIN' && dmp.created_by.pk !== this.currentUser!.pk) {
            this.f.status.disable();
          }

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('dmp.details.toastr.success')
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

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshMetadata.next(true);
    this.refreshLinkList.next(true);
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
        service: this.dmpService,
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

  public onRemoveFormData(element: number): void {
    this.formData.removeAt(element);
  }

  public onClearFormData(): void {
    while (this.formData.length) {
      this.onRemoveFormData(0);
    }
  }

  public onCancelFormData(): void {
    this.onClearFormData();
    this.initialState?.dmp_form_data.forEach(formData => {
      this.formData.push(this.fb.control(formData.value));
    });
  }

  public onExport(type: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.dmpService
      .exportAsType(this.id, type)
      .pipe(untilDestroyed(this))
      .subscribe(
        (data: Blob) => {
          const mimeType = mime.getType(type) ?? 'application/octet-stream';
          const blob = new Blob([data], { type: mimeType });
          const url = window.URL.createObjectURL(blob);

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = `dmp_${this.id}.${type}`;
          downloadLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window as Window }));

          // Fix for FireFox
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            downloadLink.remove();
          }, 100);

          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
