# table-view

To implement this component a service needs to exists that can be subscribed to. It's essential to have a `public getList()` function to retrieve data and hand it over to the component. To make life easier the service class must implement the `TableViewService` interface so it's obvious which mandatory implementations there are.

## Implementation

```ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TableViewService } from '@eworkbench/table';
import { DjangoAPI } from '@app/interfaces/django-api.interface';

@Injectable({
  providedIn: 'root',
})
export class MyService implements TableViewService {
  private readonly apiUrl = 'https://www.domain.com/api/endpoint';

  public constructor(private readonly httpClient: HttpClient) {}

  public getList(params?: HttpParams): Observable<{ total: number; data: any[] }> {
    return this.httpClient.get<DjangoAPI>(this.apiUrl, { params });
  }
}
```

In the page component table, columns can be defined and the service must be injected.

```ts
import { Component, Input, OnInit } from '@angular/core';
import { MyService } from '../path/to/services/my/my.service';
import { TableColumn } from '@eworkbench/table';

@Component({
  selector: 'eworkbench-my-page',
  templateUrl: './my-page.component.html',
  styleUrls: ['./my-page.component.scss'],
})
export class MyPageComponent implements OnInit {
  public columns: TableColumn[] = [];

  public constructor(public readonly service: MyService) {}

  public ngOnInit(): void {
    this.columns = [
      {
        title: 'First name',
        key: 'first_name',
      },
      {
        cellTemplate: this.actionsCellTemplate,
        title: '',
        key: '',
        sortable: false,
      },
    ];
  }
}
```

In the page component, the table-view selector can then be implemented and linked to the columns and service declared earlier.

```html
<eworkbench-table-view [service]="service" [columns]="columns"></eworkbench-table-view>
```

Data can also be manually assigned without a service by providing it in JSON format and binding it to `data`.

```html
<eworkbench-table-view [data]="data" [columns]="columns"></eworkbench-table-view>
```

## Running unit tests

Run `npx nx test table-view` to execute the unit tests.
