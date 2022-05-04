/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from '@app/services';
import { CMSService } from '@app/stores/cms/services/cms.service';
import type { CMSJsonResponse } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-accessibility-page',
  templateUrl: './accessibility-page.component.html',
  styleUrls: ['./accessibility-page.component.scss'],
})
export class AccessibilityPageComponent implements OnInit {
  public title = '';

  public cmsText?: CMSJsonResponse;

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
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('accessibility.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
      });
  }

  public initDetails(): void {
    this.cmsService
      .getAccessibility()
      .pipe(untilDestroyed(this))
      .subscribe(result => {
        if (result.public) {
          this.cmsText = result;
        }
        this.loading = false;
      });
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
