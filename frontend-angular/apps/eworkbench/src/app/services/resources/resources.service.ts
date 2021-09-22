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
  Resource,
  ResourcePayload,
} from '@eworkbench/types';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ResourcesService implements TableViewService, RecentChangesService, LockService, ExportService, PermissionsService {
  public readonly apiUrl = `${environment.apiUrl}/resources/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: Resource[] }> {
    return this.httpClient.get<DjangoAPI<Resource[]>>(this.apiUrl, { params }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public search(search: string, params = new HttpParams()): Observable<Resource[]> {
    const httpParams = params.set('search', search);

    return this.httpClient
      .get<DjangoAPI<Resource[]>>(this.apiUrl, { params: httpParams })
      .pipe(map(/* istanbul ignore next */ data => data.results));
  }

  public add(resource: ResourcePayload, params = new HttpParams()): Observable<Resource> {
    return this.httpClient.post<Resource>(this.apiUrl, resource, { params });
  }

  public get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<Resource>> {
    return this.httpClient.get<Resource>(`${this.apiUrl}${id}/`, { params }).pipe(
      switchMap(
        /* istanbul ignore next */ resource =>
          this.getUserPrivileges(id, userId, resource.deleted).pipe(
            map(privileges => {
              const privilegesData: PrivilegesData<Resource> = {
                privileges,
                data: resource,
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

  public delete(id: string, params = new HttpParams()): Observable<Resource> {
    return this.httpClient.patch<Resource>(`${this.apiUrl}${id}/soft_delete/`, { pk: id }, { params });
  }

  public patch(id: string, resource: ResourcePayload, params = new HttpParams()): Observable<Resource> {
    return this.httpClient.patch<Resource>(`${this.apiUrl}${id}/`, resource, { params });
  }

  public restore(id: string, params = new HttpParams()): Observable<Resource> {
    return this.httpClient.patch<Resource>(`${this.apiUrl}${id}/restore/`, { pk: id }, { params });
  }

  public history(id: string, params = new HttpParams()): Observable<RecentChanges[]> {
    return this.httpClient
      .get<DjangoAPI<RecentChanges[]>>(`${this.apiUrl}${id}/history/`, { params })
      .pipe(map(/* istanbul ignore next */ data => data.results));
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

  public changeTermsOfUsePDF(id: string, pdf: any, params = new HttpParams()): Observable<Resource> {
    const formData = new FormData();
    formData.append('pk', id);
    formData.append('terms_of_use_pdf', pdf);
    return this.httpClient.patch<Resource>(`${this.apiUrl}${id}/`, formData, { params });
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
