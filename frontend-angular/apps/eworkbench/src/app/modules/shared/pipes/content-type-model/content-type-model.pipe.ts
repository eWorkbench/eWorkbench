/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import { ContentTypeModelService } from '@app/services';
import { ContentTypeModelItem, ContentTypeModels } from '@eworkbench/types';

@Pipe({
  name: 'formatContentTypeModel',
})
export class FormatContentTypeModelPipe implements PipeTransform {
  public constructor(private readonly contentTypeModelService: ContentTypeModelService) {}

  public transform(value: ContentTypeModels | string, entity: keyof ContentTypeModelItem = 'translation'): string {
    return this.contentTypeModelService.get(value as ContentTypeModels, entity) ?? '';
  }
}
