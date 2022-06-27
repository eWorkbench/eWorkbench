FROM python:3.9-slim
LABEL maintainer="HNezbeda@anexia-it.com"

ARG MAILDUMP_VERSION
RUN pip install maildump==$MAILDUMP_VERSION

EXPOSE 1080
EXPOSE 1025

ENTRYPOINT [ "maildump", "-fn", "--db", "/maildump/database.db", "--smtp-ip", "0.0.0.0", "--http-ip", "0.0.0.0" ]
