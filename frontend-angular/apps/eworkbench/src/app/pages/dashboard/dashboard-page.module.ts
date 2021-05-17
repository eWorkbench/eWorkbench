/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppointmentModule } from '@app/modules/appointment/appointment.module';
import { DMPModule } from '@app/modules/dmp/dmp.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TaskModule } from '@app/modules/task/task.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { DashboardElementComponent } from './components/dashboard-element/dashboard-element.component';
import { DashboardPageComponent } from './components/dashboard-page/dashboard-page.component';
import { DashboardPageRoutingModule } from './dashboard-page-routing.module';

@NgModule({
  declarations: [DashboardPageComponent, DashboardElementComponent],
  imports: [
    CommonModule,
    DashboardPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
    LoadingModule,
    TableModule,
    ModalsModule,
    CalendarModule,
    SharedModule,
    FormsModule,
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
    SharedModule,
    BsDropdownModule.forRoot(),
    IconsModule,
    ProjectModule,
    TaskModule,
    DMPModule,
    ResourceModule,
    AppointmentModule,
    TooltipModule.forRoot(),
    CollapseModule.forRoot(),
    UserModule,
    SkeletonsModule,
  ],
})
export class DashboardPageModule {}
