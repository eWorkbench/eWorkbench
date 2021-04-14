/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { Toast } from 'ngx-toastr';

@Component({
  selector: '[custom-toastr]',
  templateUrl: './toastr.component.html',
  styleUrls: ['./toastr.component.scss'],
})
export class CustomToastComponent extends Toast {}
