import getpass

import grequests

from eric import APIAccess


def exception_handler(request, exception):
    print("Request failed")
    print(exception)


base_url = "http://workbench.local:8000/api"

api = APIAccess(base_url=base_url)

token = api.login(getpass.getpass("Username: "), getpass.getpass("Password: "))

api.set_http_header("Authorization", "Token " + token)

headers = {"Authorization": "Token " + token}


reqs = [
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
    grequests.get(base_url + "/user_manual/dc05ba7e-6fdf-4a20-afcb-4998bd91d763/help_texts/", headers=headers),
]

grequests.map(reqs, exception_handler=exception_handler)
