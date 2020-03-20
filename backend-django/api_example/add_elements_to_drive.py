from eric import APIAccess

base_url = "http://workbench.local:8000/api"
api = APIAccess(base_url=base_url)
token = api.login("testuser", "testuser")
api.set_http_header("Authorization", "Token " + token)


# get the drive
drive = api.get_drive("d8d6bee3-9787-4e84-967a-448135294e48")

# get the sub_directories of a drive
sub_directories = drive["sub_directories"]

# choose the 1st directory within the drive, sub_directories[0] should be the drive itself
directory = sub_directories[1]

# get the file we want to add to the drive and directory
file = api.get_file("c7ed3914-1660-4f95-b4a5-964a3b9773f2")

# patch the file by adding the directory.pk as the directory_id of the file
patched_file = api.add_file_to_directory(file["pk"], directory["pk"])
