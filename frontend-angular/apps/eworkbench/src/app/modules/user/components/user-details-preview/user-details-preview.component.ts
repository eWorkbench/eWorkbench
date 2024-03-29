/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { User } from '@eworkbench/types';

@Component({
  selector: 'eworkbench-user-details-preview',
  templateUrl: './user-details-preview.component.html',
  styleUrls: ['./user-details-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsPreviewModalComponent {
  @Input()
  public user!: User;
}
