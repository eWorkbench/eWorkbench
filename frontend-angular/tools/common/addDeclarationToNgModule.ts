/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Rule, Tree, SchematicsException } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { InsertChange } from '@schematics/angular/utility/change';
import { strings } from '@angular-devkit/core';
import { addDeclarationToModule } from '@schematics/angular/utility/ast-utils';
import * as ts from 'typescript';
import { Schema } from './schema';

export function addDeclarationToNgModule(schema: Schema): Rule {
  return (tree: Tree) => {
    if (!schema.module) {
      return tree;
    }
    const modulePath = schema.module;
    const sourceFile = tree.read(modulePath)?.toString('utf-8');
    if (!sourceFile) {
      throw new SchematicsException(`File ${modulePath} does not exist.`);
    }
    const source = ts.createSourceFile(modulePath, sourceFile, ts.ScriptTarget.Latest, true);

    const componentPath = `/${schema.path}/${strings.dasherize(schema.name)}/${strings.dasherize(schema.name)}.${strings.dasherize(
      schema.type
    )}`;
    const relativePath = buildRelativePath(modulePath, componentPath);
    const classifiedName = `${strings.classify(schema.name)}${strings.classify(schema.type)}`;
    const declarationChanges = addDeclarationToModule(source, modulePath, classifiedName, relativePath);

    const declarationRecorder = tree.beginUpdate(modulePath);
    for (const change of declarationChanges) {
      if (change instanceof InsertChange) {
        declarationRecorder.insertLeft(change.pos, change.toAdd);
      }
    }
    tree.commitUpdate(declarationRecorder);
    return tree;
  };
}
