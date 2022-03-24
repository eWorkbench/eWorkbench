/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Location, ViewportScroller } from '@angular/common';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { FAQService, PageTitleService } from '@app/services';
import { FAQ, FAQCategory } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface CollapseData {
  id: string;
  collapsed: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-faq-page',
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.scss'],
})
export class FAQPageComponent implements OnInit {
  public title = '';

  public id = this.route.snapshot.paramMap.get('id')!;

  public faq: FAQ[] = [];

  public categories: FAQCategory[] = [];

  public sortedFAQ: Record<string, FAQ[]> = {};

  public loading = true;

  public defaultOpened?: string = undefined;

  public collapse = new EventEmitter<string>();

  public constructor(
    private readonly faqService: FAQService,
    private readonly location: Location,
    private readonly route: ActivatedRoute,
    private readonly scroller: ViewportScroller,
    private readonly translocoService: TranslocoService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
    this.defaultOpened = this.id;
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

          setTimeout(() => {
            this.scrollToQuestion(this.id);
          }, 1);
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

  public onHandleCollapses(data: CollapseData): void {
    this.defaultOpened = undefined;
    this.collapse.next(data.id);
    if (data.collapsed) {
      this.location.replaceState(`/faq`);
    } else {
      this.location.replaceState(`/faq/${data.id}`);
    }
  }

  public scrollToQuestion(id: string): void {
    const scrollContainer = document.getElementById('faq-scroll-container');
    const scrollElement = document.getElementById(`faq-${id}`);
    const offsetTop = (scrollElement?.offsetTop ?? 0) - (scrollContainer?.offsetTop ?? 0);
    this.scroller.scrollToPosition([0, offsetTop]);
  }
}
