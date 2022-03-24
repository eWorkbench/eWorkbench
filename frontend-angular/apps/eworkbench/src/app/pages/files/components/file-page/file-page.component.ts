/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { CommentsComponent } from '@app/modules/comment/components/comments/comments.component';
import { NewCommentModalComponent } from '@app/modules/comment/components/modals/new/new.component';
import { DescriptionModalComponent } from '@app/modules/shared/modals/description/description.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, DrivesService, FilesService, PageTitleService, ProjectsService, WebSocketService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { Directory, Drive, File, FilePayload, Lock, Metadata, ModalCallback, Privileges, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { NewFileModalComponent } from '../modals/new.component';

interface FormFile {
  title: string | null;
  name: string | null;
  storage: string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  templateUrl: './file-page.component.html',
  styleUrls: ['./file-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilePageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.Files;

  public currentUser: User | null = null;

  public initialState?: File;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public readonly dateFormat = "yyyy-MM-dd HH':'mm";

  public newModalComponent = NewFileModalComponent;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public storages: Drive[] = [];

  public directories: Directory[] = [];

  public storagePrivileges?: Privileges;

  @ViewChild('uploadInput')
  public uploadInput!: ElementRef;

  public form: FormGroup<FormFile> = this.fb.group({
    title: [null, [Validators.required]],
    name: [null, [Validators.required]],
    storage: [null],
    projects: [[]],
  });

  public constructor(
    public readonly filesService: FilesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService,
    private readonly drivesService: DrivesService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly modalService: DialogService,
    private readonly userStore: UserStore
  ) {}

  public get f(): FormGroup<FormFile>['controls'] {
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

  public get descriptionTranslationKey(): string {
    return this.initialState?.description ? 'file.details.description.edit' : 'file.details.description.add';
  }

  private get file(): Omit<FilePayload, 'path'> {
    const payload: Omit<FilePayload, 'path'> = {
      title: this.f.title.value!,
      name: this.f.name.value!,
      projects: this.f.projects.value,
      metadata: this.metadata!,
    };

    if (this.privileges?.fullAccess && this.directories.length) {
      payload.directory_id = this.f.storage.value ?? null;
    }

    return payload;
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'file', pk: this.id }]);
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
        debounceTime(500),
        switchMap(() => {
          if (!this.lock?.locked) {
            return this.filesService.lock(this.id);
          }

          return of([]);
        })
      )
      .subscribe();
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
            this.cdr.markForCheck();
          }
        );
      }
    });
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

    this.filesService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ privilegesData => {
            const file = privilegesData.data;
            const privileges = privilegesData.privileges;

            this.form.patchValue(
              {
                title: file.title,
                name: file.name,
                storage: file.directory_id,
                projects: file.projects,
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
        ),
        switchMap(privilegesData =>
          this.drivesService.getList().pipe(
            map(drives => {
              this.storages = [...drives.data];
              this.directories = drives.data
                .flatMap(dir => dir.sub_directories)
                .flatMap(d =>
                  d.is_virtual_root ? { ...d, display: drives.data.find(drive => drive.pk === d.drive_id)?.display ?? d.display } : d
                );
              this.cdr.markForCheck();
            }),
            switchMap(() => of(privilegesData))
          )
        )
      )
      .subscribe(
        /* istanbul ignore next */ privilegesData => {
          const file = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = file.display;
          this.pageTitleService.set(file.display);

          this.initialState = { ...file };
          this.privileges = { ...privileges };
          this.initDirectoryDetails();

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

  public onUpload(event: Event): void {
    /* istanbul ignore next */
    const files = (event.target as HTMLInputElement).files;
    /* istanbul ignore next */
    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        if (this.loading) {
          return;
        }
        this.loading = true;

        this.filesService
          .updateFile(this.id, files[0])
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.loading = false;
            this.onSubmit();
          });
      };
      reader.readAsBinaryString(files[0]);
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.filesService
      .patch(this.id, this.file)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ file => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.filesService.unlock(this.id);
          }

          this.detailsTitle = file.display;
          this.pageTitleService.set(file.display);

          this.initialState = { ...file };
          this.initDirectoryDetails();
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('file.details.toastr.success')
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
        service: this.filesService,
      },
    });

    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onOpenDescriptionModal(): void {
    this.filesService.lock(this.id).pipe(take(1)).subscribe();
    this.modalRef = this.modalService.open(DescriptionModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        description: this.initialState?.description ?? '',
        descriptionKey: 'description',
        service: this.filesService,
      },
    });

    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.initialState = { ...callback.data };
        this.form.markAsPristine();
        this.refreshChanges.next(true);
        this.refreshResetValue.next(true);
      }
      this.filesService.unlock(this.id).pipe(take(1)).subscribe();
    });
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }

  public initDirectoryDetails(): void {
    this.initialState!.directory = null;

    const directory = this.directories.filter(directory => directory.pk === this.initialState!.directory_id);
    if (directory.length) {
      this.initialState!.directory = directory[0];

      const storageId = this.getStorageIdForDirectory(this.initialState!.directory_id);
      this.drivesService.get(storageId, this.currentUser!.pk!).subscribe(
        /* istanbul ignore next */ privilegesData => {
          this.storagePrivileges = privilegesData.privileges;
        }
      );
    } else {
      const directory: any = {
        display: this.translocoService.translate('file.details.storage.unknown.label'),
        name: '/',
        pk: this.initialState!.directory_id,
        drive_id: this.initialState!.directory_id,
        directory: null,
        is_virtual_root: true,
      };

      this.directories = [...this.directories, directory as Directory];
      this.initialState!.directory = directory as Directory;
    }
  }

  public getStorageForDirectory(directoryId: string): Drive[] {
    return this.storages.filter(storage => storage.sub_directories.filter(directory => directory.pk === directoryId).length);
  }

  public getStorageNameForDirectory(directoryId: string): string {
    return this.getStorageForDirectory(directoryId)[0]?.display || this.translocoService.translate('file.details.storage.unknown.label');
  }

  public getStorageIdForDirectory(directoryId: string): string {
    return this.getStorageForDirectory(directoryId)[0]?.pk || '';
  }
}
