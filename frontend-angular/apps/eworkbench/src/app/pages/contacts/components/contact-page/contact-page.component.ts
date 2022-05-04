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
import { DescriptionModalComponent } from '@app/modules/shared/modals/description/description.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, ContactsService, PageTitleService, ProjectsService, WebSocketService } from '@app/services';
import { UserStore } from '@app/stores/user';
import type { Contact, ContactPayload, Lock, Metadata, ModalCallback, Privileges, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap, take } from 'rxjs/operators';
import { NewContactModalComponent } from '../modals/new/new.component';

interface FormContact {
  academicTitle: string | null;
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  email: FormControl<string | null>;
  phone: string | null;
  company: string | null;
  projects: FormControl<string[]>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-contact-page',
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.Contacts;

  public currentUser: User | null = null;

  public initialState?: Contact;

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

  public newModalComponent = NewContactModalComponent;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group<FormContact>({
    academicTitle: null,
    firstName: this.fb.control(null, Validators.required),
    lastName: this.fb.control(null, Validators.required),
    email: this.fb.control(null, Validators.email),
    phone: null,
    company: null,
    projects: this.fb.control([]),
  });

  public constructor(
    public readonly contactsService: ContactsService,
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

  public get f() {
    return this.form.controls;
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

  public get descriptionTranslationKey(): string {
    return this.initialState?.notes ? 'contact.details.description.edit' : 'contact.details.description.add';
  }

  private get contact(): ContactPayload {
    return {
      academic_title: this.f.academicTitle.value ?? '',
      first_name: this.f.firstName.value!,
      last_name: this.f.lastName.value!,
      email: this.f.email.value ?? '',
      phone: this.f.phone.value ?? '',
      company: this.f.company.value ?? '',
      projects: this.f.projects.value,
      metadata: this.metadata!,
    };
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'contact', pk: this.id }]);
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
        skip(3),
        debounceTime(500),
        switchMap(() => {
          if (!this.lock?.locked) {
            return this.contactsService.lock(this.id);
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

    this.contactsService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const contact = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              academicTitle: contact.academic_title,
              firstName: contact.first_name,
              lastName: contact.last_name,
              email: contact.email,
              phone: contact.phone,
              company: contact.company,
              projects: contact.projects,
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
        })
      )
      .subscribe(
        privilegesData => {
          const contact = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = contact.display;
          void this.pageTitleService.set(contact.display);

          this.initialState = { ...contact };
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

    this.contactsService
      .patch(this.id, this.contact)
      .pipe(untilDestroyed(this))
      .subscribe(
        contact => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.contactsService.unlock(this.id);
          }

          this.detailsTitle = contact.display;
          void this.pageTitleService.set(contact.display);

          this.initialState = { ...contact };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('contact.details.toastr.success')
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
        service: this.contactsService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onOpenDescriptionModal(): void {
    this.contactsService.lock(this.id).pipe(take(1)).subscribe();
    this.modalRef = this.modalService.open(DescriptionModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        description: this.initialState?.notes ?? '',
        descriptionKey: 'notes',
        service: this.contactsService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.initialState = { ...callback.data };
        this.form.markAsPristine();
        this.refreshChanges.next(true);
        this.refreshResetValue.next(true);
      }
      this.contactsService.unlock(this.id).pipe(take(1)).subscribe();
    });
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }
}
