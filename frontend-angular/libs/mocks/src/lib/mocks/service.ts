/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { ExportLink, Privileges, PrivilegesApi, RecentChanges, Relation, Version } from '@eworkbench/types';
import { Observable, of } from 'rxjs';
import { mockGenericTableViewChildDataList, mockGenericTableViewDataList } from './data';
import { mockExportLink } from './export-link';
import { mockPrivileges } from './privileges';
import { mockPrivilegesApi } from './privileges-api';
import { mockRelationList } from './relations';

@Injectable({ providedIn: 'root' })
export class MockService {
  public getList(params?: HttpParams): Observable<{ total: number; data: any[] }> {
    return new Observable((observer: any) => {
      const eventCopy = { ...mockGenericTableViewDataList };

      if (params) {
        const offset = Number(params.get('offset') ?? 0);
        const limit = Number(params.get('limit') ?? 2);
        const data = eventCopy.results;
        eventCopy.results = data.slice(offset, offset + limit);
      }

      observer.next({ total: eventCopy.count, data: eventCopy.results });
      observer.complete();
    });
  }

  public getChildrenOf(_: string, params?: HttpParams): Observable<{ total: number; data: any[] }> {
    return new Observable((observer: any) => {
      const eventCopy = { ...mockGenericTableViewChildDataList };

      if (params) {
        const offset = Number(params.get('offset') ?? 0);
        const limit = Number(params.get('limit') ?? 2);
        const data = eventCopy.results;
        eventCopy.results = data.slice(offset, offset + limit);
      }

      observer.next({ total: eventCopy.count, data: eventCopy.results });
      observer.complete();
    });
  }

  public export(id: string): Observable<ExportLink> {
    if (!id) {
      return of([] as any);
    }

    return of(mockExportLink);
  }

  public delete(id: string): Observable<{ id: string }> {
    return of({ id });
  }

  public share(element: any): Observable<any> {
    return of({ element });
  }

  public history(): Observable<RecentChanges[]> {
    return of([]);
  }

  public restore(id: string): Observable<{ id: string }> {
    return of({ id });
  }

  public getPrivilegesList(): Observable<PrivilegesApi[]> {
    return of([mockPrivilegesApi]);
  }

  public getUserPrivileges(): Observable<Privileges> {
    return of(mockPrivileges);
  }

  public addUserPrivileges(): Observable<PrivilegesApi> {
    return of(mockPrivilegesApi);
  }

  public putUserPrivileges(): Observable<PrivilegesApi> {
    return of(mockPrivilegesApi);
  }

  public deleteUserPrivileges(): Observable<PrivilegesApi[]> {
    return of([mockPrivilegesApi]);
  }

  public versions(): Observable<Version[]> {
    return of([]);
  }

  public addVersion(): Observable<void> {
    return of([] as any);
  }

  public getRelations(): Observable<Relation[]> {
    return of(mockRelationList.results);
  }

  public deleteRelation(): Observable<void> {
    return of([] as any);
  }
}
