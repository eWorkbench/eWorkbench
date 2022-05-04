/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { TaskBoardsService } from '@app/services';
import type { TaskBoardColumn } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface FormTaskBoardColumnDetails {
  title: FormControl<string | null>;
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
    title: this.fb.control(null, Validators.required),
    color: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly taskBoardsService: TaskBoardsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get columnPayload(): TaskBoardColumn {
    return {
      ...this.column,
      title: this.f.title.value!,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      color: this.f.color.value || 'rgba(244,244,244,1)',
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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    const columns: TaskBoardColumn[] = this.columns.filter((col: TaskBoardColumn) => col.pk !== this.column.pk);
    this.taskBoardsService
      .moveColumn(this.taskBoardId, [...columns, this.columnPayload])
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
