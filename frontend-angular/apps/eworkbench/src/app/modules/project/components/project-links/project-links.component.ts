/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectsService } from '@app/services';
import { TableColumn } from '@eworkbench/table';
import { ModalCallback, ProjectRelation } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-project-links',
  templateUrl: './project-links.component.html',
  styleUrls: ['./project-links.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectLinksComponent implements OnInit {
  @Input()
  public id!: string;

  @ViewChild('nameCellTemplate', { static: true })
  public nameCellTemplate!: TemplateRef<any>;

  @ViewChild('setByCellTemplate', { static: true })
  public setByCellTemplate!: TemplateRef<any>;

  @ViewChild('setAtCellTemplate', { static: true })
  public setAtCellTemplate!: TemplateRef<any>;

  public listColumns!: TableColumn[];

  public data: ProjectRelation[] = [];

  public loading = false;

  public modalRef?: DialogRef;

  public constructor(
    private readonly router: Router,
    private readonly projectService: ProjectsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.listColumns = [
      {
        cellTemplate: this.nameCellTemplate,
        name: 'Title',
        key: 'title',
      },
      {
        cellTemplate: this.setByCellTemplate,
        name: 'Set by',
        key: 'set_by',
      },
      {
        cellTemplate: this.setAtCellTemplate,
        name: 'Set at',
        key: 'set_at',
      },
      {
        name: 'Private',
        key: 'private',
      },
      {
        name: 'Unlink',
        key: 'unlink',
      },
    ];

    this.loading = true;

    this.initLinks();
  }

  public initLinks(): void {
    this.projectService
      .getRelations(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ links => {
          this.loading = false;
          this.data = [...links];
          /* this.data = links.filter((link: any) => link.left_content_type_model !== 'shared_elements.note'); */
          this.cdr.markForCheck();
        }
      );
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.initLinks();
    }
  }
}
