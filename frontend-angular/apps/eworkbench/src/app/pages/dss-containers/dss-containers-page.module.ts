/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DssContainersPageRoutingModule } from './dss-containers-page-routing.module';
import { DssContainersPageComponent } from './components/dss-containers-page/dss-containers-page.component';
import { DssContainerPageComponent } from './components/dss-container-page/dss-container-page.component';
import { HeaderModule } from '@app/modules/header/header.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { TableModule } from '@eworkbench/table';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { DssContainerModule } from '@app/modules/dss-container/dss-container.module';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { NewDssContainerModalComponent } from './components/modals/new/new.component';
import { ModalsModule } from '@eworkbench/modals';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';

@NgModule({
  declarations: [DssContainersPageComponent, DssContainerPageComponent, NewDssContainerModalComponent],
  imports: [
    CommonModule,
    DssContainersPageRoutingModule,
    TranslocoRootModule,
    DssContainerModule,
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
    IconsModule,
    TableModule,
    SharedModule,
    UserModule,
    SkeletonsModule,
    LoadingModule,
    ModalsModule,
    DetailsDropdownModule,
    TrashModule,
    LockModule,
    RecentChangesModule,
  ],
})
export class DssContainersPageModule {}
