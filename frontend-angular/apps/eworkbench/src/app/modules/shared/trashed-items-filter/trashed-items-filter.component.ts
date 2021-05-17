/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-trashed-items-filter',
  templateUrl: './trashed-items-filter.component.html',
  styleUrls: ['./trashed-items-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashedItemsFilterComponent {
  @Output()
  public stateChanged = new EventEmitter<boolean>();

  public showTrashedItems = false;

  public constructor(private readonly cdr: ChangeDetectorRef) {}

  public onChangeState(): void {
    this.showTrashedItems = !this.showTrashedItems;
    this.stateChanged.emit(this.showTrashedItems);
    this.cdr.markForCheck();
  }
}
