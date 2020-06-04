from django.template.defaultfilters import register


@register.filter
def file_extension(file):
    parts = file.name.split('.')
    if len(parts) > 1:
        last_index = len(parts) - 1
        return parts[last_index]
    else:
        return ''
