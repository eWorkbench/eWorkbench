/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DialogRef } from '@ngneat/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-pending-changes-modal',
  templateUrl: './pending-changes.component.html',
  styleUrls: ['./pending-changes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookPendingChangesModalComponent {
  public id: string = this.modalRef.data.id;

  public loading = false;

  public state = ModalState.Unchanged;

  public constructor(public readonly modalRef: DialogRef) {}

  public onConfirm(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.state = ModalState.Changed;
    this.modalRef.close({ state: this.state, data: { id: this.id } });
  }
}
