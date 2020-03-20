FROM alpine:3.3

RUN apk add --update --no-cache build-base python-dev py-pip py-docutils && \
    pip install maildump && \
    apk del build-base && \
    rm -rf /var/cache/apk/* /root/.cache

EXPOSE 1080
EXPOSE 1025

ENTRYPOINT [ "maildump", "-fn", "--db", "/maildump/database.db", "--smtp-ip", "0.0.0.0", "--http-ip", "0.0.0.0" ]
