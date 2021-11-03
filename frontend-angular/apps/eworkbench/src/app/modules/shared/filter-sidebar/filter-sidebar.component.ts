/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSidebarComponent implements OnInit {
  @Input()
  public open = false;

  @Input()
  public activeFilters = false;

  @Input()
  public savedFilters = false;

  @Input()
  public miniTop = false;

  @Input()
  public rememberFilters = true;

  @Output()
  public resetFilters = new EventEmitter<boolean>();

  @Output()
  public saveFilters = new EventEmitter<boolean>();

  public cmsMessageShown = false;

  public constructor(private readonly cmsService: CMSService, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.cmsService.get$.pipe(untilDestroyed(this)).subscribe(({ maintenance }) => {
      console.log(maintenance);
      this.cmsMessageShown = maintenance.visible;
      this.cdr.markForCheck();
    });
  }
}
