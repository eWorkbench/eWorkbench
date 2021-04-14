/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Self } from '@angular/core';
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
  @Input('value')
  public _value: TaskChecklist[] = [];

  public checklistObjects: TaskChecklist[] = [];

  public editable = false;

  public onChange: any = () => {};

  public onTouch: any = () => {};

  public uniqueHash = uuidv4();

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
        pk: this.checklistObjects[i].pk,
        title: this.titles.controls[i].value,
        checked: this.checkboxes.controls[i].value,
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
    this.checklistObjects.push({ checked: false, title: '' });
    this.onTriggerChange();
  }

  public onTriggerChange(): void {
    setTimeout(() => {
      this.onChange(this.value);
      this.onTouch(this.value);
    }, 1);
  }
}
