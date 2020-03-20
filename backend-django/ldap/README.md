# Docker LDAP Image

For testing the LDAP integration, the [docker-compose.yml](../docker-compose.yml) file in this repository
provides an openLDAP server aswell as phpLdapAdmin for administrating the LDAP server.

You can access the LDAP admin via [http://127.0.11.20:1081/](). Login with
```
DN: cn=admin,dc=workbech,dc=local
Password: admin
```

## Ports
The Docker container provides the following services/ports:

 * 389 (LDAP server)
 * 636 (LDAP server with TLS)
 * 1081 (http for phpldapadmin)

## Volumes
The Docker container provides the following volumes (created automatically):
 
 * ``../data/docker_ldap_config`` contains config files for openLDAP, mapped to ``/etc/ldap/slapd.d``
 * ``../data/docker_ldap_data`` contains data files for openLDAP, mapped to ``/var/lib/ldap``

If you want to completely reset the LDAP server, then you have to stop it (CTRL+C or ``docker-compose stop``) and
delete those two folders manually. As they are created by the docker service, which is running as root, you have to
use sudo to delete them (assuming you are in the root folder of this repository).
```bash
sudo rm -rf data/docker_ldap_config/ data/docker_ldap_data/
```
 
## Importing Data
You can import data either via the commandline or via phpLdapAdmin

### Commandline

```bash
docker-compose exec ldap-service ldapadd -x -w "admin" -D "cn=admin,dc=workbench,dc=local" -f ldap/import.ldif
```

### phpLdapAdmin

Log in into the LDAP admin via [https://127.0.11.20:1081/]() (make sure to accept the SSL certificate). Login with
```
DN: cn=admin,dc=workbench,dc=local
Password: admin
```

Click on import and select [import.ldif]() (or copy paste the content of [import.ldif]() into the textfield). 
This should create you a basic structure with 3 groups (admin, professors, users) and several people/users (listed in the format username/password):
 * superuser/superuser
 * normaluser/normaluser
 * disableduser/disableduser

In addition, we are providing a larger LDAP userbase in [large_dataset.ldif](). While LDAP is nicely able to handle
this huge dataset, the phpLdapAdmin is not.
 
## Creating users
If you want to create more users, select the `ou=People` subtree and create a new `simple security object`. For password hash select
`SSHA`.

## Creating groups
If you want to create more groups, select the `ou=Groups` subtree and create a new `posix group`.

