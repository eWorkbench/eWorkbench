/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep } from 'lodash';

@UntilDestroy()
@Component({
  selector: 'eworkbench-picture-editor-details-dropdown',
  templateUrl: './picture-editor-details-dropdown.component.html',
  styleUrls: ['./picture-editor-details-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PictureEditorDetailsDropdownComponent implements OnInit {
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

  public loading = false;

  public dropdown = true;

  public detailsCollapsed = true;

  public shapesBackup: any = null;

  public constructor(private readonly cdr: ChangeDetectorRef, private readonly breakpointObserver: BreakpointObserver) {}

  public ngOnInit(): void {
    this.breakpointObserver
      .observe(['(min-width: 769px)'])
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        /* istanbul ignore if */
        if (res.matches) {
          this.dropdown = true;
          this.detailsCollapsed = true;
          this.cdr.markForCheck();
          return;
        }
        this.dropdown = false;
        this.cdr.markForCheck();
      });
  }

  public clear(): void {
    this.canvas.clear();
  }

  public toggleVisible(): void {
    if (this.shapesBackup) {
      this.canvas.shapes = [...this.shapesBackup];
      this.shapesBackup = null;
    } else {
      this.shapesBackup = cloneDeep(this.canvas.shapes);
      this.canvas.shapes = [];
    }

    this.repaint();
  }

  public onUploadBackgroundImage(event: Event): void {
    /* istanbul ignore next */
    const files = (event.target as HTMLInputElement).files;
    /* istanbul ignore next */
    if (files?.length) {
      const reader = new FileReader();
      reader.onload = async () => {
        if (this.loading) {
          return;
        }
        this.loading = true;

        this.backgroundImage!.src = URL.createObjectURL(files[0]);

        const backgroundImage: any = await fetch(this.backgroundImage!.src).then(res => res.blob());
        backgroundImage.name = `${this.picture.pk as string}_background.png`;

        this.service
          .uploadImage(this.picture.pk, {
            background_image: backgroundImage,
            width: this.picture.width,
            height: this.picture.height,
          })
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.canvas.undoStack = [];
            this.loading = false;
            this.cdr.markForCheck();
          });
      };
      reader.readAsBinaryString(files[0]);
    }
  }

  private repaint(): void {
    this.canvas.setShapesInProgress([]);
    this.canvas.repaintLayer('main');
  }
}
