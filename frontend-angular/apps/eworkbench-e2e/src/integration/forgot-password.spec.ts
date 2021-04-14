/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

interface ForgotPasswordData {
  email: string;
}

describe('eworkbench forgot password', () => {
  beforeEach(() => {
    cy.visit('/forgot-password');
  });

  it('should say "Forgot password"', () => {
    cy.contains('Forgot password');
  });

  it('should input email address and request a new password', () => {
    cy.server();
    cy.route('POST', '/api/auth/reset_password/').as('forgotPassword');
    cy.fixture('forgot-password').then((forgotPassword: ForgotPasswordData) => {
      cy.get('input[name=email]').type(`${forgotPassword.email}{enter}`);
      cy.wait('@forgotPassword');
      cy.get('main > alert > div')
        .first()
        .contains(`ℹ️ An email with instructions on how to reset your password has been sent to ${forgotPassword.email}.`);
    });
  });

  it('should redirect back to login page after clicking the back button', () => {
    cy.get('main > form > a').first().click();
    cy.url().should('include', '/login');
  });
});
