/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { UserDetailsModalComponent } from '../modals/user-details/user-details.component';

@Component({
  selector: 'eworkbench-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsComponent {
  @Input()
  public user?: User;

  @Input()
  public active = true;

  @Input()
  public modal = true;

  public modalRef?: DialogRef;

  public constructor(private readonly modalService: DialogService) {}

  public onUserModal(event: Event): void {
    /* istanbul ignore next */
    event.preventDefault();

    /* istanbul ignore next */
    this.modalRef = this.modalService.open(UserDetailsModalComponent, {
      closeButton: false,
      data: {
        user: this.user,
      },
    });
  }
}
