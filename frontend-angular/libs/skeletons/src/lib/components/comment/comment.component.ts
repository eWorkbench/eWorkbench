/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'eworkbench-comment-skeleton',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentSkeletonComponent implements OnInit {
  @Input()
  public fields = 5;

  @Input()
  public header = false;

  public items: number[] = [];

  public ngOnInit(): void {
    this.items = Array(this.fields).fill(1);
  }
}
