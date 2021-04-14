/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input, TemplateRef } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-subdirectory-collapse-element',
  templateUrl: './subdirectory-collapse-element.component.html',
  styleUrls: ['./subdirectory-collapse-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubdirectoryCollapseElementComponent {
  @Input()
  public labelTemplate?: TemplateRef<any>;

  @Input()
  public element?: any;

  @Input()
  public collapsed = false;

  public onToggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }
}
