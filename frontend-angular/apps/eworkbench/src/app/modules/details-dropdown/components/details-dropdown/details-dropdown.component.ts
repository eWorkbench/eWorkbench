/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { DeleteModalComponent } from '@app/modules/trash/components/modals/delete/delete.component';
import { UserStore } from '@app/stores/user';
import { DMP, ExportLink, ModalCallback, Privileges, Project } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { DuplicateDMPModalComponent } from '../modals/duplicate-dmp/duplicate.component';
import { DuplicateProjectModalComponent } from '../modals/duplicate-project/duplicate.component';
import { PrivilegesModalComponent } from '../modals/privileges/privileges.component';
import { ShareModalComponent } from '../modals/share/share.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-details-dropdown',
  templateUrl: './details-dropdown.component.html',
  styleUrls: ['./details-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailsDropdownComponent implements OnInit {
  @Input()
  public service!: any;

  @Input()
  public id?: string;

  @Input()
  public initialState?: any;

  @Input()
  public redirectDestination?: string[] = ['/'];

  @Input()
  public newModalComponent?: any;

  @Input()
  public backdropClose = true;

  @Input()
  public privilegesElement = true;

  @Input()
  public trashElement = true;

  @Input()
  public exportElement = true;

  @Input()
  public duplicateElement = true;

  @Input()
  public shareElement = false;

  @Input()
  public privileges?: Privileges;

  public modalRef?: DialogRef;

  public loading = false;

  public dropdown = true;

  public detailsCollapsed = true;

  public constructor(
    private readonly userStore: UserStore,
    private readonly modalService: DialogService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly breakpointObserver: BreakpointObserver
  ) {}

  public ngOnInit(): void {
    this.breakpointObserver
      .observe(['(min-width: 769px)'])
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        /* istanbul ignore if */
        if (res.matches) {
          this.dropdown = true;
          this.detailsCollapsed = true;
          this.cdr.markForCheck();
          return;
        }
        this.dropdown = false;
        this.cdr.markForCheck();
      });
  }

  public onOpenPrivilegesModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(PrivilegesModalComponent, {
      closeButton: false,
      width: '600px',
      data: { service: this.service, id: this.id, data: this.initialState },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onExport(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .export(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (exportLink: ExportLink) => {
          window.open(exportLink.url, '_blank');
          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onDelete(): void {
    const userStoreValue = this.userStore.getValue();
    const userSetting = 'SkipDialog-TrashElementFromDetailView';

    /* istanbul ignore next */
    const skipTrashDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.[userSetting]);

    if (skipTrashDialog) {
      this.delete(this.id!);
    } else {
      this.modalRef = this.modalService.open(DeleteModalComponent, {
        closeButton: false,
        data: { id: this.id, service: this.service, userSetting },
      });
      /* istanbul ignore next */
      this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
    }
  }

  public delete(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .delete(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.router.navigate(this.redirectDestination ?? /* istanbul ignore next */ ['/']);
          this.translocoService
            .selectTranslate('trashElement.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
        }
      );
  }

  public onRestore(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .restore(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.router.navigate(this.redirectDestination ?? /* istanbul ignore next */ ['/']);
          this.translocoService
            .selectTranslate('restoreElement.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
        }
      );
  }

  public onOpenNewModal(initialState?: any, duplicate?: string): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(this.newModalComponent, {
      closeButton: false,
      enableClose: this.backdropClose,
      data: { service: this.service, duplicate, initialState },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenDuplicateModal(): void {
    const userStoreValue = this.userStore.getValue();

    if (this.initialState.content_type_model === 'projects.project') {
      /* istanbul ignore next */
      const skipDuplicateDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.['SkipDialog-DuplicateProject']);

      if (skipDuplicateDialog) {
        this.duplicateProject(this.id!);
      } else {
        this.modalRef = this.modalService.open(DuplicateProjectModalComponent, {
          closeButton: false,
          data: { id: this.id },
        });
        /* istanbul ignore next */
        this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
      }
    } else if (this.initialState.content_type_model === 'dmp.dmp') {
      /* istanbul ignore next */
      const skipDuplicateDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.['SkipDialog-DuplicateDMP']);

      if (skipDuplicateDialog) {
        this.duplicateDMP(this.id!);
      } else {
        this.modalRef = this.modalService.open(DuplicateDMPModalComponent, {
          closeButton: false,
          data: { id: this.id },
        });
        /* istanbul ignore next */
        this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
      }
    } else {
      this.onOpenNewModal(this.initialState, this.initialState.pk);
    }
  }

  public onOpenShareModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(ShareModalComponent, {
      closeButton: false,
      data: { id: this.id, service: this.service },
    });
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.router.navigate(this.redirectDestination ?? /* istanbul ignore next */ ['/']);
    }
  }

  public duplicateProject(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .duplicate(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (project: Project) => {
          this.router.navigate(['/projects', project.pk]);
          this.translocoService
            .selectTranslate('project.duplicate.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
        }
      );
  }

  public duplicateDMP(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .duplicate(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (dmp: DMP) => {
          this.router.navigate(['/dmps', dmp.pk]);
          this.translocoService
            .selectTranslate('dmp.duplicate.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
        }
      );
  }
}
