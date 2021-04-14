/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { LabBookElement } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

@Component({
  selector: 'eworkbench-labbook-draw-board-element',
  templateUrl: './element.component.html',
  styleUrls: ['./element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardElementComponent {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<any>;

  @Input()
  public section?: string;

  @Input()
  public closeSection?: EventEmitter<string>;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  @Output()
  public moved = new EventEmitter<ElementRemoval>();

  @Output()
  public expand = new EventEmitter<string>();

  public constructor(private readonly translocoService: TranslocoService) {}

  public onRemove(event: ElementRemoval): void {
    this.removed.emit(event);
  }

  public onMove(event: ElementRemoval): void {
    this.moved.emit(event);
  }

  public onExpandSection(id: string): void {
    this.expand.emit(id);
  }
}
