/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { NotificationsService } from '@app/services/notifications/notifications.service';
import type { Notification } from '@eworkbench/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-notification-element',
  templateUrl: './notification-element.component.html',
  styleUrls: ['./notification-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationElementComponent {
  @ViewChild('collapseLabelTemplate', { static: true })
  public collapseLabelTemplate!: TemplateRef<any>;

  @Input()
  public notification!: Notification;

  @Input()
  public collapsed = true;

  public constructor(public readonly notificationService: NotificationsService, private readonly cdr: ChangeDetectorRef) {}

  public onRead(notification: Notification): void {
    notification.read = true;
    this.notificationService
      .read(notification.pk)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.cdr.markForCheck());
  }
}
