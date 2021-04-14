/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const nxPreset = require('@nrwl/jest/preset');

const esModules = ['gantt-schedule-timeline-calendar'].join('|');

module.exports = {
  ...nxPreset,
  transform: {
    '^.+\\.(ts|html)$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esModules})`],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  globals: {
    'ts-jest': {
      babelConfig: true,
      diagnostics: false,
    },
  },
};
