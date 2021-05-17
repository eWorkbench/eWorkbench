/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FAQService, PageTitleService } from '@app/services';
import { FAQ, FAQCategory } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-faq-page',
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.scss'],
})
export class FAQPageComponent implements OnInit {
  public title = '';

  public faq: FAQ[] = [];

  public categories: FAQCategory[] = [];

  public sortedFAQ: Record<string, FAQ[]> = {};

  public loading = true;

  public constructor(
    private readonly faqService: FAQService,
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
      .selectTranslate('faq.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });
  }

  public initDetails(): void {
    this.faqService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ result => {
          this.faq = result.data;

          this.categories = [...this.faq.map(item => item.category)]
            .filter((value, index, array) => array.map(category => category.slug).indexOf(value.slug) === index)
            .sort((a, b) => a.ordering - b.ordering);

          this.categories.forEach(category => {
            this.sortedFAQ[category.slug] = [...this.faq.filter(item => item.category.slug === category.slug)];
          });

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
