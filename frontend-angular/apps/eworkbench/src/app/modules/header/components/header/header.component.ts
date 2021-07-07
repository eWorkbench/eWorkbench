/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectsService } from '@app/services';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input()
  public title = 'eWorkbench';

  public breadcrumbs: { name: string; uri: string }[] = [];

  public constructor(private readonly router: Router, private readonly projectsService: ProjectsService) {}

  public async ngOnInit(): Promise<void> {
    const url = this.router.url.split('/').filter(v => v);
    const isProject = url.includes('projects');
    let i = 1;
    this.breadcrumbs = await Promise.all(
      url.slice(0, url.length - 1).map(async val => {
        if (isProject && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)) {
          try {
            const project = await this.projectsService.get(val).pipe(untilDestroyed(this)).toPromise();
            return { name: project?.display ?? '', uri: `/${url.slice(-url.length, i++).join('/')}` };
          } catch {
            return { name: val, uri: `/${url.slice(-url.length, i++).join('/')}` };
          }
        }

        return { name: val[0].toUpperCase() + val.slice(1), uri: `/${url.slice(-url.length, i++).join('/')}` };
      })
    );
  }
}
