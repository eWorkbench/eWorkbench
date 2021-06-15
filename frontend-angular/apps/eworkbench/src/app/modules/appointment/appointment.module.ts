/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { LockModule } from '../lock/lock.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { EditAppointmentModalComponent } from './components/modals/edit/edit.component';
import { NewAppointmentModalComponent } from './components/modals/new/new.component';

@NgModule({
  declarations: [NewAppointmentModalComponent, EditAppointmentModalComponent],
  imports: [
    CommonModule,
    SharedModule,
    TranslocoRootModule,
    ModalsModule,
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
    UserModule,
    FormHelperModule,
    WysiwygEditorModule,
    LoadingModule,
    LockModule,
    IconsModule,
  ],
  exports: [NewAppointmentModalComponent, EditAppointmentModalComponent],
})
export class AppointmentModule {}
