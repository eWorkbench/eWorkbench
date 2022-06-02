# eWorkbench Ansible server setup and deployment

Example Ansible Playbooks that can be adapted to setup all the servers and deploy the eWorkbench on a set of 5 VMs behind a loadbalancer. The loadbalancer also serves as an ssh jump host to be able to reach the VMs, which should only be available over the local network.

These playbooks are meant for a Debian system, with a sudo user named "srvadm" with a password and ssh access already set up.

There are some dependencies not covered here, which need to be installed manually like Postgres 12 on the database VM, Redis on the redis VM.

The shared storage for uploads etc. is stored on a CIFS mounted NAS.

The DSS (data science storage) interface will only work within the TU-Munich network as is. Adjustments have to be made to the corresponding roles and tasks.

Replace all occurrences of <domain> with the domain you set up for your workbench.

## Installation

https://docs.ansible.com/ansible/latest/installation_guide/index.html

## Intro

The first command to be run should be the following, which adds the ssh pub keys to the authorized_keys of all hosts of staging/production:

*First the files in /roles/authorized-keys must be adapted. Add your ssh public key within /roles/authorized-keys/files/example-key-1 for example*

*The command will ask for the login password for the ansible_user on the hosts*

```
ansible-playbook -i production authorized_keys.yml --ask-pass --ask-vault-pass
```

### hosts

There is a host file "production" with the corresponding groups and hosts in them. 

### gateway (jump host) ssh connection

There is a group called gatewayed in each hosts file that have a corresponding gatewayed:vars where the jump host command for ansible is set:

Example:
```yaml
[gatewayed:vars]
ansible_ssh_common_args='-o ProxyCommand="ssh -W %h:%p -q srvadm@wb-load.<domain>"'
```

### group_vars

Variables in all.yml are valid for all hosts as all of them are in the all group.

Then there are .yml files for each of the other groups where variables are defined as "key: value" pairs.

### playbooks

There are 4 playbooks in the root directory, each has a different purpose:

* authorized_keys.yml - Puts authorized keys on all hosts, so ansible can run properly. Usually only run once.
* setup.yml - Set's up the servers. Usually only run once, except some configuration must change.
* deploy.yml - Deploys the backend/frontend. Also sets up crontabs on the worker. Run when needed.
* update_django_requirements.yml - Updates the requirements in the backend virtualenvs on all django hosts. Run when needed.

### roles

All tasks should be defined in roles.

### vault

Ansible Vault should be used to encrypt secrets like variables, files etc to be used in a playbook. The vault.yml files in this example are unencrypted as they contain no real secrets here. The password for all vault files should be the same, as it will be needed for setup and deployment steps.

To encrypt:
```
ansible-vault encrypt ansible/group_vars/all/vault.yml
```

To decrypt:
```
ansible-vault decrypt ansible/group_vars/all/vault.yml
```

Read more here:
https://docs.ansible.com/ansible/latest/user_guide/playbooks_vault.html

and:
https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html#best-practices-for-variables-and-vaults

## Commands

To manage authorized_keys on production:
```
ansible-playbook -i production authorized_keys.yml --ask-vault-pass
```

To setup production servers:
```
ansible-playbook -i production setup.yml --ask-vault-pass
```

To deploy production:
```
ansible-playbook -i production deploy.yml --ask-vault-pass --extra-vars "tag=1.20.5"
```

To upgrade requirements on production:
```
ansible-playbook -i production update_django_requirements.yml --ask-vault-pass
```
