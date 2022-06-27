/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ProjectsService } from '@app/services';
import type { GanttChartItem } from '@eworkbench/gantt-chart';
import { TableColumn, TreeViewComponent } from '@eworkbench/table';
import type { Project } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-project-state-timeline',
  templateUrl: './project-state-timeline.component.html',
  styleUrls: ['./project-state-timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectStateTimelineComponent implements OnInit {
  @Input()
  public projectId!: string;

  @ViewChild('statesTreeView')
  public treeView!: TreeViewComponent;

  @ViewChild('nameCellTemplate', { static: true })
  public nameCellTemplate!: TemplateRef<any>;

  @ViewChild('progressCellTemplate', { static: true })
  public progressCellTemplate!: TemplateRef<any>;

  public loading = false;

  public statesListColumns: TableColumn[] = [];

  public rootProject?: Project;

  public treeData: Project[] = [];

  public params = new HttpParams();

  public ganttItems: GanttChartItem[] = [];

  public renderGantt = new EventEmitter<boolean>();

  public constructor(
    public readonly projectsService: ProjectsService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.params = this.params.set('recursive_parent', this.projectId);
    this.initTranslations();
    this.initDetails();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('projects.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.statesListColumns = [
          {
            cellTemplate: this.nameCellTemplate,
            name: column.name,
            key: 'name',
            width: '50%',
          },
          {
            cellTemplate: this.progressCellTemplate,
            name: column.progress,
            key: 'progress',
          },
        ];
      });
  }

  public initDetails(): void {
    this.loading = true;

    this.projectsService
      .get(this.projectId)
      .pipe(
        untilDestroyed(this),
        switchMap(project => {
          this.rootProject = project;
          this.rootProject.children = [];

          this.addGanttItem(project);

          return this.projectsService.getList(this.params);
        })
      )
      .subscribe(
        result => {
          const projects: Project[] = [...result.data];

          projects.forEach(project => {
            this.addGanttItem(project);

            if (project.parent_project === this.rootProject?.pk) {
              this.rootProject.children?.push(project);
              return;
            }

            const parentProject = projects.find(element => element.pk === project.parent_project);
            // eslint-disable-next-line no-negated-condition
            if (!parentProject) {
              this.rootProject?.children?.push(project);
            } else {
              if (!parentProject.children) {
                parentProject.children = [];
              }
              parentProject.children.push(project);
            }
          });
          this.treeData = [this.rootProject!];
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public addGanttItem(project: Project): void {
    this.ganttItems.push({
      name: project.name,
      startTime: project.start_date,
      endTime: project.stop_date,
      object: project,
    });
  }
}
