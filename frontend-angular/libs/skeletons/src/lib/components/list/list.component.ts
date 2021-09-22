/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'eworkbench-list-skeleton',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListSkeletonComponent implements OnInit {
  @Input()
  public lines = 10;

  @Input()
  public header = false;

  @Input()
  public collapseHeader = false;

  public items: number[] = [];

  public ngOnInit(): void {
    this.items = Array(this.lines).fill(1);
  }
}
