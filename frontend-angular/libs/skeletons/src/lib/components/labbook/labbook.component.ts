/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eworkbench-labbook-skeleton',
  templateUrl: './labbook.component.html',
  styleUrls: ['./labbook.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabbookSkeletonComponent {}
