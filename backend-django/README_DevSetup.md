[README](README.md)

# eRIC Workbench Backend - Development Setup

It is expected you have `docker` as well as `docker-compose` set up and running on your machine.

For convenience, add the following line to your `/etc/hosts` (on Linux):
```
127.0.11.20    workbench.local maildump.workbench.local
```


## Docker Setup
This repo contains the following docker services:

* `workbench.local`: a python service which is used to run ``python manage.py runserver`` at port ``8000``
* `db.workbench.local`: a postgres 9.4 server, listening on port `5432`
* `maildump.workbench.local`: a maildump server, listening on ports `1025` (smtp) and `1080` (webmail)
* `redis.workbench.local`: a redis server, listening on port `6379`
* `ldap.workbench.local`: a ldap server, listening on port `389` (ldap), `636` (ldaps) and `1081` (ldap admin) - for more information read [ldap/README.md](ldap/README.md)

To initially build and run the application, do the steps as follows:

* Build the docker images: ``docker-compose build``
* Install python dependencies: ``docker-compose run --rm python pip install -r requirements.txt``
* Run the services: ``docker-compose up``


## Django Setup

* The docker setup uses a very specific docker configuration file, located in [app/eric/settings/docker.py](app/eric/settings/docker.py). 

For more information about the settings, generate and open the documentation (see the section about [Auto Generated Sphinx Documentation](#auto-generated-sphinx-documentation) below).

Execute the following steps to setup the application:

* Collect static files
```bash
docker-compose run --rm python python manage.py collectstatic
```

* Run migrations
```bash
docker-compose run --rm python python manage.py migrate
```

* And create a superuser
```bash
docker-compose run --rm python python manage.py createsuperuser
```

* Load Fixtures for DMP:
```bash
docker-compose run --rm python python manage.py loaddata eric/fixtures/dmps
```

* Load Fixtures for Resources
```bash
docker-compose run --rm python python manage.py loaddata eric/fixtures/resources
```

* Load Fixtures for Contacts
```bash
docker-compose run --rm python python manage.py loaddata eric/fixtures/contacts
```

* Fix Privileges/Permissions for Contacts
```bash
# fix those Contacts by setting their user id to 1 (e.g., the superuser)
docker-compose run --rm python python manage.py fix_model_privileges Contact 1
```

* Load Fixtures for Plugins 
```bash
docker-compose run --rm python python manage.py loaddata eric/fixtures/plugins
```

* Access the Admin Panel [http://workbench.local:8000/admin/](http://workbench.local:8000/admin/) and login with your
 superuser account.
* On the top right of the admin panel, click on *Edit Site Settings* and select a site name, site logo and specify the
 from email address (e.g., dev@workbench.local).
* Verify that the REST API Works by accessing [browsable api](http://workbench.local:8000/api/) and
 exploring several rest endpoints.
* Start the frontend (separate repository) and login with your superuser (it is recommended to create a new user though)
* Create a new project, and invite a new user via e-mail address (any address works).
* Give that user the role "Project Manager".
* You should receive an e-mail on the [maildump server (maildump.workbench.local)](http://maildump.workbench.local:1080/) with your username
 and password. 
* Logout of the frontend application with the currently logged in superuser, and login with the credentials provided within the e-mail.
* *Please Note:* You are still logged in in the admin panel, which also gives you access to the browsable api. This
 means that you will see different results in the browsable api than in the frontend.


## PyCharm Setup
To set up PyCharm correctly and use all of its integrations and features use the following settings:

**Settings > Build, Execution, Deployment > Docker**  
Add new Docker connection
- Unix Socket on Linux
- TCP Socket on Windows (Also tick "Expose TCP Socket" in Docker App an see URL from there)

**Settings > Project: ericworkbench > Project Interpreter > Add > Docker Compose**  
- Server: Docker
- Configuration files: `./docker-compose.yml`
- Service: django  
- Python interpreter path: `/var/lib/app/venv/bin/python`
- PyCharm helpers path: `/opt/.pycharm_helpers`

**Settings > Project: ericworkbench > Project Structure**  
- Source folders: `app`
- Template Folders: `app/eric/cms/templates`

**Settings > Languages & Frameworks > Django**
- [✓] Enable Django Support
- Django project root: path to repository, e.g. `/home/bhagmann/Projekt/ericworkbench/app/eric`  
- Settings: `settings/docker.py`  
- Manage script: path to manage.py, e.g. `/home/bhagmann/Projekt/ericworkbench/app/manage.py`


## LDAP
If you want to test ldap, please have a look at [ldap/README.md](). For a quick import of some ldap users run the following command:
```bash
docker-compose exec ldap-service ldapadd -x -w "admin" -D "cn=admin,dc=workbench,dc=local" -f ldap/import.ldif
```
