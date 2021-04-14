/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { TableViewService } from '@eworkbench/table';
import {
  Directory,
  DirectoryPayload,
  DjangoAPI,
  Drive,
  DrivePayload,
  ExportLink,
  ExportService,
  PermissionsService,
  Privileges,
  PrivilegesApi,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
  Relation,
  RelationPayload,
  RelationPutPayload,
} from '@eworkbench/types';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { PrivilegesService } from '../privileges/privileges.service';

@Injectable({
  providedIn: 'root',
})
export class DrivesService implements TableViewService, RecentChangesService, ExportService, PermissionsService {
  public readonly apiUrl = `${environment.apiUrl}/drives/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params: HttpParams = new HttpParams()): Observable<{ total: number; data: Drive[] }> {
    return this.httpClient
      .get<DjangoAPI<Drive[]>>(this.apiUrl, { params })
      .pipe(map(/* istanbul ignore next */ data => ({ total: data.count, data: data.results })));
  }

  public add(drive: DrivePayload, params?: HttpParams): Observable<Drive> {
    return this.httpClient.post<Drive>(this.apiUrl, drive, { params });
  }

  public get(id: string, userId: number, params?: HttpParams): Observable<PrivilegesData<Drive>> {
    return this.httpClient
      .get<Drive>(`${this.apiUrl}${id}/`, { params })
      .pipe(
        switchMap(
          /* istanbul ignore next */ drive =>
            this.getUserPrivileges(id, userId, drive.deleted).pipe(
              map(privileges => {
                const privilegesData: PrivilegesData<Drive> = {
                  privileges,
                  data: drive,
                };
                return privilegesData;
              })
            )
        )
      );
  }

  public delete(id: string, params?: HttpParams): Observable<Drive> {
    return this.httpClient.patch<Drive>(`${this.apiUrl}${id}/soft_delete/`, { pk: id }, { params });
  }

  public patch(id: string, drive: DrivePayload, params?: HttpParams): Observable<Drive> {
    return this.httpClient.patch<Drive>(`${this.apiUrl}${id}/`, drive, { params });
  }

  public restore(id: string, params?: HttpParams): Observable<Drive> {
    return this.httpClient.patch<Drive>(`${this.apiUrl}${id}/restore/`, { pk: id }, { params });
  }

  public history(id: string, params?: HttpParams): Observable<RecentChanges[]> {
    return this.httpClient
      .get<DjangoAPI<RecentChanges[]>>(`${this.apiUrl}${id}/history/`, { params })
      .pipe(map(/* istanbul ignore next */ data => data.results));
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

  public addDirectory(id: string, directory: DirectoryPayload): Observable<Directory> {
    return this.httpClient.post<Directory>(`${this.apiUrl}${id}/sub_directories/`, directory);
  }

  public patchDirectory(driveId: string, id: string, directory: DirectoryPayload): Observable<Directory> {
    return this.httpClient.patch<Directory>(`${this.apiUrl}${driveId}/sub_directories/${id}`, directory);
  }

  public deleteDirectory(driveId: string, id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${driveId}/sub_directories/${id}/`);
  }

  public export(id: string): Observable<ExportLink> {
    return this.httpClient.get<ExportLink>(`${this.apiUrl}${id}/get_export_link/`);
  }

  public getRelations(id: string, params?: HttpParams): Observable<Relation[]> {
    return this.httpClient.get<Relation[]>(`${this.apiUrl}${id}/relations/`, { params });
  }

  public addRelation(id: string, payload: RelationPayload): Observable<Relation> {
    return this.httpClient.post<Relation>(`${this.apiUrl}${id}/relations/`, payload);
  }

  public putRelation(id: string, relationId: string, payload: RelationPutPayload): Observable<Relation> {
    return this.httpClient.put<Relation>(`${this.apiUrl}${id}/relations/${relationId}`, payload);
  }

  public deleteRelation(id: string, relationId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/relations/${relationId}`);
  }
}
