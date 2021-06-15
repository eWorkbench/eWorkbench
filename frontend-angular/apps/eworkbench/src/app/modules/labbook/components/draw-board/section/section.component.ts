/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, LabBookSectionsService, WebSocketService } from '@app/services';
import { DatePickerConfig, LabBookElement, LabBookSectionPayload, Lock, ModalCallback, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import flatpickr from 'flatpickr';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { DeleteLabBookSectionElementModalComponent } from '../../modals/delete-section/delete-section.component';
import { LabBookDrawBoardGridComponent } from '../grid/grid.component';

interface FormSection {
  date: string | null;
  title: string | null;
}

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardSectionComponent implements OnInit, AfterViewInit {
  @ViewChildren('drawBoardGrid')
  public drawBoardGrids?: QueryList<LabBookDrawBoardGridComponent>;

  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<any>;

  @Input()
  public readonly = false;

  @Input()
  public closeSection?: EventEmitter<string>;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  @Output()
  public expand = new EventEmitter<string>();

  public currentUser: User | null = null;

  public lock: Lock | null = null;

  public expanded = false;

  public loading = false;

  public uniqueHash = uuidv4();

  public refreshResetValue = new EventEmitter<boolean>();

  public modalRef?: DialogRef;

  public form: FormGroup<FormSection> = this.fb.group<FormSection>({
    date: [null, [Validators.required]],
    title: [null, [Validators.required]],
  });

  public datePickerConfig: DatePickerConfig = {
    dateFormat: 'Y-m-d',
    locale: {
      firstDayOfWeek: 1,
    },
  };

  public constructor(
    private readonly labBookSectionsService: LabBookSectionsService,
    private readonly fb: FormBuilder,
    private readonly modalService: DialogService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService
  ) {}

  public get f(): FormGroup<FormSection>['controls'] {
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

  public get section(): LabBookSectionPayload {
    const section = {
      date: this.f.date.value ?? '',
      title: this.f.title.value ?? '',
    };

    return section;
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'labbooksection', pk: this.element.child_object_id }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ (data: any) => {
        /* istanbul ignore next */
        if (data.element_lock_changed?.model_pk === this.element.child_object_id) {
          this.lock = data.element_lock_changed;
          this.cdr.markForCheck();
        }
      }
    );

    /* istanbul ignore next */
    this.closeSection?.subscribe((id: string) => {
      if (id !== this.element.child_object_id) {
        this.onCollapseSection();
        this.cdr.markForCheck();
      }
    });

    this.patchFormValues();
  }

  public ngAfterViewInit(): void {
    flatpickr(`#date-${this.uniqueHash}`, {
      ...this.datePickerConfig,
      onChange: (selectedDate, dateStr) => {
        this.f.date.setValue(dateStr);
      },
    });
  }

  public patchFormValues(): void {
    this.form.patchValue(
      {
        date: this.element.child_object.date,
        title: this.element.child_object.title,
      },
      { emitEvent: false }
    );
  }

  public onExpandSection(): void {
    this.expanded = true;
    this.expand.emit(this.element.child_object_id);
  }

  public onCollapseSection(): void {
    this.expanded = false;
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBookSectionsService
      .patch(this.element.child_object_id, this.section)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ section => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.labBookSectionsService.unlock(this.element.child_object_id);
          }

          this.element.child_object = { ...section };
          this.form.markAsPristine();
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('labBook.drawBoardSection.details.toastr.success')
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

  public pendingChanges(): boolean {
    return this.form.dirty || this.pendingChangesDrawBoards();
  }

  public pendingChangesDrawBoards(): boolean {
    for (const element of this.drawBoardGrids ?? []) {
      if (element.pendingChanges()) {
        return true;
      }
    }

    return false;
  }

  public onDelete(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(DeleteLabBookSectionElementModalComponent, {
      closeButton: false,
      data: { labBookId: this.id, sectionId: this.element.pk, elementId: this.element.child_object_id },
    });

    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.removed.emit({ id: this.element.pk, gridReload: callback.data.gridReload });
    }
  }
}
