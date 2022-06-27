#!/usr/bin/python3
import re
import sys
from subprocess import check_output

SHOWMOUNT_CMD = "/usr/sbin/showmount"
NFSOPTS = "-fstype=nfs,hard,intr,nodev,nosuid,nosymlink"
DSSNFSSERVERS = ("tumdssnfs01.dss.<domain>", "tumdssnfs02.dss.<domain>",)
DSSFILESYSTEMS = ("dssfs01", "dsstumfs01", "dsstumfs02",)


def get_dss_nfs_exports():
    exports = {}
    for dssnfsserver in DSSNFSSERVERS:
        for dssfilesystem in DSSFILESYSTEMS:
            command = f"{SHOWMOUNT_CMD} -e {dssnfsserver}"
            all_mounts = check_output(command, shell=True).decode(sys.stdout.encoding)
            matches = re.findall(fr'/dss/{dssfilesystem}/\S+/\S+\s', all_mounts)
            for match in matches:
                key = "/".join(match.strip().split("/")[3:])
                exports[key] = (dssnfsserver, match.strip())
    return exports


def print_list_for_autofs(exports):
    full_string = NFSOPTS + " \\"
    for key, server_fs in exports.items():
        full_string += f"\n  /{key} {server_fs[0]}:{server_fs[1]} \\"
    return full_string


if __name__ == "__main__":
    try:
        exports = get_dss_nfs_exports()
        if not exports:
            raise Exception
        full_string = print_list_for_autofs(exports)
        if not full_string:
            raise Exception
        print(full_string)
        sys.exit(0)
    except Exception as error:
        # print(error)
        sys.exit(1)
