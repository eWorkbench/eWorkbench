FROM node:10

# Install system applications and libraries
RUN apt-get update && \
    apt-get install -y \
        apt-transport-https \
        build-essential \
        ca-certificates \
        cron \
        curl \
        fonts-dejavu-core \
        fonts-freefont-ttf \
        fonts-liberation \
        gconf-service \
        gettext \
        git \
        libappindicator1 \
        libasound2 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libcurl3-dev \
        libdbus-1-3 \
        libexpat1 \
        libffi-dev \
        libfontconfig1 \
        libfreetype6 \
        libfreetype6-dev \
        libgcc1 \
        libgconf-2-4 \
        libgdk-pixbuf2.0-0 \
        libglib2.0-0 \
        libgtk-3-0 \
        libmcrypt-dev \
        libmcrypt4 \
        libnspr4 \
        libnss3 \
        libpango1.0-0 \
        libpangocairo-1.0-0 \
        libpng12-dev \
        libpq-dev \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxml2-dev \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        shared-mime-info \
        sudo \
        wget \
        xdg-utils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install global node.js modules
RUN npm install --global --unsafe-perm \
        gulp-cli \
        grunt-cli \
        karma \
        eslint \
        eslint-plugin-angular \
        eslint-plugin-compat
