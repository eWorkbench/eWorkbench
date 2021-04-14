/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { chain, mergeWith, apply, url, applyTemplates, move, Rule, Tree, SchematicsException } from '@angular-devkit/schematics';
import { getWorkspace as getWorkspaceDefinition } from '@schematics/angular/utility/workspace';
import { getWorkspace } from '@schematics/angular/utility/config';
import { strings, normalize, JsonParseMode, parseJson } from '@angular-devkit/core';
import { getNpmScope, NxJson } from '@nrwl/workspace';

interface Schema {
  name: string;
  project: string;
}

function updateJsonFile(host: Tree, path: string): any {
  const source = host.read(path);
  if (source) {
    const sourceText = source.toString('utf-8');
    const json = parseJson(sourceText, JsonParseMode.Loose);
    return json;
  }
}

function updateTsConfig(packageName: string, ...paths: string[]): Rule {
  const path = 'tsconfig.json';
  return (host: Tree) => {
    if (!host.exists(path)) {
      return host;
    }

    const tsconfig = updateJsonFile(host, path);
    if (!tsconfig.compilerOptions.paths) {
      tsconfig.compilerOptions.paths = {};
    }
    if (!tsconfig.compilerOptions.paths[packageName]) {
      tsconfig.compilerOptions.paths[packageName] = [];
    }
    tsconfig.compilerOptions.paths[packageName].push(...paths);
    host.overwrite(path, JSON.stringify(tsconfig, null, 2));

    return host;
  };
}

function updateNxConfig(packageName: string): Rule {
  const path = 'nx.json';
  return (host: Tree) => {
    if (!host.exists(path)) {
      return host;
    }

    const nxConfig: NxJson = updateJsonFile(host, path);
    if (!nxConfig.projects[packageName]) {
      nxConfig.projects[packageName] = {};
      nxConfig.projects[packageName].tags = [];
    }
    host.overwrite(path, JSON.stringify(nxConfig, null, 2));

    return host;
  };
}

function updateAngularConfig(packageName: string, scope: string): Rule {
  const path = 'angular.json';
  return (host: Tree) => {
    if (!host.exists(path)) {
      return host;
    }

    const angularConfig = updateJsonFile(host, path);
    if (!angularConfig.projects[packageName]) {
      angularConfig.projects[packageName] = {
        projectType: 'library',
        root: `libs/${packageName}`,
        sourceRoot: `libs/${packageName}/src`,
        prefix: scope,
        architect: {
          lint: {
            builder: '@angular-eslint/builder:lint',
            options: {
              eslintConfig: '.eslintrc',
              tsConfig: [`libs/${packageName}/tsconfig.lib.json`, `libs/${packageName}/tsconfig.spec.json`],
              exclude: ['**/node_modules/**', `!libs/${packageName}/**`],
            },
          },
          test: {
            builder: '@nrwl/jest:jest',
            options: {
              jestConfig: `libs/${packageName}/jest.config.js`,
              tsConfig: `libs/${packageName}/tsconfig.spec.json`,
              setupFile: `libs/${packageName}/src/test-setup.ts`,
              passWithNoTests: true,
            },
          },
        },
        schematics: {
          '@nrwl/angular:component': {
            styleext: 'scss',
          },
        },
      };
    }
    host.overwrite(path, JSON.stringify(angularConfig, null, 2));

    return host;
  };
}

export default function (schema: Schema): Rule {
  return async (tree: Tree) => {
    const scope = getNpmScope(tree);
    const workspace = getWorkspace(tree);
    const workspaceDef = await getWorkspaceDefinition(tree);
    if (!workspace || !workspaceDef) {
      throw new SchematicsException('Could not find Angular workspace configuration');
    }

    const name = strings.dasherize(schema.name);
    const templateSource = apply(url('./files'), [applyTemplates({ ...schema, ...strings }), move(normalize(`./libs`))]);

    return chain([
      mergeWith(templateSource),
      updateTsConfig(`@${scope}/${name}`, `libs/${strings.dasherize(name)}/src/index.ts`),
      updateAngularConfig(name, scope),
      updateNxConfig(name),
    ]);
  };
}
