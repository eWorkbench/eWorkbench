import logging

from django import template

register = template.Library()


@register.filter
def log_level_to_name(value):
    return logging.getLevelName(value)
