from eric import APIAccess

base_url = "http://workbench.local:8000/api"
api = APIAccess(base_url=base_url)
token = api.login("testuser", "testuser")
api.set_http_header("Authorization", "Token " + token)

# position_x is the place on the x axis (left/right) where the element is placed (0 is all the way to the left,
# values higher than 0 require the width of the element to be smaller)

# position_y is the place on the y axis (up/down) where the element is placed

# height is the height of the element in the labbook (default = 7, minimum = 3)

# width is the width of the element in the labbook (default = 20, minimum = 4, maximum = 20)

# create a Labbook
data_labbook = {"title": "My new Labbook"}
labbook = api.create_labbook(data_labbook)

# create a Note
data_note_1 = {
    "subject": "Note 1",
    "content": "<p>Content goes here. </br><strong>Can be HTML.</strong></p>",
}
note_1 = api.create_note(data_note_1)
# add note_1 to the labbook
child_object_1 = api.add_element_to_labbook(
    labbook_pk=labbook["pk"],
    child_object_id=note_1["pk"],
    child_object_content_type=note_1["content_type"],
    height=7,
    width=20,
    position_x=0,
    position_y=0,
)

# create another Note
data_note_2 = {
    "subject": "Note 2",
    "content": "<p>This is a second note. </br><strong>This is important.</strong></p>",
}
note_2 = api.create_note(data_note_2)
# add note_2 to the labbook
child_object_2 = api.add_element_to_labbook(
    labbook_pk=labbook["pk"],
    child_object_id=note_2["pk"],
    child_object_content_type=note_2["content_type"],
    height=7,
    width=20,
    position_x=0,
    position_y=child_object_1["position_y"] + child_object_1["height"],
)

# create a Section
data_section_1 = {"date": "2020-04-06", "title": "Section 1"}
section_1 = api.create_section(data_section_1)
# add section_1 to the labbook
child_object_3 = api.add_element_to_labbook(
    labbook_pk=labbook["pk"],
    child_object_id=section_1["pk"],
    child_object_content_type=section_1["content_type"],
    height=1,
    width=20,
    position_x=0,
    position_y=child_object_2["position_y"] + child_object_2["height"],
)

# create another Note, which will be added to Section 1
data_note_3 = {
    "subject": "Note 3",
    "content": "<p>This is a third note. </br><strong>It will be added to Section 1.</strong></p>",
}
note_3 = api.create_note(data_note_3)
# add note_3 to the labbook
child_object_4 = api.add_element_to_labbook(
    labbook_pk=labbook["pk"],
    child_object_id=note_3["pk"],
    child_object_content_type=note_3["content_type"],
    height=7,
    width=20,
    position_x=0,
    position_y=child_object_3["position_y"] + child_object_3["height"],
)

# now lets get the section to get its child_elements list
current_section_1_child_elements = api.get_section_child_elements(labbook["pk"], section_1["pk"])
# append the pk of child_object_4 to the child_elements list
current_section_1_child_elements.append(child_object_4["pk"])
# modify the section with the new data
modified_section_1 = api.modify_section(section_1["pk"], current_section_1_child_elements)

# as a last step we will modify child_object_4 to change its position in the section.
# Here we place it at the beginning of the section
modified_child_object_4 = api.modify_labbook_child_element(labbook["pk"], child_object_4["pk"], 0)
