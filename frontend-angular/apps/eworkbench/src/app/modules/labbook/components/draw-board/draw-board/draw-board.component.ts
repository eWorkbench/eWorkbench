/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, ViewChild } from '@angular/core';
import { LabBookElementEvent } from '@eworkbench/types';
import { UntilDestroy } from '@ngneat/until-destroy';
import { LabBookDrawBoardGridComponent } from '../grid/grid.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board',
  templateUrl: './draw-board.component.html',
  styleUrls: ['./draw-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardComponent {
  @ViewChild('drawBoardGrid', { static: true })
  public drawBoardGrid?: LabBookDrawBoardGridComponent;

  @Input()
  public id!: string;

  @Input()
  public projects: string[] = [];

  public created = new EventEmitter<LabBookElementEvent>();

  public refresh = new EventEmitter<boolean>();

  public onAddElement(event: LabBookElementEvent): void {
    this.created.next(event);
  }

  public onRefreshGrid(event: boolean): void {
    this.refresh.next(event);
  }
}
