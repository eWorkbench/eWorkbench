/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'eworkbench-wysiwyg-skeleton',
  templateUrl: './wysiwyg.component.html',
  styleUrls: ['./wysiwyg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WysiwygSkeletonComponent {
  @Input()
  public header = false;
}
