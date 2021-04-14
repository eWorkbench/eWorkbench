/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { cloneDeep } from 'lodash';
import { TableColumnChangedEvent } from '../../interfaces/table-column-changed-event.interface';
import { TableColumn } from '../../interfaces/table-column.interface';

@Component({
  selector: 'eworkbench-table-manage-columns',
  templateUrl: './table-columns.component.html',
  styleUrls: ['./table-columns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableColumnComponent implements OnChanges {
  @Input()
  public columns!: TableColumn[];

  @Input()
  public defaultColumns!: TableColumn[];

  @Input()
  public reset = true;

  @Output()
  public columnsChanged = new EventEmitter<TableColumnChangedEvent>();

  public _columns: TableColumn[] = [];

  private _defaultColumns: TableColumn[] = [];

  public ngOnChanges(changes: SimpleChanges): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (changes.columns) {
      const clone = changes.columns.currentValue.map(({ cellTemplate, ...rest }: any) => rest);
      this._columns = cloneDeep(clone);
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (changes.defaultColumns) {
      const clone = changes.defaultColumns.currentValue.map(({ cellTemplate, ...rest }: any) => rest);
      this._defaultColumns = cloneDeep(clone);
    }
  }

  public onColumnChanged(column: TableColumn): void {
    column.hidden = !column.hidden;
    this.columnsChanged.emit(this._columns);
  }

  public resetColumns(): void {
    this.columnsChanged.emit(this._defaultColumns);
  }
}
