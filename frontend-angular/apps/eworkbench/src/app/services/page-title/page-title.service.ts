/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, isObservable, lastValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PageTitleService {
  public appTitle = 'eWorkbench';

  public title$ = new BehaviorSubject<string>('');

  public get(): Observable<string> {
    return this.title$.pipe(
      map((pageTitle: string) => {
        if (pageTitle) {
          return `${pageTitle} • ${this.appTitle}`;
        }

        return this.appTitle;
      })
    );
  }

  public async set(newTitle: string | Observable<any>): Promise<void> {
    if (isObservable(newTitle)) {
      const title = await lastValueFrom(newTitle);
      return this.title$.next(title);
    }

    return this.title$.next(newTitle);
  }
}
