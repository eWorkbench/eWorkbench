/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, Self, ViewChild } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';

@Component({
  selector: 'eworkbench-wysiwyg-editor',
  templateUrl: './wysiwyg-editor.component.html',
  styleUrls: ['./wysiwyg-editor.component.scss'],
})
export class WysiwygEditorComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  @Input()
  public id!: string;

  @Input()
  public maxHeight: number | false = 500;

  public init = {
    base_url: '/tinymce',
    suffix: '.min',
    menubar: false,
    statusbar: false,
    branding: false,
    max_height: this.maxHeight,
    external_plugins: {
      formula: 'plugins/tinymce-formula/plugin.js',
    },
    plugins: [
      'advlist autolink autoresize lists link image charmap print preview anchor searchreplace visualblocks code fullscreen',
      'insertdatetime textpattern media table paste code help hr quickbars',
    ],
    toolbar_location: 'top',
    toolbar_mode: 'sliding',
    toolbar:
      'formatselect | bold italic underline strikethrough forecolor backcolor | table | removeformat | alignleft aligncenter alignright alignjustify | charmap superscript subscript | link image | numlist bullist outdent indent hr | formula',
    quickbars_insert_toolbar: '',
    quickbars_selection_toolbar:
      'bold italic underline strikethrough forecolor backcolor | removeformat  | alignleft aligncenter alignright alignjustify | superscript subscript | formula',
    contextmenu: 'inserttable | cell row column deletetable | charmap | hr',
    paste_data_images: true,
    content_css: '/assets/styles/tinymce.css',
    file_picker_types: 'image',
    file_picker_callback: (cb: any) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');

      input.onchange = () => {
        if (input.files) {
          const file: File = input.files[0];

          const reader = new FileReader();
          reader.onload = () => {
            const id = `blobid${new Date().getTime()}`;
            const blobCache = this.editor?.editor?.editorUpload.blobCache;
            if (reader.result) {
              const base64 = (reader.result as string).split(',')[1];
              const blobInfo = blobCache.create(id, file, base64);
              blobCache.add(blobInfo);

              cb(blobInfo.blobUri(), { title: file.name });
            }
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    },
  };

  @Input()
  public initialValue?: string;

  @Input()
  public inline?: boolean = false;

  @Input()
  public disabled?: boolean = false;

  @Input()
  public tagName?: string = 'div';

  @Input()
  public plugins?: string;

  @Input()
  public toolbar?: string | string[];

  @ViewChild(EditorComponent)
  public editor?: EditorComponent;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onChanged: any = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onTouched: any = () => {};

  public constructor(@Self() public readonly ngControl: NgControl, private readonly cdr: ChangeDetectorRef) {
    ngControl.valueAccessor = this;
  }

  public ngOnInit(): void {
    this.init.max_height = this.maxHeight;
  }

  public ngAfterViewInit(): void {
    this.ngControl.valueChanges?.subscribe(() => {
      this.cdr.markForCheck();
    });

    setTimeout(() => this.editor?.editor?.setMode(this.disabled ? 'readonly' : 'design'), 500);
  }

  public writeValue(value: string | null): void {
    if (this.ngControl.value !== value) {
      this.onChanged(value);
    }
  }

  public registerOnChange(fn: any): void {
    this.onChanged = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
