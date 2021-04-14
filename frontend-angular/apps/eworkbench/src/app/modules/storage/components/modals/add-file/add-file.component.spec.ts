/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { AddFileModalComponent } from './add-file.component';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockDirectory, mockFile, mockUser } from '@eworkbench/mocks';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ModalsModule } from '@eworkbench/modals';
import { ToastrService } from 'ngx-toastr';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { mockProvider } from '@ngneat/spectator';
import { Subject } from 'rxjs';
import { TableModule } from '@eworkbench/table';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { UserModule } from '@app/modules/user/user.module';

describe('AddFileModalComponent', () => {
  let spectator: Spectator<AddFileModalComponent>;
  const createComponent = createComponentFactory({
    component: AddFileModalComponent,
    imports: [getTranslocoModule(), HttpClientTestingModule, ModalsModule, TableModule, FormsModule, IconsModule, UserModule],
    providers: [
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
    mocks: [ToastrService, DialogService],
  });

  beforeEach(() => (spectator = createComponent({ props: { directory: mockDirectory } })));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call selectFile', () => {
    spectator.setInput({ currentUser: mockUser });
    const onSelectFileSpy = spyOn(spectator.component, 'selectFile').and.callThrough();
    spectator.component.selectFile(mockFile);
    expect(spectator.component.selectedFile).toStrictEqual(mockFile);
    expect(onSelectFileSpy).toHaveBeenCalledTimes(1);
  });
});
