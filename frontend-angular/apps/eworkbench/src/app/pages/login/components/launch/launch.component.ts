import { Component, ChangeDetectionStrategy, OnInit, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SHOW_MENU } from '@app/modules/navbar/tokens/show-menu.token';
import { AuthService } from '@app/services/auth/auth.service';
import { LaunchScreenService } from '@app/services/launch-screen/launch-screen.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { map, tap, switchMap, shareReplay, filter, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-launch',
  templateUrl: './launch.component.html',
  styleUrls: ['./launch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaunchComponent implements OnInit, OnDestroy {
  private readonly launchScreens$ = this.launchScreenService.getList().pipe(
    map(response => response.data),
    shareReplay()
  );

  private readonly currentIndex$ = new BehaviorSubject(0);

  public readonly currentScreen$ = combineLatest([this.launchScreens$, this.currentIndex$]).pipe(
    tap(([screens, index]) => {
      if (index >= screens.length) {
        void this.router.navigate([this.returnUrl]);
      }
    }),
    map(([screens, index]) => screens[index])
  );

  private readonly acceptedScreenPayload$ = this.currentScreen$.pipe(
    filter(Boolean),
    switchMap(currentScreen =>
      of({
        launch_screen: currentScreen.pk,
        accepted_version: currentScreen.version,
        accepted_timestamp: currentScreen.last_modified_at,
      })
    )
  );

  private readonly acceptScreenSubject = new Subject<void>();
  private readonly screenAccepted$ = this.acceptScreenSubject.asObservable().pipe(
    switchMap(() => this.acceptedScreenPayload$.pipe(take(1))),
    switchMap(screen => this.launchScreenService.acceptScreen(screen))
  );

  private returnUrl = '/';

  public constructor(
    @Inject(SHOW_MENU) public readonly showMenu$: BehaviorSubject<boolean>,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly launchScreenService: LaunchScreenService,
    private readonly authService: AuthService
  ) {}

  public ngOnInit(): void {
    this.showMenu$.next(false);
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || this.returnUrl;

    this.screenAccepted$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.currentIndex$.next(this.currentIndex$.value + 1);
      },
    });
  }

  public ngOnDestroy(): void {
    this.showMenu$.next(true);
  }

  public onLogout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  public acceptScreen(): void {
    this.acceptScreenSubject.next();
  }
}
