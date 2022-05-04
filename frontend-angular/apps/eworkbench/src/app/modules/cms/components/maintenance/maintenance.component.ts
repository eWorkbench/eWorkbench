/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import type { CMSSettingsMaintenance } from '@app/stores/cms';
import { CMSService } from '@app/stores/cms/services/cms.service';
import type { User } from '@eworkbench/types';
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
        maintenance => {
          const visible = !Boolean(localStorage.getItem('hideMaintenance')) && maintenance.visible;

          this.maintenance = { ...maintenance, visible };
          this.cmsService.set({ maintenance: this.maintenance });
          this.cdr.markForCheck();
        },
        () => {
          this.cdr.markForCheck();
        }
      );
  }

  public onHide(event: Event): void {
    event.preventDefault();
    this.hideMaintenanceMessage();
  }

  public hideMaintenanceMessage(): void {
    localStorage.setItem('hideMaintenance', 'true');
    this.cmsService.set({ maintenance: { ...this.maintenance, visible: false } });
    this.initDetails();
  }
}
