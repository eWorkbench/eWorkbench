/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { TasksService } from '@app/services';
import { Label, ModalCallback } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { EditLabelModalComponent } from '../modals/edit/edit.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-labels',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelsComponent {
  @Input()
  public id?: string;

  @Input()
  public labels: Label[] = [];

  @Input()
  public readonly = false;

  @Output()
  public labelChange = new EventEmitter<Label[]>();

  public modalRef?: DialogRef;

  public constructor(
    public readonly tasksService: TasksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService
  ) {}

  public openEditLabelModal(label: Label): void {
    if (this.readonly) {
      return;
    }

    /* istanbul ignore next */
    this.modalRef = this.modalService.open(EditLabelModalComponent, {
      closeButton: false,
      data: {
        label,
      },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    /* istanbul ignore next */
    if (callback?.state === ModalState.Changed) {
      if (callback.data) {
        const labels = [...this.labels.filter(label => label.pk !== callback.data.pk), callback.data];
        this.labelChange.emit(labels);
      }
      this.cdr.markForCheck();
    }
  }

  public removeLabel(label: Label): void {
    const labels = this.labels.filter(oldLabel => oldLabel.pk !== label.pk);
    const labelsPayload = labels.map(label => label.pk);

    if (this.id) {
      this.tasksService
        .patch(this.id, { labels: labelsPayload })
        .pipe(untilDestroyed(this))
        .subscribe(/* istanbul ignore next */ () => this.labelChange.emit(labels));
    } else {
      this.labelChange.emit(labels);
    }
  }
}
