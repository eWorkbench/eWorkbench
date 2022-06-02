/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@eworkbench/icons';
import { AlertModule } from 'ngx-bootstrap/alert';
import { LockComponent } from './components/lock/lock.component';
import { UserModule } from '../user/user.module';

@NgModule({
  declarations: [LockComponent],
  imports: [CommonModule, RouterModule, TranslocoRootModule, AlertModule.forRoot(), UserModule, IconsModule],
  exports: [LockComponent],
})
export class LockModule {}
