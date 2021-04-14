/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppointmentModule } from '@app/modules/appointment/appointment.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { StudyRoomBookingPageComponent } from './components/study-room-booking-page/study-room-booking-page.component';
import { StudyRoomDetailsComponent } from './components/study-room-details/study-room-details.component';
import { StudyRoomBookingPageRoutingModule } from './study-room-booking-page-routing.module';

@NgModule({
  declarations: [StudyRoomBookingPageComponent, StudyRoomDetailsComponent],
  imports: [
    CommonModule,
    StudyRoomBookingPageRoutingModule,
    TranslocoRootModule,
    LoadingModule,
    FormsModule,
    FormHelperModule,
    HeaderModule,
    CalendarModule,
    AppointmentModule,
    CollapseModule.forRoot(),
    UserModule,
    WysiwygEditorModule,
    MetadataModule,
    SharedModule,
    AppointmentModule,
    ResourceModule,
  ],
})
export class StudyRoomBookingPageModule {}
