/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UserGroupsService } from '@app/services';
import type { UserGroup } from '@eworkbench/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-resource-usage-setting-user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesResourceUsageSettingUserGroupsComponent implements OnInit {
  @Input()
  public value!: string;

  public userGroup?: UserGroup;

  public constructor(private readonly userGroupsService: UserGroupsService, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.userGroupsService
      .get()
      .pipe(
        untilDestroyed(this),
        map(userGroups => userGroups.filter(userGroup => userGroup.pk === Number(this.value)))
      )
      .subscribe(userGroup => {
        if (userGroup.length) {
          this.userGroup = [...userGroup][0];
          this.cdr.markForCheck();
        }
      });
  }
}
