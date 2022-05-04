/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AuthService } from '@app/services/auth/auth.service';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import type { RelationPayload, User } from '@eworkbench/types';
import { FormArray, FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, skip } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-search-content',
  templateUrl: './search-content.component.html',
  styleUrls: ['./search-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchContentComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('genericCheckboxTemplate', { static: true })
  public genericCheckboxTemplate!: TemplateRef<any>;

  @Input()
  public service!: any;

  @Input()
  public listColumns!: TableColumn[];

  @Input()
  public baseModel!: any;

  @Input()
  public formArray!: FormArray<RelationPayload>;

  @Input()
  public newContent?: EventEmitter<any>;

  @Output()
  public changed = new EventEmitter<boolean>();

  public allListColumns: TableColumn[] = [];

  public currentUser: User | null = null;

  public params = new HttpParams();

  public searchControl = this.fb.control<string | null>(null);

  public relations: RelationPayload[] = [];

  public selectedContent: string[] = [];

  public constructor(private readonly authService: AuthService, private readonly fb: FormBuilder) {}

  public ngOnInit(): void {
    this.newContent?.pipe(untilDestroyed(this)).subscribe(newContent => {
      this.tableView.loadData(false, this.params);
      this.onChangeSelection({ target: { checked: true } }, newContent);
    });

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      if (value) {
        this.params = this.params.delete('recently_modified_by_me');
        this.params = this.params.set('search', value);
      } else {
        if (this.currentUser?.pk) {
          this.params = this.params.set('recently_modified_by_me', this.currentUser.pk.toString());
        }
        this.params = this.params.delete('search');
      }
      this.tableView.loadData(false, this.params);
    });

    this.allListColumns = [
      {
        cellTemplate: this.genericCheckboxTemplate,
        name: '',
        key: 'select2',
        hideable: false,
      },
      ...this.listColumns,
    ];

    this.initDetails();
  }

  public initDetails(): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.params = this.params.set('recently_modified_by_me', this.currentUser.pk.toString());
  }

  public onChangeSelection(event: any, row: any): void {
    if (event.target.checked) {
      const relation: RelationPayload = {
        left_content_type: row.content_type,
        left_object_id: row.pk,
        right_content_type: this.baseModel.content_type,
        right_object_id: this.baseModel.pk,
        private: false,
      };

      this.selectedContent.push(row.pk);
      this.formArray.push(this.fb.control(relation) as any);
    } else {
      const index: number = this.selectedContent.indexOf(row.pk);
      if (index !== -1) {
        this.selectedContent.splice(index, 1);
      }
      this.formArray.removeAt(this.formArray.value.findIndex(relation => relation.left_object_id === row.pk));
    }
    this.changed.emit(true);
  }

  public isSelected(pk: string): boolean {
    if (this.selectedContent.some(item => item === pk)) {
      return true;
    }

    return false;
  }
}
