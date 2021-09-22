/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PrivilegesService } from '@app/services/privileges/privileges.service';
import { environment } from '@environments/environment';
import { TableViewService } from '@eworkbench/table';
import {
  DjangoAPI,
  ExportLink,
  ExportService,
  FinalizeVersion,
  LabBook,
  LabBookElement,
  LabBookElementPayload,
  LabBookPayload,
  LockService,
  PermissionsService,
  Privileges,
  PrivilegesApi,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
  Relation,
  RelationPayload,
  RelationPutPayload,
  Version,
  VersionsService,
} from '@eworkbench/types';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LabBooksService
  implements TableViewService, RecentChangesService, VersionsService<LabBook>, LockService, ExportService, PermissionsService
{
  public readonly apiUrl = `${environment.apiUrl}/labbooks/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: LabBook[] }> {
    return this.httpClient.get<DjangoAPI<LabBook[]>>(this.apiUrl, { params }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public search(search: string, params = new HttpParams()): Observable<LabBook[]> {
    const httpParams = params.set('search', search);

    return this.httpClient
      .get<DjangoAPI<LabBook[]>>(this.apiUrl, { params: httpParams })
      .pipe(map(/* istanbul ignore next */ data => data.results));
  }

  public add(labbook: LabBookPayload): Observable<LabBook> {
    return this.httpClient.post<LabBook>(this.apiUrl, labbook);
  }

  public get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<LabBook>> {
    return this.httpClient.get<LabBook>(`${this.apiUrl}${id}/`, { params }).pipe(
      switchMap(
        /* istanbul ignore next */ labBook =>
          this.getUserPrivileges(id, userId, labBook.deleted).pipe(
            map(privileges => {
              const privilegesData: PrivilegesData<LabBook> = {
                privileges,
                data: labBook,
              };
              return privilegesData;
            })
          )
      )
    );
  }

  public getPrivilegesList(id: string): Observable<PrivilegesApi[]> {
    return this.httpClient.get<PrivilegesApi[]>(`${this.apiUrl}${id}/privileges/`);
  }

  public getUserPrivileges(id: string, userId: number, deleted: boolean): Observable<Privileges> {
    return this.httpClient
      .get<PrivilegesApi>(`${this.apiUrl}${id}/privileges/${userId}/`)
      .pipe(map(/* istanbul ignore next */ privileges => this.privilegesService.transform(privileges, deleted)));
  }

  public addUserPrivileges(id: string, userId: number): Observable<PrivilegesApi> {
    return this.httpClient.post<PrivilegesApi>(
      `${this.apiUrl}${id}/privileges/`,
      {
        user_pk: userId,
        view_privilege: 'AL',
      },
      {
        params: new HttpParams().set('pk', userId.toString()),
      }
    );
  }

  public putUserPrivileges(id: string, userId: number, privileges: PrivilegesApi): Observable<PrivilegesApi> {
    return this.httpClient.put<PrivilegesApi>(`${this.apiUrl}${id}/privileges/${userId}/`, privileges);
  }

  public deleteUserPrivileges(id: string, userId: number): Observable<PrivilegesApi[]> {
    return this.httpClient
      .delete(`${this.apiUrl}${id}/privileges/${userId}/`)
      .pipe(switchMap(/* istanbul ignore next */ () => this.getPrivilegesList(id)));
  }

  public delete(id: string): Observable<LabBook> {
    return this.httpClient.patch<LabBook>(`${this.apiUrl}${id}/soft_delete/`, { pk: id });
  }

  public patch(id: string, labbook: LabBookPayload): Observable<LabBook> {
    return this.httpClient.patch<LabBook>(`${this.apiUrl}${id}/`, labbook);
  }

  public restore(id: string): Observable<LabBook> {
    return this.httpClient.patch<LabBook>(`${this.apiUrl}${id}/restore/`, { pk: id });
  }

  public getElements(id: string, section?: string): Observable<LabBookElement<any>[]> {
    if (section) {
      return this.httpClient.get<LabBookElement<any>[]>(`${this.apiUrl}${id}/elements/?section=${section}`);
    }
    return this.httpClient.get<LabBookElement<any>[]>(`${this.apiUrl}${id}/elements/`);
  }

  public getElement(labBookId: string, id: string): Observable<LabBookElement<any>> {
    return this.httpClient.get<LabBookElement<any>>(`${this.apiUrl}${labBookId}/elements/${id}/`);
  }

  public addElement(id: string, element: LabBookElementPayload): Observable<LabBookElement<any>> {
    return this.httpClient.post<LabBookElement<any>>(`${this.apiUrl}${id}/elements/`, element);
  }

  public patchElement(id: string, elementId: string, element: LabBookElementPayload): Observable<LabBookElement<any>> {
    return this.httpClient.patch<LabBookElement<any>>(`${this.apiUrl}${id}/elements/${elementId}/`, element);
  }

  public deleteElement(id: string, elementId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/elements/${elementId}/`);
  }

  public updateAllElements(id: string, elements: LabBookElementPayload[]): Observable<string[]> {
    return this.httpClient.put<string[]>(`${this.apiUrl}${id}/elements/update_all/`, elements);
  }

  public history(id: string, params = new HttpParams()): Observable<RecentChanges[]> {
    return this.httpClient
      .get<DjangoAPI<RecentChanges[]>>(`${this.apiUrl}${id}/history/`, { params })
      .pipe(map(/* istanbul ignore next */ data => data.results));
  }

  public versions(id: string, params = new HttpParams()): Observable<Version[]> {
    return this.httpClient
      .get<DjangoAPI<Version[]>>(`${this.apiUrl}${id}/versions/`, { params })
      .pipe(map(/* istanbul ignore next */ data => data.results));
  }

  // TODO: needs proper interface for return type, maybe with a generic?
  public previewVersion(id: string, version: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/versions/${version}/preview/`);
  }

  public addVersion(id: string, version?: FinalizeVersion): Observable<LabBook> {
    return this.httpClient.post<LabBook>(`${this.apiUrl}${id}/versions/`, version);
  }

  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<LabBook> {
    if (versionInProgress) {
      return this.addVersion(id).pipe(
        switchMap(
          /* istanbul ignore next */ () => {
            return this.httpClient.post<LabBook>(`${this.apiUrl}${id}/versions/${version}/restore/`, { pk: id });
          }
        )
      );
    }

    return this.httpClient.post<LabBook>(`${this.apiUrl}${id}/versions/${version}/restore/`, { pk: id });
  }

  public lock(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}${id}/lock/`, undefined, { params });
  }

  public unlock(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}${id}/unlock/`, undefined, { params });
  }

  public export(id: string): Observable<ExportLink> {
    return this.httpClient.get<ExportLink>(`${this.apiUrl}${id}/get_export_link/`);
  }

  public getRelations(id: string, params = new HttpParams()): Observable<{ total: number; data: Relation[] }> {
    return this.httpClient.get<DjangoAPI<Relation[]>>(`${this.apiUrl}${id}/relations/`, { params }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public addRelation(id: string, payload: RelationPayload): Observable<Relation> {
    return this.httpClient.post<Relation>(`${this.apiUrl}${id}/relations/`, payload);
  }

  public putRelation(id: string, relationId: string, payload: RelationPutPayload): Observable<Relation> {
    return this.httpClient.put<Relation>(`${this.apiUrl}${id}/relations/${relationId}/`, payload);
  }

  public deleteRelation(id: string, relationId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/relations/${relationId}/`);
  }
}
