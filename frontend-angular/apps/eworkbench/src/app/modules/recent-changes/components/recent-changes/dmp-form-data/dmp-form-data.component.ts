/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

interface RecentChangesDMPFormData {
  name: string;
  value: string;
}

interface RecentChangesDMPFormDataChanges {
  model: string;
  pk: string;
  fields: RecentChangesDMPFormData;
}

interface RecentChangesDMPFormDataChangeSet {
  name: string;
  oldValue: string;
  newValue: string;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-dmp-form-data',
  templateUrl: './dmp-form-data.component.html',
  styleUrls: ['./dmp-form-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesDMPFormDataComponent implements OnInit {
  @Input()
  public oldValue!: string;

  @Input()
  public newValue!: string;

  public changeSet: RecentChangesDMPFormDataChangeSet[] = [];

  public constructor(private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    const oldValue: RecentChangesDMPFormDataChanges[] | null = JSON.parse(this.oldValue);
    const newValue: RecentChangesDMPFormDataChanges[] | null = JSON.parse(this.newValue);

    if (!oldValue?.length || !newValue?.length) {
      return;
    }

    const oldFields = oldValue.map(change => change.fields);
    const newFields = newValue.map(change => change.fields);

    const changeSet: RecentChangesDMPFormDataChangeSet[] = [];
    for (let index = 0; index < oldFields.length; index++) {
      const oldField = { ...oldFields[index] };
      const newField = { ...newFields[index] };

      if (oldField.value !== newField.value) {
        changeSet.push({
          name: oldField.name,
          oldValue: oldField.value,
          newValue: newField.value,
        });
      }
    }
    this.changeSet = [...changeSet];

    this.cdr.markForCheck();
  }
}
