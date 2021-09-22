/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentModule } from '@app/modules/comment/comment.module';
import { ContactModule } from '@app/modules/contact/contact.module';
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
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { VersionsModule } from '@app/modules/versions/versions.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ContactPageComponent } from './components/contact-page/contact-page.component';
import { ContactsPageComponent } from './components/contacts-page/contacts-page.component';
import { MergeDuplicatesModalComponent } from './components/modals/merge-duplicates/merge-duplicates.component';
import { NewContactModalComponent } from './components/modals/new/new.component';
import { ContactsPageRoutingModule } from './contacts-page-routing.module';

@NgModule({
  declarations: [ContactsPageComponent, NewContactModalComponent, ContactPageComponent, MergeDuplicatesModalComponent],
  imports: [
    CommonModule,
    ContactsPageRoutingModule,
    TranslocoRootModule,
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
    FormHelperModule,
    ModalsModule,
    TableModule,
    TrashModule,
    UserModule,
    RecentChangesModule,
    SharedModule,
    VersionsModule,
    LoadingModule,
    LockModule,
    DetailsDropdownModule,
    WysiwygEditorModule,
    MetadataModule,
    ProjectModule,
    ContactModule,
    LinkModule,
    IconsModule,
    SkeletonsModule,
    AlertModule,
    FavoritesModule,
    CommentModule,
    LoadingModule,
    TooltipModule.forRoot(),
  ],
})
export class ContactsPageModule {}
