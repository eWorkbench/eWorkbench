/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ClipboardModule } from '@angular/cdk/clipboard';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MyScheduleService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockExportLink } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { ExportModalComponent } from './export.component';

describe('ExportModalComponent', () => {
  let spectator: Spectator<ExportModalComponent>;
  const createComponent = createComponentFactory({
    component: ExportModalComponent,
    imports: [ModalsModule, FormsModule, HttpClientTestingModule, getTranslocoModule(), ClipboardModule],
    providers: [
      mockProvider(MyScheduleService, {
        export: () => of(mockExportLink),
      }),
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should set the export URL', () => {
    expect(spectator.component.iCalExportUrl).toBe(mockExportLink.url);
  });

  it('should call onCopyExportUrlToClipboard()', () => {
    const onCopyExportUrlToClipboardSpy = spyOn(spectator.component, 'onCopyExportUrlToClipboard').and.callThrough();
    spectator.component.onCopyExportUrlToClipboard();
    expect(onCopyExportUrlToClipboardSpy).toHaveBeenCalledTimes(1);

    spectator.component.iCalExportUrl = undefined;
    spectator.component.onCopyExportUrlToClipboard();
    expect(onCopyExportUrlToClipboardSpy).toHaveBeenCalledTimes(2);

    spectator.component.iCalExportUrl = mockExportLink.url;
    spectator.component.onCopyExportUrlToClipboard();
    expect(onCopyExportUrlToClipboardSpy).toHaveBeenCalledTimes(3);
  });
});
