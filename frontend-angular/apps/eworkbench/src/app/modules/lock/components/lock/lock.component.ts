/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { formatDistanceToNowStrict } from 'date-fns';

@UntilDestroy()
@Component({
  selector: 'eworkbench-lock',
  templateUrl: './lock.component.html',
  styleUrls: ['./lock.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LockComponent {
  @Input()
  public id!: string;

  @Input()
  public lock: any;

  @Input()
  public lockUser!: any;

  @Input()
  public service!: any;

  @Input()
  public modified = false;

  public constructor(public readonly translocoService: TranslocoService, private readonly router: Router) {}

  public get lockedUntil() {
    return formatDistanceToNowStrict(new Date(this.lock.lock_details.locked_until), {
      addSuffix: true,
      unit: 'minute',
    });
  }

  public releaseLock(event?: Event): void {
    event?.preventDefault();
    this.service.unlock(this.id).pipe(untilDestroyed(this)).subscribe();
  }

  public refresh(event?: Event): void {
    event?.preventDefault();
    void this.router.navigate([this.router.url]);
  }
}
