/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { AngularCropperjsModule } from '@crawl/angular-cropperjs';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PasswordPageComponent } from './components/password-page/password-page.component';
import { ProfilePageComponent } from './components/profile-page/profile-page.component';
import { SettingsPageComponent } from './components/settings-page/settings-page.component';
import { ProfilePageRoutingModule } from './profile-page-routing.module';

@NgModule({
  declarations: [ProfilePageComponent, PasswordPageComponent, SettingsPageComponent],
  imports: [
    CommonModule,
    ProfilePageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
    FormsModule,
    ErrorTailorModule.forRoot({
      errors: {
        useFactory(translocoService: TranslocoService) {
          return {
            required: () => translocoService.translate('form.errors.required'),
            minlength: ({ requiredLength, actualLength }) =>
              translocoService.translate('form.errors.minlength', { requiredLength, actualLength }),
            mustmatch: () => translocoService.translate('form.errors.mustmatch'),
          };
        },
        deps: [TranslocoService],
      },
      controlErrorComponent: CustomControlErrorComponent,
    }),
    FormHelperModule,
    AngularCropperjsModule,
    AlertModule,
    IconsModule,
    SkeletonsModule,
    UserModule,
    TooltipModule.forRoot(),
    SkeletonsModule,
  ],
})
export class ProfilePageModule {}
