/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LoadingComponent } from './components/loading/loading.component';
import { TableColumnComponent } from './components/table-columns/table-columns.component';
import { TableSortComponent } from './components/table-sort/table-sort.component';
import { TableViewComponent } from './components/table-view/table-view.component';
import { TreeViewComponent } from './components/tree-view/tree-view.component';

@NgModule({
  declarations: [TableViewComponent, TreeViewComponent, TableSortComponent, TableColumnComponent, LoadingComponent],
  imports: [CommonModule, CdkTableModule, DragDropModule, IconsModule, FormsModule, BsDropdownModule.forRoot(), TooltipModule.forRoot()],
  exports: [TableViewComponent, TreeViewComponent, TableColumnComponent],
})
export class TableModule {}
