/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { AuthService, DssContainersService, PageTitleService, WebSocketService } from '@app/services';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { CMSJsonResponse, DropdownElement, DssContainer, DssContainerPayload, Lock, Privileges, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { debounceTime, map, switchMap, take } from 'rxjs/operators';
import { NewDssContainerModalComponent } from '../modals/new/new.component';

interface FormDssContainer {
  name: string | null;
  path: string | null;
  readWriteSetting: DssContainerPayload['read_write_setting'] | null;
  importOption: DssContainerPayload['import_option'] | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-dss-container-page',
  templateUrl: './dss-container-page.component.html',
  styleUrls: ['./dss-container-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DssContainerPageComponent implements OnInit, OnDestroy {
  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: DssContainer;

  public loading = true;

  public newModalComponent = NewDssContainerModalComponent;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public modalRef?: DialogRef;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public dssContainerDetailHowTo?: CMSJsonResponse;

  public readWriteSettings: DropdownElement[] = [];

  public importOptions: DropdownElement[] = [];

  public form: FormGroup<FormDssContainer> = this.fb.group({
    name: [null, [Validators.required]],
    path: [null, [Validators.required]],
    readWriteSetting: [null, [Validators.required]],
    importOption: [null, [Validators.required]],
  });

  public constructor(
    public readonly dssContainersService: DssContainersService,
    private readonly pageTitleService: PageTitleService,
    private readonly cmsService: CMSService,
    private readonly route: ActivatedRoute,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly titleService: Title,
    private readonly modalService: DialogService
  ) {}

  public get f(): FormGroup<FormDssContainer>['controls'] {
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

  private get dssContainer(): DssContainerPayload {
    return {
      name: this.f.name.value!,
      path: this.f.path.value!,
      read_write_setting: this.f.readWriteSetting.value!,
      import_option: this.f.importOption.value!,
    };
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'dsscontainer', pk: this.id }]);
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

    this.cmsService
      .getDssContainerDetailHowTo()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ result => {
          this.dssContainerDetailHowTo = result;
          this.cdr.markForCheck();
        }
      );

    this.initTranslations();
    this.initDetails();
    this.initPageTitle();
  }

  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('dssContainers.readWriteSetting')
      .pipe(untilDestroyed(this))
      .subscribe(readWriteSetting => {
        this.readWriteSettings = [
          {
            label: readWriteSetting.readOnly,
            value: 'RO',
          },
          {
            label: readWriteSetting.readWriteNoNew,
            value: 'RWNN',
          },
          {
            label: readWriteSetting.readWriteOnlyNew,
            value: 'RWON',
          },
          {
            label: readWriteSetting.readWriteAll,
            value: 'RWA',
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('dssContainers.importOption')
      .pipe(untilDestroyed(this))
      .subscribe(importOption => {
        this.importOptions = [
          {
            label: importOption.importOnlyNew,
            value: 'ION',
          },
          {
            label: importOption.importList,
            value: 'IL',
          },
          {
            label: importOption.importAll,
            value: 'IA',
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
            return this.dssContainersService.lock(this.id);
          }

          return of([]);
        })
      )
      .subscribe();
  }

  public initDetails(formChanges = true): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.dssContainersService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ privilegesData => {
            const dssContainer = privilegesData.data;
            const privileges = privilegesData.privileges;

            this.form.patchValue(
              {
                name: dssContainer.name,
                path: dssContainer.path,
                readWriteSetting: dssContainer.read_write_setting,
                importOption: dssContainer.import_option,
              },
              { emitEvent: false }
            );

            if (!privileges.edit) {
              this.form.disable({ emitEvent: false });
            }

            return privilegesData;
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ privilegesData => {
          const dssContainer = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = dssContainer.display;
          this.pageTitleService.set(dssContainer.display);

          this.initialState = { ...dssContainer };
          this.privileges = { ...privileges };

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }

          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.dssContainersService
      .patch(this.id, this.dssContainer)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ dssContainer => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.dssContainersService.unlock(this.id);
          }

          this.detailsTitle = dssContainer.display;
          this.pageTitleService.set(dssContainer.display);

          this.initialState = { ...dssContainer };
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.toastrService.success(this.translocoService.translate('dssContainer.details.toastr.success'));
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

  public onUploadJsonPathList(event: Event): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    /* istanbul ignore next */
    const files = (event.target as HTMLInputElement).files;
    /* istanbul ignore next */
    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const paths = JSON.parse(result);

        this.dssContainersService
          .importJsonPathList(paths)
          .pipe(untilDestroyed(this))
          .subscribe(
            /* istanbul ignore next */ result => {
              this.loading = false;
              this.translocoService
                .selectTranslate('dssContainer.importPathList.toastr.success', { count: result.count })
                .pipe(untilDestroyed(this))
                .subscribe(success => {
                  this.toastrService.success(success);
                });
              this.cdr.markForCheck();
            },
            /* istanbul ignore next */ () => {
              this.loading = false;
              this.cdr.markForCheck();
            }
          );
      };
      reader.readAsBinaryString(files[0]);
    }
  }
}
