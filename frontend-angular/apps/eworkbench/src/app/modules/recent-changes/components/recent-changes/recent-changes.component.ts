/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MetadataService } from '@app/services';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import type { MetadataField, RecentChanges, RecentChangesChangeRecord, User } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep } from 'lodash';
import { map, switchMap } from 'rxjs/operators';

interface MetadataParameters {
  [id: string]: MetadataField;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes',
  templateUrl: './recent-changes.component.html',
  styleUrls: ['./recent-changes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('dateCellTemplate', { static: true })
  public dateCellTemplate!: TemplateRef<any>;

  @Input()
  public service: any;

  @Input()
  public changesId!: string;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public users?: User[] = [];

  public listColumns: TableColumn[] = [];

  public data: any[] = [];

  public loading = false;

  public metadataParameters?: MetadataParameters;

  public constructor(
    private readonly metadataService: MetadataService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
    this.getChanges();

    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.getChanges();
    });
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('recentChanges.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.dateCellTemplate,
            name: column.date,
            key: 'date',
          },
        ];
      });
  }

  public getChanges(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.metadataService
      .getFields()
      .pipe(
        untilDestroyed(this),
        map(fields => {
          const metadataParameters: MetadataParameters = {};

          fields.map(field => {
            metadataParameters[field.pk!] = field;
          });
          this.metadataParameters = metadataParameters;
        }),
        switchMap(() =>
          this.service?.history(this.changesId).pipe(
            untilDestroyed(this),
            map((recentChanges: RecentChanges[]) => {
              const changes: RecentChanges[] = [];
              let changeRecords: RecentChangesChangeRecord[];

              recentChanges.forEach(change => {
                changeRecords = [];

                change.change_records.forEach(record => {
                  if (record.field_name === 'metadata') {
                    const oldValue = record.old_value ? this.parseJSON(cloneDeep(record.old_value)) : [];
                    const newValue = record.new_value ? this.parseJSON(cloneDeep(record.new_value)) : [];

                    changeRecords.push({
                      field_name: record.field_name,
                      old_value: oldValue.filter((oldField: any) => !newValue.some((newField: any) => oldField.pk === newField.pk)),
                      new_value: newValue.filter((newField: any) => !oldValue.some((oldField: any) => newField.pk === oldField.pk)),
                    });
                  } else {
                    changeRecords.push({ ...record });
                  }
                });

                changes.push({
                  ...change,
                  change_records: [...changeRecords],
                });
              });

              this.data = changes;
            })
          )
        )
      )
      .subscribe(
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onToggleExpanded(row: RecentChanges): void {
    row.expanded = !row.expanded;
  }

  public parseJSON(value: string): any {
    return JSON.parse(value);
  }

  public formatFieldName(fieldName: string): string {
    return fieldName.split('_').join(' ');
  }

  public isTrashedOrRestored(changesetType: string): boolean {
    return ['R', 'S'].includes(changesetType);
  }

  public isStandardField(contentTypeModel: string, fieldName: string): boolean {
    return (
      !this.isHtmlField(fieldName) &&
      !this.isChecklistField(fieldName) &&
      !this.isLabelsField(fieldName) &&
      !this.isTaskBoardColumnsField(fieldName) &&
      !this.isDriveDirectoryStructureField(fieldName) &&
      !this.isDMPFormField(fieldName) &&
      !this.isDMPFormDataField(fieldName) &&
      !this.isDMPStatusField(contentTypeModel, fieldName) &&
      !this.isMetadataField(fieldName) &&
      !this.isLabBookChildElementsField(fieldName) &&
      !this.isTermsOfUsePDFField(fieldName) &&
      !this.isDateTimeField(fieldName) &&
      !this.isFileSizeField(fieldName) &&
      !this.isUserField(fieldName) &&
      !this.isProjectField(fieldName) &&
      !this.isTaskStateField(contentTypeModel, fieldName) &&
      !this.isTaskPriorityField(contentTypeModel, fieldName) &&
      !this.isResourceTypeField(contentTypeModel, fieldName) &&
      !this.isResourceGeneralUsageSettingField(contentTypeModel, fieldName) &&
      !this.isResourceUsageSettingSelectedUserGroupsField(contentTypeModel, fieldName)
    );
  }

  public isHtmlField(fieldName: string): boolean {
    return ['html_content', 'description', 'content', 'text', 'notes'].includes(fieldName);
  }

  public isChecklistField(fieldName: string): boolean {
    return fieldName === 'checklist_items';
  }

  public isLabelsField(fieldName: string): boolean {
    return fieldName === 'labels';
  }

  public isTaskBoardColumnsField(fieldName: string): boolean {
    return fieldName === 'kanban_board_columns';
  }

  public isDriveDirectoryStructureField(fieldName: string): boolean {
    return fieldName === 'sub_directories';
  }

  public isDMPFormField(fieldName: string): boolean {
    return fieldName === 'dmp_form';
  }

  public isDMPFormDataField(fieldName: string): boolean {
    return fieldName === 'dmp_form_data';
  }

  public isDMPStatusField(contentTypeModel: string, fieldName: string): boolean {
    return contentTypeModel === 'dmp' && fieldName === 'status';
  }

  public isMetadataField(fieldName: string): boolean {
    return fieldName === 'metadata';
  }

  public isLabBookChildElementsField(fieldName: string): boolean {
    return fieldName === 'child_elements';
  }

  public isTermsOfUsePDFField(fieldName: string): boolean {
    return fieldName === 'terms_of_use_pdf';
  }

  public isDateTimeField(fieldName: string): boolean {
    return ['start_date', 'date_time_start', 'end_date', 'due_date', 'stop_date', 'date_time_end'].includes(fieldName);
  }

  public isFileSizeField(fieldName: string): boolean {
    return fieldName === 'file_size';
  }

  public isUserField(fieldName: string): boolean {
    return ['attending_users', 'assigned_users', 'responsible_users'].includes(fieldName);
  }

  public isProjectField(fieldName: string): boolean {
    return ['projects', 'parent_project'].includes(fieldName);
  }

  public isTaskStateField(contentTypeModel: string, fieldName: string): boolean {
    return contentTypeModel === 'task' && fieldName === 'state';
  }

  public isTaskPriorityField(contentTypeModel: string, fieldName: string): boolean {
    return contentTypeModel === 'task' && fieldName === 'priority';
  }

  public isResourceTypeField(contentTypeModel: string, fieldName: string): boolean {
    return contentTypeModel === 'resource' && fieldName === 'type';
  }

  public isResourceGeneralUsageSettingField(contentTypeModel: string, fieldName: string): boolean {
    return contentTypeModel === 'resource' && fieldName === 'general_usage_setting';
  }

  public isResourceUsageSettingSelectedUserGroupsField(contentTypeModel: string, fieldName: string): boolean {
    return contentTypeModel === 'resource' && fieldName === 'usage_setting_selected_user_groups';
  }
}
