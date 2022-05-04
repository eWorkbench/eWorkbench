/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { isEqual } from 'lodash';

interface RecentChangesDirectoryStructure {
  name: string;
  directory: string | null;
  drive: string;
}

interface RecentChangesDirectoryStructureChanges {
  model: string;
  pk: string;
  fields: RecentChangesDirectoryStructure;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-directory-structure',
  templateUrl: './directory-structure.component.html',
  styleUrls: ['./directory-structure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesDirectoryStructureComponent implements OnInit {
  @Input()
  public oldValue!: string;

  @Input()
  public newValue!: string;

  public oldStructure: RecentChangesDirectoryStructure[] = [];

  public newStructure: RecentChangesDirectoryStructure[] = [];

  public constructor(private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    const oldValue: RecentChangesDirectoryStructureChanges[] = JSON.parse(this.oldValue);
    const newValue: RecentChangesDirectoryStructureChanges[] = JSON.parse(this.newValue);

    const oldFields = oldValue.map(change => change.fields);
    const newFields = newValue.map(change => change.fields);

    this.oldStructure = oldFields.filter((oldField: any) => !newFields.some((newField: any) => isEqual(oldField, newField)));

    this.newStructure = newFields.filter((newField: any) => !oldFields.some((oldField: any) => isEqual(newField, oldField)));

    this.cdr.markForCheck();
  }
}
