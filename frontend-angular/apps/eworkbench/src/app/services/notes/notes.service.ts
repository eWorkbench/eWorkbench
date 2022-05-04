/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PrivilegesService } from '@app/services/privileges/privileges.service';
import { environment } from '@environments/environment';
import type { TableViewService } from '@eworkbench/table';
import type {
  DjangoAPI,
  ExportLink,
  ExportService,
  FinalizeVersion,
  LockService,
  Note,
  NotePayload,
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
import type { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotesService
  implements TableViewService, RecentChangesService, VersionsService<Note>, LockService, ExportService, PermissionsService
{
  public readonly apiUrl = `${environment.apiUrl}/notes/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: Note[] }> {
    return this.httpClient.get<DjangoAPI<Note[]>>(this.apiUrl, { params }).pipe(
      map(data => ({
        total: data.count,
        data: data.results,
      }))
    );
  }

  public add(note: NotePayload, params = new HttpParams()): Observable<Note> {
    return this.httpClient.post<Note>(this.apiUrl, note, { params });
  }

  public get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<Note>> {
    return this.httpClient.get<Note>(`${this.apiUrl}${id}/`, { params }).pipe(
      switchMap(note =>
        this.getUserPrivileges(id, userId, note.deleted).pipe(
          map(privileges => {
            const privilegesData: PrivilegesData<Note> = {
              privileges,
              data: note,
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
      .pipe(map(privileges => this.privilegesService.transform(privileges, deleted)));
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
    return this.httpClient.delete(`${this.apiUrl}${id}/privileges/${userId}/`).pipe(switchMap(() => this.getPrivilegesList(id)));
  }

  public delete(id: string, params = new HttpParams()): Observable<Note> {
    return this.httpClient.patch<Note>(`${this.apiUrl}${id}/soft_delete/`, { pk: id }, { params });
  }

  public patch(id: string, note: NotePayload, params = new HttpParams()): Observable<Note> {
    return this.httpClient.patch<Note>(`${this.apiUrl}${id}/`, note, { params });
  }

  public restore(id: string, params = new HttpParams()): Observable<Note> {
    return this.httpClient.patch<Note>(`${this.apiUrl}${id}/restore/`, { pk: id }, { params });
  }

  public history(id: string, params = new HttpParams()): Observable<RecentChanges[]> {
    return this.httpClient.get<DjangoAPI<RecentChanges[]>>(`${this.apiUrl}${id}/history/`, { params }).pipe(map(data => data.results));
  }

  public versions(id: string, params = new HttpParams()): Observable<Version[]> {
    return this.httpClient.get<DjangoAPI<Version[]>>(`${this.apiUrl}${id}/versions/`, { params }).pipe(map(data => data.results));
  }

  // TODO: needs proper interface for return type, maybe with a generic?
  public previewVersion(id: string, version: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/versions/${version}/preview/`);
  }

  public addVersion(id: string, version?: FinalizeVersion): Observable<Note> {
    return this.httpClient.post<Note>(`${this.apiUrl}${id}/versions/`, version);
  }

  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<Note> {
    if (versionInProgress) {
      return this.addVersion(id).pipe(
        switchMap(() => this.httpClient.post<Note>(`${this.apiUrl}${id}/versions/${version}/restore/`, { pk: id }))
      );
    }

    return this.httpClient.post<Note>(`${this.apiUrl}${id}/versions/${version}/restore/`, { pk: id });
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
      map(data => ({
        total: data.count,
        data: data.results,
      }))
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
