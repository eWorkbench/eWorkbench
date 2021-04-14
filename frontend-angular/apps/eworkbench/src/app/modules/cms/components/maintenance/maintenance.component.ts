/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CMSSettingsMaintenance } from '@app/stores/cms';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { User } from '@eworkbench/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceComponent implements OnInit {
  public maintenance: CMSSettingsMaintenance = { text: null, visible: false };

  public currentUser: User | null = null;

  public constructor(private readonly cmsService: CMSService, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.cmsService
      .maintenance()
      .pipe(untilDestroyed(this), take(1))
      .subscribe(
        /* istanbul ignore next */ maintenance => {
          this.maintenance = { ...maintenance };
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.cdr.markForCheck();
        }
      );
  }

  public onHide(event: Event): void {
    /* istanbul ignore next */
    event.preventDefault();
    this.hideMaintenanceMessage();
  }

  public hideMaintenanceMessage(): void {
    this.cmsService.set({ maintenance: { ...this.maintenance, visible: false } });
    this.initDetails();
  }
}
