/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { isEqual } from 'lodash';

interface RecentChangesTaskBoardColumn {
  title: string;
  color: string;
  icon: string;
}

interface RecentChangesTaskBoardColumnChanges {
  model: string;
  pk: string;
  fields: RecentChangesTaskBoardColumn;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-task-board-columns',
  templateUrl: './task-board-columns.component.html',
  styleUrls: ['./task-board-columns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesTaskBoardColumnsComponent implements OnInit {
  @Input()
  public oldValue!: string;

  @Input()
  public newValue!: string;

  public oldStructure: RecentChangesTaskBoardColumn[] = [];

  public newStructure: RecentChangesTaskBoardColumn[] = [];

  public constructor(private readonly translocoService: TranslocoService, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    const oldValue: RecentChangesTaskBoardColumnChanges[] = this.oldValue ? JSON.parse(this.oldValue) : [];
    const newValue: RecentChangesTaskBoardColumnChanges[] = this.newValue ? JSON.parse(this.newValue) : [];

    const oldFields = oldValue.map(change => change.fields);
    const newFields = newValue.map(change => change.fields);

    this.oldStructure = oldFields.filter((oldField: any) => {
      return !newFields.some((newField: any) => {
        return isEqual(oldField, newField);
      });
    });

    this.newStructure = newFields.filter((newField: any) => {
      return !oldFields.some((oldField: any) => {
        return isEqual(newField, oldField);
      });
    });

    this.cdr.markForCheck();
  }
}
