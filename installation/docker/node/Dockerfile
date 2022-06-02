FROM node:16

# Install entrypoint scripts
COPY docker-node-entrypoint.sh /usr/local/bin/
RUN chmod a+x /usr/local/bin/docker-node-entrypoint.sh

WORKDIR /app
ENTRYPOINT [ "/bin/bash", "/usr/local/bin/docker-node-entrypoint.sh" ]
