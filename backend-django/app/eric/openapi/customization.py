from drf_yasg.inspectors import SwaggerAutoSchema


class CustomAutoSchema(SwaggerAutoSchema):
    """
    Tags "api/..." endpoints as "api/{endpoint}" instead of "api"
    """

    def get_tags(self, operation_keys=None):
        operation_keys = operation_keys or self.operation_keys

        tags = self.overrides.get('tags')
        if not tags:
            if operation_keys[0] == 'api':
                tags = [f'{operation_keys[0]}/{operation_keys[1]}']
            else:
                tags = [operation_keys[0]]

        return tags
