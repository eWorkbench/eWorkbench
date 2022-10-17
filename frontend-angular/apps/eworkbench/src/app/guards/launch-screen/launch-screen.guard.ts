import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@app/services';
import { LaunchScreenService } from '@app/services/launch-screen/launch-screen.service';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LaunchScreenGuard implements CanActivate {
  private readonly loggedIn$ = this.authService.user$.pipe(map(user => user.loggedIn));

  private readonly launchScreensCount$ = this.loggedIn$.pipe(
    switchMap(() => this.launchScreenService.getList()),
    map(response => response.total)
  );

  public constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly launchScreenService: LaunchScreenService
  ) {}

  private navigate(loadLaunchScreen: boolean, state: RouterStateSnapshot): boolean {
    if (loadLaunchScreen) {
      void this.router.navigate(['/login', 'launch'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    return true;
  }

  public canActivate(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.launchScreensCount$.pipe(
      take(1),
      switchMap(count => {
        if (count > 0) {
          return of(this.navigate(true, state));
        }
        return of(this.navigate(false, state));
      })
    );
  }
}
