/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { SearchContentComponent } from '../../search-content/search-content.component';
import { NewLinkModalComponent } from './new.component';

describe('NewComponent', () => {
  let spectator: Spectator<NewLinkModalComponent>;
  const createComponent = createComponentFactory({
    component: NewLinkModalComponent,
    declarations: [SearchContentComponent],
    imports: [
      getTranslocoModule(),
      HttpClientTestingModule,
      TabsModule.forRoot(),
      FormsModule,
      LoadingModule,
      ModalsModule,
      TableModule,
      IconsModule,
    ],
    providers: [
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

  it('should call initDetails()', () => {
    spectator.setInput({
      contentType: 'shared_elements.contact',
    });
    const initDetailsSpy = spyOn(spectator.component, 'initDetails').and.callThrough();
    spectator.component.initDetails();
    expect(initDetailsSpy).toHaveBeenCalledTimes(1);
  });

  it('should call showSearch()', () => {
    const showSearchSpy = spyOn(spectator.component, 'showSearch').and.callThrough();
    spectator.component.showSearch('shared_elements.contact');
    expect(showSearchSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.showContactSearch).toBe(true);
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });
});
