/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderModule } from '@app/modules/header/header.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { MetadataService, PageTitleService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockMetadataSearchResults, mockPageTitle } from '@eworkbench/mocks';
import { TableModule } from '@eworkbench/table';
import { MetadataSearchRequestData } from '@eworkbench/types';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { of } from 'rxjs';
import { MetadataSearchPageComponent } from './metadata-search-page.component';
import { mockChangedSearchParameter } from './mocks/changed-search-parameter';
import { mockMetadataFields } from './mocks/metadata-fields';

describe('MetadataSearchPageComponent', () => {
  let spectator: Spectator<MetadataSearchPageComponent>;
  const createComponent = createComponentFactory({
    component: MetadataSearchPageComponent,
    imports: [
      HeaderModule,
      FormsModule,
      RouterTestingModule,
      getTranslocoModule(),
      MetadataModule,
      TableModule,
      SharedModule,
      UserModule,
      HttpClientModule,
      TooltipModule.forRoot(),
    ],
    providers: [
      mockProvider(MetadataService, {
        getFields: () => of(mockMetadataFields),
        search: () => of(mockMetadataSearchResults),
      }),
      mockProvider(PageTitleService, {
        get: () => of(mockPageTitle),
      }),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });

  it('should add and remove search parameters', () => {
    expect(spectator.component.selectedSearchParameters.length).toBe(0);
    spectator.component.onAdd();
    expect(spectator.component.selectedSearchParameters.length).toBe(0);
    spectator.component.form.patchValue({
      parameters: mockMetadataFields[0].pk,
    });
    spectator.component.onAdd();
    expect(spectator.component.selectedSearchParameters.length).toBe(1);

    const parameter = mockMetadataFields[0];
    spectator.component.onRemove(parameter);
    expect(spectator.component.selectedSearchParameters.length).toBe(0);
    spectator.component.onRemove(parameter);
    expect(spectator.component.selectedSearchParameters.length).toBe(0);
  });

  it('should change values', () => {
    let changedData = mockChangedSearchParameter;

    spectator.component.selectedSearchParameters = [];
    expect(spectator.component.selectedSearchParameters.length).toBe(0);

    spectator.component.onChanged(changedData);
    expect(spectator.component.selectedSearchParameters.length).toBe(0);

    spectator.component.selectedSearchParameters = [
      {
        ...mockMetadataFields[0],
        showCheckbox: true,
        showRadio: false,
        operator: '=',
        values: [{ answer: 'A', selected: true }, { answer: 'B' }, { answer: 'C' }],
        combinationOperator: 'AND',
      },
    ];
    expect(spectator.component.selectedSearchParameters.length).toBe(1);
    expect(spectator.component.selectedSearchParameters[0].values[0].selected).toBe(true);

    spectator.component.onChanged(changedData);
    expect(spectator.component.selectedSearchParameters[0].values[0].selected).toBeUndefined();

    changedData = {
      ...changedData,
      id: '58c7fafe-31f1-41c5-a40f-e1223862f489',
      combinationOperator: 'OR',
    };
    spectator.component.onChanged(changedData);
    expect(spectator.component.selectedSearchParameters[0].combinationOperator).toBe('AND');
  });

  it('should build the search request data', () => {
    let searchRequestData: MetadataSearchRequestData;

    spectator.component.selectedSearchParameters = mockMetadataFields;
    searchRequestData = spectator.component.buildSearchRequestData();
    expect(searchRequestData.parameters.length).toBe(1);

    spectator.component.selectedSearchParameters[0].combinationOperator = 'OR';
    searchRequestData = spectator.component.buildSearchRequestData();
    expect(searchRequestData.parameters.length).toBe(2);

    spectator.component.selectedSearchParameters[0].combinationOperator = 'AND';
    spectator.component.selectedSearchParameters[1].combinationOperator = 'OR';
    searchRequestData = spectator.component.buildSearchRequestData();
    expect(searchRequestData.parameters.length).toBe(1);
  });

  it('should change the type of a search parameter', () => {
    const id = 'e85cd7a0-72b1-4563-9014-f703931cd19f';
    const parameter = mockMetadataFields[0];
    spectator.component.selectedSearchParameters = [parameter];
    spectator.component.onChangeType({ parameter, id });
    expect(spectator.component.selectedSearchParameters.length).toBe(1);
  });

  it('should add a search parameter at a specific position', () => {
    const parameter1 = mockMetadataFields[0];
    const parameter2 = mockMetadataFields[1];

    spectator.component.selectedSearchParameters = [parameter1, parameter2];

    spectator.component.searchParametersData = {};
    spectator.component.searchParametersData[parameter1.pk!] = parameter1;
    spectator.component.searchParametersData[parameter2.pk!] = parameter2;

    spectator.component.onAdd(parameter2.pk, 0);
    expect(spectator.component.selectedSearchParameters.length).toBe(3);
    expect(spectator.component.selectedSearchParameters[0].pk).toBe(parameter2.pk);

    spectator.component.onAdd(parameter1.pk, 2);
    expect(spectator.component.selectedSearchParameters.length).toBe(4);
    expect(spectator.component.selectedSearchParameters[2].pk).toBe(parameter1.pk);
  });
});
