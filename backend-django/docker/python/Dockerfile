FROM python:3.5.6-jessie

# Using Jessie repository from Debian archive
RUN sed -i 's/deb.debian.org/archive.debian.org/g' /etc/apt/sources.list && \
    sed -i '/jessie-updates/d' /etc/apt/sources.list

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y \
        git \
        cron \
        ca-certificates \
        fonts-dejavu-core \
        fonts-freefont-ttf \
        sudo \
        build-essential \
        libpq-dev \
        libmysqlclient-dev \
        libpng12-dev \
        libmcrypt-dev \
        libmcrypt4 \
        libcurl3-dev \
        libxslt1-dev \
        libxml2-dev \
        libfreetype6 \
        python-lxml \
        libcairo2 \
        libpango1.0-0 \
        libgdk-pixbuf2.0-0 \
        libffi-dev \
        shared-mime-info \
        libfreetype6-dev \
        # database
        postgresql-client \
        # ldap
        libsasl2-dev \
        libldap2-dev \
        libssl-dev \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install build and entrypoint scripts
COPY ./docker/python/docker-python-entrypoint.sh /usr/local/bin/
COPY ./docker/python/wait-for-postgres.sh /usr/local/bin/
RUN chmod a+x /usr/local/bin/docker-python-entrypoint.sh && chmod a+x /usr/local/bin/wait-for-postgres.sh

# upgrade pip
RUN pip install --no-cache-dir --upgrade pip virtualenv psycopg2-binary

WORKDIR /app/app
ENTRYPOINT [ "/usr/local/bin/docker-python-entrypoint.sh" ]
