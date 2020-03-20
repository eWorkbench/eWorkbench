FROM tumworkbench/node_base_frontend:1.1

# Install entrypoint scripts
COPY docker-node-entrypoint /usr/local/bin/
RUN chmod a+x /usr/local/bin/docker-node-entrypoint

WORKDIR /app
ENTRYPOINT [ "/bin/bash", "/usr/local/bin/docker-node-entrypoint" ]
