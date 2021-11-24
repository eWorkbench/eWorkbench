/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentModule } from '@app/modules/comment/comment.module';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FavoritesModule } from '@app/modules/favorites/favorites.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LinkModule } from '@app/modules/link/link.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NewResourceModalComponent } from './components/modals/new/new.component';
import { ResourcePageComponent } from './components/resource-page/resource-page.component';
import { ResourcesPageComponent } from './components/resources-page/resources-page.component';
import { ResourcesPageRoutingModule } from './resources-page-routing.module';

@NgModule({
  declarations: [ResourcesPageComponent, NewResourceModalComponent, ResourcePageComponent],
  imports: [
    CommonModule,
    ResourcesPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
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
    FormHelperModule,
    ModalsModule,
    TableModule,
    TrashModule,
    UserModule,
    RecentChangesModule,
    SharedModule,
    LoadingModule,
    LockModule,
    DetailsDropdownModule,
    WysiwygEditorModule,
    MetadataModule,
    CalendarModule,
    ResourceModule,
    ProjectModule,
    IconsModule,
    SkeletonsModule,
    ResourceModule,
    LinkModule,
    TooltipModule.forRoot(),
    FavoritesModule,
    CommentModule,
  ],
})
export class ResourcesPageModule {}
