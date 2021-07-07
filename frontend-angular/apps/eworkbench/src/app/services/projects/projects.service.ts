/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PrivilegesService } from '@app/services/privileges/privileges.service';
import { environment } from '@environments/environment';
import { TableViewService, TreeViewService } from '@eworkbench/table';
import {
  DjangoAPI,
  Project,
  ProjectMember,
  ProjectMemberPatchPayload,
  ProjectMemberPayload,
  ProjectPayload,
  ProjectRelation,
  ProjectRelationPayload,
  ProjectRelationPutPayload,
} from '@eworkbench/types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService implements TableViewService, TreeViewService {
  public readonly apiUrl = `${environment.apiUrl}/projects/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params: HttpParams): Observable<{ total: number; data: Project[] }> {
    return this.httpClient.get<DjangoAPI<Project[]>>(this.apiUrl, { params }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public getChildrenOf(childrenOf: string, params = new HttpParams()): Observable<{ total: number; data: Project[] }> {
    const httpParams = params.set('parent_project', childrenOf);

    return this.httpClient.get<DjangoAPI<Project[]>>(this.apiUrl, { params: httpParams }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public getParentsOf(parentsOf: string, params = new HttpParams()): Observable<{ total: number; data: Project[] }> {
    const httpParams = params.set('parents_of', parentsOf);

    return this.httpClient.get<DjangoAPI<Project[]>>(this.apiUrl, { params: httpParams }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public getRecursiveParent(recursiveParent: string, params = new HttpParams()): Observable<{ total: number; data: Project[] }> {
    const httpParams = params.set('recursive_parent', recursiveParent);

    return this.httpClient.get<DjangoAPI<Project[]>>(this.apiUrl, { params: httpParams }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public getMembers(id: string): Observable<ProjectMember[]> {
    return this.httpClient.get<ProjectMember[]>(`${this.apiUrl}${id}/acls/`);
  }

  public getMembersUp(id: string): Observable<ProjectMember[]> {
    return this.httpClient.get<ProjectMember[]>(`${this.apiUrl}${id}/acls/get_assigned_users_up/`);
  }

  public addMember(id: string, payload: ProjectMemberPayload): Observable<ProjectMember> {
    return this.httpClient.post<ProjectMember>(`${this.apiUrl}${id}/acls/`, payload);
  }

  public patchMember(id: string, userId: string, payload: ProjectMemberPatchPayload): Observable<ProjectMember> {
    return this.httpClient.patch<ProjectMember>(`${this.apiUrl}${id}/acls/${userId}/`, payload);
  }

  public deleteMember(id: string, userId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/acls/${userId}/`);
  }

  public search(search: string, params = new HttpParams()): Observable<Project[]> {
    const httpParams = params.set('search', search);

    return this.httpClient
      .get<DjangoAPI<Project[]>>(`${environment.apiUrl}/projects/`, { params: httpParams })
      .pipe(map(/* istanbul ignore next */ data => data.results));
  }

  public add(project: ProjectPayload, params = new HttpParams()): Observable<Project> {
    return this.httpClient.post<Project>(this.apiUrl, project, { params });
  }

  public get(id: string, params = new HttpParams()): Observable<Project> {
    return this.httpClient.get<Project>(`${this.apiUrl}${id}/`, { params });
  }

  public delete(id: string, params = new HttpParams()): Observable<Project> {
    return this.httpClient.patch<Project>(`${this.apiUrl}${id}/soft_delete/`, { pk: id }, { params });
  }

  public patch(id: string, project: ProjectPayload, params = new HttpParams()): Observable<Project> {
    return this.httpClient.patch<Project>(`${this.apiUrl}${id}/`, project, { params });
  }

  public restore(id: string, params = new HttpParams()): Observable<Project> {
    return this.httpClient.patch<Project>(`${this.apiUrl}${id}/restore/`, { pk: id }, { params });
  }

  public getRelations(id: string, params = new HttpParams()): Observable<ProjectRelation[]> {
    return this.httpClient.get<ProjectRelation[]>(`${this.apiUrl}${id}/relations/`, { params });
  }

  public addRelation(id: string, payload: ProjectRelationPayload): Observable<ProjectRelation> {
    return this.httpClient.post<ProjectRelation>(`${this.apiUrl}${id}/relations/`, payload);
  }

  public putRelation(id: string, relationId: string, payload: ProjectRelationPutPayload): Observable<ProjectRelation> {
    return this.httpClient.put<ProjectRelation>(`${this.apiUrl}${id}/relations/${relationId}`, payload);
  }

  public deleteRelation(id: string, relationId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/relations/${relationId}`);
  }

  public duplicate(id: string): Observable<Project> {
    return this.httpClient.post<Project>(`${this.apiUrl}${id}/duplicate/`, { pk: id });
  }
}
