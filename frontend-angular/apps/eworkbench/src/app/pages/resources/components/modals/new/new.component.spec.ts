/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { ProjectsService, ResourcesService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockProject, mockResource } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import Chance from 'chance';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { NewResourceModalComponent } from './new.component';

describe('NewResourceModalComponent', () => {
  let spectator: Spectator<NewResourceModalComponent>;
  let chance: Chance.Chance;
  const createComponent = createComponentFactory({
    component: NewResourceModalComponent,
    imports: [
      ModalsModule,
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      LoadingModule,
      DetailsDropdownModule,
      WysiwygEditorModule,
      IconsModule,
      ResourceModule,
      FormHelperModule,
    ],
    providers: [
      mockProvider(ResourcesService, {
        add: () => of(mockResource),
        changeTermsOfUsePDF: () => of(mockResource),
      }),
      mockProvider(ProjectsService, {
        getList: () => of({ total: 1, data: [mockProject] }),
      }),
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: { initialState: mockResource },
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  beforeEach(() => (chance = new Chance()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should add a new resource', () => {
    spectator.component.form.controls.name.setValue(chance.string({ alpha: true, symbols: false }));

    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should be in loading state and not add a new resource', () => {
    spectator.setInput({
      loading: true,
    });
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should patch form with initial values', () => {
    spectator.setInput({
      initialState: mockResource,
    });
    const patchFormValuesSpy = jest.spyOn(spectator.component, 'patchFormValues');
    spectator.component.patchFormValues();
    expect(patchFormValuesSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({
      initialState: undefined,
    });
    spectator.component.patchFormValues();
    expect(patchFormValuesSpy).toHaveBeenCalledTimes(2);
  });
});
