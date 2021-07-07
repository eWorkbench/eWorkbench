/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { difference } from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TableSortDirection } from '../../enums/table-sort-direction.enum';
import { TableColumn } from '../../interfaces/table-column.interface';
import { TableSortChangedEvent } from '../../interfaces/table-sort-changed-event.interface';

@Component({
  selector: 'eworkbench-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public data: any[] = [];

  @Input()
  public pagination = true;

  @Input()
  public paginationSize = 20;

  @Input()
  public sortBy = 'name';

  @Input()
  public sort = TableSortDirection.Descending;

  @Input()
  public columns: TableColumn[] = [];

  @Input()
  public columnHeader = true;

  @Input()
  public service: any;

  @Input()
  public params?: HttpParams;

  @Input()
  public orderByField = 'ordering';

  @Input()
  public offsetField = 'offset';

  @Input()
  public perPageField = 'limit';

  @Input()
  public expandKey = 'name';

  @Input()
  public rowHover = true;

  @Input()
  public expandable = true;

  @Input()
  public skeletonLines = 20;

  public skeletonItems: number[] = [];

  public displayedColumns$ = new BehaviorSubject<string[]>([]);

  public dataSource$ = new BehaviorSubject<any>([]);

  public total = 0;

  public page = 1;

  public expanded = new Set<string>();

  public loading = false;

  public loadingMore = false;

  public firstDataLoaded = false;

  private serviceSubscription?: Subscription;

  private expandServiceSubscription?: Subscription;

  public constructor(private readonly cdr: ChangeDetectorRef) {}

  public get orderByDirection(): string | null {
    switch (this.sort) {
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
      this.loadData();
    } else {
      this.data.forEach(d => {
        d.expanded = false;
        d.level = 0;
      });
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
      this.displayedColumns$.next(columns);
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (changes.data) {
      if (!this.service) {
        if (changes.data.currentValue) {
          this.data.forEach(d => {
            d.expanded = false;
            d.level = 0;
          });
          const slice = changes.data.currentValue.slice(this.offset, this.page * this.paginationSize);
          this.total = changes.data.currentValue.length;
          this.dataSource$.next(slice);
        }
      }
    }
  }

  public ngOnDestroy(): void {
    this.serviceSubscription?.unsubscribe();
    this.expandServiceSubscription?.unsubscribe();
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
  }

  public onExpandChange(data: any): void {
    if (data.expanded) {
      /* this.data = this.data.filter((item: any) => item.pk === data.pk || item.level <= Number(data.level)); */
      this.data = difference(this.data, this.removeChildren(data));
      data.expanded = false;
      this.dataSource$.next(this.data);
      this.cdr.markForCheck();
    } else if (this.service) {
      let params = new HttpParams();
      if (this.orderByDirection !== null) {
        params = params.set(this.orderByField, `${this.orderByDirection}${this.sortBy}`);
      }

      this.expandServiceSubscription = this.service.getChildrenOf(data.pk, params).subscribe((event: any) => {
        for (const d of event.data) {
          const exists = this.data.find((item: any) => item.pk === d.pk);
          if (exists) {
            continue;
          }
          d.level = (data.level as number) + 1;
          const idx = this.data.findIndex((item: any) => item.pk === data.pk);
          this.data.splice(idx + 1, 0, d);
        }
        data.children = event.data;
        data.expanded = true;
        this.dataSource$.next(this.data);
        this.cdr.markForCheck();
      });
    } else {
      for (const d of data.children) {
        const exists = this.data.find((item: any) => item.pk === d.pk);
        if (exists) {
          continue;
        }
        d.level = (data.level as number) + 1;
        d.expanded = false;
        const idx = this.data.findIndex((item: any) => item.pk === data.pk);
        this.data.splice(idx + 1, 0, d);
      }
      data.expanded = true;
      this.dataSource$.next(this.data);
      this.cdr.markForCheck();
    }
  }

  public removeChildren(item: any, res: any[] = []): any[] {
    if (!item.children || item.children.length === 0) return res;
    if (this.service) {
      const top = item.children.shift();
      if (!top) return res;
      if (top.pk !== item.pk || top.level >= Number(item.level)) {
        res.push(top);
      }
      if (top.children?.length) {
        res = this.removeChildren(top, res);
      }
      return this.removeChildren(item, res);
    }
    for (const child of item.children) {
      res = this.removeChildren(child, res);
    }
    res = [...res, ...item.children];
    return res;
  }

  public hasRelation(data: any): boolean {
    if (data.project_tree.length) {
      return Boolean(data.project_tree.find((item: any) => item.parent_project === data.pk));
    }
    return false;
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
        params = params.set(this.orderByField, `${this.orderByDirection}${this.sortBy}`);
      }

      this.serviceSubscription = this.service.getList(params).subscribe((event: any) => {
        if (append) {
          this.data = [...this.data, ...event.data];
        } else {
          this.data = event.data;
        }
        this.total = event.total;

        this.data.forEach(d => {
          d.children = [];
          d.expanded = false;
          d.level = 0;
        });

        this.loading = false;
        this.loadingMore = false;
        this.firstDataLoaded = true;
        this.dataSource$.next(this.data);
        this.cdr.markForCheck();
      });
    }
  }
}
