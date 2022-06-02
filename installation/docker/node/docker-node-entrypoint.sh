#!/bin/bash

# check who owns the working directory
USER_ID=$(stat -c "%u" $PWD)

if [ "$USER_ID" -eq "0" ]; then
    echo "Are you on Windows? Overriding user_id with 1000"
    USER_ID=1000
fi

echo "Directory $PWD is owned by user with id ${USER_ID}"

# set the python run uid to the user id we just retrieved
NODE_RUN_UID=${NODE_RUN_UID:=${USER_ID}}
NODE_RUN_USER=${NODE_RUN_USER:=user}
NODE_RUN_GROUP=${NODE_RUN_GROUP:=user}
NODE_RUN_USER_TEST=$(grep "[a-zA-Z0-9\-\_]*:[a-zA-Z]:${NODE_RUN_UID}:" /etc/passwd)

# Make sure the given group exists
getent group $NODE_RUN_GROUP || groupadd $NODE_RUN_GROUP

# Update the user to the configured UID and group if
# it already exists.
if [ -n "${NODE_RUN_USER_TEST}" ]; then
    echo "Update user '$NODE_RUN_USER'"

    usermod -l ${NODE_RUN_USER} $(id -un ${NODE_RUN_UID})
    usermod -u $NODE_RUN_UID -g $NODE_RUN_GROUP $NODE_RUN_USER

# Else create the user with the configured UID and group
else
    echo "Create user '$NODE_RUN_USER'"

    # Create the user with the corresponding group
    mkdir /home/$NODE_RUN_USER
    useradd -u $NODE_RUN_UID -g $NODE_RUN_GROUP -d /home/$NODE_RUN_USER $NODE_RUN_USER
    chown $NODE_RUN_USER:$NODE_RUN_GROUP /home/$NODE_RUN_USER

    # Make the user to an sudoer
    echo "$NODE_RUN_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/100-user
    echo "Defaults:$NODE_RUN_USER !requiretty" >> /etc/sudoers

    # Fix permissions of sudoers files
    chmod 600 /etc/sudoers
    chmod 600 /etc/sudoers.d/100-user
fi

export HOME=/home/$NODE_RUN_USER

# change permissions of /var/lib/app to the current user
chown -R $NODE_RUN_USER:$NODE_RUN_GROUP /var/lib/app

# Block the container if no commands supplied
if [ $# -eq 0 ]; then
    exec sleep infinity

# Else start the supplied commands with the configured
# user.
else
    echo "Executing $@"
    exec su -p - ${NODE_RUN_USER} -s /bin/bash -c "cd $PWD; $*"
fi
