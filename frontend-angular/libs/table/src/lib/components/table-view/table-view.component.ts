/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TableSortDirection } from '../../enums/table-sort-direction.enum';
import type { TableColumn } from '../../interfaces/table-column.interface';
import type { TableSortChangedEvent } from '../../interfaces/table-sort-changed-event.interface';

@Component({
  selector: 'eworkbench-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public data: any[] = [];

  @Input()
  public pagination = true;

  @Input()
  public paginationSize = 20;

  @Input()
  public selectable = false;

  @Input()
  public sortBy?: string;

  @Input()
  public sort?: TableSortDirection;

  @Input()
  public columns: TableColumn[] = [];

  @Input()
  public columnHeader = true;

  @Input()
  public service: any;

  @Input()
  public customId?: string;

  @Input()
  public params?: HttpParams;

  @Input()
  public orderByField = 'ordering';

  @Input()
  public offsetField = 'offset';

  @Input()
  public perPageField = 'limit';

  @Input()
  public skipInit = false;

  @Input()
  public rowHover = true;

  @Input()
  public relation = false;

  @Input()
  public noPadding = false;

  @Output()
  public dataSelected = new EventEmitter<any>();

  @Output()
  public sortChanged = new EventEmitter<TableSortChangedEvent>();

  @Output()
  public orderChanged = new EventEmitter<TableColumn[]>();

  @Output()
  public rendered = new EventEmitter<boolean>();

  @Input()
  public skeletonLines = 20;

  public skeletonItems: number[] = [];

  public displayedColumns$ = new BehaviorSubject<string[]>([]);

  public dataSource$ = new BehaviorSubject<any>([]);

  public total = 0;

  public page = 1;

  public selected = new Map<string, any>();

  public loading = false;

  public loadingMore = false;

  public firstDataLoaded = false;

  private serviceSubscription?: Subscription;

  public constructor(private readonly cdr: ChangeDetectorRef) {}

  public get allChecked(): boolean {
    return this.data.every(({ pk }) => this.selected.has(pk));
  }

  public get indeterminate(): boolean {
    return Boolean(this.selected.size && !this.allChecked);
  }

  public get orderByDirection(): string | null {
    switch (this.sort ?? TableSortDirection.Descending) {
      case TableSortDirection.None: {
        return null;
      }

      case TableSortDirection.Ascending: {
        return '';
      }

      case TableSortDirection.Descending: {
        return '-';
      }
    }
  }

  public get offset(): number {
    return (this.page - 1) * this.paginationSize;
  }

  public ngOnInit(): void {
    this.skeletonItems = Array(this.skeletonLines).fill(1);
    if (this.service) {
      if (!this.skipInit) {
        this.loadData();
      }
    } else {
      const slice = this.data.slice(this.offset, this.page * this.paginationSize);
      this.total = this.data.length;
      this.firstDataLoaded = true;
      this.dataSource$.next(slice);
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (changes.columns) {
      const columns = changes.columns.currentValue.filter((col: TableColumn) => !col.hidden).map((col: TableColumn) => col.key);
      this.displayedColumns$.next(this.selectable ? ['select', ...columns] : columns);
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (changes.data) {
      if (!this.service) {
        if (changes.data.currentValue) {
          const slice = changes.data.currentValue.slice(this.offset, this.page * this.paginationSize);
          this.total = changes.data.currentValue.length;
          this.dataSource$.next(slice);
        }
      }
    }
  }

  public ngOnDestroy(): void {
    this.serviceSubscription?.unsubscribe();
  }

  public onColumnDrop(event: CdkDragDrop<string[]>): void {
    const columns = [...this.displayedColumns$.value];
    moveItemInArray(columns, event.previousIndex, event.currentIndex);
    this.displayedColumns$.next(this.selectable ? ['select', ...columns.slice(1)] : columns);
    const filteredColumns = this.displayedColumns$.value
      .flatMap(sortedKey => this.columns.filter(column => sortedKey === column.key))
      .filter(column => column.key !== 'actions');
    const sortedColumns = [
      ...filteredColumns,
      ...this.columns.filter(column => column.hidden),
      ...this.columns.filter(column => column.key === 'actions'),
    ];
    this.orderChanged.emit(this.selectable ? sortedColumns.slice(1) : sortedColumns);
  }

  public onSelectAll(): void {
    if (this.allChecked) {
      this.selected.clear();
    } else {
      for (const d of this.data) {
        this.selected.set(d.pk, d);
      }
    }

    this.dataSelected.emit([...this.selected.values()]);
  }

  public onSelect(data: any): void {
    if (this.selected.has(data.pk)) {
      this.selected.delete(data.pk);
    } else {
      this.selected.set(data.pk, data);
    }

    this.dataSelected.emit([...this.selected.values()]);
  }

  public onLoadMore(): void {
    this.page += 1;
    if (this.service) {
      this.loadingMore = true;
      this.loadData(true);
    } else {
      const slice = this.data.slice(0, this.page * this.paginationSize);
      this.dataSource$.next(slice);
    }
  }

  public onSortChanged(event: TableSortChangedEvent): void {
    this.sortBy = event.key;
    this.sort = event.direction;

    if (this.service) {
      this.loadData();
    }

    this.sortChanged.emit(event);
  }

  public loadData(append = false, httpParams?: HttpParams): void {
    if (this.service) {
      this.loading = true;
      this.cdr.markForCheck();

      if (!append) {
        this.page = 1;
      }

      const baseParams = httpParams ?? this.params ?? new HttpParams();
      let params = baseParams.set(this.offsetField, this.offset.toString()).set(this.perPageField, this.paginationSize.toString());

      if (this.orderByDirection !== null) {
        params = params.set(this.orderByField, `${this.orderByDirection}${this.sortBy ?? 'pk'}`);
      }

      if (this.relation) {
        this.serviceSubscription = this.service.getRelations(this.customId, params).subscribe((event: any) => {
          if (append) {
            this.data = [...this.data, ...event.data];
          } else {
            this.data = event.data;
          }
          this.total = event.total;

          this.loading = false;
          this.loadingMore = false;
          this.firstDataLoaded = true;
          this.dataSource$.next(this.data);
          this.rendered.emit(true);
          this.cdr.markForCheck();
        });
      } else {
        this.serviceSubscription = this.service.getList(params, this.customId).subscribe((event: any) => {
          if (append) {
            this.data = [...this.data, ...event.data];
          } else {
            this.data = event.data;
          }
          this.total = event.total;

          this.loading = false;
          this.loadingMore = false;
          this.firstDataLoaded = true;
          this.dataSource$.next(this.data);
          this.rendered.emit(true);
          this.cdr.markForCheck();
        });
      }
    }
  }

  public updateParams(params?: HttpParams): void {
    this.params = params ?? new HttpParams();
  }

  public updateSort(sort?: TableSortDirection): void {
    this.sort = sort;
  }
}
