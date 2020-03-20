# eRIC Workbench Frontend
This repo contains the sourcecode of the eRIC Workbench frontend. There is a separate repository for the backend based
on Django REST Framework.

The frontend is based on [AngularJS] 1.7 and [Bootstrap] 3, as well as many other AngularJS and JavaScript components.

## Installation instructions for development
It is expected you have `docker` as well as `docker-compose` set up and running on your machine.

There is a [docker-compose.yml]() file within this repo, which contains a simple webserver based on NodeJS, aswell 
as ``npm``, the node package manager.

* First, build the docker image with
```bash
docker-compose build
```

* Second, start the development server with:
```bash
docker-compose up
```

* Last but not least, make sure to create a local app configuration in [app/js/app.local.js](app/js/app.local.js) with
the following content, where ``workbench.local:8000`` is the domain/url of the Django Backend of eRIC Workbench:
```javascript
(function() {
    'use strict';

    var
        app = angular.module('app');

    // define rest api url
    app.value('restApiUrl', 'http://workbench.local:8000/api/');
    // define admin panel url
    app.value('djangoAdminUrl', 'http://workbench.local:8000/admin/');
    // define websockets url
    app.value('websocketsUrl', 'ws://workbench.local:8000/ws/'); // note: use wss:// instead of ws:// for websockets over https
})();
```

**Note:** If you are getting [CORS] errors, something might be wrong with your domain name and CORS configuration.
Within the eRIC Workbench backend (API) you can configure a whitelist for domains that are allowed to access the 
backend. By default, ``0.0.0.0``, ``localhost``, ``127.0.0.1`` and ``workbench.local`` are whitelisted (with any port 
combination).

**Note:** Within the configuration from above, it is possible to also use relative paths (e.g. when the API and the frontend are hosted on the same virtual host), such as:
```javascript
    app.value('restApiUrl', '/api/');
    app.value('djangoAdminUrl', '/admin/');
    // however, for websockets you still need to specify the full url
    app.value('websocketsUrl', 'wss://somedomain.com/ws/');
```

You should now be able to access your project at [http://workbench.local:8080/app/](). Any changes you make on your JavaScript,
HTML and LESS files should take effect after refresh the page in the browser.

## Installation instructions for a production system
Installating the eRIC Workbench AngularJS application on a production system is as easy as uploading the [public/]() 
folder. There is no downtime, as there are no other manual tasks that need to be performed. However, as this is a 
Single Page Application, all users need to refresh the website. Caching issues are taken care of by using a cache-buster.


The AngularJS application should be minified and uglified (we will henceforth call this the *compiled* version) before 
uploading. You can create the compiled version by executing the following command (this may take a couple of minutes):
```bash
docker-compose run --rm node gulp build --max_old_space_size=4000 --production
```

If you want a debug build with all log output, you can just run this command:
```bash
docker-compose run --rm node gulp build
```

**Note:** Make sure to adapt the config file [public/js/app.local.js](public/js/app.local.js) to your needs!

The [public/](public/) folder contains the minified code aswell as images and licenses for the used components.

### PyCharm Setup

To set up PyCharm correctly and use all of its integrations and features use the following settings:

#### Settings > Project: ericworkbench > Project Structure
Source folders:
- `app/js`

Excluded Folders:
- `app/.tmp`
- `public`

Resource Folders:
- `app`

## Manual Tasks

### Compile the code
* Production build (no log output):
```bash
docker-compose run --rm node gulp build --max_old_space_size=4000 --production
```
* Debug build:
```bash
docker-compose run --rm node gulp build
```

### Compile LESS files into CSS
This is done automatically within the docker container, using gulp-watch.

The following command will compile all `.less` files within [app/](app/) into a css file:
```bash
docker-compose run --rm node gulp styles
```

### Execute Unit tests
```bash
docker-compose run --rm node gulp run-tests
```

### Add a new npm dependency to the project
```bash
docker-compose run --rm node npm install dependency-name --save
```

### Add a new npm dev-dependency to the project
```bash
docker-compose run --rm node npm install dependency-name --save-dev
```

### Create Translation POT Files
```bash
docker-compose run --rm node gulp make-messages
```

### Create Translation JSON Files
```bash
docker-compose run --rm node gulp compile-messages
```

### Run the linter for javascript
```bash
docker-compose run --rm node eslint app/js/
```
**Note**: This is configured [.eslintrc.js](.eslintrc.js) as well as [.eslintignore](.eslintignore), which you can use within
your IDE.

## Instructions for project
* Follow the [JavaScript and AngularJS Coding Conventions](README_CodingConventions.md) for this project
  * To make this easier, you can use ``eslint`` (see config files [.eslintrc.js](.eslintrc.js) ) within your IDE
  * In addition, you can import [IDEConfigStyle.xml](IDECodingStyle.xml) into Webstorm/PHpstorm/Pycharm for JavaScript 
  Code Style
  * If you want to manually check your code style, use this command: ``docker-compose run --rm node eslint app/js/``
* Only deploy production builds to staging and production servers
* Create new branches for new features

### Repository Structure

* [app/](app/) - contains all the source for the frontend
* [docker/](docker/) - contains infos for the docker images used in this project
* [node_modules/](node_modules/) - contains node modules installed via NPM - do not commit these (they are in .gitignore)
* [public/](public/) - contains the files for deployment
* [gulpfile.js](gulpfile.js) - contains build instructions for `gulp`.

### Patternfly Theme
All stuff about the theme can be configured in the [app/theme/]() subfolder in the `.less` files.

Each screen, directive, widget, etc... can have their own `.less` file.

Use ``gulp styles`` to update the .css files based on the definitions in the `.less` files.


### AngularJS Development
Any controllers (JS and HTML Code) should be placed in [app/js/screens/]() in subfolders (see existing folders). 
One subfolder can contain many controllers.
Please make extensive use of re-useable AngularJS directives, services and factories. 

### Translations
Translations are handled by `angular-gettext`. See [this guide](https://angular-gettext.rocketeer.be/dev-guide/annotate/) for annotating objects.

Basically, you can annotate in HTML by using the ``translate`` attribute, e.g.:
```html
<span translate>Lorem impsum</span>
```

and in Angular you can inject ``gettextCatalog`` and use ``gettextCatalog.getString("Lorem ipsum")`` within your JavaScript code.

Once you are done, run 
```bash
docker-compose run --rm node gulp make-messages
```
which will create a ``.pot`` file in the [app/locales/](app/locales/) folder. Load this ``.po`` file in your favourite 
translations editor (e.g., poedit) as a template. Use the existing files (e.g., ``de.po``) to translate.

Once you are done translating, use 
```bash
docker-compose run --rm node gulp compile-messages
```
to rebuild the translations files in [app/locales/](app/locales/).


# Docker Frontend Node Base
There is a node base image for docker, hosted on [dockerhub](https://hub.docker.com/r/tumworkbench/frontend_node_base/).

This image is basically built within the [Dockerfile](docker/frontendNodeBase/Dockerfile) in [docker/frontendNodeBase/](docker/frontendNodeBase/).

```bash
docker login
docker build docker/frontendNodeBase/ -t tumworkbench/node_base_frontend
docker push tumworkbench/node_base_frontend
```

# Non-updateable Javascript Dependencies

## selectize.js

Needs to be in version 0.12.4 - we tried 0.12.6 and it did not properly display project names in the project selectize widget

# External Resources
[AngularJS]: https://angularjs.org/
[Bootstrap]: http://getbootstrap.com/
[gulp]: http://gulpjs.com/
[npm]: https://www.sitepoint.com/beginners-guide-node-package-manager/
[docker]: https://www.docker.com/community-edition
[docker-compose]: https://docs.docker.com/compose/
[CORS]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS

* [gulp]
* [npm]
* [docker]
* [docker-compose]
* [AngularJS]
* [Bootstrap]


# Attributions
We are using the free "font-awesome icon set" v4.6 (www.fontawesome.com) as well as "entypo pictograms" by Daniel Bruce (www.entypo.com)
