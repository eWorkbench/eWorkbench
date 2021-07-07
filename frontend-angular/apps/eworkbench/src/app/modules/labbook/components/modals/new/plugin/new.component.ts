/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabBooksService, PluginInstancesService, PluginsService } from '@app/services';
import { DropdownElement, LabBookElementEvent, ModalCallback, PluginDetails, PluginInstancePayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, skip } from 'rxjs/operators';

interface FormElement {
  parentElement: string | null;
  position: 'top' | 'bottom';
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-labbook-plugin-element-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewLabBookPluginElementModalComponent implements OnInit {
  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public labBookId = this.modalRef.data.labBookId;

  public projectsList: string[] = this.modalRef.data.projects ?? [];

  public loading = true;

  public plugins: PluginDetails[] = [];

  public selectedPlugin?: PluginDetails;

  public pluginDetails?: PluginDetails;

  public step = 1;

  public state = ModalState.Unchanged;

  public searchControl = this.fb.control<string | null>(null);

  public onlyPluginsWithAccess = this.fb.control<boolean>(true);

  public params = new HttpParams();

  public showFeedbackFormForPlugin?: { type: string; id: string };

  public parentElement: DropdownElement[] = [];

  public position: DropdownElement[] = [];

  public form = this.fb.group<FormElement>({
    parentElement: ['labBook', [Validators.required]],
    position: ['bottom', [Validators.required]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly pluginsService: PluginsService,
    private readonly pluginInstancesService: PluginInstancesService,
    private readonly labBooksService: LabBooksService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public get f(): FormGroup<FormElement>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get element(): any {
    const element = {
      parentElement: this.f.parentElement.value,
      position: this.f.position.value,
    };

    return element;
  }

  public get pluginInstance(): PluginInstancePayload {
    const pluginInstance = {
      title: this.translocoService.translate('labBook.newPluginElementModal.title.placeholder'),
      plugin: this.selectedPlugin?.pk,
      projects: this.projectsList,
    };

    return pluginInstance;
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearch();
    this.initDetails();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('labBook.newPluginElementModal')
      .pipe(untilDestroyed(this))
      .subscribe(newPluginElementModal => {
        this.parentElement = [{ value: 'labBook', label: newPluginElementModal.currentLabBook }];

        this.position = [
          { value: 'top', label: newPluginElementModal.position.top },
          { value: 'bottom', label: newPluginElementModal.position.bottom },
        ];
      });
  }

  public initSearch(): void {
    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.set('search', value);
          this.initPlugins();
          this.cdr.markForCheck();
          return;
        }

        this.params = this.params.delete('search');
        this.initPlugins();
        this.cdr.markForCheck();
      }
    );
  }

  public initDetails(): void {
    this.labBooksService
      .getElements(this.labBookId)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ labBookElements => {
          const sections: DropdownElement[] = [];

          labBookElements.map(element => {
            if (element.child_object_content_type_model === 'labbooks.labbooksection') {
              sections.push({
                value: element.child_object.pk,
                label: `${element.child_object.date as string}: ${element.child_object.title as string}`,
              });
            }
          });

          this.parentElement = [...this.parentElement, ...sections];
          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

    this.initPlugins();
  }

  public initPlugins(): void {
    this.onlyPluginsWithAccess.disable();

    this.pluginsService
      .get(this.params)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ plugins => {
          this.plugins = [...plugins];
          this.loading = false;
          this.onlyPluginsWithAccess.enable();
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.onlyPluginsWithAccess.enable();
          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.pluginInstancesService
      .add(this.pluginInstance)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ pluginInstance => {
          this.state = ModalState.Changed;
          const event: LabBookElementEvent = {
            childObjectId: pluginInstance.pk,
            childObjectContentType: pluginInstance.content_type,
            childObjectContentTypeModel: pluginInstance.content_type_model,
            parentElement: this.element.parentElement,
            position: this.element.position,
          };
          this.modalRef.close({ state: this.state, data: event });
          this.translocoService
            .selectTranslate('labBook.newPluginElementModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onToogleOnlyPluginsWithAccess(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.params = this.params.set('onlyPluginsWithAccess', String(this.onlyPluginsWithAccess.value));
    this.initPlugins();
  }

  public onChangeStep(step: number): void {
    this.step = step;
  }

  public onCancelDetails(): void {
    this.pluginDetails = undefined!;
    this.showFeedbackFormForPlugin = undefined!;
    this.step = 1;
  }

  public onShowDetails(plugin: PluginDetails): void {
    this.pluginDetails = { ...plugin };
    this.showFeedbackFormForPlugin = undefined!;
  }

  public onSelect(plugin: PluginDetails): void {
    this.selectedPlugin = { ...plugin };
    this.showFeedbackFormForPlugin = undefined!;
    this.onChangeStep(2);
  }

  public onDropdownSelected(event: { type: string; id: string }): void {
    this.showFeedbackFormForPlugin = { ...event };
  }

  public onHideFeedbackForm(): void {
    this.showFeedbackFormForPlugin = undefined!;
  }
}
