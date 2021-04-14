/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { chain, mergeWith, apply, url, applyTemplates, move, Rule, Tree, SchematicsException } from '@angular-devkit/schematics';
import { getWorkspace as getWorkspaceDefinition, buildDefaultPath } from '@schematics/angular/utility/workspace';
import { getWorkspace } from '@schematics/angular/utility/config';
import { parseName } from '@schematics/angular/utility/parse-name';
import { findModuleFromOptions } from '@schematics/angular/utility/find-module';
import { strings, normalize } from '@angular-devkit/core';
import { Schema } from './schema';

export function build(schema: Schema, declaration?: (...args: any[]) => Rule): Rule {
  return async (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const workspaceDef = await getWorkspaceDefinition(tree);
    if (!workspace || !workspaceDef) {
      throw new SchematicsException('Could not find Angular workspace configuration');
    }
    const projectDef = workspaceDef.projects.get(schema.project) ?? workspaceDef.projects.get(workspace.defaultProject!);

    if (!schema.path) {
      schema.path = buildDefaultPath(projectDef!);
    }
    schema.module = findModuleFromOptions(tree, schema);

    const parsedPath = parseName(schema.path, schema.name);
    schema.name = parsedPath.name;
    schema.path = parsedPath.path;

    const templateSource = apply(url('./files'), [applyTemplates({ ...schema, ...strings }), move(normalize(parsedPath.path))]);

    const rules = [mergeWith(templateSource)];
    if (declaration) {
      rules.unshift(declaration(schema));
    }

    return chain(rules);
  };
}
