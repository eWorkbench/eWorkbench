/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import type { User } from '@eworkbench/types';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesUsersComponent implements OnInit {
  @Input()
  public value!: string;

  @Input()
  public users: User[] = []; // Users from details

  public assignees: (User | undefined)[] = []; // Mixed array of mapped users from details and unknown users

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    const userIds: number[] = this.value.split(',').map(id => Number(id));
    this.assignees = userIds.map(id => {
      const user = this.users.filter(user => user.pk === id);
      return user.length ? user[0] : undefined;
    });

    /*
      // TODO: Needs endpoint to fetch a user by its id
      from(userIds)
        .pipe(
          mergeMap(pk =>
            this.userService.search(pk).pipe(
              untilDestroyed(this),
              catchError(() => {
                return of({ pk: Number(pk), name: this.translocoService.translate('formInput.unknownUser') } as any);
              })
            )
          ),
          map(user => {
            this.users = [...this.users, user];
          })
        )
        .subscribe();
    */
  }
}
