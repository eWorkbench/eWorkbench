/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { User } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'eworkbench-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
  @Input()
  public user?: User;

  @Input()
  public chip = false;

  @Input()
  public inverted = false;

  @Input()
  public ring = false;

  @Input()
  public scale = 1;

  private readonly baseSize = 25;

  public constructor(private readonly translocoService: TranslocoService) {}

  public get margin(): number {
    return this.scale === 1 ? 0 : (this.baseSize * this.scale - this.baseSize) / 2;
  }

  public getFirstLetter(text: string | null): string {
    return text ? text.slice(0, 1) : '';
  }
}
