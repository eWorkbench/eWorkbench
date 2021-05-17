/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormatContentTypeModelPipe } from '@app/modules/shared/pipes/content-type-model/content-type-model.pipe';
import { NotificationsService } from '@app/services/notifications/notifications.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-notification-page',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormatContentTypeModelPipe],
})
export class NotificationPageComponent implements OnInit {
  public title = '';

  public id = this.route.snapshot.paramMap.get('id')!;

  public loading = false;

  public constructor(
    private readonly notificationsService: NotificationsService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly formatContentTypeModel: FormatContentTypeModelPipe
  ) {}

  public ngOnInit(): void {
    this.notificationsService
      .get(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        notification => {
          const routerBaseLink = this.formatContentTypeModel.transform(notification.content_type_model, 'routerBaseLink');
          this.router.navigate([routerBaseLink, notification.object_id]);
        },
        (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.router.navigate(['/not-found']);
          } else {
            this.router.navigate(['/']);
          }
        }
      );
  }
}
