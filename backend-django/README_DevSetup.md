[README](README.md)

# eRIC Workbench Backend - Development Setup

It is expected you have `docker` as well as `docker-compose` set up and running on your machine.


## Docker Setup
This repo contains the following docker services:

* `python`: a python service which is used to run ``python manage.py runserver`` at port ``8000``
* `db`: a postgres 9.4 server, listening on port `5432`
* `maildump`: a maildump server, listening on ports `1025` (smtp) and `1080` (webmail)
* `redis`: a redis server, listening on port `6379`
* `ldap`: a ldap server, listening on port `389` (ldap), `636` (ldaps) and `1081` (ldap admin) - for more information read [ldap/README.md](ldap/README.md)

To initially build and run the application, do the steps as follows:

* Build the docker images: ``docker-compose build``
* Install python dependencies: ``docker-compose run --rm python pip install -r requirements_dev.txt``
* Run the services: ``docker-compose up``


## Auto-formatter setup
We use [isort](https://github.com/pycqa/isort), [black](https://github.com/psf/black) and [flake8](https://gitlab.com/pycqa/flake8) for local auto-formatting and for linting in the CI pipeline.
The pre-commit framework (https://pre-commit.com) provides GIT hooks for these tools, so they are automatically applied before every commit.

Steps to activate:
* Install the pre-commit framework: `pip install pre-commit` (for alternative installation options see https://pre-commit.com/#install)
* Activate the framework (from the root directory of the repository): `pre-commit install`

Hint: You can also run the formatters manually at any time with the following command: `pre-commit run --all-files`


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

* Access the Admin Panel [http://localhost:8000/admin/](http://localhost:8000/admin/) and login with your
 superuser account.
* On the top right of the admin panel, click on *Edit Site Settings* and select a site name, site logo and specify the
 from email address (e.g., dev@localhost).
* Verify that the REST API Works by accessing [browsable api](http://localhost:8000/api/) and
 exploring several rest endpoints.
* Start the frontend (separate repository) and login with your superuser (it is recommended to create a new user though)
* Create a new project, and invite a new user via e-mail address (any address works).
* Give that user the role "Project Manager".
* You should receive an e-mail on the maildump server [localhost:1080](http://localhost:1080/) with your username
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

**Settings > Project: eworkbench-backend > Project Interpreter > Add > Docker Compose**  
- Server: Docker
- Configuration files: `./docker-compose.yml`
- Service: django  
- Python interpreter path: `/var/lib/app/venv/bin/python`
- PyCharm helpers path: `/opt/.pycharm_helpers`

**Settings > Project: eworkbench-backend > Project Structure**  
- Source folders: `app`
- Template Folders: `app/eric/cms/templates`

**Settings > Languages & Frameworks > Django**
- [✓] Enable Django Support
- Django project root: path to repository, e.g. `/home/bhagmann/Projekt/eworkbench-backend/app/eric`  
- Settings: `settings/docker.py`  
- Manage script: path to manage.py, e.g. `/home/bhagmann/Projekt/eworkbench-backend/app/manage.py`


## PyCharm Test Setup
Please make sure to change your local testing configuration as follows:
- Custom settings: path to your `docker_tests.py` settings file, e.g. `/home/bhagmann/Projekt/eworkbench-backend/app/eric/settings/docker_tests.py`  
- Options: `--keepdb` to reuse the existing database

You can change these settings either for individual tests or as a template:  
- Test dropdown > Edit Configurations > Django tests   
- Test dropdown > Edit Configurations > Edit configuration templates > Django tests


## LDAP
If you want to test ldap, please have a look at [ldap/README.md](). For a quick import of some ldap users run the following command:
```bash
docker-compose exec ldap-service ldapadd -x -w "admin" -D "cn=admin,dc=workbench,dc=local" -f ldap/import.ldif
```

## NFS

*This setup is now replaced with a simple volume mapping from ./dss to /dss in the python container.*

##### If you need to use the NFS setup, you will have to first uncomment the commented lines in docker-compose.yml, ./docker/python/Dockerfile and ./docker/python/docker-python-entrypoint.sh and the follow the setps below.

Some additional steps need to be taken to be able to run the NFS container.
This applies to Debian-based host machines (including Ubuntu). Other systems may require different steps.

1. Install NFS server
    
    ```bash
    sudo apt install nfs-common nfs-kernel-server
    ```

2. Configure AppArmor
    
    Check if AppArmor is running with
    ```bash
    sudo aa-status
    ```
    
    If AppArmor is running some packages need to be installed in preparation to adding a custom aa-profile.
    ```bash
    sudo apt install liblxc-common apparmor-utils
    ```
    
    Finally, copy the AppArmor-profile for [erichough/nfs](https://github.com/ehough/docker-nfs-server/blob/develop/doc/feature/apparmor.md) to the AppArmor-profile-directory and enable it in complain-mode:
    ```bash
    # cd to repo directory
    sudo cp nfs/apparmor.txt /etc/apparmor.d/erichough-nfs
    sudo aa-complain /etc/apparmor.d/erichough-nfs
    ```

3. Extend `/etc/security/capability.conf`
    
    Additionally, we need to add `CAP_SYS_ADMIN` to the Linux kernel capabilities in order to allow the nfs-server to run on privileged ports.
    
    (The following step will not show `cap_sys_admin` in the Pycharm Terminal!)
    
    Run
    ```bash
    capsh --print
    ```
    
    If the `Current`-section of the output does not include a `cap_sys_admin`-capability, it needs to be added.
    
    In `/etc/security/capability.conf` insert
    ```
    cap_sys_admin  <username>
    cap_sys_module <username>
    ```
    above the line
    ```
    none *
    ```
    and replace `<username>` with the user that runs docker (your current username, if you start docker without sudo).
    
4. Extend `/etc/pam.d/su`

    In `/etc/pam.d/su` add
    ```
    auth    optional    pam_cap.so
    ```
    above the line
    ```
    auth   sufficient   pam_rootok.so
    ```
    
5. Restart the system to enable the capability

    Then run
    ```bash
    capsh --print
    ```
    once more to check if `cap_sys_admin` is now enabled in the `Current`-section of the output.
    Check http://manpages.ubuntu.com/manpages/xenial/man8/pam_cap.8.html for more details.

6. Try running the NFS container
    
    ```bash
    docker-compose up nfs
    ```

7. Stop conflicting services
    
    If you get an error like `listen tcp 127.0.11.20:2049: bind: address already in use`:
    ```bash
    # Disable services temporarily
    sudo service nfs-server stop
    sudo service portmap stop
    
    # Disable service auto-start
    sudo systemctl disable nfs-server
    sudo systemctl disable portmap
    ```

8. Rebuild the container to automatically mount nfs.
    
    ```bash
    docker-compose build
    ```
