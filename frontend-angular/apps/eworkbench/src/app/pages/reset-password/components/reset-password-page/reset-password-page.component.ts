/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { PageTitleService, PasswordService } from '@app/services';
import { MustMatch } from '@app/validators/must-match.validator';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-reset-password-page',
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent implements OnInit {
  public title = '';

  public token = this.route.snapshot.paramMap.get('token')!;

  public loading = false;

  public form: FormGroup = this.fb.group(
    {
      password: [null, [Validators.required, Validators.minLength(8)]],
      passwordConfirm: [null, [Validators.required, Validators.minLength(8)]],
    },
    { validators: [MustMatch('password', 'passwordConfirm')] }
  );

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly passwordService: PasswordService,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  private get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('resetPassword.title')
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

  public onChangePassword(): void {
    if (this.loading || this.form.invalid) {
      return;
    }
    this.loading = true;

    this.passwordService
      .confirm({ password: this.f.password.value, token: this.token })
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
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
