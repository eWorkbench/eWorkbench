/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ResizeEvent } from 'angular-resizable-element';
import { SaveSketchEvent } from '../../interfaces/save-sketch-event.interface';
import { scriptLoader } from '../../util/script-loader';

declare global {
  interface Window {
    CH: any;
  }
}

export const PICTURE_EDITOR_SCRIPT_SRC = new InjectionToken<string>('PICTURE_EDITOR_SCRIPT_SRC');

@UntilDestroy()
@Component({
  selector: 'eworkbench-picture-editor',
  templateUrl: './picture-editor.component.html',
  styleUrls: ['./picture-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PictureEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public picture?: any = {};

  @Input()
  public sketch = false;

  @Input()
  public service: any;

  @Output()
  public saveSketch = new EventEmitter<SaveSketchEvent>();

  @ViewChild('core', { static: true })
  public core!: ElementRef<HTMLDivElement>;

  public canvas: any | undefined;

  public backgroundImage = new Image();

  public style: Record<string, string> = {};

  public loading = true;

  public constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    @Inject(DOCUMENT) private readonly document: Document,
    @Optional() @Inject(PICTURE_EDITOR_SCRIPT_SRC) private readonly pictureEditorScriptSrc?: string
  ) {}

  public ngOnInit(): void {
    this.style = {
      'width.px': (((this.picture.width as number | undefined) ?? 600) + 2).toString(),
    };
  }

  public ngAfterViewInit(): void {
    scriptLoader(this.document, this.pictureEditorScriptSrc ?? '/canvas/canvas-helper.min.js', () => this.initialize());
  }

  public ngOnDestroy(): void {
    this.canvas?._teardown();
  }

  public initialize(): void {
    if (!this.sketch && this.picture.download_background_image) {
      this.backgroundImage.crossOrigin = 'anonymous';
      this.backgroundImage.src = this.picture.download_background_image;
    }

    this.ngZone.runOutsideAngular(() => {
      this.canvas = new window.CH.CanvasHelper(this.core.nativeElement, {
        ...window.CH.defaultOptions,
        imageSize: {
          width: this.picture.width ?? 600,
          height: this.picture.height ?? 600,
        },
        toolbarPosition: 'hidden',
        tools: [window.CH.SelectShape],
        backgroundShapes:
          !this.sketch && this.picture.download_background_image
            ? [window.CH.shapes.createShape('Image', { x: 0, y: 0, image: this.backgroundImage, scale: 1 })]
            : [],
      });
      this.canvas.setColor('primary', '#000000');
      this.canvas.setColor('secondary', '#00000000');
      this.canvas.undoStack = [];
    });

    if (!this.sketch && this.picture.download_shapes) {
      this.service
        .downloadShapes(this.picture.download_shapes)
        .pipe(untilDestroyed(this))
        .subscribe((shapes: Record<string, any>[]) => {
          this.canvas?.loadSnapshot({
            shapes,
          });
          this.canvas.undoStack = [];
        });
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  public resizeValidate(event: ResizeEvent): boolean {
    const MIN_DIMENSIONS_PX = 200;
    if ((event.rectangle.width ?? 0) < MIN_DIMENSIONS_PX || (event.rectangle.height ?? 0) < MIN_DIMENSIONS_PX) {
      return false;
    }

    return true;
  }

  public onResize(event: ResizeEvent): void {
    if (event.edges.right) {
      this.picture.width = event.rectangle.width ?? 600;
      this.style = {
        'width.px': ((this.picture.width as number) + 2).toString(),
      };

      this.canvas.setImageSize(this.picture.width, this.picture.height);
      window.dispatchEvent(new Event('resize'));
    } else if (event.edges.bottom) {
      this.picture.height = event.rectangle.height ?? 600;
      this.canvas.setImageSize(this.picture.width, this.picture.height);
      window.dispatchEvent(new Event('resize'));
    }
  }
}
