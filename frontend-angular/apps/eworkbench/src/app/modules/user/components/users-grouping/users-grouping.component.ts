/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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

  @Input()
  public modal = true;

  @Input()
  public chip = false;

  @Input()
  public inverted = false;

  public constructor(private readonly modalService: DialogService) {}

  public onOpenMoreModal(event?: Event): void {
    /* istanbul ignore next */
    event?.preventDefault();
    this.modalService.open(UsersListModalComponent, { closeButton: false, data: { users: this.users } });
  }
}
