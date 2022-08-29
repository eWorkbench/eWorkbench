# One Click Docker Setup

It is expected you have `docker` as well as `docker-compose` set up and running on your machine.

## Run the following command to build the containers:
```bash
docker-compose build
```
(This will take some time to pull images and install dependencies.)

## Run the following command to start the workbench:
```bash
docker-compose up
```
This will take some time to start everything and will keep running once everything is up and show debug logs.

### On the first run a django superuser is created, with following credentials (Don't use in production!):
- Username: admin
- Password: adminpass
- Email: admin@example.com

### Links:
- Workbench Frontend: [http://localhost:4200](http://localhost:4200)
- Workbench Backend Admin: [http://localhost:8000/admin/](http://localhost:8000/admin/)
- Workbench Backend API: [http://localhost:8000/api/](http://localhost:8000/api/)
- Maildump (Catches Outgoing E-Mails): [http://localhost:1080](http://localhost:1080)

### Additional setup steps:
* Access the Admin Panel [http://localhost:8000/admin/](http://localhost:8000/admin/) and login with your
 superuser account.
* On the top right of the admin panel, click on *Edit Site Settings* and select a site name, site logo and specify the
 from email address (e.g., dev@localhost).
* Verify that the REST API Works by accessing [browsable api](http://localhost:8000/api/) and
 exploring several rest endpoints.
* Start the frontend (separate repository) and login with your superuser (it is recommended to create a new user though)
* Create a new project, and invite a new user via e-mail address (any address works).
* Give that user the role "Project Manager".
* You should receive an e-mail on the maildump server [localhost:1080](http://localhost:1080/)  with your username
 and password. 
* Logout of the frontend application with the currently logged in superuser, and login with the credentials provided within the e-mail.
* *Please Note:* You are still logged in in the admin panel, which also gives you access to the browsable api. This
 means that you will see different results in the browsable api than in the frontend.

### To use an external IP:
Forward the external port 80 to the internal port 4200.
If used with an external IP following files in the codebase need to be changed.
```
1) backend-django/app/eric/settings/docker.py

	add IP / hostname to CORS_ORIGIN_REGEX_WHITELIST at the bottom

2) backend-django/app/eric/settings/docker.py

	add an ALLOWED_HOSTS setting like the following using your IP / hostname
	ALLOWED_HOSTS = [
        "myworkbenchdomain.com",
        "111.222.333.444",
    ]

3) frontend-angular/apps/eworkbench/src/environments/environment.ts

	replace "localhost" with the IP / hostname
```

### When changes are made within the codebase or the docker-compose.yml File always do:
```bash
docker compose down
docker-compose build
docker-compose up
```

### Change the following file to adjust the django (backend settings) in order to use an external Postgres Database, LDAP or anything else you want to change:
```
backend-django/app/eric/settings/docker.py
```
