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
import { RemoveResourcePDFModalComponent } from '@app/modules/resource/components/modals/remove-pdf/remove-pdf.component';
import { DescriptionModalComponent } from '@app/modules/shared/modals/description/description.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, PageTitleService, ProjectsService, ResourcesService, WebSocketService } from '@app/services';
import { UserStore } from '@app/stores/user';
import type {
  BookingRulesPayload,
  DropdownElement,
  Lock,
  Metadata,
  ModalCallback,
  Privileges,
  Project,
  Resource,
  ResourcePayload,
  User,
} from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap, take } from 'rxjs/operators';
import { NewResourceModalComponent } from '../modals/new/new.component';

interface FormResource {
  name: FormControl<string | null>;
  type: FormControl<'ROOM' | 'LABEQ' | 'OFFEQ' | 'ITRES'>;
  contact: string | null;
  responsibleUnit: string | null;
  location: string | null;
  projects: FormControl<string[]>;
  termsOfUsePDF: File | string | null;
  calendarInterval: number;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-page',
  templateUrl: './resource-page.component.html',
  styleUrls: ['./resource-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcePageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  @ViewChild('termsOfUsePDFInput')
  public termsOfUsePDFInput!: ElementRef;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.Resources;

  public currentUser: User | null = null;

  public initialState?: Resource;

  public metadata?: Metadata[];

  public bookingRules?: BookingRulesPayload;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshInitialState = new EventEmitter<Resource>();

  public refreshMetadata = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();

  public refreshBookingRules = new EventEmitter<boolean>();

  public refreshMyBookings = new EventEmitter<boolean>();

  public newModalComponent = NewResourceModalComponent;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public types: DropdownElement[] = [];

  public userAvailabilityChoices: DropdownElement[] = [];

  public userAvailabilitySelectedUserGroupsChoices: DropdownElement[] = [];

  public form = this.fb.group<FormResource>({
    name: this.fb.control(null, Validators.required),
    type: this.fb.control('ROOM', Validators.required),
    contact: null,
    responsibleUnit: null,
    location: null,
    projects: this.fb.control([]),
    termsOfUsePDF: null,
    calendarInterval: 30,
  });

  public updateInProgress = false;

  public constructor(
    public readonly resourcesService: ResourcesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly projectsService: ProjectsService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
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
    return this.initialState?.description ? 'resource.details.description.edit' : 'resource.details.description.add';
  }

  private get resource(): ResourcePayload {
    this.refreshBookingRules.next(true);

    return {
      name: this.f.name.value!,
      type: this.f.type.value,
      contact: this.f.contact.value ?? '',
      responsible_unit: this.f.responsibleUnit.value ?? '',
      location: this.f.location.value ?? '',
      booking_rule_minimum_time_before: this.bookingRules?.booking_rule_minimum_time_before as any,
      booking_rule_minimum_duration: this.bookingRules?.booking_rule_minimum_duration as any,
      booking_rule_maximum_time_before: this.bookingRules?.booking_rule_maximum_time_before as any,
      booking_rule_maximum_duration: this.bookingRules?.booking_rule_maximum_duration as any,
      booking_rule_time_between: this.bookingRules?.booking_rule_time_between as any,
      booking_rule_bookable_hours: this.bookingRules?.booking_rule_bookable_hours as any,
      booking_rule_bookings_per_user: this.bookingRules?.booking_rule_bookings_per_user as any,
      projects: this.f.projects.value,
      calendar_interval: this.f.calendarInterval.value,
      metadata: this.metadata!,
    };
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'resource', pk: this.id }]);
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

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('resources')
      .pipe(untilDestroyed(this))
      .subscribe(resources => {
        this.types = [
          {
            value: 'ROOM',
            label: resources.type.room,
          },
          {
            value: 'LABEQ',
            label: resources.type.labEquipment,
          },
          {
            value: 'OFFEQ',
            label: resources.type.officeEquipment,
          },
          {
            value: 'ITRES',
            label: resources.type.ITResource,
          },
        ];
      });
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(2),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();
          if (!this.lock?.locked) {
            return this.resourcesService.lock(this.id);
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

    this.resourcesService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(privilegesData => {
          const resource = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              name: resource.name,
              type: resource.type,
              contact: resource.contact,
              responsibleUnit: resource.responsible_unit,
              location: resource.location,
              projects: resource.projects,
              termsOfUsePDF: resource.terms_of_use_pdf,
              calendarInterval: resource.calendar_interval,
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
          const resource = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = resource.name;
          void this.pageTitleService.set(resource.display);

          this.initialState = { ...resource };
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
    this.updateInProgress = true;

    this.resourcesService
      .patch(this.id, this.resource)
      .pipe(untilDestroyed(this))
      .subscribe(
        resource => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.resourcesService.unlock(this.id);
          }

          this.detailsTitle = resource.display;
          void this.pageTitleService.set(resource.display);

          this.initialState = { ...resource };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
          this.refreshResetValue.next(true);
          this.refreshInitialState.next(this.initialState);

          this.loading = false;
          this.updateInProgress = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('resource.details.toastr.success')
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

  public onUploadPDF(event: Event): void {
    const files = (event.target as HTMLInputElement).files;

    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        if (this.loading) {
          return;
        }
        this.loading = true;

        this.resourcesService
          .changeTermsOfUsePDF(this.id, files[0])
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.termsOfUsePDFInput.nativeElement.value = '';
            this.loading = false;
            this.onSubmit();
          });
      };
      reader.readAsBinaryString(files[0]);
    }
  }

  public onClearPDF(): void {
    this.modalRef = this.modalService.open(RemoveResourcePDFModalComponent, {
      closeButton: false,
      data: { id: this.id },
    });

    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: { state: ModalState }) => this.onRemoveResourcePDFModalClose(callback));
  }

  public onRemoveResourcePDFModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.onSubmit();
    }
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }

  public onUpdateBookingRules(bookingRules: BookingRulesPayload): void {
    this.bookingRules = bookingRules;
  }

  public onOpenNewCommentModal(): void {
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.resourcesService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onOpenDescriptionModal(): void {
    this.resourcesService.lock(this.id).pipe(take(1)).subscribe();
    this.modalRef = this.modalService.open(DescriptionModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        description: this.initialState?.description ?? '',
        descriptionKey: 'description',
        service: this.resourcesService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.initialState = { ...callback.data };
        this.form.markAsPristine();
        this.refreshChanges.next(true);
        this.refreshResetValue.next(true);
      }
      this.resourcesService.unlock(this.id).pipe(take(1)).subscribe();
    });
  }

  public onResourceBooked(): void {
    this.refreshMyBookings.next(true);
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }
}
