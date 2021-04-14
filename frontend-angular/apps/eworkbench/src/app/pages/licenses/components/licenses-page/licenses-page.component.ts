/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from '@app/services';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { TableColumn } from '@eworkbench/table';
import { CMSJsonResponse, OSSLicense } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map, switchMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-licenses-page',
  templateUrl: './licenses-page.component.html',
  styleUrls: ['./licenses-page.component.scss'],
})
export class LicensesPageComponent implements OnInit {
  @ViewChild('repositoryCellTemplate', { static: true })
  public repositoryCellTemplate!: TemplateRef<any>;

  public title = '';

  public cmsText?: CMSJsonResponse;

  public listColumns: TableColumn[] = [];

  public data: OSSLicense[] = [];

  public loading = true;

  public constructor(
    private readonly cmsService: CMSService,
    private readonly translocoService: TranslocoService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('licenses.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('licenses.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            name: column.key,
            key: 'key',
          },
          {
            name: column.licenses,
            key: 'licenses',
          },
          {
            cellTemplate: this.repositoryCellTemplate,
            name: column.repository,
            key: 'repository',
          },
        ];
      });
  }

  public initDetails(): void {
    this.cmsService
      .getBackendLicenses()
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ result => {
            this.data = [...result];
          }
        ),
        switchMap(
          /* istanbul ignore next */ () =>
            this.cmsService.getFrontendLicenses().pipe(
              untilDestroyed(this),
              map(
                /* istanbul ignore next */ result => {
                  if (result.public) {
                    this.cmsText = result;
                  }
                }
              )
            )
        )
      )
      .subscribe(
        /* istanbul ignore next */ () => {
          this.loading = false;
        }
      );
  }

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }
}
