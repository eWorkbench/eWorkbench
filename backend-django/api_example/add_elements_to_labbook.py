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

# get a comment
text = api.get_note("ead80899-b03c-4256-928e-e1bbc2ff53f2")
# add it to the labbook
api.add_element_to_labbook(labbook_pk="6d31b364-7326-41e1-9c4c-db734b391c9b",
                           child_object_id=text["pk"],
                           child_object_content_type=text["content_type"],
                           height=7,
                           width=20,
                           position_x=0,
                           position_y=0)
# get a file
file = api.get_file("c7ed3914-1660-4f95-b4a5-964a3b9773f2")
# add it to the labbook
api.add_element_to_labbook(labbook_pk="6d31b364-7326-41e1-9c4c-db734b391c9b",
                           child_object_id=file["pk"],
                           child_object_content_type=file["content_type"],
                           height=4,
                           width=9,
                           position_x=1,
                           position_y=8)
# get a picture
picture = api.get_picture("ade70287-6521-4d11-a7a6-0b5b8ba47977")
# add it to the labbook
api.add_element_to_labbook(labbook_pk="6d31b364-7326-41e1-9c4c-db734b391c9b",
                           child_object_id=picture["pk"],
                           child_object_content_type=picture["content_type"],
                           height=5,
                           width=8,
                           position_x=11,
                           position_y=9)
