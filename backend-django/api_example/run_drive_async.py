import getpass

from eric import APIAccess
import grequests

def exception_handler(request, exception):
    print("Request failed")
    print(exception)


base_url = "http://workbench.local:8000/api"

api = APIAccess(base_url=base_url)

token = api.login(getpass.getpass('Username: '), getpass.getpass('Password: '))

api.set_http_header("Authorization", "Token " + token)

headers = {
    'Authorization': "Token " + token
}

# first of all, create a new kanban board

drive = {
    "title": "Board",
    "projects": []
}

# drive = api.create_drive(drive)

drive = {
    'pk': 'ed1ef3b4-14a0-4d87-9bae-70bf3dd2fe1c'
}

print("drive_pk=", drive['pk'])

# create two sub directories
sub_directory1 = api.add_sub_directory_to_drive(drive['pk'], {'title': 'New'})

print("sub_directory1_pk=", sub_directory1['pk'])

sub_directory2 = api.add_sub_directory_to_drive(drive['pk'], {'title': 'Second'})

print("sub_directory2_pk=", sub_directory2['pk'])

sub_directory3 = api.add_sub_directory_to_drive(drive['pk'], {'title': 'Third', 'parent_directory': sub_directory2['pk']})

print("sub_directory3_pk=", sub_directory3['pk'])


reqs = []

for i in range (1, 10):
    reqs.append(
        # update sub dir 1
        grequests.patch(
            base_url + "/drives/{drive_pk}/sub_directories/{directory_pk}/".format(
                drive_pk=drive['pk'], directory_pk=sub_directory1['pk']
            ), data={'title': 'asdf'}, headers=headers
        )
    )
    reqs.append(
        # update sub dir 2
        grequests.patch(
            base_url + "/drives/{drive_pk}/sub_directories/{directory_pk}/".format(
                drive_pk=drive['pk'], directory_pk=sub_directory3['pk']
            ), data={'parent_directory': sub_directory2['pk']}, headers=headers
        )
    )

grequests.map(reqs, exception_handler=exception_handler)
