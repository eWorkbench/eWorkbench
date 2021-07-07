/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule } from '@angular/common/http';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { UserModule } from '@app/modules/user/user.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { PluginFeedbackComponent } from './feedback.component';

const pk = '12915b9e-75e3-4846-967a-428b517aecb9';

describe('PluginFeedbackComponent', () => {
  let spectator: Spectator<PluginFeedbackComponent>;
  const createComponent = createComponentFactory({
    component: PluginFeedbackComponent,
    imports: [
      ModalsModule,
      UserModule,
      getTranslocoModule(),
      WysiwygEditorModule,
      LoadingModule,
      FormsModule,
      HttpClientModule,
      FormHelperModule,
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent({ props: { id: pk } })));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.setInput({
      loading: false,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onCancel()', () => {
    const onCancelSpy = jest.spyOn(spectator.component, 'onCancel');
    spectator.setInput({
      loading: false,
    });
    spectator.component.onCancel();
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onCancel();
    expect(onCancelSpy).toHaveBeenCalledTimes(2);
  });
});
