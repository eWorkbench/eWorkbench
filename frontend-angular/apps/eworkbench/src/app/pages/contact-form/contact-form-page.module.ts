/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { ContactFormPageComponent } from './components/contact-form-page/contact-form-page.component';
import { ContactFormPageRoutingModule } from './contact-form-routing.module';

@NgModule({
  declarations: [ContactFormPageComponent],
  imports: [
    CommonModule,
    ContactFormPageRoutingModule,
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
    WysiwygEditorModule,
  ],
})
export class ContactFormPageModule {}
