/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HeaderModule } from '@app/modules/header/header.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { TableModule } from '@eworkbench/table';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { MetadataSearchPageComponent } from './components/metadata-search-page/metadata-search-page.component';
import { MetadataSearchPageRoutingModule } from './metadata-search-page-routing.module';

@NgModule({
  declarations: [MetadataSearchPageComponent],
  imports: [
    CommonModule,
    MetadataSearchPageRoutingModule,
    TranslocoRootModule,
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
    HeaderModule,
    FormsModule,
    MetadataModule,
    TableModule,
    SharedModule,
    UserModule,
  ],
})
export class MetadataSearchPageModule {}
