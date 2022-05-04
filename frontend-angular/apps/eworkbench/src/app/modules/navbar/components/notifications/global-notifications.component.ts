/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NotificationsModalComponent } from '@app/modules/notification/components/modals/notifications/notifications.component';
import { NotificationsService } from '@app/services/notifications/notifications.service';
import type { Notification } from '@eworkbench/types';
import { DialogService } from '@ngneat/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-global-notifications',
  templateUrl: './global-notifications.component.html',
  styleUrls: ['./global-notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalNotificationsComponent implements OnInit {
  public constructor(
    public readonly notificationService: NotificationsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService
  ) {}

  public unreadNotifications: Notification[] = [];

  public oldNotifications: Notification[] = [];

  public ngOnInit(): void {
    this.initNotifications();
  }

  public initNotifications(): void {
    this.notificationService
      .getList(new HttpParams().set('ordering', '-created_at').set('limit', '10'))
      .pipe(untilDestroyed(this))
      .subscribe(notifications => {
        this.unreadNotifications = notifications.data.filter(notif => !notif.read);
        this.oldNotifications = notifications.data.filter(notif => notif.read);

        this.cdr.markForCheck();
      });
  }

  public onRead(notification: Notification): void {
    notification.read = true;
    this.notificationService
      .read(notification.pk)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.initNotifications());
  }

  public onOpenNotificationsModal(): void {
    this.modalService.open(NotificationsModalComponent, {
      closeButton: false,
      width: '1200px',
    });
  }

  public onReadAll(): void {
    this.notificationService
      .readAll()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.initNotifications());
  }
}
