/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { LabBookElement } from '@eworkbench/types';
import { UntilDestroy } from '@ngneat/until-destroy';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-permission-denied',
  templateUrl: './permission-denied.component.html',
  styleUrls: ['./permission-denied.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardPermissionDeniedComponent {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<any>;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  public onRemove(event: ElementRemoval): void {
    this.removed.emit(event);
  }
}
