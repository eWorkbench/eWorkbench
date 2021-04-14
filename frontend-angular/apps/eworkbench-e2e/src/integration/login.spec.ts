/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

interface LoginData {
  username: string;
  password: string;
}

describe('eworkbench login', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  it('should say "Login"', () => {
    cy.contains('Login');
  });

  it('should input credentials and login', () => {
    cy.server();
    cy.route('POST', '/api/auth/login/').as('login');
    cy.fixture('login').then((login: LoginData) => {
      cy.login(login.username, login.password);
      cy.wait('@login');
      cy.url().should('include', '/');
      // cy.get('ul > li > div > button').contains('e2e-firstname e2e-lastname');
      // TODO: Fix this test as it will always return null and really shouldn't
      // expect(localStorage.getItem('token')).not.to.be.null;
    });
  });

  it('should redirect to the forgot password page', () => {
    cy.get('.ewb-button-none').click();
    cy.url().should('include', '/forgot-password');
  });
});
