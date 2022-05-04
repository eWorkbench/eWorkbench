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
  KanbanTask,
  PermissionsService,
  Privileges,
  PrivilegesApi,
  PrivilegesData,
  RecentChanges,
  Relation,
  RelationPayload,
  RelationPutPayload,
  TaskBoard,
  TaskBoardColumn,
  TaskBoardPayload,
} from '@eworkbench/types';
import type { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import type { Optional } from 'utility-types';

@Injectable({
  providedIn: 'root',
})
export class TaskBoardsService implements TableViewService, ExportService, PermissionsService {
  public readonly apiUrl = `${environment.apiUrl}/kanbanboards/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: TaskBoard[] }> {
    return this.httpClient.get<DjangoAPI<TaskBoard[]>>(this.apiUrl, { params }).pipe(
      map(data => ({
        total: data.count,
        data: data.results,
      }))
    );
  }

  public create(taskBoard: TaskBoardPayload, params = new HttpParams()): Observable<TaskBoard> {
    return this.httpClient.post<TaskBoard>(this.apiUrl, taskBoard, { params });
  }

  public get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<TaskBoard>> {
    return this.httpClient.get<TaskBoard>(`${this.apiUrl}${id}/`, { params }).pipe(
      switchMap(taskBoard =>
        this.getUserPrivileges(id, userId, taskBoard.deleted).pipe(
          map(privileges => {
            const privilegesData: PrivilegesData<TaskBoard> = {
              privileges,
              data: taskBoard,
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

  public delete(id: string, params = new HttpParams()): Observable<TaskBoard> {
    return this.httpClient.patch<TaskBoard>(`${this.apiUrl}${id}/soft_delete/`, { pk: id }, { params });
  }

  public patch(id: string, taskBoard: Optional<TaskBoardPayload>, params = new HttpParams()): Observable<TaskBoard> {
    return this.httpClient.patch<TaskBoard>(`${this.apiUrl}${id}/`, { pk: id, ...taskBoard }, { params });
  }

  public restore(id: string, params = new HttpParams()): Observable<TaskBoard> {
    return this.httpClient.patch<TaskBoard>(`${this.apiUrl}${id}/restore/`, { pk: id }, { params });
  }

  public history(id: string, params = new HttpParams()): Observable<RecentChanges[]> {
    return this.httpClient.get<DjangoAPI<RecentChanges[]>>(`${this.apiUrl}${id}/history/`, { params }).pipe(map(data => data.results));
  }

  public lock(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}${id}/lock/`, undefined, { params });
  }

  public unlock(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}${id}/unlock/`, undefined, { params });
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

  public getTasks(id: string, params = new HttpParams()): Observable<KanbanTask[]> {
    return this.httpClient.get<KanbanTask[]>(`${this.apiUrl}${id}/tasks/`, { params });
  }

  public moveColumn(
    id: string,
    columns: TaskBoardColumn[],
    params = new HttpParams()
  ): Observable<{ kanban_board_columns: TaskBoardColumn[]; pk: string }> {
    return this.httpClient.patch<{ kanban_board_columns: TaskBoardColumn[]; pk: string }>(
      `${this.apiUrl}${id}/`,
      { kanban_board_columns: columns, pk: id },
      { params }
    );
  }

  public moveCard(
    id: string,
    task: { assignment_pk: string; to_column: string; to_index: number },
    params = new HttpParams()
  ): Observable<TaskBoardColumn[]> {
    return this.httpClient.put<TaskBoardColumn[]>(`${this.apiUrl}${id}/tasks/move_assignment/`, task, { params });
  }

  public deleteCard(id: string, taskId: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/tasks/${taskId}/`, { params });
  }

  public changeBackgroundImage(id: string, image: any, params = new HttpParams()): Observable<TaskBoard> {
    const formData = new FormData();
    formData.append('pk', id);
    formData.append('background_image', image);
    return this.httpClient.patch<TaskBoard>(`${this.apiUrl}${id}/`, formData, { params });
  }

  public changeBoardSettings(id: string, payload: TaskBoardPayload, params = new HttpParams()): Observable<TaskBoard> {
    return this.httpClient.patch<TaskBoard>(`${this.apiUrl}${id}/`, { ...payload, pk: id }, { params });
  }

  public clearBackgroundImage(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.patch<void>(`${this.apiUrl}${id}/clear_background_image/`, {}, { params });
  }

  public export(id: string): Observable<ExportLink> {
    return this.httpClient.get<ExportLink>(`${this.apiUrl}${id}/get_export_link/`);
  }

  public getFilterSettings(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/filtersettings/`);
  }

  public upsertFilterSettings(id: string, payload: any, filterId?: string): Observable<any> {
    if (filterId) {
      return this.httpClient.put<any>(`${this.apiUrl}${id}/filtersettings/${filterId}/`, payload);
    }

    return this.httpClient.post<any>(`${this.apiUrl}${id}/filtersettings/`, payload);
  }

  public changeColumnTransparency(id: string, opacity: number): Observable<void> {
    return this.httpClient.patch<void>(`${this.apiUrl}${id}/set_columns_transparency/`, { alpha: opacity });
  }

  public getUserSettings(id: string): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}${id}/usersettings/`);
  }

  public upsertUserSettings(id: string, payload: any, settingId?: string): Observable<any> {
    if (settingId) {
      return this.httpClient.put<any>(`${this.apiUrl}${id}/usersettings/${settingId}/`, payload);
    }

    return this.httpClient.post<any>(`${this.apiUrl}${id}/usersettings/`, payload);
  }
}
