/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { CustomToastComponent } from '@app/modules/shared/toastr/toastr.component';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '@environments/environment';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogModule } from '@ngneat/dialog';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './interceptors/auth/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error/error.interceptor';
import { FooterModule } from './modules/footer/footer.module';
import { NavbarModule } from './modules/navbar/navbar.module';
import { TranslocoRootModule } from './transloco-root.module';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { LeaveProjectGuard } from './guards/leave-project/leave-project.guard';
import { PendingChangesGuard } from './guards/pending-changes/pending-changes.guard';
import { MatomoModule } from 'ngx-matomo-v9';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    TranslocoRootModule,
    AkitaNgRouterStoreModule,
    /* istanbul ignore next */
    environment.production ? [] : AkitaNgDevtools,
    MatomoModule,
    ToastrModule.forRoot({
      toastComponent: CustomToastComponent,
      closeButton: true,
      tapToDismiss: false,
      maxOpened: 3,
    }),
    DialogModule.forRoot(),
    ErrorTailorModule.forRoot({
      errors: {
        useFactory(translocoService: TranslocoService) {
          return {
            required: () => translocoService.translate('form.errors.required'),
          };
        },
        deps: [TranslocoService],
      },
      controlErrorComponent: CustomControlErrorComponent,
    }),
    NavbarModule,
    FooterModule,
    WysiwygEditorModule,
    LoadingBarHttpClientModule,
    LoadingBarRouterModule,
    LoadingBarModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    PendingChangesGuard,
    LeaveProjectGuard,
  ],
  bootstrap: [AppComponent],
})
/* istanbul ignore next */
export class AppModule {}