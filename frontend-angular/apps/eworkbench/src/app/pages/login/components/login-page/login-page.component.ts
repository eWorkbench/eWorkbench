/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, PageTitleService } from '@app/services';
import { EmailDetected } from '@app/validators/email-detected.validator';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface FormLogin {
  username: FormControl<string | null>;
  password: FormControl<string | null>;
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

  public loading$ = new BehaviorSubject(false);

  public form = this.fb.group<FormLogin>({
    username: this.fb.control(null, [Validators.required, EmailDetected()]),
    password: this.fb.control(null, Validators.required),
  });

  private readonly loginSubject = new Subject<void>();
  private readonly loggedIn$ = this.loginSubject
    .asObservable()
    .pipe(switchMap(() => this.authService.login(this.f.username.value!, this.f.password.value!)));

  private returnUrl = '/';

  public constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly translocoService: TranslocoService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  public get f() {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.loggedIn$.pipe(untilDestroyed(this)).subscribe({
      next: user => {
        if (user.loggedIn) {
          void this.router.navigate([this.returnUrl]);
        }
      },
      error: () => {
        this.loading$.next(false);
      },
    });

    this.returnUrl = this.route.snapshot.queryParams.returnUrl || this.returnUrl;

    this.initTranslations();
    this.initPageTitle();
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('login.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
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
    if (this.loading$.value || this.form.invalid) {
      return;
    }
    this.loading$.next(true);
    this.loginSubject.next();
  }
}
