/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, Self, ViewChild } from '@angular/core';
import { NgControl, Validators } from '@angular/forms';
import { TaskChecklist } from '@eworkbench/types';
import { FormArray, FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { v4 as uuidv4 } from 'uuid';

interface FormAnswers {
  checkboxes: boolean[];
  titles: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-task-checklist',
  templateUrl: './task-checklist.component.html',
  styleUrls: ['./task-checklist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskChecklistComponent implements AfterViewInit {
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('value')
  public _value: TaskChecklist[] = [];

  @Input()
  public editable = false;

  @ViewChild('checkboxElements')
  public checkboxElements!: ElementRef<HTMLDivElement>;

  public checklistObjects: TaskChecklist[] = [];

  public onChange: any = () => {};

  public onTouch: any = () => {};

  public uniqueHash = uuidv4();

  public dropListOrientation = 'vertical';

  public form = this.fb.group<FormAnswers>({
    checkboxes: this.fb.array([]),
    titles: this.fb.array([]),
  });

  public constructor(
    @Self() private readonly ngControl: NgControl,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.ngControl.valueAccessor = this;
  }

  public get f(): FormGroup<FormAnswers>['controls'] {
    return this.form.controls;
  }

  public get checkboxes(): FormArray<boolean> {
    return this.form.get('checkboxes') as FormArray<boolean>;
  }

  public get titles(): FormArray<string> {
    return this.form.get('titles') as FormArray<string>;
  }

  public get value(): TaskChecklist[] {
    const payload: TaskChecklist[] = [];

    for (let i = 0; i < this.titles.controls.length; i++) {
      payload.push({
        pk: this.checklistObjects[i].pk!,
        title: this.titles.controls[i].value,
        checked: this.checkboxes.controls[i].value,
        ordering: i,
      });
    }

    return payload;
  }

  public set value(checklist: TaskChecklist[]) {
    const value = [...(checklist ??= [])];
    this._value = value;
    this.clearItems();
    this.checklistObjects = [...checklist];
    this.initField();
    this.onChange(value);
    this.onTouch(value);
    this.cdr.markForCheck();
  }

  public ngAfterViewInit(): void {
    if (this.ngControl.disabled) {
      this.form.disable();
    } else {
      this.editable = true;
    }
    this.cdr.markForCheck();

    setTimeout(() => this.ngControl.control?.markAsPristine(), 500);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  public writeValue(value: TaskChecklist[]): void {
    this.value = value;
  }

  public initField(): void {
    const items = [...this._value];
    items.map(item => {
      this.checkboxes.push(this.fb.control(item.checked) as any);
      this.titles.push(this.fb.control(item.title, [Validators.required]) as any);
    });
  }

  public clearItems(): void {
    while (this.checkboxes.length) {
      this.checkboxes.removeAt(0);
    }

    while (this.titles.length) {
      this.titles.removeAt(0);
    }

    this.checklistObjects = [];
  }

  public onRemoveItem(element: number): void {
    this.checkboxes.removeAt(element);
    this.titles.removeAt(element);
    this.checklistObjects.splice(element, 1);
    this.onTriggerChange();
  }

  public onAddItem(): void {
    this.checkboxes.push(this.fb.control(false));
    this.titles.push(this.fb.control(''));
    this.checklistObjects.push({ checked: false, title: '', ordering: this.checklistObjects.length });
    this.onTriggerChange(true);
  }

  public onTriggerChange(focus = false): void {
    setTimeout(() => {
      this.onChange(this.value);
      this.onTouch(this.value);

      if (focus) {
        const el = this.checkboxElements.nativeElement.lastElementChild as HTMLDivElement;
        el.querySelector('textarea')?.focus();
      }
    }, 1);
  }

  public onElementDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    this.refreshOrdering(event.previousIndex, event.currentIndex);
  }

  public refreshOrdering(from: number, to: number): void {
    const delta = to < from ? -1 : 1;

    const titles = [...this.titles.controls].map(control => control.value);
    this.titles.controls[to].patchValue(titles[from]);
    for (let i = from; i !== to; i += delta) {
      this.titles.controls[i].patchValue(titles[i + delta]);
    }

    const checkboxes = [...this.checkboxes.controls].map(control => control.value);
    this.checkboxes.controls[to].patchValue(checkboxes[from]);
    for (let i = from; i !== to; i += delta) {
      this.checkboxes.controls[i].patchValue(checkboxes[i + delta]);
    }

    this.onTriggerChange();
  }
}
