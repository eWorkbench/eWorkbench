/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CompactType, DisplayGrid, GridsterConfig, GridType } from 'angular-gridster2';

export const gridsterConfig: GridsterConfig = {
  gridType: GridType.VerticalFixed,
  compactType: CompactType.None,
  setGridSize: true,
  margin: 6,
  outerMargin: true,
  outerMarginTop: 6,
  outerMarginRight: 6,
  outerMarginBottom: 6,
  outerMarginLeft: 6,
  useTransformPositioning: true,
  mobileBreakpoint: 640,
  minCols: 20,
  maxCols: 20,
  minRows: 20,
  maxRows: 5000,
  minItemCols: 1,
  maxItemCols: 20,
  minItemRows: 1,
  maxItemRows: 5000,
  minItemArea: 1,
  maxItemArea: 100000,
  defaultItemCols: 20,
  defaultItemRows: 14,
  fixedColWidth: 50,
  fixedRowHeight: 50,
  keepFixedHeightInMobile: false,
  keepFixedWidthInMobile: false,
  scrollSensitivity: 10,
  scrollSpeed: 20,
  enableEmptyCellClick: false,
  enableEmptyCellContextMenu: false,
  enableEmptyCellDrop: false,
  enableEmptyCellDrag: false,
  enableOccupiedCellDrop: false,
  emptyCellDragMaxCols: 50,
  emptyCellDragMaxRows: 50,
  ignoreMarginInRow: false,
  draggable: {
    enabled: true,
    ignoreContent: true,
    dragHandleClass: 'drag-handle',
  },
  resizable: {
    enabled: true,
  },
  swap: true,
  pushItems: true,
  disablePushOnDrag: false,
  disablePushOnResize: false,
  pushDirections: {
    north: true,
    east: true,
    south: true,
    west: true,
  },
  pushResizeItems: false,
  displayGrid: DisplayGrid.Always,
  disableWindowResize: false,
  disableWarnings: false,
  scrollToNewItems: true,
};