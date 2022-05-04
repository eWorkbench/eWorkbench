/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { LabelsService } from '@app/services';
import type { Label } from '@eworkbench/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-labels',
  templateUrl: './labels.component.html',
  styleUrls: ['./labels.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesLabelsComponent implements OnInit {
  @Input()
  public value!: string;

  public labels: Label[] = [];

  public constructor(private readonly labelsService: LabelsService, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    const labelIds: string[] = this.value.split(',');
    this.labelsService
      .get()
      .pipe(
        untilDestroyed(this),
        map(labels => {
          labelIds.forEach(label => {
            labels.forEach(apiLabel => {
              if (label === apiLabel.pk) {
                if (this.labels.length) {
                  this.labels = [...this.labels, apiLabel];
                  this.cdr.markForCheck();
                } else {
                  this.labels = [apiLabel];
                  this.cdr.markForCheck();
                }
              }
            });
          });
        })
      )
      .subscribe();
  }
}
