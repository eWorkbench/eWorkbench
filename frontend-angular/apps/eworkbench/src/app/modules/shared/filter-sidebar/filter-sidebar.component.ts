/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSidebarComponent {
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
}
