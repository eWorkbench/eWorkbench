/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-change-project-member-role-modal',
  templateUrl: './change-role.component.html',
  styleUrls: ['./change-role.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeProjectMemberRoleModalComponent {
  public constructor(public readonly modalRef: DialogRef, private readonly translocoService: TranslocoService) {}
}
