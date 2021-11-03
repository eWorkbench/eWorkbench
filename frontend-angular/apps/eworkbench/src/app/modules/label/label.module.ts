/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { ModalsModule } from '@eworkbench/modals';
import { FormsModule } from '@eworkbench/forms';
import { LoadingModule } from '../loading/loading.module';
import { LabelsComponent } from './component/label/label.component';
import { NewLabelModalComponent } from './component/modals/new/new.component';
import { EditLabelModalComponent } from './component/modals/edit/edit.component';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
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
