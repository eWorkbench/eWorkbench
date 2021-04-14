/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { build, addDeclarationToNgModule, Schema } from '../../common';
import { Rule } from '@angular-devkit/schematics';

export default function (schema: Schema): Rule {
  return build(schema, addDeclarationToNgModule);
}
