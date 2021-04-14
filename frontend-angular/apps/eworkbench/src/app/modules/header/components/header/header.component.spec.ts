/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { CMSModule } from '@app/modules/cms/cms.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { IconsModule } from '@eworkbench/icons';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import Chance from 'chance';
import fc from 'fast-check';
import { HeaderComponent } from './header.component';

const chance = new Chance();
const expectedContentString = chance.string({ alpha: true, symbols: false });

describe('HeaderComponent', () => {
  let spectator: SpectatorHost<HeaderComponent>;
  const createHost = createHostFactory({
    component: HeaderComponent,
    imports: [RouterTestingModule, getTranslocoModule(), IconsModule, CMSModule, HttpClientModule, SharedModule, CMSModule],
  });

  beforeEach(
    () => (spectator = createHost(`<eworkbench-header><span slot="elements">${expectedContentString}</span></eworkbench-header>`))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should set the header title', () => {
    fc.assert(
      fc.property(fc.string(), string => {
        spectator.setInput({
          title: string,
        });
        expect(spectator.component.title).toBe(string);
        const h1 = spectator.query<HTMLHeadingElement>('.title > h1');
        expect(h1).toHaveText(string.trim());
      })
    );
  });

  it('should set some content inside the header', () => {
    const ngContent = spectator.query<HTMLDivElement>('.elements');
    expect(ngContent).toHaveText(expectedContentString);
  });
});
