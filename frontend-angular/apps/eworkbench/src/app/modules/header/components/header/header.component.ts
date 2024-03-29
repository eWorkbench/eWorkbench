/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ElementRef, Inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectsService } from '@app/services';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { HEADER_TOP_OFFSET } from '../../tokens/header-top-offset.token';

@UntilDestroy()
@Component({
  selector: 'eworkbench-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Input()
  public title? = 'eWorkbench';

  public breadcrumbs: { name: string; uri: string }[] = [];

  public constructor(
    @Inject(HEADER_TOP_OFFSET) private readonly headerTopOffset: BehaviorSubject<number>,
    private readonly router: Router,
    private readonly projectsService: ProjectsService,
    private readonly elRef: ElementRef
  ) {}

  public async ngOnInit(): Promise<void> {
    const url = this.router.url.split('/').filter(v => v);
    const isProject = url.includes('projects');
    this.breadcrumbs = await Promise.all(
      url.slice(0, url.length - 1).map(async (val, i) => {
        const name = val[0].toUpperCase() + val.slice(1);
        if (isProject && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)) {
          try {
            const project = await lastValueFrom(this.projectsService.get(val).pipe(untilDestroyed(this)));
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            return { name: project?.display ?? '', uri: `/${url.slice(-url.length, i - 3).join('/')}` };
          } catch {
            return { name, uri: `/${url.slice(-url.length, i - 3).join('/')}` };
          }
        }
        return { name, uri: `/${url.slice(-url.length, i + 1).join('/')}` };
      })
    );
  }

  public onMaintenanceLoaded(): void {
    setTimeout(() => {
      const topOffset = 60 + Number(this.elRef.nativeElement.offsetHeight); // 60 = height of menu bar
      this.headerTopOffset.next(topOffset);
    }, 1);
  }
}
