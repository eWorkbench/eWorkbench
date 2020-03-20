Installation Instructions
=========================

This is the readme for how to deploy Workbench on a Debian 9+/Ubuntu 16.04+ server with nginx. If you just want to run 
 it locally on your machine (for development purpose), please look at the main README file of this repository and use
 the included docker-compose setup.

Preparations
------------

We are assuming that you are working as a non-root user (which can run ``sudo``) and that you have basic
 knowledge about setting up nginx, aswell as using systemd and Linux servers in general. Please make use of the
 ``sudo`` command where applicable (e.g. when using ``apt-get install`` or when restarting systemd services).

Please prepare a Debian/Ubuntu Server (can be virtualized) and note down the hostname (e.g., the domain
 that the workbench installation will be running at) of that server. For demonstration purpose within this document we
 chose the hostname ``workbench.local``, but you can choose any other hostname instead.

If you are planning to use LDAP, make sure you have LDAP server details ready. They can be added anytime later though.
 Please contact your local LDAP admin for those details.

Also, make sure you have the details for your outgoing e-mail server ready. Please contact your local email admin for
 those details (they can also be added later, but it is recommended to have them added with the initial setup).

Prepare the Workbench Backend (Django) and Frontend (AngularJS) application sources on your local computer (e.g., by
cloning the git repositories or downloading packaged files). We are assuming that you have both repositories
in your home folder, e.g.: ``~/eric/frontend`` and ``~/eric/backend``. How you gain access to the git repositories or
the redmine website is beyond the scope of this document.

For the purpose of this tutorial, we are assuming that you are logged in as the ``www-data`` user on the server. If you
are logged in as any other user, please make sure to adapt the commands, especially those involving the user or group
``www-data``, accordingly.

Basic Packages (Python, Git, ...)
---------------------------------

The following commands require execution by a superuser, please use `sudo` where applicable!

Update the servers package index:

.. code:: bash

    apt update

Check which version of python is installed (Python 3.5 or newer is required):

.. code:: bash

    python3 --version

If you can not find python3, please install it using the following command:

.. code:: bash

    apt install -y python3.5 # or just use apt install -y python3

In addition, install python3-dev and python3-pip:

.. code:: bash

    apt install -y python3-dev python3-pip

Install virtualenv via pip (sudo might be required):

.. code:: bash

    pip3 install virtualenv --upgrade  # install/upgrade virtualenv

Last but not least, install git:

.. code:: bash

    apt install git


Redis Cache
-----------

It is recommended to setup a redis caching server, as Workbench aswell as the Django Framework make use of caching via redis.
 Please follow the guide for installing redis depending on your operating system (e.g., ``apt -y install redis-server``).

Redis needs to be configured to not use a tcp port, but a unix socket as follows (see ``/etc/redis/redis.conf``):


.. code::

    port 0


.. code::

    unixsocket /var/run/redis/redis.sock
    unixsocketperm 770


Now restart the redis server:

.. code:: bash

    service redis-server restart

And verify that you can connect to the redis server via the unix socket as root:

.. code:: bash

    redis-cli -s /var/run/redis/redis.sock

Also verify the permissions on ``/var/run/redis/redis.sock`` via ``ls -la /var/run/redis/redis.sock``. The user and group ``redis`` should have access to it:

.. code::

    ls -la /var/run/redis/redis.sock

    srwxrwx--- 1 redis redis 0 /var/run/redis/redis.sock

Last but not least, make sure that the user that the Django Application is going to run with (e.g., ``www-data``) is in the group ``redis``:

.. code:: bash

    usermod -aG redis www-data


Please also read the settings section regarding caches (see :ref:`settings` for details) on how to configure redis within the Django application.


Postgres Database
-----------------

The Postgres Database Server is used for permanently storing data within a relational database. In addition, Workbench uses the Postgres FTS Feature, which is installed in migration ``eric/search/migrations/0001_initial.py`` by using ``TrigramExtension`` (``pg_trgm``) and ``UnaccentExtension`` (this is just for your information):

.. code:: python

    from django.db import migrations
    from django.contrib.postgres.operations import TrigramExtension, UnaccentExtension


    class Migration(migrations.Migration):

        initial = True

        dependencies = []

        operations = [
            TrigramExtension(),
            UnaccentExtension(),
        ]


Please note that executing this migration requires superuser privileges within the database, executing this migration without those privileges might result in an error.

After the migration has been executed, superuser privileges can be removed for the database user.

Installation
~~~~~~~~~~~~

Install the postgres dev-server and client (tested with version 9.4, 9.6; newer versions should work too):

.. code:: bash

    apt-get install -y postgresql postgresql-client postgresql-contrib
    apt-get install -y postgresql-server-dev-9.6 # this one requires the exact version name

Check if postgres services are running

.. code:: bash

    ps -ef | grep postgres
    systemctl status postgresql

Configuration
~~~~~~~~~~~~~

We assume that a new database user called `eric` is created. This user gets superuser privileges for now. If you choose
to give this user a different name, make sure to adapt the commands accordingly.

.. code:: bash

    su -                        # change to root user
    su - postgres               # change to a session with the postgres user
    createuser -P eric          # add new postgres user 'eric'
    createdb eric               # create new database 'eric'
    psql                        # change to postgres bash
    \l                          # show databases and verify the newly created database exists
    ALTER USER eric WITH SUPERUSER;  # add user to role attribute superuser so we can install pg_tgrm
    \du                         # check if user has the role attribute superuser
    \q                          # exit
    exit                        # leave session with postgres user

Further Dependencies
--------------------

Additional Packages required for Workbench:

.. code:: bash

    apt install -y libxml2-dev libxslt1-dev libffi-dev libsasl2-dev python-dev libldap2-dev libssl-dev

WeasyPrint (Python PDF Printer) requires several packages, see ``http://weasyprint.readthedocs.io/en/stable/install.html#linux``

The following should work with Debian 9.0+ as well as Ubuntu 16.04+ (but make sure to consult the documentation link above):

.. code:: bash

    apt install -y build-essential libcairo2 libpango-1.0-0 libpangocairo-1.0.0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info


Webserver
~~~~~~~~~

**Note**: Previous versions of this document advised to install Apache2. New features of Workbench make it necessary to use
nginx as a webserver. Workbench will no longer work with Apache2.

Deployment
----------

Now that we have the pre-requesits done, we can start deploying the backend and frontend applications. Therefore we
suggest the following basic folder structure, which you have to create on the server:

* Backend: ``/var/django/ericworkbench/``
* Frontend: ``/var/www/ericworkbench/``

.. code:: bash

    # create folders (using sudo)
    mkdir /var/django
    mkdir /var/django/ericworkbench
    mkdir /var/www/
    mkdir /var/www/ericworkbench
    # change ownership of the folders to www-data (should be the nginx user)
    chown -R www-data:www-data /var/www
    chown -R www-data:www-data /var/django
    # set permissions
    chmod 775 /var/django /var/django/ericworkbench
    chmod 775 /var/www /var/www/ericworkbench


.. _upload-workbench-backend:

Uploading the Backend Application
---------------------------------

From the eRIC Workbench Backend application on your local computer (should be in ``~/eric/backend``), copy the **app**
folder onto the server in the folder ``/var/django/ericworkbench/``, such that the folder structure looks like this:

::

    /var/django/ericworkbench/
    /var/django/ericworkbench/app/
    /var/django/ericworkbench/app/requirements.txt
    /var/django/ericworkbench/app/eric/
    /var/django/ericworkbench/app/eric/manage.py
    /var/django/ericworkbench/app/eric/settings/


.. _upload-workbench-frontend:

Uploading the Frontend Application
----------------------------------

From the eRIC Workbench Frontend application on your local computer (should be in ``~/eric/frontend``), copy the
**public** folder of onto the server in the folder ``/var/www/ericworkbench/``, such that the folder structure looks
like this:

::

    /var/www/ericworkbench/
    /var/www/ericworkbench/index.html
    /var/www/ericworkbench/node_modules/
    /var/www/ericworkbench/locales/
    /var/www/ericworkbench/LICENSES/
    /var/www/ericworkbench/js/
    /var/www/ericworkbench/img/
    /var/www/ericworkbench/fonts/
    /var/www/ericworkbench/css/


For websockets to work you have to edit (or create if necessary) `/var/www/ericworkbench/js/app.local.js` with the following content:

.. code::

    (function () {
        'use strict';

        /**
         * This file is only local, and not within the git repo
         */

        var
            app = angular.module('app');

        /* Your configuration goes here */
        app.value('websocketsUrl', 'ws://workbench.local/ws/');
    })();


Setting up the Backend Application
----------------------------------

**Note**: This step should NOT require sudo. All steps should be executed as a normal user (e.g., `www-data`).

Now that we have uploaded all files we need to the server, change to the directory ``/var/django/ericworkbench``

.. code:: bash

    cd /var/django/ericworkbench

and create a virtualenv in the ``venv`` directory (and activate it)

.. code:: bash

    virtualenv -p python3 venv # alternatively, specify python3.5 or python3.4
    source venv/bin/activate

Install and upgrade pip (best practice)

.. code:: bash

    pip install pip --upgrade

Install the ``daphne`` webserver:

.. code:: bash

    pip install daphne

Then change to the ``app`` sub directory (``/var/django/ericworkbench/app``):

.. code:: bash

    cd app

Create the ``logs`` directory

.. code:: bash

    mkdir logs

and finally install the dependencies of eRIC Workbench (listed in a requirements file) using ``pip``:

.. code:: bash

    pip install -r requirements.txt

If you get the error 'permission denied' (e.g., because you are not logged in as ``www-data``), you have to change the
ownership of the directory ``/var/django`` to your current user (temporarily).


Create a new settings file in ``/var/django/ericworkbench/app/eric/settings/``, e.g. ``live.py``. You can call the file
whatever you want (just needs the ending ``.py``). In this example, the settings file is called ``live.py`` and we will
furthermore reference to it with ``eric.settings.live``.

The new settings file ``live.py`` overwrites the basic settings from ``base.py``. An example settings file is
furthermore provided in ``app/eric/settings/example.py``, containing the basic configuration options available for
eRIC Workbench.

For more information about settings, please look at the :ref:`Settings` section of this documentation.

Initialize (migrate) the Database, collect the static files and create a superuser:

::

    python manage.py migrate --settings=eric.settings.live
    python manage.py createsuperuser --settings=eric.settings.live
    python manage.py collectstatic --settings=eric.settings.live


Frontend
~~~~~~~~

Change the URLs in ``/var/www/ericworkbench/js/app.config.js`` to match your settings, e.g.:

.. code:: javascript

    app.value('restApiUrl', '/api/');


Install nginx
~~~~~~~~~~~~~

Please look up how to install nginx on your system. For Debian/Ubuntu this is usually


.. code:: bash

    apt install nginx


Configure nginx
~~~~~~~~~~~~~~~

Create a new configuration file called ``workbench`` in ``/etc/nginx/sites-available``:

.. code::

    # upstream (django)
    upstream web {
        ip_hash;
        server unix:/run/daphne/socket fail_timeout=0;
    }

    # don't send the nginx version number in error pages and Server header
    server_tokens off;

    # This header enables the Cross-site scripting (XSS) filter built into most recent web browsers.
    # It's usually enabled by default anyway, so the role of this header is to re-enable the filter for
    # this particular website if it was disabled by the user.
    # https://www.owasp.org/index.php/List_of_useful_HTTP_headers
    add_header X-XSS-Protection "1; mode=block";

    # config to don't allow the browser to render the page inside an frame or iframe
    # and avoid clickjacking http://en.wikipedia.org/wiki/Clickjacking
    # if you need to allow [i]frames, you can use SAMEORIGIN or even set an uri with ALLOW-FROM uri
    # https://developer.mozilla.org/en-US/docs/HTTP/X-Frame-Options
    add_header X-Frame-Options SAMEORIGIN;

    # with Content Security Policy (CSP) enabled(and a browser that supports it(http://caniuse.com/#feat=contentsecuritypolicy),
    # you can tell the browser that it can only download content from the domains you explicitly allow
    # http://www.html5rocks.com/en/tutorials/security/content-security-policy/
    # https://www.owasp.org/index.php/Content_Security_Policy
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: mediastream:;" always;

    # redirect all http traffic to https
    server {
        listen 80;
        listen [::]:80;
        server_name workbench.local;

        # deny access to .htaccess files (just in case)
        location ~ /\.ht {
            deny all;
        }

        # deny access to .git files (just in case)
        location ~ /\.git {
            deny all;
        }

        # deny readme files etc...
        location ~ ^/(?:\.htaccess|README){
            deny   all;
        }

        # allow 20 GB of body to be transferred
        client_max_body_size       20G;

        # frontend app root
        root /var/www/ericworkbench;

        # alias for static files
        location /static/ {
            autoindex off;
            alias /var/django/ericworkbench/htdocs/static/;
        }

        # alias for uploaded files
        location /uploaded_media/ {
            autoindex off;
            alias /var/django/ericworkbench/htdocs/static/uploaded_media/;
        }

        index index.html;

        location / {
            # raise a 503 (maintenance) error, if maintenance.enable exists
            if (-f /var/www/ericworkbench/public/maintenance.enable) {
                return 503;
            }
            # First attempt to serve request as file, then
            # as directory, then fall back the django proxy
            try_files $uri $uri/ @django;
        }

        # error 503 redirect to maintenance.html
        error_page 503 @maintenance;
        location @maintenance {
                expires -1;
                add_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
                rewrite ^(.*)$ /maintenance.html break;
        }

        # proxy stuff for django
        location @django {
            # timeout for uploads
            # timeout is set only between two successive read operations, not for the transmission of the whole response.
            # If the proxied server does not transmit anything within this time, the connection is closed.
            proxy_read_timeout 600;
            # timeout for establishing a connection with a proxied server
            proxy_connect_timeout 15;
            proxy_pass_request_headers on;
            # make sure the real ip address of the connecting client is properly set
            proxy_set_header	X-Real-IP $remote_addr;
            proxy_set_header	X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header	Host $http_host;
            proxy_pass		http://web;
            proxy_redirect		off;
            # tell the upstream that we are using https (or whatever scheme is currently in use)
            proxy_set_header	X-Forwarded-Proto $scheme;
        }
    }


Enable the configuration via a symlink:

.. code:: bash

    ln -s /etc/nginx/sites-available/workbench /etc/nginx/sites-enabled/workbench.conf

and reload your nginx:

.. code:: bash

    service nginx reload

You can check if nginx is running by executing

.. code:: bash

    systemctl status nginx


Setup daphne as a python wsgi server with systemd
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We already installed daphne above using ``pip install daphne``.

To test that the setup is working, go to ``/var/django/ericworkbench/app`` and run the following command:

.. code:: bash
    export DJANGO_SETTINGS_MODULE=eric.settings.live
    daphne -b 0.0.0.0 -p 8080 eric.asgi:application

Daphne might not print any log messages, so unless you see an error you can assume that it works.

Depending on your firewall configuration, you should be able to access the backend application using ``http://workbench.local:8080/admin/`` (note: styles might not work, but you should see the django admin login).

If that works, you can kill the daphne process (CTRL C) and convert it into a systemd service.

**Note**: We will be using a unix socket instead of port 8080.

1. Create a new file ``/etc/systemd/system/daphne.service``:

.. code::

    [Unit]
    Requires=daphne.socket
    Description=daphne daemon (workbench)
    After=network.target

    [Service]
    PIDFile=/run/daphne/pid
    User=www-data
    Group=www-data
    WorkingDirectory=/var/django/ericworkbench/app
    Environment="DJANGO_SETTINGS_MODULE=eric.settings.live"
    ExecStart=/var/django/ericworkbench/venv/bin/daphne -u /run/daphne/socket -v 2 --proxy-headers --http-timeout 600 eric.asgi:application
    ExecReload=/bin/kill -s HUP $MAINPID
    ExecStop=/bin/kill -s TERM $MAINPID
    PrivateTmp=true

    [Install]
    WantedBy=multi-user.target

You can adapt ``--workers 6`` to any number of workers you prefer. As a rule of thumb, daphne recommends to set it to ``2 x {num_cpu_cores} + 1``.

2. Create a new file ``/etc/systemd/system/daphne.socket``:

.. code::

    [Unit]
    Description=daphne socket

    [Socket]
    ListenStream=/run/daphne/socket

    [Install]
    WantedBy=sockets.target

3. Create a new file ``/etc/systemd/system/daphne_restart.service``:

.. code::

    [Unit]
    Description=Restart daphne service

    [Service]
    Type=oneshot
    ExecStart=/bin/systemctl restart daphne

4. Create a new file ``/etc/systemd/system/daphne_restart.path``:

.. code::

    [Unit]
    Description=Triggers the daphne service

    [Path]
    PathModified=/run/daphne/restart.txt

    [Install]
    WantedBy=multi-user.target

5. Permission handling for ``/run/daphne/socket``: Create a new file ``/etc/tmpfiles.d/daphne.conf``:

.. code::

    d /run/daphne 0775 www-data www-data -

6. As root: Reload systemd daemon and enable the ``daphne`` socket unit aswell as the ``daphne_restart`` path unit:

.. code:: bash

    systemctl daemon-reload
    systemctl enable daphne.socket
    systemctl start daphne.socket
    systemctl enable daphne_restart.path
    systemctl start daphne_restart.path

The tmpfile.d service will be reloaded on boot, therefore we have to manually create the folder and set permissions:

.. code:: bash

    mkdir /run/daphne
    chown -R www-data:www-data /run/daphne
    chmod 755 /run/daphne


7. You should be able to verify that `daphne` is running by executing

.. code:: bash

    systemctl status daphne

If it says

.. code::

    ● daphne.service - daphne daemon (workbench)
       Loaded: loaded (/etc/systemd/system/daphne.service; disabled; vendor preset: enabled)
       Active: inactive (dead)

then you can start the service by executing

.. code::

    touch /run/daphne/restart.txt

On success, you should see the following output by `systemctl status daphne`:

.. code::

    ● daphne.service - daphne daemon (workbench)
       Loaded: loaded (/etc/systemd/system/daphne.service; disabled; vendor preset: enabled)
       Active: active (running) since Thu 2019-01-31 12:53:20 CET; 5s ago
      Process: 23843 ExecStop=/bin/kill -s TERM $MAINPID (code=exited, status=1/FAILURE)
     Main PID: 23868 (daphne)
        Tasks: 7 (limit: 9830)
       CGroup: /system.slice/daphne.service
               ├─23868 /var/django/ericworkbench/venv/bin/python3 /var/django/ericworkbench/venv/bin/daphne --pid /run/daphne/pid --workers 6 --timeout 600 --bind unix:/run/daphne/socket eric.wsgi
               ├─23873 /var/django/ericworkbench/venv/bin/python3 /var/django/ericworkbench/venv/bin/daphne --pid /run/daphne/pid --workers 6 --timeout 600 --bind unix:/run/daphne/socket eric.wsgi
               ├─23874 /var/django/ericworkbench/venv/bin/python3 /var/django/ericworkbench/venv/bin/daphne --pid /run/daphne/pid --workers 6 --timeout 600 --bind unix:/run/daphne/socket eric.wsgi
               ├─23877 /var/django/ericworkbench/venv/bin/python3 /var/django/ericworkbench/venv/bin/daphne --pid /run/daphne/pid --workers 6 --timeout 600 --bind unix:/run/daphne/socket eric.wsgi
               ├─23878 /var/django/ericworkbench/venv/bin/python3 /var/django/ericworkbench/venv/bin/daphne --pid /run/daphne/pid --workers 6 --timeout 600 --bind unix:/run/daphne/socket eric.wsgi
               ├─23881 /var/django/ericworkbench/venv/bin/python3 /var/django/ericworkbench/venv/bin/daphne --pid /run/daphne/pid --workers 6 --timeout 600 --bind unix:/run/daphne/socket eric.wsgi
               └─23882 /var/django/ericworkbench/venv/bin/python3 /var/django/ericworkbench/venv/bin/daphne --pid /run/daphne/pid --workers 6 --timeout 600 --bind unix:/run/daphne/socket eric.wsgi

    Jan 31 12:53:20 tuzebib-platform systemd[1]: Started daphne daemon (workbench).
    Jan 31 12:53:20 tuzebib-platform daphne[23868]: [2019-01-31 12:53:20 +0100] [23868] [INFO] Starting daphne 19.9.0
    Jan 31 12:53:20 tuzebib-platform daphne[23868]: [2019-01-31 12:53:20 +0100] [23868] [INFO] Listening at: unix:/run/daphne/socket (23868)
    Jan 31 12:53:20 tuzebib-platform daphne[23868]: [2019-01-31 12:53:20 +0100] [23868] [INFO] Using worker: sync
    Jan 31 12:53:20 tuzebib-platform daphne[23868]: [2019-01-31 12:53:20 +0100] [23873] [INFO] Booting worker with pid: 23873
    Jan 31 12:53:20 tuzebib-platform daphne[23868]: [2019-01-31 12:53:20 +0100] [23874] [INFO] Booting worker with pid: 23874
    Jan 31 12:53:21 tuzebib-platform daphne[23868]: [2019-01-31 12:53:21 +0100] [23877] [INFO] Booting worker with pid: 23877
    Jan 31 12:53:21 tuzebib-platform daphne[23868]: [2019-01-31 12:53:21 +0100] [23878] [INFO] Booting worker with pid: 23878
    Jan 31 12:53:21 tuzebib-platform daphne[23868]: [2019-01-31 12:53:21 +0100] [23881] [INFO] Booting worker with pid: 23881
    Jan 31 12:53:21 tuzebib-platform daphne[23868]: [2019-01-31 12:53:21 +0100] [23882] [INFO] Booting worker with pid: 23882


For debugging purpose you might want to check the logs of this service by executing:

.. code::

    journalctl -u daphne.service



Last steps
~~~~~~~~~~

In case you changed the permissions for the respecting folders, make sure that the correct folder permissions are set, 
such that nginx and daphne will have access to those files.

.. code:: bash

    chown -R www-data:www-data /var/www/ericworkbench
    chown -R www-data:www-data /var/django


You should now be able to access Workbench via the following URLs
-----------------------------------------------------------------

eRIC Workbench: ``http://workbench.local``

Browsable API: ``http://workbench.local/api``

Admin Panel: ``http://workbench.local/admin``


Deploy Updates
==============

Update the Backend (Django)
---------------------------

Follow the same steps as in :ref:`upload-workbench-backend` for uploading the updated workbench backend.

Then run the following commands on the server:

.. code:: bash

    cd /var/django/ericworkbench
    # activate venv
    source venv/bin/activate
    cd app
    # update requirements
    pip install -r requirements.txt --upgrade
    # migrate
    python manage.py migrate --settings=eric.settings.live
    # collect static file
    python manage.py collectstatic --settings=eric.settings.live
    # rebuild search index
    python manage.py ftsrebuild --settings=eric.settings.live

    # reload app using systemd
    sudo systemctl restart daphne.socket


Update the Frontend (Angular)
-----------------------------

Follow the same steps as in :ref:`upload-workbench-frontend` for uploading the updated workbench frontend. You do not
need to run any commands on the server.

Depending on your browser, you might have to empty/clear the cache of the client computers and refresh the website.


DB and Media Backups
====================

Before you execute any commands, make sure you have activated the virtualenv!

.. code:: bash

    source venv/bin/activate
    cd app

For all commands, specify the settings file you want to use!

All backups are stored in the [backups/] folder.

To create a new database backup, run:

.. code:: bash

    python manage.py dbbackup -z --settings=eric.settings.live


To create a new media files backup, run:

.. code:: bash

    python manage.py mediabackup -z --settings=eric.settings.live


## Restoring from backups
To restore a database backup, run the ``dbrestore``, also add ``-I`` and specify the input file:

.. code:: bash

    python manage.py dbrestore -z -I ../backups/default-anx-i-ws-200-2017-03-09-125228.psql.gz --settings=eric.settings.live


**Note**: In some cases the command might fail if you have an existing database. In this case, make sure
 to clean the database before you run the dbrestore command

To restore a media files backup, run:

.. code:: bash

    python manage.py mediarestore -z -I ../backups/anx-i-ws-200-2017-03-09-124608.tar.gz

