/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { PicturesService } from '@app/services';
import type { Picture } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-picture-editor-modal',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictureEditorModalComponent {
  public initialState?: Picture = this.modalRef.data?.initialState;

  public state = ModalState.Unchanged;

  public privileges = this.modalRef.data?.privileges;

  public constructor(public readonly modalRef: DialogRef, public readonly picturesService: PicturesService) {}
}
