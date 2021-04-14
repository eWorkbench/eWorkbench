/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { TaskBoardsService } from '@app/services';
import { TaskBoardColumn } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface FormTaskBoardColumnDetails {
  title: string | null;
  color: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-column-details-modal',
  templateUrl: './column-details.component.html',
  styleUrls: ['./column-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnDetailsModalComponent implements OnInit {
  public column = this.modalRef.data.column;

  public columns = this.modalRef.data.columns;

  public taskBoardId = this.modalRef.data.taskBoardId;

  public state = ModalState.Unchanged;

  public loading = false;

  public form = this.fb.group<FormTaskBoardColumnDetails>({
    title: [null, [Validators.required]],
    color: [null, [Validators.required]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly taskBoardsService: TaskBoardsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f(): FormGroup<FormTaskBoardColumnDetails>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get columnPayload(): TaskBoardColumn {
    return {
      ...this.column,
      title: this.f.title.value!,
      color: this.f.color.value!,
    };
  }

  public ngOnInit(): void {
    this.form.patchValue(
      {
        title: this.column.title,
        color: this.column.color,
      },
      { emitEvent: false }
    );
  }

  public onDelete(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    let order = 1;
    const columns: TaskBoardColumn[] = this.columns
      .filter(/* istanbul ignore next */ (col: TaskBoardColumn) => col.pk !== this.column.pk)
      .map(
        /* istanbul ignore next */ (col: TaskBoardColumn) => {
          col.ordering = order++;
          return col;
        }
      );

    this.taskBoardsService
      .moveColumn(this.taskBoardId, columns)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
        },
        /* istanbul ignore next */ () => {
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

    const columns: TaskBoardColumn[] = this.columns.filter(/* istanbul ignore next */ (col: TaskBoardColumn) => col.pk !== this.column.pk);
    this.taskBoardsService
      .moveColumn(this.taskBoardId, [...columns, this.columnPayload])
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
