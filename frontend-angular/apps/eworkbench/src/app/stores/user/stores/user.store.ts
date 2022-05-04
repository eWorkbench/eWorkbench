/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import type { User } from '@eworkbench/types';

export interface UserState {
  user: User | null;
  token: string | null;
  loggedIn: boolean;
}

export function createInitialState(): UserState {
  return { user: null, token: null, loggedIn: false };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'user' })
export class UserStore extends Store<UserState> {
  public constructor() {
    super(createInitialState());
  }
}
