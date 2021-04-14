/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { chain, mergeWith, apply, url, applyTemplates, move, Rule, Tree, SchematicsException } from '@angular-devkit/schematics';
import { getWorkspace as getWorkspaceDefinition, buildDefaultPath } from '@schematics/angular/utility/workspace';
import { getWorkspace } from '@schematics/angular/utility/config';
import { strings, normalize } from '@angular-devkit/core';

interface Schema {
  name: string;
  project: string;
}

export default function (schema: Schema): Rule {
  return async (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const workspaceDef = await getWorkspaceDefinition(tree);
    if (!workspace || !workspaceDef) {
      throw new SchematicsException('Could not find Angular workspace configuration');
    }
    const projectDef = workspaceDef.projects.get(schema.project) ?? workspaceDef.projects.get(workspace.defaultProject!);

    const templateSource = apply(url('./files'), [
      applyTemplates({ ...schema, ...strings }),
      move(normalize(`${buildDefaultPath(projectDef!)}/pages`)),
    ]);

    return chain([mergeWith(templateSource)]);
  };
}
