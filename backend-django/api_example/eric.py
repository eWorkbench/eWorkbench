import json
import requests


class APIAccess:
    def __init__(self, base_url):
        self.base_url = base_url
        self.headers = {}

    def set_http_header(self, key, value):
        self.headers[key] = value

    def get(self, url, data=None):
        return requests.get(self.base_url + url, data, headers=self.headers)

    def post(self, url, data=None):
        return requests.post(self.base_url + url, data, headers=self.headers)

    def patch(self, url, data=None):
        return requests.patch(self.base_url + url, data, headers=self.headers)

    def put(self, url, data=None):
        return requests.put(self.base_url + url, data, headers=self.headers)

    def login(self, username, password):
        response = self.post("/auth/login/", {"username": username, "password": password})
        data = json.loads(response.text)

        print(response.status_code)

        if response.status_code == 200:
            return data['token']
        else:
            return None

    def get_projects(self):
        response = self.get("/projects/")
        data = json.loads(response.text)

        return data

    def get_project(self, pk):
        response = self.get("/projects/{pk}/".format(pk=pk))
        data = json.loads(response.text)

        return data

    def get_tasks(self):
        response = self.get("/tasks/")
        data = json.loads(response.text)

        return data

    def create_labbook(self, data):
        response = self.post("/labbooks/", data=data)
        data = json.loads(response.text)

        return data

    def create_section(self, data):
        response = self.post("/labbooksections/", data=data)
        data = json.loads(response.text)

        return data

    def get_section_child_elements(self, labbook_pk, section_pk):
        response = self.get("/labbooks/{labbook_pk}/elements/?section={section_pk}".format(
            labbook_pk=labbook_pk,
            section_pk=section_pk
        ))
        data = json.loads(response.text)

        return data

    def modify_section(self, pk, child_elements):
        response = self.patch("/labbooksections/{pk}/".format(pk=pk),
                              data={
                                  'pk': pk,
                                  'child_elements': child_elements,
                              })
        data = json.loads(response.text)

        return data

    def modify_labbook_child_element(self, labbook_pk, element_pk, position_y):
        response = self.patch("/labbooks/{labbook_pk}/elements/{element_pk}/".format(
            labbook_pk=labbook_pk,
            element_pk=element_pk
        ), data={'position_y': position_y})
        data = json.loads(response.text)

        return data

    def create_note(self, data):
        response = self.post("/notes/", data=data)
        data = json.loads(response.text)

        return data

    def get_notes(self):
        response = self.get("/notes/")
        data = json.loads(response.text)

        return data

    def get_note(self, pk):
        response = self.get("/notes/{pk}/".format(pk=pk))
        data = json.loads(response.text)

        return data

    def get_note_relations(self, pk):
        response = self.get("/notes/{pk}/relations/".format(pk=pk))
        data = json.loads(response.text)

        return data

    def create_kanban_board(self, kanban_board):
        response = self.post("/kanbanboards/", data=kanban_board)
        data = json.loads(response.text)

        return data

    def create_drive(self, drive):
        response = self.post("/drives/", data=drive)
        data = json.loads(response.text)

        return data

    def create_project(self, project):
        response = self.post("/projects/", data=project)
        data = json.loads(response.text)

        return data

    def create_contact(self, contact):
        response = self.post("/contacts/", data=contact)
        data = json.loads(response.text)

        return data

    def create_task(self, task):
        response = self.post("/tasks/", data=task)
        data = json.loads(response.text)

        return data

    def modify_sub_directory_of_drive(self, drive_pk, directory_pk, new_title):
        response = self.patch("/drives/{drive_pk}/sub_directories/{directory_pk}/".format(
            drive_pk=drive_pk, directory_pk=directory_pk
        ), data={'title': new_title})
        data = json.loads(response.text)

        return data

    def get_picture(self, pk):
        response = self.get("/pictures/{pk}/".format(pk=pk))
        data = json.loads(response.text)

        return data

    def get_file(self, pk):
        response = self.get("/files/{pk}/".format(pk=pk))
        data = json.loads(response.text)

        return data

    def add_element_to_labbook(self,
                               labbook_pk,
                               child_object_id,
                               child_object_content_type,
                               height,
                               width,
                               position_x,
                               position_y):
        response = self.post("/labbooks/{labbook_pk}/elements/".format(labbook_pk=labbook_pk,)
                             , data={'child_object_id': child_object_id,
                                     'child_object_content_type': child_object_content_type,
                                     'height': height,
                                     'width': width,
                                     'position_x': position_x,
                                     'position_y': position_y})
        data = json.loads(response.text)

        return data

    def get_drive(self, pk):
        response = self.get("/drives/{pk}/".format(pk=pk))
        data = json.loads(response.text)

        return data

    def add_file_to_directory(self, file_pk, directory_pk):
        response = self.patch("/files/{file_pk}/".format(file_pk=file_pk),
                              data={'directory_id': directory_pk})
        data = json.loads(response.text)

        return data

    def logout(self, username, password):
        pass
