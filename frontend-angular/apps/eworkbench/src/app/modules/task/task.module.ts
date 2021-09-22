/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DragDropModule } from '@angular/cdk/drag-drop';
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
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TextareaAutosizeModule } from 'ngx-textarea-autosize';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LabelModule } from '../label/label.module';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { NewTaskModalComponent } from './components/modals/new/new.component';
import { TaskChecklistComponent } from './components/task-checklist/task-checklist.component';
import { TaskPriorityComponent } from './components/task-priority/task-priority.component';
import { TaskStateComponent } from './components/task-state/task-state.component';

@NgModule({
  declarations: [NewTaskModalComponent, TaskStateComponent, TaskPriorityComponent, TaskChecklistComponent],
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
    LabelModule,
    IconsModule,
    LoadingModule,
    TooltipModule.forRoot(),
    TextareaAutosizeModule,
    DragDropModule,
  ],
  exports: [NewTaskModalComponent, TaskStateComponent, TaskPriorityComponent, TaskChecklistComponent],
})
export class TaskModule {}
