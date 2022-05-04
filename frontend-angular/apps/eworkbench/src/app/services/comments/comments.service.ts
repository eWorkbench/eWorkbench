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
  Comment,
  CommentPayload,
  DjangoAPI,
  PermissionsService,
  Privileges,
  PrivilegesApi,
  PrivilegesData,
  Relation,
  RelationPayload,
  RelationPutPayload,
} from '@eworkbench/types';
import type { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CommentsService implements TableViewService, PermissionsService {
  public readonly apiUrl = `${environment.apiUrl}/comments/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: Comment[] }> {
    return this.httpClient.get<DjangoAPI<Comment[]>>(this.apiUrl, { params }).pipe(
      map(data => ({
        total: data.count,
        data: data.results,
      }))
    );
  }

  public add(comment: CommentPayload, params = new HttpParams()): Observable<Comment> {
    return this.httpClient.post<Comment>(this.apiUrl, comment, { params });
  }

  public get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<Comment>> {
    return this.httpClient.get<Comment>(`${this.apiUrl}${id}/`, { params }).pipe(
      switchMap(comment =>
        this.getUserPrivileges(id, userId, comment.deleted).pipe(
          map(privileges => {
            const privilegesData: PrivilegesData<Comment> = {
              privileges,
              data: comment,
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

  public delete(id: string, params = new HttpParams()): Observable<Comment> {
    return this.httpClient.patch<Comment>(`${this.apiUrl}${id}/soft_delete/`, { pk: id }, { params });
  }

  public patch(id: string, comment: CommentPayload, params = new HttpParams()): Observable<Comment> {
    return this.httpClient.patch<Comment>(`${this.apiUrl}${id}/`, comment, { params });
  }

  public restore(id: string, params = new HttpParams()): Observable<Comment> {
    return this.httpClient.patch<Comment>(`${this.apiUrl}${id}/restore/`, { pk: id }, { params });
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
