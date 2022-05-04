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
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBooksService } from '@app/services';
import type { DatePickerConfig, LabBookElement, LabBookElementEvent, ModalCallback } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import flatpickr from 'flatpickr';
import { take } from 'rxjs/operators';
import { NewLabBookSectionElementModalComponent } from '../../modals/new/section/new.component';
import type { LabBookDrawBoardElementComponent } from '../element/element.component';
import { LabBookPendingChangesModalComponent } from '../modals/pending-changes/pending-changes.component';

interface FormSearch {
  startDate: string | null;
  endDate: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookSearchBarComponent implements AfterViewInit {
  @ViewChildren('elementComponent')
  public elements?: QueryList<LabBookDrawBoardElementComponent>;

  @Input()
  public id!: string;

  @Input()
  public projects: string[] = [];

  @Input()
  public editable? = false;

  @Output()
  public created = new EventEmitter<LabBookElementEvent>();

  public close = new EventEmitter<string>();

  public sections: LabBookElement<any>[] = [];

  public expanded = false;

  public invalidDates = false;

  public loading = false;

  public modalRef?: DialogRef;

  public expandedSection?: string;

  public datePickerConfig: DatePickerConfig = {
    dateFormat: 'Y-m-d',
    locale: {
      firstDayOfWeek: 1,
    },
  };

  public form = this.fb.group<FormSearch>({
    startDate: null,
    endDate: null,
  });

  public constructor(
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService,
    private readonly labBooksService: LabBooksService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public ngAfterViewInit(): void {
    flatpickr('#startDate', {
      ...this.datePickerConfig,
      onChange: (_, dateStr) => {
        this.f.startDate.setValue(dateStr);
        this.onSetFilter();
      },
    });
    flatpickr('#endDate', {
      ...this.datePickerConfig,
      onChange: (_, dateStr) => {
        this.f.endDate.setValue(dateStr);
        this.onSetFilter();
      },
    });
  }

  public onSetFilter(): void {
    this.sections = [];

    if (this.f.startDate.value && this.f.endDate.value) {
      const start = new Date(Date.parse(this.f.startDate.value));
      const end = new Date(Date.parse(this.f.endDate.value));

      this.invalidDates = false;
      this.expanded = true;

      if (start > end) {
        this.invalidDates = true;
      } else {
        this.search(start, end);
      }

      return;
    }

    this.expanded = false;
  }

  public search(start: Date, end: Date): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labBooksService
      .getElements(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        labBookElements => {
          this.sections = labBookElements.filter(element => {
            const elementDate = new Date(Date.parse(element.child_object.date));
            return element.child_object_content_type_model === 'labbooks.labbooksection' && elementDate >= start && elementDate <= end;
          });

          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onOpenNewSectionModal(): void {
    this.modalRef = this.modalService.open(NewLabBookSectionElementModalComponent, {
      closeButton: false,
      data: { projects: this.projects },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.created.emit(callback.data);
    }
  }

  public onExpandSection(id: string): void {
    if (!this.expandedSection || !this.pendingChanges()) {
      this.switchSectionStates(id);
      return;
    }

    this.modalRef = this.modalService.open(LabBookPendingChangesModalComponent, {
      closeButton: false,
      data: { id },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.switchSectionStates(id);
      }
    });
  }

  public switchSectionStates(id: string): void {
    this.expandedSection = id;
    this.close.next(id);
  }

  public onReset(): void {
    this.form.patchValue({ startDate: null, endDate: null });
    this.onSetFilter();
  }

  public pendingChanges(): boolean {
    for (const element of this.elements ?? []) {
      if (element.pendingChanges()) {
        return true;
      }
    }

    return false;
  }
}
