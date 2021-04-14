/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { AuthService, DrivesService, DssContainersService, PageTitleService, ProjectsService } from '@app/services';
import { Drive, DrivePayload, Envelope, Metadata, Privileges, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { NewStorageModalComponent } from '../modals/new/new.component';

interface FormStorage {
  title: string | null;
  projects: string[];
  dssEnvelope: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-storage-page',
  templateUrl: './storage-page.component.html',
  styleUrls: ['./storage-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoragePageComponent implements OnInit {
  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: Drive;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public newModalComponent = NewStorageModalComponent;

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public dssEnvelopes: Envelope[] = [];

  public selectedDssEnvelope?: Envelope;

  public form: FormGroup<FormStorage> = this.fb.group({
    title: [null, [Validators.required]],
    projects: [[]],
    dssEnvelope: [null],
  });

  public constructor(
    public readonly drivesService: DrivesService,
    private readonly dssContainersService: DssContainersService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly projectsService: ProjectsService,
    private readonly pageTitleService: PageTitleService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService
  ) {}

  public get f(): FormGroup<FormStorage>['controls'] {
    return this.form.controls;
  }

  public get storage(): DrivePayload {
    return {
      title: this.f.title.value ?? '',
      projects: this.f.projects.value,
      dss_envelope_id: this.f.dssEnvelope.value,
      metadata: this.metadata,
    };
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initDetails();
  }

  public initDetails(): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.drivesService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ privilegesData => {
            const storage = privilegesData.data;
            const privileges = privilegesData.privileges;

            this.form.patchValue(
              {
                title: storage.title,
                projects: storage.projects,
                dssEnvelope: storage.dss_envelope_id,
              },
              { emitEvent: false }
            );

            if (!privileges.edit) {
              this.f.title.disable({ emitEvent: false });
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
                }),
                switchMap(() => of(privilegesData))
              );
            }

            return of(privilegesData);
          }
        ),
        switchMap(
          /* istanbul ignore next */ privilegesData => {
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
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ privilegesData => {
          const storage = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = storage.title;
          this.pageTitleService.set(storage.title);

          this.initialState = { ...storage };
          this.privileges = { ...privileges };

          this.loading = false;

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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.drivesService
      .patch(this.id, this.storage)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ storage => {
          this.detailsTitle = storage.title;
          this.pageTitleService.set(storage.title);

          this.initialState = { ...storage };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshMetadata.next(true);
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

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }
}
