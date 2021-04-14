/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-state-timeline-modal',
  templateUrl: './state-timeline.component.html',
  styleUrls: ['./state-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateTimelineModalComponent {
  public loading = false;

  public id: string = this.modalRef.data.id;

  public constructor(public readonly modalRef: DialogRef, private readonly modalService: DialogService) {}
}
