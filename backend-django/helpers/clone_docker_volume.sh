#!/bin/bash

# check for positional argument #1: source volume name
if [ "$1" != "" ]
then
  SOURCE_VOLUME_NAME="$1"
else
  echo -e "\e[31mPlease indicate the volume name you want to clone"
  exit 1
fi

# check for positional argument #2: destination volume name
if [ "$2" != "" ]
then
  DESTINATION_VOLUME_NAME="$2"
else
  echo -e "\e[31mPlease indicate the destination volume name"
  exit 1
fi

# quit all active docker sessions
docker-compose down

# check if the source volume exists
docker volume inspect "$SOURCE_VOLUME_NAME" > /dev/null 2>&1
if [ "$?" != "0" ]
then
  echo -e "\e[31mThe source volume \"$1\" does not exist"
  exit 1
fi

# check if the destinatin volume exists
docker volume inspect "$DESTINATION_VOLUME_NAME" > /dev/null 2>&1
if [ "$?" = "0" ]
then
  # remove old destinatin volume
  docker volume rm "$DESTINATION_VOLUME_NAME"
fi

# create new volume
docker volume create --name "$DESTINATION_VOLUME_NAME"

# copy all data from the main volume to the new volume
docker run --rm -i \
                -t \
                -v "$SOURCE_VOLUME_NAME":/from \
                -v "$DESTINATION_VOLUME_NAME":/to \
                alpine ash -c "cd /from ; cp -av . /to"

echo -e "\e[32mDocker volume ${SOURCE_VOLUME_NAME} successfully cloned to ${DESTINATION_VOLUME_NAME}"
