/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject } from '@angular/core/testing';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { MockService } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { DeleteModalComponent } from '../modals/delete/delete.component';
import { RestoreButtonComponent } from './restore-button.component';

describe('RestoreButtonComponent', () => {
  let spectator: Spectator<RestoreButtonComponent>;
  const createComponent = createComponentFactory({
    component: RestoreButtonComponent,
    declarations: [DeleteModalComponent],
    imports: [
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      ModalsModule,
      LoadingModule,
      IconsModule,
      TooltipModule.forRoot(),
    ],
    providers: [MockService],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  beforeEach(inject([MockService], (service: MockService) => {
    spectator.setInput({
      service: service,
    });
  }));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onRestore()', () => {
    const onRestoreSpy = spyOn(spectator.component, 'onRestore').and.callThrough();
    const id = '8147b971-9ab6-4f8b-bbf5-76e8eccae3f8';
    spectator.component.onRestore(id);
    expect(onRestoreSpy).toBeCalledWith(id);
    expect(onRestoreSpy).toBeCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onRestore(id);
    expect(onRestoreSpy).toHaveBeenCalledTimes(2);
  });
});
