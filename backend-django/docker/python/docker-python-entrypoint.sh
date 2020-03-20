#!/bin/bash

# check who owns the working directory
USER_ID=$(stat -c "%u" $PWD)

if [ "$USER_ID" -eq "0" ]; then
    echo "Are you on Windows? Overriding user_id with 1000"
    USER_ID=1000
fi

echo "Directory $PWD is owned by user with id ${USER_ID}"

# set the python run uid to the user id we just retrieved
PYTHON_RUN_UID=${PYTHON_RUN_UID:=${USER_ID}}
PYTHON_RUN_USER=${PYTHON_RUN_USER:=user}
PYTHON_RUN_GROUP=${PYTHON_RUN_GROUP:=user}
PYTHON_RUN_USER_TEST=$(grep "[a-zA-Z0-9\-\_]*:[a-zA-Z]:${PYTHON_RUN_UID}:" /etc/passwd)

# Make sure the given group exists
getent group $PYTHON_RUN_GROUP || groupadd $PYTHON_RUN_GROUP

# Update the user to the configured UID and group if
# it already exists.
if [ -n "${PYTHON_RUN_USER_TEST}" ]; then
    echo "Update user '$PYTHON_RUN_USER'"

    usermod -l ${PYTHON_RUN_USER} $(id -un ${PYTHON_RUN_UID})
    usermod -u $PYTHON_RUN_UID -g $PYTHON_RUN_GROUP $PYTHON_RUN_USER

# Else create the user with the configured UID and group
else
    echo "Create user '$PYTHON_RUN_USER'"

    # Create the user with the corresponding group
    mkdir /home/$PYTHON_RUN_USER
    useradd -u $PYTHON_RUN_UID -g $PYTHON_RUN_GROUP -d /home/$PYTHON_RUN_USER $PYTHON_RUN_USER
    chown $PYTHON_RUN_USER:$PYTHON_RUN_GROUP /home/$PYTHON_RUN_USER

    # Make the user to an sudoer
    echo "$PYTHON_RUN_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/100-user
    echo "Defaults:$PYTHON_RUN_USER !requiretty" >> /etc/sudoers

    # Fix permissions of sudoers files
    chmod 600 /etc/sudoers
    chmod 600 /etc/sudoers.d/100-user
fi

# wait for postgres
wait-for-postgres.sh
# done
>&2 echo 'PostgreSQL is up - continuing...'


export HOME=/home/$PYTHON_RUN_USER

# check if app directory exists (should be a volume, and should exist)
if [ ! -d "/var/lib/app" ]; then
    echo "Make sure '/var/lib/app' is mounted as a volume"
    exit -1
fi

# change permissions of /var/lib/app to the current user
chown -R $PYTHON_RUN_USER:$PYTHON_RUN_GROUP /var/lib/app

# create venv
if [ ! -d "/var/lib/app/venv" ]; then
    echo "Creating virtual environment at /var/lib/app/venv ..."
    sudo -u $PYTHON_RUN_USER virtualenv -p python3 /var/lib/app/venv
fi


# Block the container if no commands supplied
if [ $# -eq 0 ]; then
    exec sleep infinity

# Else start the supplied commands with the configured user
else
    echo "Executing cmd '$*'"
    exec su -p - ${PYTHON_RUN_USER} -s /bin/bash -c "source /var/lib/app/venv/bin/activate; $*"
    # exec sudo -u $PYTHON_RUN_USER bash -c "source /var/lib/app/venv/bin/activate; $*"
fi
