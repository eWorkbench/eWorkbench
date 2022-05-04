/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const mockUserStoreDialogFalse = {
  user: { userprofile: { ui_settings: { confirm_dialog: { 'SkipDialog-TrashElementFromDeleteMenu': false } } } },
};

export const mockUserStoreDialogTrue = {
  user: { userprofile: { ui_settings: { confirm_dialog: { 'SkipDialog-TrashElementFromDeleteMenu': true } } } },
};
