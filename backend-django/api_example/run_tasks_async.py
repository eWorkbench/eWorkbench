import getpass

from eric import APIAccess
import grequests

from eric.shared_elements.models import Task


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

task = {
    "project": None,
    "state": Task.TASK_STATE_NEW,
    "priority": Task.TASK_PRIORITY_NORMAL,
    "start_date": "2017-09-06T09:00:00.000Z",
    "due_date": "2017-09-07T10:00:00.000Z",
    "assigned_users": [],
    "title": "Schmafu",
    "assigned_users_pk": [],
    "projects": []
}

reqs = [
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers),
    grequests.post(base_url + "/tasks/", data=task, headers=headers)
]

grequests.map(reqs, exception_handler=exception_handler)
