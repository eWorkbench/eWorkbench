/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';

interface CollapseData {
  id: string;
  collapsed: boolean;
}

@Component({
  selector: 'eworkbench-secondary-collapse-element',
  templateUrl: './secondary-collapse-element.component.html',
  styleUrls: ['./secondary-collapse-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryCollapseElementComponent implements OnInit {
  @Input()
  public id?: string;

  @Input()
  public labelText?: string;

  @Input()
  public labelTemplate?: TemplateRef<any>;

  @Input()
  public element?: any;

  @Input()
  public collapsed = false;

  @Input()
  public collapsible = true;

  @Input()
  public background = true;

  @Input()
  public center = true;

  @Input()
  public collapse = new EventEmitter<string>();

  @Output()
  public toggled = new EventEmitter<CollapseData>();

  public constructor(private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.collapse.subscribe((event: string) => {
      if (event !== this.id) {
        this.collapsed = true;
        this.cdr.markForCheck();
      }
    });
  }

  public onToggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.toggled.emit({ id: this.id ?? '', collapsed: this.collapsed });
  }
}
