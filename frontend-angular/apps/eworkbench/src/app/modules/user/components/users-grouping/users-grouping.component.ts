/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { User } from '@eworkbench/types';
import { DialogService } from '@ngneat/dialog';
import { UsersListModalComponent } from '../modals/users-list/users-list.component';

@Component({
  selector: 'eworkbench-users-grouping',
  templateUrl: './users-grouping.component.html',
  styleUrls: ['./users-grouping.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersGroupingComponent {
  @Input()
  public users: User[] = [];

  public constructor(private readonly modalService: DialogService) {}

  public onOpenMoreModal(): void {
    /* istanbul ignore next */
    this.modalService.open(UsersListModalComponent, { closeButton: false, data: { users: this.users } });
  }
}
