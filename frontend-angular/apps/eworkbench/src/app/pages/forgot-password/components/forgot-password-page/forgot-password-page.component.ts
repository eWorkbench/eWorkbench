/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { PageTitleService, PasswordService } from '@app/services';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-forgot-password-page',
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPageComponent implements OnInit {
  public title = '';

  public loading = false;

  public resetRequested: boolean | string = false;

  public form = this.fb.group({
    email: [null, [Validators.required, Validators.email]],
  });

  public constructor(
    private readonly passwordService: PasswordService,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  private get f(): FormGroup['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('forgotPassword.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
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

  public onForgotPassword(): void {
    if (this.loading || this.form.invalid) {
      return;
    }
    this.resetRequested = false;
    this.loading = true;

    this.passwordService
      .request({ email: this.f.email.value })
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.resetRequested = this.f.email.value;
          this.loading = false;
          this.form.reset();
          this.form.clearValidators();
          Object.keys(this.form.controls).forEach(key => {
            this.form.controls[key].setErrors(null);
          });
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
