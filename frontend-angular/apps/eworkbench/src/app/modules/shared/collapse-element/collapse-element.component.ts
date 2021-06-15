/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, TemplateRef } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-collapse-element',
  templateUrl: './collapse-element.component.html',
  styleUrls: ['./collapse-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapseElementComponent {
  @Input()
  public labelText?: string;

  @Input()
  public labelTemplate?: TemplateRef<any>;

  @Input()
  public element?: any;

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
