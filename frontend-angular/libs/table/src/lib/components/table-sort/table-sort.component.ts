/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TableSortDirection } from '../../enums/table-sort-direction.enum';
import type { TableColumn } from '../../interfaces/table-column.interface';
import type { TableSortChangedEvent } from '../../interfaces/table-sort-changed-event.interface';

@Component({
  selector: 'eworkbench-table-sort',
  templateUrl: './table-sort.component.html',
  styleUrls: ['./table-sort.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSortComponent {
  @Input()
  public column!: TableColumn;

  @Input()
  public sortBy?: string;

  @Input()
  public sort?: TableSortDirection;

  @Output()
  public sortChanged = new EventEmitter<TableSortChangedEvent>();

  public sortDirection = TableSortDirection;

  public get tooltip(): string {
    if (this.column.key !== this.sortBy) {
      this.sort = TableSortDirection.None;
      return 'Click to sort ascending';
    }

    switch ((this.sort ??= TableSortDirection.None)) {
      case TableSortDirection.None: {
        return 'Click to sort ascending';
      }

      case TableSortDirection.Ascending: {
        return 'Click to sort descending';
      }

      case TableSortDirection.Descending: {
        return 'Reset sorting';
      }
    }
  }

  public get sortIcon(): string {
    if (this.column.key !== this.sortBy) {
      this.sort = TableSortDirection.None;
      return 'wb-inactive-sort';
    }

    switch ((this.sort ??= TableSortDirection.None)) {
      case TableSortDirection.None: {
        return 'wb-inactive-sort';
      }

      case TableSortDirection.Ascending: {
        return 'wb-active-sort-ascending-127';
      }

      case TableSortDirection.Descending: {
        return 'wb-active-sort-ascending-126';
      }
    }
  }

  public onSortChanged(key: string): void {
    this.sortBy = key;

    switch ((this.sort ??= TableSortDirection.None)) {
      case TableSortDirection.None: {
        this.sort = TableSortDirection.Ascending;
        break;
      }

      case TableSortDirection.Ascending: {
        this.sort = TableSortDirection.Descending;
        break;
      }

      case TableSortDirection.Descending: {
        this.sort = TableSortDirection.None;
        break;
      }
    }

    this.sortChanged.emit({ key: this.sortBy, direction: this.sort });
  }
}
