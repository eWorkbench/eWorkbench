#!/bin/bash

# get path of script file and project root
SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
ROOTPATH="${SCRIPTPATH}/../"

# check if a docker compose override file should be generated
CREATE_DOCKER_COMPOSE_OVERRIDE_FILE=false
while getopts :o opt
do
  case $opt in
     o) CREATE_DOCKER_COMPOSE_OVERRIDE_FILE=true;;
    \?) echo -e "\e[31mUnknown option -$OPTARG"; exit 1;;
  esac
done

# remove the parsed options from the positional arguments
shift $(( OPTIND - 1 ))

# check for positional argument #1: source volume name
if [ "$1" != "" ]
then
  SOURCE_VOLUME_NAME="$1"
else
  echo -e "\e[31mPlease indicate the volume name you want to clone, e.g. \e[39mpg_data"
  exit 1
fi

# change to project root path
cd "$ROOTPATH" || exit 1

# get current directory name as docker volume prefix
DOCKER_VOLUME_PREFIX=${PWD##*/}

# get current git branch name for the volume clone name
GIT_BRANCH=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

# define docker volume names for source and its clone
DOCKER_VOLUME_SOURCE="${DOCKER_VOLUME_PREFIX}_${SOURCE_VOLUME_NAME}"
DOCKER_VOLUME_CLONE="${DOCKER_VOLUME_PREFIX}_${SOURCE_VOLUME_NAME}_${GIT_BRANCH}"

# change to script path
cd "$SCRIPTPATH" || exit 1

# execute clone script
./clone_docker_volume.sh "$DOCKER_VOLUME_SOURCE" "$DOCKER_VOLUME_CLONE"

# create docker-compose override file
if $CREATE_DOCKER_COMPOSE_OVERRIDE_FILE
then
  # change to project root path
  cd "$ROOTPATH" || exit 1

  # create docker-compose override file with correct volume names
  cat > docker-compose.override.yml << _EOF_
version: '3'
volumes:
  $GIT_BRANCH:
services:
  db:
    volumes:
      - $GIT_BRANCH:/var/lib/postgresql/data
_EOF_
  echo -e "\e[32mdocker-compose.override.yml successfully created"
fi
