/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { AppVersionService, ContactFormService, PageTitleService } from '@app/services';
import type { ContactFormPayload } from '@eworkbench/types';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormContact {
  subject: FormControl<string | null>;
  message: FormControl<string | null>;
  [key: string]: any;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-contact-form-page',
  templateUrl: './contact-form-page.component.html',
  styleUrls: ['./contact-form-page.component.scss'],
})
export class ContactFormPageComponent implements OnInit {
  public title = '';

  public backendVersion = '';

  public loading = true;

  public form = this.fb.group<FormContact>({
    subject: this.fb.control(null, Validators.required),
    message: this.fb.control(null, Validators.required),
  });

  public constructor(
    private readonly appVersionService: AppVersionService,
    private readonly contactFormService: ContactFormService,
    private readonly fb: FormBuilder,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  private get f() {
    return this.form.controls;
  }

  private get contact(): ContactFormPayload {
    return {
      subject: this.f.subject.value!,
      message: this.f.message.value ?? '',
      backend_version: this.backendVersion,
      browser_version: window.navigator.userAgent,
      local_time: new Date().toISOString(),
      url: window.location.href,
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initBackendVersion();
    this.initPageTitle();
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('contactForm.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
      });
  }

  public initBackendVersion(): void {
    this.appVersionService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        version => {
          this.loading = false;
          this.backendVersion = version;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
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

  public onSubmit(): void {
    if (this.loading || this.form.invalid) {
      return;
    }
    this.loading = true;

    this.contactFormService
      .send(this.contact)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loading = false;
          this.form.reset();
          this.form.clearValidators();
          Object.keys(this.form.controls).forEach(key => {
            this.form.controls[key].setErrors(null);
          });
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('contactForm.success.toastr')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
