/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { AuthService, LabBooksService, PageTitleService, ProjectsService, WebSocketService } from '@app/services';
import { LabBook, LabBookPayload, Lock, Metadata, Privileges, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap, take } from 'rxjs/operators';
import { NewLabBookModalComponent } from '../modals/new/new.component';

interface FormLabBook {
  title: string | null;
  isTemplate: boolean;
  description: string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-page',
  templateUrl: './labbook-page.component.html',
  styleUrls: ['./labbook-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookPageComponent implements OnInit, OnDestroy {
  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: LabBook;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public loading = true;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public newModalComponent = NewLabBookModalComponent;

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form: FormGroup<FormLabBook> = this.fb.group({
    title: [null, [Validators.required]],
    isTemplate: [false],
    description: [null],
    projects: [[]],
  });

  public constructor(
    public readonly labBooksService: LabBooksService,
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
    private readonly modalService: DialogService
  ) {}

  public get f(): FormGroup<FormLabBook>['controls'] {
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

  private get labBook(): LabBookPayload {
    return {
      title: this.f.title.value!,
      is_template: this.f.isTemplate.value,
      description: this.f.description.value ?? '',
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

    this.websocketService.subscribe([{ model: 'labbook', pk: this.id }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ (data: any) => {
        /* istanbul ignore next */
        if (data.element_lock_changed?.model_pk === this.id) {
          this.lock = data.element_lock_changed;
          this.cdr.detectChanges();
        }
      }
    );

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
          this.cdr.markForCheck();
          if (!this.lock?.locked) {
            return this.labBooksService.lock(this.id);
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

    this.labBooksService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ privilegesData => {
            const labBook = privilegesData.data;
            const privileges = privilegesData.privileges;

            this.form.patchValue(
              {
                title: labBook.title,
                isTemplate: labBook.is_template,
                description: labBook.description,
                projects: labBook.projects,
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
          const labBook = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = labBook.display;
          this.pageTitleService.set(labBook.display);

          this.initialState = { ...labBook };
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
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .patch(this.id, this.labBook)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ labBook => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.labBooksService.unlock(this.id);
          }

          this.detailsTitle = labBook.display;
          this.pageTitleService.set(labBook.display);

          this.initialState = { ...labBook };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('labBook.details.toastr.success')
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

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshMetadata.next(true);
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }
}
