/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { TaskChecklist } from '@eworkbench/types';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy } from '@ngneat/until-destroy';

interface RecentChangesTaskChecklist {
  model: string;
  pk: string;
  fields: TaskChecklist;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-task-checklist',
  templateUrl: './task-checklist.component.html',
  styleUrls: ['./task-checklist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesTaskChecklistComponent implements OnInit {
  @Input()
  public value!: string;

  public checklistControl = this.fb.control<TaskChecklist[]>([]);

  public constructor(private readonly fb: FormBuilder, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.patchFormValues();
  }

  public patchFormValues(): void {
    const valueList: RecentChangesTaskChecklist[] = JSON.parse(this.value);
    const checkboxes: TaskChecklist[] = valueList.map(data => data.fields);
    this.checklistControl.patchValue(checkboxes);
    this.checklistControl.disable();
  }
}
