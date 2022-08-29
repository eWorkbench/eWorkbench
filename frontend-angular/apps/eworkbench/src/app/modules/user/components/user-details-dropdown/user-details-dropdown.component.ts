/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { User } from '@eworkbench/types';

@Component({
  selector: 'eworkbench-user-details-dropdown',
  templateUrl: './user-details-dropdown.component.html',
  styleUrls: ['./user-details-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsDropdownComponent {
  @Input()
  public user?: User;

  @Input()
  public avatar = true;

  @Input()
  public avatarScale = 1.6;

  @Input()
  public set search(value: string) {
    this.searchTerms = value.split(' ');
  }

  public searchTerms: string[] = [];
}
