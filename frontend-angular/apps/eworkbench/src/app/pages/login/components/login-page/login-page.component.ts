/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, PageTitleService } from '@app/services';
import { UserState } from '@app/stores/user';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map, take } from 'rxjs/operators';

interface FormLogin {
  username: string | null;
  password: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent implements OnInit {
  public title = '';

  public loading = false;

  public form = this.fb.group<FormLogin>({
    username: [null, Validators.required],
    password: [null, Validators.required],
  });

  private returnUrl = '/';

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  private get f(): FormGroup<FormLogin>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(
      untilDestroyed(this),
      take(1),
      map(
        /* istanbul ignore next */ (user: UserState) => {
          /* istanbul ignore next */
          if (user.loggedIn) {
            this.router.navigate(['/']);
          }
        }
      )
    );

    this.returnUrl = this.route.snapshot.queryParams.returnUrl || this.returnUrl;

    this.initTranslations();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('login.title')
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

  public onLogin(): void {
    if (this.loading || this.form.invalid) {
      return;
    }
    this.loading = true;

    this.authService
      .login(this.f.username.value!, this.f.password.value!)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.router.navigate([this.returnUrl]);
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
