/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'eworkbench-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ModalComponent {
  @Input()
  public className = 'modal-wrap';

  @Input()
  public modalFooter = true;

  @Input()
  public closeButton = true;

  public constructor(public readonly modalRef: DialogRef) {}
}
