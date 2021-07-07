import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { TableViewService } from '@eworkbench/table';
import {
  DjangoAPI,
  DssContainer,
  DssContainerPayload,
  ExportLink,
  PermissionsService,
  Privileges,
  PrivilegesApi,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
} from '@eworkbench/types';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { PrivilegesService } from '../privileges/privileges.service';

@Injectable({
  providedIn: 'root',
})
export class DssContainersService implements TableViewService, RecentChangesService, PermissionsService {
  public readonly apiUrl = `${environment.apiUrl}/dsscontainers/`;

  public readonly importUrl = `${environment.apiUrl}/dssfilestoimport/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: DssContainer[] }> {
    return this.httpClient.get<DjangoAPI<DssContainer[]>>(this.apiUrl, { params }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<DssContainer>> {
    return this.httpClient.get<DssContainer>(`${this.apiUrl}${id}/`, { params }).pipe(
      switchMap(
        /* istanbul ignore next */ task =>
          this.getUserPrivileges(id, userId, task.deleted).pipe(
            map(privileges => {
              const privilegesData: PrivilegesData<DssContainer> = {
                privileges,
                data: task,
              };
              return privilegesData;
            })
          )
      )
    );
  }

  public add(dssContainer: DssContainerPayload, params = new HttpParams()): Observable<DssContainer> {
    return this.httpClient.post<DssContainer>(this.apiUrl, dssContainer, { params });
  }

  public patch(id: string, dssContainer: DssContainerPayload, params = new HttpParams()): Observable<DssContainer> {
    return this.httpClient.patch<DssContainer>(`${this.apiUrl}${id}/`, { pk: id, ...dssContainer }, { params });
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

  public importJsonPathList(pathList: { path: string }[]): Observable<{ count: number }> {
    return this.httpClient.post<{ count: number }>(this.importUrl, pathList);
  }
}
