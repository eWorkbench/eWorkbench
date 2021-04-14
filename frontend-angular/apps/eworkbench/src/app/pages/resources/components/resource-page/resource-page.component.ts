/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse } from '@angular/common/http';
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
import { RemoveResourcePDFModalComponent } from '@app/modules/resource/components/modals/remove-pdf/remove-pdf.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { AuthService, PageTitleService, ProjectsService, ResourcesService, UserGroupsService, WebSocketService } from '@app/services';
import { UserService } from '@app/stores/user';
import {
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
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { NewResourceModalComponent } from '../modals/new/new.component';

interface FormResource {
  name: string | null;
  type: 'ROOM' | 'LABEQ' | 'OFFEQ' | 'ITRES';
  contact: string | null;
  responsibleUnit: string | null;
  location: string | null;
  description: string | null;
  userAvailability: 'GLB' | 'USR' | 'PRJ';
  userAvailabilitySelectedUserGroups: string | null;
  userAvailabilitySelectedUsers: number[] | null;
  projects: string[];
  termsOfUsePDF: File | string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-page',
  templateUrl: './resource-page.component.html',
  styleUrls: ['./resource-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcePageComponent implements OnInit, OnDestroy {
  @ViewChild('termsOfUsePDFInput')
  public termsOfUsePDFInput!: ElementRef;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: Resource;

  public userAvailabilitySelectedUsers: User[] = [];

  public userAvailabilitySelectedUsersInput$ = new Subject<string>();

  public metadata?: Metadata[];

  public bookingRules?: BookingRulesPayload;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshInitialState = new EventEmitter<Resource>();

  public refreshMetadata = new EventEmitter<boolean>();

  public refreshBookingRules = new EventEmitter<boolean>();

  public refreshMyBookings = new EventEmitter<boolean>();

  public newModalComponent = NewResourceModalComponent;

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public types: DropdownElement[] = [];

  public userAvailabilityChoices: DropdownElement[] = [];

  public userAvailabilitySelectedUserGroupsChoices: DropdownElement[] = [];

  public form: FormGroup<FormResource> = this.fb.group({
    name: [null, [Validators.required]],
    type: ['ROOM', [Validators.required]],
    contact: [null],
    responsibleUnit: [null],
    location: [null],
    description: [null],
    userAvailability: ['PRJ', [Validators.required]],
    userAvailabilitySelectedUserGroups: [null],
    userAvailabilitySelectedUsers: [[]],
    projects: [[]],
    termsOfUsePDF: [null],
  });

  public constructor(
    public readonly resourcesService: ResourcesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly projectsService: ProjectsService,
    private readonly userGroupsService: UserGroupsService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  public get f(): FormGroup<FormResource>['controls'] {
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

  private get resource(): ResourcePayload {
    this.refreshBookingRules.next(true);

    return {
      name: this.f.name.value!,
      type: this.f.type.value,
      contact: this.f.contact.value ?? '',
      responsible_unit: this.f.responsibleUnit.value ?? '',
      location: this.f.location.value ?? '',
      description: this.f.description.value ?? '',
      user_availability: this.f.userAvailability.value,
      user_availability_selected_user_group_pks: this.f.userAvailabilitySelectedUserGroups.value
        ? [Number(this.f.userAvailabilitySelectedUserGroups.value)]
        : [],
      user_availability_selected_user_pks: this.f.userAvailabilitySelectedUsers.value,
      booking_rule_minimum_time_before: this.bookingRules?.booking_rule_minimum_time_before,
      booking_rule_minimum_duration: this.bookingRules?.booking_rule_minimum_duration,
      booking_rule_maximum_time_before: this.bookingRules?.booking_rule_maximum_time_before,
      booking_rule_maximum_duration: this.bookingRules?.booking_rule_maximum_duration,
      booking_rule_time_between: this.bookingRules?.booking_rule_time_between,
      booking_rule_bookable_hours: this.bookingRules?.booking_rule_bookable_hours,
      booking_rule_bookings_per_user: this.bookingRules?.booking_rule_bookings_per_user,
      projects: this.f.projects.value,
      metadata: this.metadata,
    };
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'resource', pk: this.id }]);
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

        this.userAvailabilityChoices = [
          {
            value: 'GLB',
            label: resources.userAvailability.global,
          },
          {
            value: 'PRJ',
            label: resources.userAvailability.project,
          },
          {
            value: 'USR',
            label: resources.userAvailability.user,
          },
        ];
      });
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
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

  public initSearchInput(): void {
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
        map(
          /* istanbul ignore next */ privilegesData => {
            const resource = privilegesData.data;
            const privileges = privilegesData.privileges;

            this.form.patchValue(
              {
                name: resource.name,
                type: resource.type,
                contact: resource.contact,
                responsibleUnit: resource.responsible_unit,
                location: resource.location,
                description: resource.description,
                userAvailability: resource.user_availability,
                userAvailabilitySelectedUserGroups: resource.user_availability_selected_user_group_pks?.length
                  ? resource.user_availability_selected_user_group_pks[0].toString()
                  : null,
                userAvailabilitySelectedUsers: resource.user_availability_selected_user_pks,
                projects: resource.projects,
                termsOfUsePDF: resource.terms_of_use_pdf,
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
                  this.cdr.markForCheck();
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
          const resource = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = resource.name;
          this.pageTitleService.set(resource.display);

          this.initialState = { ...resource };
          this.userAvailabilitySelectedUsers = [...resource.user_availability_selected_users];
          this.privileges = { ...privileges };

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

    this.userGroupsService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ userGroups => {
          this.userAvailabilitySelectedUserGroupsChoices = userGroups.map(group => ({ value: group.pk.toString(), label: group.name }));
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.cdr.markForCheck();
        }
      );

    this.userAvailabilitySelectedUsersInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.userAvailabilitySelectedUsers = [...users];
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
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.resourcesService
      .patch(this.id, this.resource)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ resource => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.resourcesService.unlock(this.id);
          }

          this.detailsTitle = resource.display;
          this.pageTitleService.set(resource.display);

          this.initialState = { ...resource };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshMetadata.next(true);
          this.refreshResetValue.next(true);
          this.refreshInitialState.next(this.initialState);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('resource.details.toastr.success')
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

  public onUploadPDF(event: Event): void {
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

    /* istanbul ignore next */
    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: { state: ModalState }) => this.onRemoveResourcePDFModalClose(callback));
  }

  public onRemoveResourcePDFModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      /* istanbul ignore next */
      this.onSubmit();
    }
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }

  public onUpdateBookingRules(bookingRules: BookingRulesPayload): void {
    this.bookingRules = bookingRules;
  }

  public changeUserAvailabilitySelectedUsers(userAvailabilitySelectedUsers: User[]): void {
    this.userAvailabilitySelectedUsers = [...userAvailabilitySelectedUsers];
    this.cdr.markForCheck();
  }

  public onResourceBooked(): void {
    this.refreshMyBookings.next(true);
  }
}
