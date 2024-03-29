[README](README.md)

# eRIC Workbench Backend - Commands

## Usage statistics
The `wbstats` command prints various usage metrics as TSV (tab separated values). 

Command for production environments (without Docker):
```bash
python manage.py wbstats
```

The output can be piped into a file that can be read with programs like LibreOffice Calc or Microsoft Excel:
```bash
python manage.py wbstats > wbstats_$(date +%F_%H-%M).tsv
```


Command for development environments:
```bash
docker-compose run --rm python python manage.py wbstats
```

## Re-Generate Full Text Search Database
When FTS templates are modified this command can be executed to update all FTS indexes. 
```bash
docker-compose run --rm python python manage.py ftsrebuild
```

## Invalidate the project cache
Projects are cached in memory and the cache is invalidated automatically when there are changes.
When the server is restarted it can be useful to invalidate the project cache manually using the following command:
```bash
docker-compose run --rm python python manage.py invalidate_project_cache
```

## Fixing Permission Labels
If you update the labels/titles of a custom model permission, you need to run the following command:
```bash
docker-compose run --rm python python manage.py fixpermissionlabels
```

## Sync Menu Entries
When new menu entries are added or existing entries are removed, the sortable menu needs to be synced for all existing
users. The following command does this for you:
```bash
docker-compose run --rm python python manage.py sync_sortable_menu
``` 

## Built-in Framework Commands

## Creating a new app
There is a ``django_app_template.tar.gz`` which contains an app template that you can use with the following command:
```bash
docker-compose run --rm python "cd eric; python ../manage.py startapp --template=../../django_app_template.tar.gz NEW_APP_NAME"
```

## Run Migrations
```bash
docker-compose run --rm python python manage.py migrate
```

## Make Migrations
```bash
docker-compose run --rm python python manage.py makemigrations
```

## Creating Fixtures
Example:
```bash
docker-compose run --rm python python manage.py dumpdata --format=json --natural-foreign --natural-primary projects.Role projects.RolePermissionAssignment --indent 2
```

## Run Tests
Tests are run using djangos testrunter:
```bash
docker-compose run --rm python python manage.py test
```

## Install/Upgrade Python Requirements
```bash
docker-compose run --rm python pip install -r requirements.txt --upgrade
```

## Backups

### Creating Database and Media Files Backups
For all commands, specify the settings file you want to use!

All backups are stored in the [backups/] folder.

To create a new database backup, run:
```bash
docker-compose run --rm python python manage.py dbbackup -z
```

To create a new media files backup, run:
```bash
docker-compose run --rm python python manage.py mediabackup -z
```

### Restoring from backups
To restore a database backup, run the ``dbrestore``, also add ``-I`` and specify the input file:
```bash
docker-compose run --rm python python manage.py dbrestore -z -I ../backups/default-anx-i-ws-200-2017-03-09-125228.psql.gz
```

*Note*: In some cases the command might fail if you have an existing database. In this case, make sure
 to clean the database before you run the dbrestore command

To restore a media files backup, run:
```bash
docker-compose run --rm python python manage.py mediarestore -z -I ../backups/anx-i-ws-200-2017-03-09-124608.tar.gz
```

### Cloning the database volume when changing branches

A common issue are branches with their respective migrations which can render the database unusable after applying migrations and then changing back to a branch without that changes, e.g. removing a non-nullable field in a feature branch but still using it in the master branch.

To avoid this problem you can clone the Docker volume for the current branch and also generate a Docker override file to use it. This ensures that you have different database states for each branch which persist on your local drive until you manually delete them or the Docker override file.

To clone your **default** database volume for your current branch you have to execute the following command from your project root:

```
./helpers/clone_database_volume_for_current_branch.sh -o pg_data
```

The argument `-o` is optional and generates the `docker-compose.override.yml` file.

**Important**: Do **NOT** add the `docker-compose.override.yml` to the project repository! If you change to a branch where you need another volume clone just execute the command above or delete the override file to use the default volume again.

### Adding licenseheaders

In order to publish the workbench-project on Github, the following licenseheader needs to be added to all files where applicable (`*.py, *.js, *.scss, *.less, etc.`, BUT NOT: `*.html, *.xml, *.yml, etc.`):
```
Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
SPDX-License-Identifier: AGPL-3.0-or-later
```

Install the [licenseheaders](https://github.com/johann-petrak/licenseheaders) tool:

```docker-compose run --rm python pip install -r requirements_dev.txt```

Add the licenseheader to all files with this command

`docker-compose run --rm python python -m licenseheaders -t ../LICENSE.txt`

Be aware that this also adds headers to xml-files (Not wanted in export-templates) and removes comment-lines if they are at the very beginning of files. This makes it necessary to check the changes and adapt manually where needed.

## Sync sortable menu

To synchronize the menu and create menu-entries for new apps for existing users, run the following command:

```bash
docker-compose run --rm python python manage.py sync_sortable_menu
```
 
