import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { AcceptedScreen, AcceptedScreenPayload, DjangoAPI, LaunchScreen } from '@eworkbench/types';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LaunchScreenService {
  public readonly apiUrl = `${environment.apiUrl}/launchscreens/`;

  public readonly acceptUrl = `${environment.apiUrl}/acceptedscreens/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: LaunchScreen[] }> {
    return this.httpClient.get<DjangoAPI<LaunchScreen[]>>(this.apiUrl, { params }).pipe(
      map(data => ({
        total: data.count,
        data: data.results,
      }))
    );
  }

  public acceptScreen(screen: AcceptedScreenPayload, params = new HttpParams()): Observable<AcceptedScreen> {
    return this.httpClient.post<AcceptedScreen>(this.acceptUrl, screen, { params });
  }
}
