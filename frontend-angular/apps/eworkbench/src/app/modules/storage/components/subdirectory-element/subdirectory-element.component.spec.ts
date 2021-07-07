/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { SubdirectoryElementComponent } from './subdirectory-element.component';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from '@ngneat/dialog';
import { mockDirectory, mockDrive, mockFile } from '@eworkbench/mocks';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { IconsModule } from '@eworkbench/icons';

describe('SubdirectoryElementComponent', () => {
  let spectator: Spectator<SubdirectoryElementComponent>;
  const createComponent = createComponentFactory({
    component: SubdirectoryElementComponent,
    imports: [getTranslocoModule(), HttpClientTestingModule, LoadingModule, IconsModule],
    mocks: [ToastrService, DialogService],
  });

  beforeEach(() => (spectator = createComponent({ props: { storage: mockDrive, directory: mockDirectory, files: [mockFile] } })));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call removeFile', () => {
    const removeFileSpy = jest.spyOn(spectator.component, 'removeFile');

    spectator.component.removeFile(mockFile);
    expect(removeFileSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.files).toStrictEqual([]);
  });
});
