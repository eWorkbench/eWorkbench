/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MetadataService, PageTitleService } from '@app/services';
import type { TableColumn } from '@eworkbench/table';
import type {
  DropdownElement,
  MetadataChangedSearchParameter,
  MetadataField,
  MetadataSearchParameters,
  MetadataSearchRequestData,
} from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-metadata-search-page',
  templateUrl: './metadata-search-page.component.html',
  styleUrls: ['./metadata-search-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataSearchPageComponent implements OnInit {
  public title = '';

  @ViewChild('titleCellTemplate', { static: true })
  public titleCellTemplate!: TemplateRef<any>;

  @ViewChild('typeCellTemplate', { static: true })
  public typeCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', { static: true })
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedByCellTemplate', { static: true })
  public lastModifiedByCellTemplate!: TemplateRef<any>;

  public loading = true;

  public searchRequest = false;

  public results: any[] = [];

  public searchParametersData: MetadataSearchParameters = {};

  public searchParametersDropdown: DropdownElement[] = [];

  public selectedSearchParameters: MetadataField[] = [];

  public listColumns: TableColumn[] = [];

  public form: FormGroup = this.fb.group({
    types: [''],
    parameters: [''],
  });

  public types: Record<string, string>[] = [];

  public constructor(
    private readonly metadataService: MetadataService,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  private get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  public get parameters(): FormArray {
    return this.form.get('parameters') as FormArray;
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
    this.initPageTitle();
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('metadataSearch.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('metadataSearch.searchTypes')
      .pipe(untilDestroyed(this))
      .subscribe(searchTypes => {
        this.types = [
          {
            value: '',
            label: searchTypes.all,
          },
          {
            value: 'dmp',
            label: searchTypes.dmp,
          },
          {
            value: 'labbook',
            label: searchTypes.labBook,
          },
          {
            value: 'labbooksection',
            label: searchTypes.labBookSection,
          },
          {
            value: 'contact',
            label: searchTypes.contact,
          },
          {
            value: 'file',
            label: searchTypes.file,
          },
          {
            value: 'meeting',
            label: searchTypes.appointment,
          },
          {
            value: 'note',
            label: searchTypes.note,
          },
          {
            value: 'task',
            label: searchTypes.task,
          },
          {
            value: 'project',
            label: searchTypes.project,
          },
          {
            value: 'projectroleuserassignment',
            label: searchTypes.projectMember,
          },
          {
            value: 'resource',
            label: searchTypes.resource,
          },
          {
            value: 'picture',
            label: searchTypes.picture,
          },
          {
            value: 'kanbanboard',
            label: searchTypes.taskBoard,
          },
          {
            value: 'drive',
            label: searchTypes.storage,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('metadataSearch.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.titleCellTemplate,
            name: column.title,
            key: 'title',
            width: '25%',
          },
          {
            cellTemplate: this.typeCellTemplate,
            name: column.type,
            key: 'type',
          },
          {
            cellTemplate: this.createdByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
          },
          {
            cellTemplate: this.lastModifiedByCellTemplate,
            name: column.lastModifiedBy,
            key: 'last_modified_by',
          },
        ];
      });
  }

  public initDetails(): void {
    this.metadataService
      .getFields()
      .pipe(untilDestroyed(this))
      .subscribe(
        fields => {
          const parametersData: MetadataSearchParameters = {};
          const parameters: DropdownElement[] = [];

          fields.forEach(field => {
            parametersData[field.pk!] = field;
            parameters.push({ value: field.pk!, label: field.display! });
          });
          this.searchParametersData = parametersData;
          this.searchParametersDropdown = parameters;

          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.metadataService
      .search(this.buildSearchRequestData())
      .pipe(untilDestroyed(this))
      .subscribe(
        (data: any) => {
          this.results = data;
          this.searchRequest = true;
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onAdd(id?: string, index?: number): void {
    const parameterId = id ?? this.f.parameters.value;
    if (parameterId) {
      const parameter = this.searchParametersData[parameterId];
      const selectedSearchParameters = [...this.selectedSearchParameters];

      if (index === undefined) {
        selectedSearchParameters.push(parameter);
      } else {
        selectedSearchParameters.splice(index, 0, parameter);
      }
      this.selectedSearchParameters = selectedSearchParameters;
    }

    this.form.patchValue(
      {
        parameters: null,
      },
      { emitEvent: false }
    );
  }

  public onRemove(parameter: MetadataField): void {
    const selectedSearchParameters = [...this.selectedSearchParameters];
    const index = selectedSearchParameters.indexOf(parameter);
    if (index > -1) {
      selectedSearchParameters.splice(index, 1);
      this.selectedSearchParameters = selectedSearchParameters;
    }
  }

  public onChanged(data: MetadataChangedSearchParameter): void {
    this.selectedSearchParameters.map(parameter => {
      if (parameter.pk === data.id) {
        parameter.operator = data.operator;
        parameter.values = data.answers;
        parameter.combinationOperator = data.combinationOperator;
      }
    });
  }

  public onChangeType(callback: { parameter: MetadataField; id: string }): void {
    const selectedSearchParameters = [...this.selectedSearchParameters];
    const index = selectedSearchParameters.indexOf(callback.parameter);
    this.onRemove(callback.parameter);
    this.onAdd(callback.id, index);
  }

  public buildSearchRequestData(): MetadataSearchRequestData {
    const orCombinations: any[] = [];
    let andCombinations: any[] = [];
    let parameter: MetadataField;

    orCombinations.push(andCombinations);

    for (let i = 0; i < this.selectedSearchParameters.length; i++) {
      parameter = this.selectedSearchParameters[i];

      andCombinations.push({
        parameter_index: i,
        field: parameter.pk,
        operator: parameter.operator,
        values: parameter.values,
      });

      // if there is an or-combination (that is not on the last parameter) -> start new and-combination
      if (parameter.combinationOperator === 'OR' && i < this.selectedSearchParameters.length - 1) {
        andCombinations = [];
        orCombinations.push(andCombinations);
      }
    }

    return {
      content_type: this.f.types.value ?? null,
      parameters: orCombinations,
    };
  }
}
