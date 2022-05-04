/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ForgotPasswordPageComponent } from './components/forgot-password-page/forgot-password-page.component';
import { ForgotPasswordPageRoutingModule } from './forgot-password-page-routing.module';

@NgModule({
  declarations: [ForgotPasswordPageComponent],
  imports: [
    CommonModule,
    ForgotPasswordPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
    FormsModule,
    FormHelperModule,
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
    RouterModule,
    AlertModule.forRoot(),
  ],
})
export class ForgotPasswordPageModule {}
