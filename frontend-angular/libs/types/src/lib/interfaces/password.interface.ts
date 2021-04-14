/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface ForgotPassword {
  email: string;
}

export interface ChangePassword {
  password: string;
  token: string;
}

export interface PasswordAPIResponse {
  status?: string;
  email?: string[];
  password?: string[];
  token?: string[];
}
