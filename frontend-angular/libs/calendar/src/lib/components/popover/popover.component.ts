/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PopoverDirective } from 'ngx-bootstrap/popover';

@UntilDestroy()
@Component({
  selector: 'eworkbench-calendar-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPopoverWrapperComponent {
  @ViewChild(PopoverDirective, { static: true })
  public popover!: PopoverDirective;

  public template?: TemplateRef<any>;
}
