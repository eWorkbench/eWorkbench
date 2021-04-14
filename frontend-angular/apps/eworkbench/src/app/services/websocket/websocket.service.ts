/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { UserService } from '@app/stores/user';
import { environment } from '@environments/environment';
import { WebSocketElementPayload } from '@eworkbench/types';
import { Subject } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  public notifications = new Subject();

  public elements = new Subject();

  public notificationsConnection = webSocket(`${environment.wsUrl}/notifications/`);

  public elementsConnection = webSocket(`${environment.wsUrl}/elements/`);

  public subscribedElements: WebSocketElementPayload[] = [];

  public constructor(private readonly userService: UserService) {}

  public connect(): void {
    this.notificationsConnection.subscribe({ next: msg => this.notifications.next(msg) });
    this.elementsConnection.subscribe({ next: msg => this.elements.next(msg) });

    this.userService.get$.subscribe(({ user, token }) => {
      if (user) {
        this.notificationsConnection.next({ authorization: token });
        this.elementsConnection.next({ authorization: token });
      }
    });
  }

  public subscribe(elements: WebSocketElementPayload[]): void {
    for (const element of elements) {
      this.subscribedElements = [...this.subscribedElements, element];
      this.elementsConnection.next({ action: 'subscribe', model_name: element.model, model_pk: element.pk });
    }
  }

  public unsubscribe(): void {
    for (const element of this.subscribedElements) {
      this.elementsConnection.next({ action: 'unsubscribe', model_name: element.model, model_pk: element.pk });
    }
    this.subscribedElements = [];
  }
}
