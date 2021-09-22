/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { TableViewService } from '@eworkbench/table';
import { DjangoAPI, KanbanTask, Task } from '@eworkbench/types';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TasksBacklogService implements TableViewService {
  public readonly apiUrl = `${environment.apiUrl}/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public getList(params: HttpParams, id: string): Observable<{ total: number; data: Task[] }> {
    return this.httpClient.get<KanbanTask[]>(`${this.apiUrl}kanbanboards/${id}/tasks/`).pipe(
      switchMap(
        /* istanbul ignore next */ tasks =>
          this.httpClient
            .get<DjangoAPI<Task[]>>(`${this.apiUrl}tasks/`, {
              params: params.set('id', tasks.map(/* istanbul ignore next */ task => task.task_id).join(',')),
            })
            .pipe(
              map(
                /* istanbul ignore next */ data => ({
                  total: data.count,
                  data: data.results,
                })
              )
            )
      )
    );
  }

  public addTasks(id: string, payload: any, params = new HttpParams()): Observable<KanbanTask[]> {
    return this.httpClient.post<KanbanTask[]>(`${this.apiUrl}kanbanboards/${id}/tasks/create_many/`, payload, {
      params,
    });
  }
}
