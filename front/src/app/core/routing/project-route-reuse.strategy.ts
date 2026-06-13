import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

@Injectable()
export class ProjectRouteReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot
  ): boolean {
    const isProjectWorkspace = future.routeConfig?.path === 'projects/:projectId/:slug';
    if (
      isProjectWorkspace
      && future.routeConfig === current.routeConfig
      && future.paramMap.get('projectId') !== current.paramMap.get('projectId')
    ) {
      return false;
    }
    return super.shouldReuseRoute(future, current);
  }
}
