/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'eworkbench-overview-collapse-element',
  templateUrl: './overview-collapse-element.component.html',
  styleUrls: ['./overview-collapse-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewCollapseElementComponent {
  @Input()
  public collapsed = false;

  @Input()
  public collapsible = true;

  @Input()
  public background = true;

  @Input()
  public center = true;

  @Input()
  public primary = true;

  @Input()
  public border = true;

  @Input()
  public toggled = new EventEmitter<boolean>();

  public onToggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.toggled.emit(this.collapsed);
  }
}
