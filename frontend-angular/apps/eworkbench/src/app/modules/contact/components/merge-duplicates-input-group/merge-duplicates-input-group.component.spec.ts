/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SpectatorRouting, createRoutingFactory } from '@ngneat/spectator/jest';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { MergeDuplicatesInputGroupComponent } from './merge-duplicates-input-group.component';
import { FormsModule } from '@eworkbench/forms';
import { FormArray } from '@ngneat/reactive-forms';
import { FormGroup } from '@angular/forms';

describe('MergeDuplicatesInputGroupComponent', () => {
  let spectator: SpectatorRouting<MergeDuplicatesInputGroupComponent>;
  const createComponent = createRoutingFactory({
    component: MergeDuplicatesInputGroupComponent,
    imports: [getTranslocoModule(), FormsModule],
  });

  beforeEach(
    () =>
      (spectator = createComponent({
        props: {
          formGroup: new FormGroup({}),
          fields: new FormArray<string>([]),
        },
      }))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onChangeFieldIndex()', () => {
    const onChangeFieldIndexSpy = jest.spyOn(spectator.component, 'onChangeFieldIndex');
    spectator.component.onChangeFieldIndex(1);
    expect(onChangeFieldIndexSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.selectedFieldIndex).toBe(1);
  });
});
