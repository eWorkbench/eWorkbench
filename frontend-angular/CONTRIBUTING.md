# eWorkbench

<p align="center"><img src="./assets/logo.png" width="450"></p>

## Generate a library

Run `npx ng g @nrwl/angular:lib my-lib` to generate a library.

Libraries are sharable across libraries and applications. They can be imported from `@eworkbench/mylib`.

## Generate a module

Run `npm run g:m modules/my-module` to generate a module.

## Generate a component

Components **should** only be generated within `modules` or `pages`.

Run `npm run g:c modules/my-module/components/my-component` to generate a component.

## Generate a page

Pages will be automatically be generated in the folder `pages`.

Run `npm run g:page my-page` to generate a page.

## Generate a service

Services **should** only be generated within `modules`.  
Global services can be generated within `services` if they affect the whole app.

Run `npm run g:service modules/my-module/services/my-service` to generate a service.

## Generate a store

Stores **should** only be generated within `modules`.  
Global stores can be generated within `stores` if they affect the whole app.

Run `npm run g:store modules/my-module/stores/my-store` to generate a store.

## Generate a directive

Directives **should** only be generated within `modules`.  
Global directives can be generated within `directives` if they affect the whole app.

Run `npm run g:directive modules/my-module/directives/my-directive` to generate a directive.

## Generate a pipe

Pipes **should** only be generated within `modules`.  
Global pipes can be generated within `pipes` if they affect the whole app.

Run `npm run g:pipe modules/my-module/pipes/my-pipe` to generate a pipe.

## Generate a guard

Guards **should** only be generated within `modules`.  
Global pipes can be generated within `guards` if they affect the whole app.

Run `npm run g:guard modules/my-module/guards/my-guard` to generate a guard.

## Generate a interceptor

Run `npm run g:i modules/my-module/interceptors/my-interceptor` to generate an interceptor.

## Development server

The default project is `eworkbench` and can easily be served as a dev server with `npm start`.

If you need to serve a specific app as a dev server run `npx ng serve my-app`.

Navigate to http://localhost:4200/. The app will automatically reload if you change any of the source files.

## Build

The default project is `eworkbench` and a development build for it can be generated with `npm run build`. You can also generate a production build with `npm run build:prod`.

Run `npx ng build my-app` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

The default project is `eworkbench` and unit tests for it can be executed with `npm test`.  
Run `npm run affected:test` to execute the unit tests affected by a change.

Run `npx ng test my-app` to execute the unit tests via [Jest](https://jestjs.io).  
Run `npx nx affected:test` to execute the unit tests affected by a change.

## Running end-to-end tests

The default project is `eworkbench` and end-to-end tests for it can be executed with `npm run e2e`.  
Run `npm run affected:e2e` to execute the end-to-end tests affected by a change.

Run `npx ng e2e my-app` to execute the end-to-end tests via [Cypress](https://www.cypress.io).  
Run `npx nx affected:e2e` to execute the end-to-end tests affected by a change.

## Understand your workspace

Run `npx nx dep-graph` to see a diagram of the dependencies of your projects.
