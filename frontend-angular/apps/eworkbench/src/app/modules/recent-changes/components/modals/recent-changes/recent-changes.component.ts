/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'eworkbench-recent-changes-modal',
  templateUrl: './recent-changes.component.html',
  styleUrls: ['./recent-changes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesModalComponent {
  public id: string = this.modalRef.data.id;

  public service: any = this.modalRef.data.service;

  public constructor(public readonly modalRef: DialogRef) {}
}
