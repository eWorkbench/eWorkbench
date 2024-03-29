/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { MetadataTagsService } from '@app/services';
import type { DatePickerConfig, Metadata, MetadataFieldSearchConfig, MetadataFieldTypeSettings, MetadataTag } from '@eworkbench/types';
import { FormArray, FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface FormAnswers {
  answers: FormArray<boolean | string | number | null>;
}

// TODO: Inputs should be formatted respecting the thousands separator and decimals
@UntilDestroy()
@Component({
  selector: 'eworkbench-metadata-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss'],
})
export class MetadataFieldComponent implements OnInit {
  @Input()
  public baseType?: string;

  @Input()
  public uuid?: string;

  @Input()
  public id?: string;

  @Input()
  public values?: any;

  @Input()
  public typeSettings?: MetadataFieldTypeSettings;

  @Input()
  public label?: string | null;

  @Input()
  public editable? = false;

  @Input()
  public cancelChanges = new EventEmitter<Metadata>();

  @Output()
  public changed = new EventEmitter<any>();

  public loading = false;

  public tags: MetadataTag[] = [];

  public selectedValues: string[] = [];

  public singleSelected?: string;

  public datetimeMode = 'daytime';

  public datepicker = false;

  public currentDate = new Date();

  public datePickerConfig: DatePickerConfig = {
    dateFormat: 'Y-m-d H:i',
    enableTime: true,
    time_24hr: true,
    minuteIncrement: 1,
    locale: {
      firstDayOfWeek: 1,
    },
    defaultHour: this.currentDate.getHours(),
    defaultMinute: this.currentDate.getMinutes(),
  };

  public realDatePickerConfig: DatePickerConfig = {
    dateFormat: 'Y-m-d',
    enableTime: false,
    locale: {
      firstDayOfWeek: 1,
    },
  };

  public timePickerConfig: DatePickerConfig = {
    dateFormat: 'H:i',
    enableTime: true,
    minuteIncrement: 1,
    noCalendar: true,
    time_24hr: true,
    defaultHour: this.currentDate.getHours(),
    defaultMinute: this.currentDate.getMinutes(),
  };

  public datetimePickerConfig: DatePickerConfig = {};

  public datetimeMask = '0000-M0-d0 Hh:m0';

  public form = this.fb.group<FormAnswers>({
    answers: this.fb.array([]),
  });

  public labels: string[] = [];

  public customInputSelectedControl = this.fb.control<boolean>(false);

  public customInputControl = this.fb.control<string | null>(null);

  // This awkward value is used to support existing selected options from the legacy Angular frontend.
  // Probably should receive a migration to fix this in the future.
  public customInputValue = "vm.metadata.values['custom_input']";

  public constructor(
    private readonly fb: FormBuilder,
    private readonly translocoService: TranslocoService,
    private readonly metadataTagsService: MetadataTagsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  private get f() {
    return this.form.controls;
  }

  public get answers(): FormArray<string | boolean> {
    return this.form.get('answers') as any;
  }

  public ngOnInit(): void {
    this.initField();
    this.onChanged();

    this.cancelChanges.pipe(untilDestroyed(this)).subscribe(event => {
      this.resetField(event);
    });

    this.customInputSelectedControl.value$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onChanged();
    });
  }

  public initField(): void {
    const answers = this.typeSettings?.answers;
    const values = this.values;
    const isCheckbox = this.showCheckbox();

    if (!this.uuid) {
      this.uuid = this.id;
    }

    if (this.baseType === 'checkbox') {
      this.answers.push(this.fb.control({ value: values ? values.value : false, disabled: !this.editable }));
      if (values?.value) {
        this.selectedValues.push(this.id!);
      }
    } else if (this.baseType === 'selection' && answers) {
      answers.map(answer => this.answers.push(this.fb.control({ value: answer, disabled: true }) as any));

      if (values) {
        if (isCheckbox) {
          values.answers?.map((value: { answer: string; selected: boolean }) => {
            if (value.selected) {
              this.selectedValues.push(value.answer);
            }
          });

          if (this.isNotFinal()) {
            this.customInputSelectedControl.patchValue(values.custom_input_selected, { emitEvent: false });
          }
        } else {
          this.singleSelected = values.single_selected;
        }

        if (this.isNotFinal()) {
          this.customInputControl.patchValue(values.custom_input, { emitEvent: false });
          if (!this.editable) {
            this.customInputSelectedControl.disable();
            this.customInputControl.disable();
          }
        }
      }
    } else if (this.baseType === 'fraction') {
      ['numerator', 'denominator'].map(
        /* istanbul ignore next*/ field => {
          this.answers.push(
            this.fb.control(
              {
                value: values ? values[field] : '',
                disabled: !this.editable,
              },
              [Validators.pattern(/^[-+]?[1-9]\d*$/)]
            )
          );
          this.labels.push(this.translocoService.translate(`metadata.field.fraction.${field}.label`));
        }
      );
    } else if (this.baseType === 'gps') {
      // x coordinate
      this.answers.push(
        this.fb.control(
          {
            value: values ? values.x : '',
            disabled: !this.editable,
          },
          [Validators.pattern(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/)]
        )
      );
      this.labels.push(this.translocoService.translate('metadata.field.gps.x.label'));

      // y coordinate
      this.answers.push(
        this.fb.control(
          {
            value: values ? values.y : '',
            disabled: !this.editable,
          },
          [Validators.pattern(/^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)]
        )
      );
      this.labels.push(this.translocoService.translate('metadata.field.gps.y.label'));
    } else if (this.baseType === 'time') {
      this.datetimePickerConfig = this.timePickerConfig;
      this.datepicker = true;

      let value = '';
      if (values?.value && !isNaN(values.value)) {
        value = new Date(values.value * 1000 * 60).toISOString().substr(11, 5);
      }

      // 24h time format with an optional leading zero
      this.answers.push(
        this.fb.control({ value, disabled: !this.editable }, [Validators.pattern(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)]) as any
      );
      this.labels.push(this.label ?? '');
    } else if (this.baseType === 'tag') {
      this.metadataTagsService
        .get()
        .pipe(untilDestroyed(this))
        .subscribe(
          tags => {
            this.tags = tags;
            this.loading = false;
            this.cdr.markForCheck();
          },
          () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
      this.answers.push(this.fb.control({ value: values?.answers ?? [], disabled: !this.editable }));
    } else {
      if (this.baseType === 'date') {
        this.datetimePickerConfig = this.datePickerConfig;
        this.datepicker = true;
      } else if (this.baseType === 'real_date') {
        this.datetimePickerConfig = this.realDatePickerConfig;
        this.datepicker = true;
      }

      this.answers.push(this.fb.control({ value: values ? values.value : '', disabled: !this.editable }));
      this.labels.push(this.label ?? '');
    }
  }

  public showCheckbox(): boolean {
    if (this.baseType === 'checkbox') {
      return true;
    } else if (this.baseType === 'selection' && this.typeSettings?.multiple_select) {
      return true;
    }
    return false;
  }

  public showRadio(): boolean {
    if (this.baseType === 'selection' && !this.typeSettings?.multiple_select) {
      return true;
    }
    return false;
  }

  public toggleSelection(selection?: string): void {
    if (selection) {
      const index = this.selectedValues.indexOf(selection, 0);
      if (index > -1) {
        this.selectedValues.splice(index, 1);
      } else {
        this.selectedValues.push(selection);
      }
    }
  }

  public toggleSingleSelection(selection?: string): void {
    if (selection) {
      this.singleSelected = selection;
    }
  }

  public onChanged(selection?: string): void {
    const isCheckbox = this.showCheckbox();
    const answers = this.f.answers.value;

    if (this.baseType === 'checkbox') {
      this.toggleSelection(selection);

      this.changed.emit({
        value: Boolean(this.selectedValues.length),
      });
    } else if (this.baseType === 'selection') {
      let config: MetadataFieldSearchConfig;

      if (isCheckbox) {
        this.toggleSelection(selection);

        // return value for checkboxes in format: { answers: [{ answer: 'A1', selected: true }, { answer: 'A2' }]}
        config = {
          // @ts-expect-error
          answers: answers.map((answer: string) => ({
            answer,
            selected: Boolean(this.selectedValues.includes(answer, 0)),
          })),
        };

        if (this.isNotFinal()) {
          config['custom_input'] = this.customInputControl.value ?? null;
          config['custom_input_selected'] = this.customInputSelectedControl.value;
        }
      } else {
        this.toggleSingleSelection(selection);

        // return value for radio buttons in format: { answers: [{ answer: 'A1' }, { answer: 'A2' }], single_selected: 'A1' }
        config = {
          // @ts-expect-error
          answers: answers.map((answer: string) => ({
            answer,
          })),
          single_selected: this.singleSelected!,
        };

        if (this.isNotFinal()) {
          config['custom_input'] = this.customInputControl.value ?? null;
        }
      }

      this.changed.emit(config);
    } else if (this.baseType === 'fraction') {
      // return value for fractions in format: { numerator: 1, denominator: 2 }
      this.changed.emit({
        numerator: Number(answers[0]),
        denominator: Number(answers[1]),
      });
    } else if (this.baseType === 'gps') {
      // return value for fractions in format: { x: '14.234654', y: '43.273865' }
      this.changed.emit({
        x: answers[0] ?? null,
        y: answers[1] ?? null,
      });
    } else if (this.baseType === 'time') {
      // return value for times in format (must be converted to minutes in integer): { value: 120 }
      const answer = answers[0];
      let returnValue;

      if (answer && typeof answer === 'string') {
        const time = answer.split(':');
        returnValue = Number(time[0]) * 60 + Number(time[1]);
      } else {
        returnValue = null;
      }

      this.changed.emit({
        value: returnValue,
      });
    } else if (this.baseType === 'tag') {
      // return value for tag in format: { answers: ['Tag 1', 'Tag 2'] }
      this.changed.emit({
        answers: answers[0],
      });
    } else {
      // return value for any other type in format: { value: 'V' }
      let answer = answers[0];

      if (['decimal', 'decimal_number', 'currency'].includes(this.baseType!, 0)) {
        answer = Number(answer);
      } else if (this.baseType === 'date') {
        answer = answer ?? null;
      }

      this.changed.emit({
        value: answer ?? null,
      });
    }
  }

  public resetField(parameter: Metadata): void {
    this.clearAnswers();

    this.selectedValues = [];
    this.singleSelected = undefined!;
    this.values = parameter.values;

    this.initField();
    this.onChanged();
    this.cdr.markForCheck();
  }

  public clearAnswers(): void {
    while (this.answers.length) {
      this.answers.removeAt(0);
    }
  }

  public isNotFinal(): boolean {
    return this.typeSettings?.final === false;
  }

  public addTag = (name: string): Promise<MetadataTag> =>
    new Promise((resolve, reject) => {
      this.loading = true;
      this.metadataTagsService
        .add({ name })
        .pipe(untilDestroyed(this))
        .subscribe(
          tag => {
            this.loading = false;
            this.cdr.markForCheck();
            resolve({ pk: tag.pk, name: tag.name });
          },
          () => {
            this.loading = false;
            this.cdr.markForCheck();
            reject();
          }
        );
    });
}
