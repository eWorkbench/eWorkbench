/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Project } from '@eworkbench/types';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-project-progress-bar',
  templateUrl: './project-progress-bar.component.html',
  styleUrls: ['./project-progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectProgressBarComponent {
  @Input()
  public project!: Project;

  public get progressbarValues(): Record<string, string> {
    return {
      DONE: this.getPercentage(this.project.tasks_status.DONE),
      PROG: this.getPercentage(this.project.tasks_status.PROG),
      NEW: this.getPercentage(this.project.tasks_status.NEW),
    };
  }

  public getTotalTasks(): number {
    return this.project.tasks_status.NEW + this.project.tasks_status.PROG + this.project.tasks_status.DONE;
  }

  public getPercentage(taskStatus: number): string {
    return `${((taskStatus / this.getTotalTasks()) * 100).toFixed(1).toString()}%`;
  }
}
