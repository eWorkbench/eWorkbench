/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { ModalsModule } from '@eworkbench/modals';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LabelsComponent } from './component/label/label.component';
import { EditLabelModalComponent } from './component/modals/edit/edit.component';
import { NewLabelModalComponent } from './component/modals/new/new.component';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [LabelsComponent, NewLabelModalComponent, EditLabelModalComponent],
  imports: [
    CommonModule,
    RouterModule,
    TranslocoRootModule,
    ModalsModule,
    FormsModule,
    FormHelperModule,
    LoadingModule,
    TooltipModule.forRoot(),
    SharedModule,
  ],
  exports: [LabelsComponent, NewLabelModalComponent, EditLabelModalComponent],
})
export class LabelModule {}
