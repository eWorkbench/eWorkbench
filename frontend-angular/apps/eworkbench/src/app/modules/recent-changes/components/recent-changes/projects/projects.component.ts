/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ProjectsService } from '@app/services';
import type { Project } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesProjectsComponent implements OnInit {
  @Input()
  public value!: string;

  public projects: Project[] = [];

  public constructor(
    private readonly projectsService: ProjectsService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    const projectIds: string[] = this.value.split(',');
    from(projectIds)
      .pipe(
        mergeMap(id =>
          this.projectsService.get(id).pipe(
            untilDestroyed(this),
            catchError(() => of({ pk: id, display: this.translocoService.translate('formInput.unknownProject') } as Project))
          )
        ),
        map(project => {
          this.projects = [...this.projects, project];
          this.cdr.markForCheck();
        })
      )
      .subscribe();
  }
}
