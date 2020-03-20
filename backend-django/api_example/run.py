from eric import APIAccess

base_url = "http://workbench.local:8000/api"

api = APIAccess(base_url=base_url)

api.set_http_header("Authorization", "Token 123456")

token = api.login("testuser", "testuser")

print("token=", token)


api.set_http_header("Authorization", "Token " + token)

notes = api.get_notes()

tasks = api.get_tasks()

#
# projects = api.get_projects()
#
# print(projects)
#
# project = api.get_project("' or '1'='1")
#
# print(project)
#
# project = api.get_project("1234; DROP TABLE auth_users;")
#
# print(project)
