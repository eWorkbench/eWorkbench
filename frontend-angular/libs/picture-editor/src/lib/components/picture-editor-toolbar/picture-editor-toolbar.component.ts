/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep } from 'lodash';
import { PictureEditorTool } from '../../enums/picture-editor-tool.enum';
import type { SaveSketchEvent } from '../../interfaces/save-sketch-event.interface';

declare global {
  interface Window {
    CH: any;
  }
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-picture-editor-toolbar',
  templateUrl: './picture-editor-toolbar.component.html',
  styleUrls: ['./picture-editor-toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PictureEditorToolbarComponent implements OnInit {
  @Input()
  public picture: any;

  @Input()
  public sketch = false;

  @Input()
  public backgroundImage?: HTMLImageElement;

  @Input()
  public canvas: any;

  @Input()
  public service: any;

  @Output()
  public saveSketch = new EventEmitter<SaveSketchEvent>();

  public loading = true;

  public tools = PictureEditorTool;

  public selectedTool: PictureEditorTool | null = null;

  public selectedShape: any = null;

  public selectedShapeClone: any = null;

  public get canUndo(): boolean {
    if (this.canvas) {
      return this.canvas.canUndo();
    }

    return false;
  }

  public get canRedo(): boolean {
    if (this.canvas) {
      return this.canvas.canRedo();
    }

    return false;
  }

  public constructor(public readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.loading = false;

    this.canvas.on('shapeSelected', (data: { selectedShape: Record<string, any> }) => {
      if (data.selectedShape.className === 'ErasedLinePath') {
        return this.resetSelection();
      }
      this.selectedShape = data.selectedShape;
      this.selectedShapeClone = cloneDeep(data.selectedShape);
      this.cdr.markForCheck();
    });

    this.canvas.on('drawingChange', () => {
      this.cdr.markForCheck();
    });
  }

  public selectTool(tool: PictureEditorTool): void {
    switch (tool) {
      case PictureEditorTool.Select:
        this.resetSelection();
        this.canvas.setTool(new window.CH.SelectShape(this.canvas));
        this.selectedTool = PictureEditorTool.Select;
        break;

      case PictureEditorTool.Text:
        this.resetSelection();
        this.canvas.setTool(new window.CH.Text(this.canvas));
        this.selectedTool = PictureEditorTool.Text;
        break;

      case PictureEditorTool.Pen:
        this.resetSelection();
        this.canvas.setTool(new window.CH.Pencil(this.canvas));
        this.selectedTool = PictureEditorTool.Pen;
        break;

      case PictureEditorTool.Eraser:
        this.resetSelection();
        this.canvas.setTool(new window.CH.Eraser(this.canvas));
        this.selectedTool = PictureEditorTool.Eraser;
        break;

      case PictureEditorTool.Line:
        this.resetSelection();
        this.canvas.setTool(new window.CH.Line(this.canvas));
        this.selectedTool = PictureEditorTool.Line;
        break;

      case PictureEditorTool.Ellipse:
        this.resetSelection();
        this.canvas.setTool(new window.CH.Ellipse(this.canvas));
        this.selectedTool = PictureEditorTool.Ellipse;
        break;

      case PictureEditorTool.Polygon:
        this.resetSelection();
        this.canvas.setTool(new window.CH.Polygon(this.canvas));
        this.selectedTool = PictureEditorTool.Polygon;
        break;

      case PictureEditorTool.Square:
        this.resetSelection();
        this.canvas.setTool(new window.CH.Rectangle(this.canvas));
        this.selectedTool = PictureEditorTool.Square;
        break;

      default:
        this.resetSelection();
        this.canvas.setTool(new window.CH.SelectShape(this.canvas));
        this.selectedTool = PictureEditorTool.Select;
        break;
    }
  }

  public getPrimaryColor(shape = this.selectedShape): string {
    if (shape) {
      if (Reflect.has(shape, 'smoothedPoints')) {
        if (shape.smoothedPoints.length) {
          return shape.smoothedPoints[0].color;
        }
      } else if (Reflect.has(shape, 'points')) {
        if (shape.points.length) {
          return shape.points[0].color;
        }
      } else if (Reflect.has(shape, 'strokeColor')) {
        return shape.strokeColor;
      } else {
        return shape.color;
      }
    }

    return this.canvas.getColor('primary');
  }

  public getSecondaryColor(shape = this.selectedShape): string {
    if (shape) {
      if (Reflect.has(shape, 'fillColor')) {
        return shape.fillColor;
      }
    }

    return this.canvas.getColor('secondary');
  }

  public changePrimaryColor(color: string, shape = this.selectedShape): void {
    if (shape) {
      if (Reflect.has(shape, 'smoothedPoints')) {
        for (const smoothedPoint of shape.smoothedPoints) {
          smoothedPoint.color = color;
        }
      } else if (Reflect.has(shape, 'points')) {
        for (const point of shape.points) {
          point.color = color;
        }
      } else if (Reflect.has(shape, 'strokeColor')) {
        shape.strokeColor = color;
      } else {
        shape = color;
      }

      this.canvas.repaintLayer('main');
    }

    this.canvas.setColor('primary', color);
  }

  public changeSecondaryColor(color: string, shape = this.selectedShape): void {
    if (shape) {
      if (Reflect.has(shape, 'fillColor')) {
        shape.fillColor = color;
        this.canvas.repaintLayer('main');
      }
    }

    this.canvas.setColor('secondary', color);
  }

  public changePrimaryColorHistory(shape = this.selectedShape, clone = this.selectedShapeClone): void {
    if (shape && clone) {
      const localShape = cloneDeep(clone);
      this.canvas.execute({
        do: () => {
          this.changePrimaryColor(this.canvas.getColor('primary'));
        },
        undo: () => {
          this.changePrimaryColor(this.getPrimaryColor(localShape));
        },
      });
    }
  }

  public changeSecondaryColorHistory(shape = this.selectedShape, clone = this.selectedShapeClone): void {
    if (shape && clone) {
      const localShape = cloneDeep(clone);
      this.canvas.execute({
        do: () => {
          this.changeSecondaryColor(this.canvas.getColor('secondary'));
        },
        undo: () => {
          this.changeSecondaryColor(this.getSecondaryColor(localShape));
        },
      });
    }
  }

  public async save(): Promise<void> {
    const toBlob = (canvas: HTMLCanvasElement): Promise<unknown> => new Promise(resolve => canvas.toBlob(resolve));

    this.resetSelection();
    this.loading = true;

    const renderedImage: any = await toBlob(this.canvas.getImage());
    const shapes: any = new Blob([JSON.stringify(this.canvas.getSnapshot().shapes)], { type: 'application/json' });

    if (this.sketch) {
      renderedImage.name = 'rendered.png';
      shapes.name = 'shapes.json';

      this.saveSketch.emit({ file: renderedImage, shapes });
      this.loading = false;
      this.cdr.markForCheck();
    } else {
      renderedImage.name = `${this.picture.pk as string}_rendered.png`;
      shapes.name = `${this.picture.pk as string}_shapes.json`;

      let backgroundImage: any;
      if (this.backgroundImage?.src) {
        backgroundImage = await fetch(this.backgroundImage.src).then(res => res.blob());
        backgroundImage.name = `${this.picture.pk as string}_background.png`;
      }

      this.service
        .uploadImage(this.picture.pk, {
          background_image: backgroundImage,
          shapes_image: shapes,
          width: this.picture.width,
          height: this.picture.height,
          rendered_image: renderedImage,
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.canvas.undoStack = [];
          this.loading = false;
          this.cdr.markForCheck();
        });
    }
  }

  public deleteShape(shape = this.selectedShape): void {
    if (shape) {
      const localSelectedShape = cloneDeep(shape);
      const original = cloneDeep(this.canvas.shapes);
      const filtered = original.filter((shape: { id: string }) => shape.id !== localSelectedShape.id);
      this.canvas.execute({
        do: () => {
          this.canvas.shapes = [...filtered];
          this.resetSelection();
        },
        undo: () => {
          this.canvas.shapes = [...original];
          this.alignSelection(localSelectedShape);
        },
      });
    }
  }

  public undo(): void {
    if (this.canUndo) {
      this.canvas.undo();
      this.alignSelection();
    }
  }

  public redo(): void {
    if (this.canRedo) {
      this.canvas.redo();
      this.alignSelection();
    }
  }

  private alignSelection(shape = this.selectedShape): void {
    if (shape) {
      this.canvas.setShapesInProgress([]);
      this.canvas.setShapesInProgress([
        shape,
        window.CH.shapes.createShape('SelectionBox', {
          shape,
          handleSize: 0,
        }),
      ]);
      this.canvas.repaintLayer('main');
    }
  }

  private resetSelection(): void {
    this.selectedShape = null;
    this.selectedShapeClone = null;
    this.canvas.setShapesInProgress([]);
    this.canvas.repaintLayer('main');
  }
}
