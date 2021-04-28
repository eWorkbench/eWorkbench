/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppointmentModule } from '@app/modules/appointment/appointment.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { ScheduleModule } from '@app/modules/schedule/schedule.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CalendarPageRoutingModule } from './calendar-page-routing.module';
import { CalendarPageComponent } from './components/calendar-page/calendar-page.component';

@NgModule({
  declarations: [CalendarPageComponent],
  imports: [
    CommonModule,
    CalendarPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
    CalendarModule,
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
    ModalsModule,
    ClipboardModule,
    LoadingModule,
    WysiwygEditorModule,
    UserModule,
    ProjectModule,
    BsDropdownModule.forRoot(),
    AppointmentModule,
    IconsModule,
    ScheduleModule,
    SharedModule,
  ],
})
export class CalendarPageModule {}
