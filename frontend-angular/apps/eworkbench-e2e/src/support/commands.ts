/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      login: (email: string, password: string) => void;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.get('input[name=username]').type(email);
  cy.get('input[name=password]').type(`${password}{enter}`);
});
