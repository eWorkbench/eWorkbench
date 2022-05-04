/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, isDevMode, OnInit } from '@angular/core';
import { environment } from '@environments/environment';
import { MatomoInjector } from 'ngx-matomo-v9';
import { WebSocketService } from './services';

@Component({
  selector: 'eworkbench-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public constructor(private readonly websocketService: WebSocketService, private readonly matomoInjector: MatomoInjector) {}

  public ngOnInit(): void {
    this.websocketService.connect();

    if (!isDevMode() && environment.tracking) {
      this.matomoInjector.init(environment.matomoUrl as unknown as string, environment.matomoId as unknown as number);
    }
  }
}
