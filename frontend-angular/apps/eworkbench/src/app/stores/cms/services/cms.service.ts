/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CMSQuery, CMSSettings, CMSSettingsMaintenance, CMSStore } from '@app/stores/cms';
import { environment } from '@environments/environment';
import type { CMSJsonResponse, OSSLicense } from '@eworkbench/types';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CMSService {
  public readonly apiUrl = `${environment.apiUrl}/cms/`;

  public readonly apiUrlLicenses = `${environment.apiUrl}/`;

  public constructor(private readonly cmsQuery: CMSQuery, private readonly cmsStore: CMSStore, private readonly httpClient: HttpClient) {}

  public get get$(): Observable<CMSSettings> {
    return this.cmsQuery.cms$ as any;
  }

  public set(settings: CMSSettings): Observable<unknown> {
    return this.cmsStore.update(() => settings);
  }

  public maintenance(): Observable<CMSSettingsMaintenance> {
    return this.get$.pipe(
      take(1),
      switchMap(settings => {
        if (settings.maintenance.text) {
          return of(settings.maintenance);
        }

        return this.httpClient.get<CMSJsonResponse>(`${this.apiUrl}json/maintenance/`).pipe(
          map(maintenanceSettings => {
            const maintenance = { text: maintenanceSettings.text, visible: maintenanceSettings.public };
            this.set({
              ...settings,
              maintenance: { ...maintenance },
            });
            return maintenance;
          })
        );
      })
    );
  }

  public getDssContainerListHowTo(): Observable<CMSJsonResponse> {
    return this.httpClient.get<CMSJsonResponse>(`${this.apiUrl}json/dss_container_list_how_to/`);
  }

  public getDssContainerDetailHowTo(): Observable<CMSJsonResponse> {
    return this.httpClient.get<CMSJsonResponse>(`${this.apiUrl}json/dss_container_detail_how_to/`);
  }

  public getPrivacyPolicy(): Observable<CMSJsonResponse> {
    return this.httpClient.get<CMSJsonResponse>(`${this.apiUrl}json/privacy/`);
  }

  public getImprint(): Observable<CMSJsonResponse> {
    return this.httpClient.get<CMSJsonResponse>(`${this.apiUrl}json/imprint/`);
  }

  public getBackendLicenses(): Observable<OSSLicense[]> {
    return this.httpClient.get<OSSLicense[]>(`${this.apiUrlLicenses}oss_licenses/`);
  }

  public getFrontendLicenses(): Observable<CMSJsonResponse> {
    return this.httpClient.get<CMSJsonResponse>(`${this.apiUrl}json/frontend_licenses/`);
  }

  public getAccessibility(): Observable<CMSJsonResponse> {
    return this.httpClient.get<CMSJsonResponse>(`${this.apiUrl}json/accessibility/`);
  }
}
