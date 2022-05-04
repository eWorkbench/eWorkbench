/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChildren } from '@angular/core';
import type { LabBookElement } from '@eworkbench/types';

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
  @ViewChildren('elementComponent')
  public elements?: any;

  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<any>;

  @Input()
  public section?: string;

  @Input()
  public editable? = false;

  @Input()
  public closeSection?: EventEmitter<string>;

  @Input()
  public refreshElementRelations?: EventEmitter<{ model_name: string; model_pk: string }>;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  @Output()
  public moved = new EventEmitter<ElementRemoval>();

  @Output()
  public expand = new EventEmitter<string>();

  public onRemove(event: ElementRemoval): void {
    this.removed.emit(event);
  }

  public onMove(event: ElementRemoval): void {
    this.moved.emit(event);
  }

  public onExpandSection(id: string): void {
    this.expand.emit(id);
  }

  public pendingChanges(): boolean {
    for (const element of this.elements ?? []) {
      if (element.pendingChanges()) {
        return true;
      }
    }

    return false;
  }
}
