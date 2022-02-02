/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { CommentsModalComponent } from '@app/modules/comment/components/modals/comments/comments.component';
import { PrivilegesModalComponent } from '@app/modules/details-dropdown/components/modals/privileges/privileges.component';
import { RecentChangesModalComponent } from '@app/modules/recent-changes/components/modals/recent-changes/recent-changes.component';
import { DeleteModalComponent } from '@app/modules/trash/components/modals/delete/delete.component';
import { LabBookSectionsService, LabBooksService } from '@app/services';
import { UserStore } from '@app/stores/user';
import { ExportLink, LabBookElement, ModalCallback, Privileges } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { MoveLabBookElementToLabBookModalComponent } from '../modals/move/element-to-labbook/element-to-labbook.component';
import { MoveLabBookElementToSectionModalComponent } from '../modals/move/element-to-section/element-to-section.component';
import { LabBookElementRemoveModalComponent } from '../modals/remove/remove.component';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-element-dropdown',
  templateUrl: './element-dropdown.component.html',
  styleUrls: ['./element-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookElementDropdownComponent implements OnInit {
  @Input()
  public service!: any;

  @Input()
  public id?: string;

  @Input()
  public labBookId!: string;

  @Input()
  public elementId!: string;

  @Input()
  public section?: string;

  @Input()
  public initialState?: any;

  @Input()
  public redirectDestination!: string;

  @Input()
  public privileges?: Privileges;

  @Input()
  public labBookEditable? = false;

  @Input()
  public newModalComponent?: any;

  @Input()
  public minimalistic = false;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  @Output()
  public moved = new EventEmitter<ElementRemoval>();

  public modalRef?: DialogRef;

  public loading = false;

  public uniqueHash = uuidv4();

  public dropdown = true;

  public detailsCollapsed = true;

  public constructor(
    private readonly userStore: UserStore,
    private readonly labBooksService: LabBooksService,
    private readonly labBookSectionsService: LabBookSectionsService,
    private readonly modalService: DialogService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
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
    this.modalService.open(PrivilegesModalComponent, {
      closeButton: false,
      data: { service: this.service, id: this.id, data: this.initialState },
    });
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
    const userSetting = 'SkipDialog-TrashAndDeleteElementFromLabbook';

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
      this.modalRef.afterClosed$
        .pipe(untilDestroyed(this), take(1))
        .subscribe((callback: ModalCallback) => this.onDeleteModalClose(callback));
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
          this.loading = false;
          this.translocoService
            .selectTranslate('labBook.elementDropdown.trashElement.toastr.success')
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

  public onOpenMoveToSectionModal(): void {
    this.modalRef = this.modalService.open(MoveLabBookElementToSectionModalComponent, {
      closeButton: false,
      data: { labBookId: this.labBookId, elementId: this.elementId },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: ModalCallback) => this.onMoveElementToSectionModalClose(callback));
  }

  public onOpenMoveBackToLabBookModal(): void {
    const userStoreValue = this.userStore.getValue();
    /* istanbul ignore next */
    const skipTrashDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.['SkipDialog-MoveElementOutOfSection']);

    if (skipTrashDialog) {
      this.moveBackToLabBook();
    } else {
      this.modalRef = this.modalService.open(MoveLabBookElementToLabBookModalComponent, {
        closeButton: false,
        data: { labBookId: this.labBookId, elementId: this.elementId, sectionId: this.section },
      });
      /* istanbul ignore next */
      this.modalRef.afterClosed$
        .pipe(untilDestroyed(this), take(1))
        .subscribe((callback: ModalCallback) => this.onMoveElementToLabBookModalClose(callback));
    }
  }

  public moveBackToLabBook(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    // 1. Get all elements of section
    this.labBooksService
      .getElements(this.labBookId, this.section)
      .pipe(
        untilDestroyed(this),
        switchMap(
          /* istanbul ignore next */ elements => {
            // 2. Filter elements of the section and patch it with the selected element removed
            const childElements = elements.filter(element => element.pk !== this.elementId).map(element => element.pk);

            return this.labBookSectionsService
              .patch(this.section!, {
                pk: this.section!,
                child_elements: [...childElements],
              })
              .pipe(untilDestroyed(this));
          }
        ),
        switchMap(
          /* istanbul ignore next */ () => {
            // 3. Get all elements of main LabBook grid to calculate the new Y position in the next step
            return this.labBooksService.getElements(this.labBookId).pipe(untilDestroyed(this));
          }
        ),
        switchMap(
          /* istanbul ignore next */ elements => {
            // 4. Calculate and patch the new Y position for formerly removed element from the section
            const filteredElements = elements.filter(element => element.pk !== this.elementId);

            return this.labBooksService
              .patchElement(this.labBookId, this.elementId, {
                position_y: this.getMaxYPosition(filteredElements),
              })
              .pipe(untilDestroyed(this));
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ () => {
          this.onMoveElementToLabBookModalClose({
            state: ModalState.Changed,
            data: { id: this.elementId, gridReload: false },
          });
          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('labBook.moveElementToLabBookModal.toastr.success')
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

  public remove(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .deleteElement(this.labBookId, this.elementId)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.removed.emit({ id: this.elementId, gridReload: false });
          this.loading = false;
          this.translocoService
            .selectTranslate('labBook.elementDropdown.removeFromLabBook.toastr.success')
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

  public onOpenRecentChangesModal(): void {
    /* istanbul ignore next */
    this.modalService.open(RecentChangesModalComponent, {
      closeButton: false,
      data: { service: this.service, id: this.id },
    });
  }

  public onRemove(): void {
    const userStoreValue = this.userStore.getValue();
    /* istanbul ignore next */
    const skipTrashDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.['SkipDialog-RemoveElementFromLabbook']);

    if (skipTrashDialog) {
      this.remove();
    } else {
      this.modalRef = this.modalService.open(LabBookElementRemoveModalComponent, {
        closeButton: false,
      });
      /* istanbul ignore next */
      this.modalRef.afterClosed$
        .pipe(untilDestroyed(this), take(1))
        .subscribe((callback: ModalCallback) => this.onRemoveModalClose(callback));
    }
  }

  public onOpenCommentsModal(): void {
    /* istanbul ignore next */
    this.modalService.open(CommentsModalComponent, {
      closeButton: false,
      width: '912px',
      data: { service: this.service, element: this.initialState, create: true },
    });
  }

  public onDeleteModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.remove();
    }
  }

  public onRemoveModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.remove();
    }
  }

  public onMoveElementToSectionModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.moved.emit({ id: this.elementId, gridReload: false });
    }
  }

  public onMoveElementToLabBookModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.moved.emit({ id: this.elementId, gridReload: false });
    }
  }

  public getMaxYPosition(elements: LabBookElement<any>[]): number {
    if (!elements.length) {
      return 0;
    }

    return Math.max(...elements.map(element => element.position_y + element.height));
  }
}
