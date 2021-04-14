/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from '@app/services';
import { UserService } from '@app/stores/user';
import { MustMatch } from '@app/validators/must-match.validator';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-password-page',
  templateUrl: './password-page.component.html',
  styleUrls: ['./password-page.component.scss'],
})
export class PasswordPageComponent implements OnInit {
  public title = '';

  public loading = false;

  public form = this.fb.group(
    {
      password: [null, [Validators.required, Validators.minLength(8)]],
      passwordConfirm: [null, [Validators.required, Validators.minLength(8)]],
    },
    { validators: [MustMatch('password', 'passwordConfirm')] }
  );

  public constructor(
    private readonly userService: UserService,
    private readonly fb: FormBuilder,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
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
      .selectTranslate('changePassword.title')
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

  public onSubmit(): void {
    if (this.loading || this.form.invalid) {
      return;
    }
    this.loading = true;

    this.userService
      .changePassword(this.f.password.value)
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
          this.translocoService
            .selectTranslate('changePassword.success.toastr.passwordChanged')
            .pipe(untilDestroyed(this))
            .subscribe(passwordChanged => {
              this.toastrService.success(passwordChanged);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
