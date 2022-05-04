/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HeaderModule } from '@app/modules/header/header.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { PrivacyPolicyPageComponent } from './components/privacy-policy-page/privacy-policy-page.component';
import { PrivacyPolicyPageRoutingModule } from './privacy-policy-routing.module';

@NgModule({
  declarations: [PrivacyPolicyPageComponent],
  imports: [CommonModule, PrivacyPolicyPageRoutingModule, TranslocoRootModule, HeaderModule, LoadingModule, SharedModule],
})
export class PrivacyPolicyPageModule {}
