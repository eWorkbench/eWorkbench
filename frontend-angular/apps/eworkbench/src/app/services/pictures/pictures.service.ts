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
  ConvertTiffPayload,
  DjangoAPI,
  ExportLink,
  ExportService,
  FinalizeVersion,
  LockService,
  PermissionsService,
  Picture,
  PictureEditorPayload,
  PicturePayload,
  Privileges,
  PrivilegesApi,
  PrivilegesData,
  RecentChanges,
  RecentChangesService,
  Relation,
  RelationPayload,
  RelationPutPayload,
  SketchPayload,
  Version,
  VersionsService,
} from '@eworkbench/types';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Optional } from 'utility-types';

@Injectable({
  providedIn: 'root',
})
export class PicturesService
  implements TableViewService, RecentChangesService, VersionsService<Picture>, LockService, ExportService, PermissionsService
{
  public readonly apiUrl = `${environment.apiUrl}/pictures/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: Picture[] }> {
    return this.httpClient.get<DjangoAPI<Picture[]>>(this.apiUrl, { params }).pipe(
      map(
        /* istanbul ignore next */ data => ({
          total: data.count,
          data: data.results,
        })
      )
    );
  }

  public add(picture: PicturePayload | SketchPayload, params = new HttpParams()): Observable<Picture> {
    const formData = new FormData();
    for (const [key, val] of Object.entries(picture)) {
      if (!val) continue;
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (val instanceof Blob) {
            formData.append(key, v, v.name);
          } else {
            formData.append(key, v);
          }
        });
        continue;
      } else if (val instanceof Blob) {
        formData.append(key, val, (val as any).name);
      } else {
        formData.append(key, val);
      }
    }
    return this.httpClient.post<Picture>(this.apiUrl, formData, { params });
  }

  public get(id: string, userId: number, params = new HttpParams()): Observable<PrivilegesData<Picture>> {
    return this.httpClient.get<Picture>(`${this.apiUrl}${id}/`, { params }).pipe(
      switchMap(
        /* istanbul ignore next */ picture =>
          this.getUserPrivileges(id, userId, picture.deleted).pipe(
            map(privileges => {
              const privilegesData: PrivilegesData<Picture> = {
                privileges,
                data: picture,
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

  public delete(id: string, params = new HttpParams()): Observable<Picture> {
    return this.httpClient.patch<Picture>(`${this.apiUrl}${id}/soft_delete/`, { pk: id }, { params });
  }

  public patch(id: string, task: Optional<PicturePayload>, params = new HttpParams()): Observable<Picture> {
    return this.httpClient.patch<Picture>(`${this.apiUrl}${id}/`, { pk: id, ...task }, { params });
  }

  public restore(id: string, params = new HttpParams()): Observable<Picture> {
    return this.httpClient.patch<Picture>(`${this.apiUrl}${id}/restore/`, { pk: id }, { params });
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

  public addVersion(id: string, version?: FinalizeVersion): Observable<Picture> {
    return this.httpClient.post<Picture>(`${this.apiUrl}${id}/versions/`, version);
  }

  public restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<Picture> {
    if (versionInProgress) {
      return this.addVersion(id).pipe(
        switchMap(
          /* istanbul ignore next */ () => {
            return this.httpClient.post<Picture>(`${this.apiUrl}${id}/versions/${version}/restore/`, { pk: id });
          }
        )
      );
    }

    return this.httpClient.post<Picture>(`${this.apiUrl}${id}/versions/${version}/restore/`, { pk: id });
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
    return this.httpClient.put<Relation>(`${this.apiUrl}${id}/relations/${relationId}`, payload);
  }

  public deleteRelation(id: string, relationId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}${id}/relations/${relationId}`);
  }

  public uploadImage(id: string, picture: PictureEditorPayload, params = new HttpParams()): Observable<Picture> {
    const formData = new FormData();
    for (const [key, val] of Object.entries(picture)) {
      if (!val) continue;
      if (val instanceof Blob) {
        if (val.size) {
          formData.append(key, val, (val as any).name);
        }
      } else {
        formData.append(key, val);
      }
    }
    return this.httpClient.patch<Picture>(`${this.apiUrl}${id}/`, formData, { params });
  }

  public downloadShapes(url: string, params = new HttpParams()): Observable<any> {
    return this.httpClient.get<any>(url, { params });
  }

  public convertTiff(url: string, picture: ConvertTiffPayload, params = new HttpParams()): Observable<Blob> {
    const formData = new FormData();
    for (const [key, val] of Object.entries(picture)) {
      if (!val) continue;
      if (val instanceof Blob) {
        if (val.size) {
          formData.append(key, val, (val as any).name);
        }
      } else {
        formData.append(key, val);
      }
    }
    return this.httpClient.post(url, formData, { params, responseType: 'blob' });
  }
}
