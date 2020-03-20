#!/bin/bash

# wait for postgres
postgres_ready() {
python << END
import sys
import psycopg2
try:
    psycopg2.connect(
        dbname="eric",
        user="eric",
        password="eric",
        host="db"
    )
except psycopg2.OperationalError:
    sys.exit(-1)
sys.exit(0)
END
}

until postgres_ready; do
  >&2 echo 'PostgreSQL is not available yet (sleeping)...'
  sleep 2
done
