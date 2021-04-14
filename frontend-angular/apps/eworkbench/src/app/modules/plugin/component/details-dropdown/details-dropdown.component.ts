/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PluginDetails } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-plugin-details-dropdown',
  templateUrl: './details-dropdown.component.html',
  styleUrls: ['./details-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginDetailsDropdownComponent implements OnInit {
  @Input()
  public plugin!: PluginDetails;

  @Output()
  public selected = new EventEmitter<{ type: string; id: string }>();

  public modalRef?: DialogRef;

  public dropdown = true;

  public detailsCollapsed = true;

  public constructor(
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly breakpointObserver: BreakpointObserver
  ) {}

  public ngOnInit(): void {
    this.breakpointObserver
      .observe(['(min-width: 769px)'])
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        /* istanbul ignore if */
        if (res.matches) {
          this.dropdown = true;
          this.detailsCollapsed = true;
          this.cdr.markForCheck();
          return;
        }
        this.dropdown = false;
        this.cdr.markForCheck();
      });
  }

  public onGiveFeedback(): void {
    this.selected.emit({ type: 'feedback', id: this.plugin.pk });
  }

  public onRequestAccess(): void {
    this.selected.emit({ type: 'request_access', id: this.plugin.pk });
  }
}
