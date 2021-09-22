/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommentsState } from '@app/enums/comments-state.enum';
import { SitePreferencesService } from '@app/services';
import { TableColumn, TableSortDirection, TableViewComponent } from '@eworkbench/table';
import { DropdownElement, SitePreferences } from '@eworkbench/types';
import { FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent implements OnInit {
  @Input()
  public service!: any;

  @Input()
  public id!: string;

  @Input()
  public contentType!: string;

  @Input()
  public create = false;

  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('containerCellTemplate', { static: true })
  public containerCellTemplate!: TemplateRef<any>;

  public params = new HttpParams();

  public listColumns: TableColumn[] = [];

  public dropdownStates: DropdownElement[] = [];

  public dropdownStateControl = new FormControl(CommentsState.All);

  public dropdownSortControl = new FormControl(TableSortDirection.Descending);

  public sort = TableSortDirection.Descending;

  public sortBy = 'created_at';

  public initialLoading = true;

  public constructor(
    private readonly sitePreferencesService: SitePreferencesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
    this.initSitePreferences();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('comments.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.containerCellTemplate,
            name: column.title,
            key: 'title',
            hideable: false,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('comments.state')
      .pipe(untilDestroyed(this))
      .subscribe(states => {
        this.dropdownStates = [
          {
            value: CommentsState.All,
            label: states.all,
          },
          {
            value: CommentsState.Public,
            label: states.public,
          },
          {
            value: CommentsState.Private,
            label: states.private,
          },
        ];
      });
  }

  public initSitePreferences(): void {
    this.sitePreferencesService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (preferences: SitePreferences) => {
          this.params = this.params.set('with_content_type', preferences.content_types['shared_elements.comment']);
          this.initialLoading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public loadComments(): void {
    this.tableView.loadData();
  }

  public onChangeState(element: DropdownElement): void {
    switch (element.value) {
      case CommentsState.Public:
        this.params = this.params.set('private', false);
        this.tableView.updateParams(this.params);
        this.tableView.loadData();
        break;
      case CommentsState.Private:
        this.params = this.params.set('private', true);
        this.tableView.updateParams(this.params);
        this.tableView.loadData();
        break;
      default:
        this.params = this.params.delete('private');
        this.tableView.updateParams(this.params);
        this.tableView.loadData();
        break;
    }
  }

  public onChangeSort(element: number): void {
    this.sort = element;
    this.tableView.updateSort(element);
    this.tableView.loadData();
    this.cdr.markForCheck();
  }
}
