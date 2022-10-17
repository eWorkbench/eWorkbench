import getpass

from faker import Faker

from eric import APIAccess

fake = Faker()


def exception_handler(request, exception):
    print("Request failed")
    print(exception)


base_url = "http://workbench.local:8000/api"

api = APIAccess(base_url=base_url)

token = api.login(getpass.getpass("Username: "), getpass.getpass("Password: "))

api.set_http_header("Authorization", "Token " + token)

master_project = api.create_project({"name": "Important project", "description": "This is an important project"})


sub_project1 = api.create_project({"name": "Milestone 1", "description": "", "parent_project": master_project["pk"]})

sub_project1a = api.create_project({"name": "Planning", "description": "", "parent_project": sub_project1["pk"]})

sub_project1b = api.create_project({"name": "Executing", "description": "", "parent_project": sub_project1["pk"]})

sub_project2 = api.create_project({"name": "Milestone 2", "description": "", "parent_project": master_project["pk"]})

sub_project3 = api.create_project({"name": "Milestone 3", "description": "", "parent_project": master_project["pk"]})

sub_project4 = api.create_project({"name": "Milestone 4", "description": "", "parent_project": master_project["pk"]})

# create 10 fake users that are assigned to the master project

for i in range(0, 10):
    name = fake.name()
    first_name = name.split(" ")[0]
    last_name = " ".join(name.split(" ")[-1:])
    username = first_name[0].lower() + last_name.lower().replace(" ", "")
    email = username + "@" + last_name.lower() + ".com"

    api.create_contact(
        {"first_name": first_name, "last_name": last_name, "email": email, "projects": [master_project["pk"]]}
    )


example_tasks = [
    {"title": "Research how to do it", "projects": [sub_project1a["pk"]]},
    {"title": "Figure out funding", "projects": [sub_project1a["pk"]]},
    {"title": "Hold a presentation", "projects": [sub_project1a["pk"]]},
    {"title": "Prepare marking campaign", "projects": [sub_project1b["pk"]]},
    {"title": "Write a strategy paper", "projects": [sub_project1b["pk"]]},
    {"title": "Buy new lab equipment", "projects": [sub_project1b["pk"]]},
    {"title": "Check for security problems", "projects": [sub_project1b["pk"]]},
    {"title": "Clean the lab", "projects": [sub_project1b["pk"]]},
    {"title": "Create tasks for other milestones", "projects": [sub_project2["pk"]]},
]

# create some fake tasks for all projects
for task in example_tasks:
    api.create_task(task)
