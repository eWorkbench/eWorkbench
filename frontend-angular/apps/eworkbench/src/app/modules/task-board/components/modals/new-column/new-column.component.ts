/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy } from '@ngneat/until-destroy';

interface FormTaskBoardColumn {
  title: FormControl<string | null>;
  color: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-task-board-column-modal',
  templateUrl: './new-column.component.html',
  styleUrls: ['./new-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewTaskBoardColumnModalComponent {
  public state = ModalState.Unchanged;

  public loading = false;

  public form = this.fb.group<FormTaskBoardColumn>({
    title: this.fb.control(null, Validators.required),
    color: null,
  });

  public constructor(public readonly modalRef: DialogRef, private readonly fb: FormBuilder) {}

  public get f() {
    return this.form.controls;
  }

  public get taskBoardColumn() {
    return {
      title: this.f.title.value,
      color: this.f.color.value,
    };
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.state = ModalState.Changed;
    this.modalRef.close({
      state: this.state,
      data: this.taskBoardColumn,
    });
  }
}
