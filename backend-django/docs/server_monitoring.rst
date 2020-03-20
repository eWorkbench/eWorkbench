Server Monitoring
=================

It is recommended that server monitoring is activated for the following components:

- Apache / Mod Passenger
- PostgreSQL
- Redis
- eRIC Workbench itself

Monitoring Software
-------------------

For the purpose of monitoring performance we recommend using ``munin``. Please follow general guidelines for your operating
system to install munin, and most importantly, read up about using and configuring plugins in munin.

For Debian/Ubuntu it works like this:

.. code:: bash

    apt-get install munin


You should adapt your configuration for nginx in ``/etc/nginx/sites-enabled/workbench.conf``:

.. code::

	# alias for munin
	location /munin/ {
		autoindex off;
		alias /var/cache/munin/www/;
		disable_symlinks off;
		# allow certain ips
		allow	x.x.x.x;
		# deny all others
		deny	all;
	}


Monitoring gunicorn
-------------------

Add `those two scripts <https://github.com/munin-monitoring/contrib/tree/master/plugins/gunicorn>`_ to ``/usr/share/munin/plugins/``:

1. ``gunicorn_status``

.. code:: python

    #!/usr/bin/env python
    """
    gunicorn_status - A munin plugin for Linux to monitor gunicorn processes

    Copyright (C) 2012 Azavea, Inc.
    Author: Andrew Jennings

    Like Munin, this plugin is licensed under the GNU GPL v2 license
    http://www.opensource.org/licenses/GPL-2.0

    If you've put your gunicorn pid somewhere other than the 
    default /var/run/gunicorn.pid, you can add a section like
    this to your munin-node's plugin configuration:
    
    [gunicorn_*]
    env.gunicorn_pid_path [path to your gunicorn pid]

    This plugin supports the following munin configuration parameters:
    #%# family=auto contrib
    #%# capabilities=autoconf

    """

    import sys, os, re
    from subprocess import check_output
    from time import sleep

    # set path to your gunicorn pid
    try:
        GUNICORN_PID_PATH = os.environ['gunicorn_pid_path']
    except:
        GUNICORN_PID_PATH = "/var/run/gunicorn.pid"

    class GunicornStatus():
        master_pid = ''
        """
        The gunicorn master process pid, as a string
        """

        worker_pids = ''
        """
        The list of gunicorn processes as strings
        """

        def __init__(self):
            try:
                self._get_master_pid()
                self._get_worker_pids(self.master_pid)
            except:
                sys.exit("Couldn't read gunicorn pid")

        def print_total_workers(self):
            print ('total_workers.value %d' % self._worker_count())

        def print_idle_workers(self):
            print ('idle_workers.value %d' % self._idle_worker_count())


        def _get_master_pid(self):
            master_pid_file = open(GUNICORN_PID_PATH)
            self.master_pid = master_pid_file.read().rstrip()
            master_pid_file.close()    

        def _get_worker_pids(self, master_pid):
            children = check_output(
                ['ps', '--ppid', master_pid, '-o', 'pid', '--no-headers'])
            self.worker_pids = [pid.strip() for pid in children.splitlines()]

        def _worker_count(self):
            return len(self.worker_pids)

        def _idle_worker_count(self):
            idle_workers = 0
            for pid in self.worker_pids:
                before = self._cpu_time(pid)
                sleep(0.50)
                after = self._cpu_time(pid)
                if before == after:
                    idle_workers += 1
            return idle_workers

        def _cpu_time(self, pid):
            proc_info = open('/proc/%s/stat' % pid).read()
            proc_info = [field.rstrip() for field in proc_info.split()]
            user_time = int(proc_info[13].rstrip())
            kernel_time = int(proc_info[14].rstrip())
            return user_time + kernel_time

    def print_config():
        instance = None
        name = os.path.basename(sys.argv[0])
        if name != "gunicorn_status":
            for r in ("^gunicorn_(.*?)_status$", "^gunicorn_status_(.*?)$"):
                m = re.match(r, name, re.IGNORECASE)
                if m:
                    instance = m.group(1)
                    break
        graph_title = "graph_title Gunicorn - Status"
        if instance:
            graph_title = "%s - %s" % (graph_title, instance)
        print graph_title
        print "graph_args -l 0"
        print "graph_vlabel Number of workers"
        print "graph_category appserver"
        print "total_workers.label Total Workers"
        print "idle_workers.label Idle Workers"

    if __name__ == "__main__":
        if len(sys.argv) == 2 and sys.argv[1] == 'config':
            print_config()
        elif len(sys.argv) == 2 and sys.argv[1] == 'autoconf':
            try:
                open(GUNICORN_PID_PATH).close()
                print "yes"
            except:
                print "no"
        # Some docs say it'll be called with fetch, some say no arg at all
        elif len(sys.argv) == 1 or (len(sys.argv) == 2 and sys.argv[1] == 'fetch'):
            status = GunicornStatus()
            try:
                status.print_total_workers()
                status.print_idle_workers()
            except:
                sys.exit("Couldn't retrieve gunicorn status")


2. ``gunicorn_memory_status``:

.. code:: python

    #!/usr/bin/env python
    """
    gunicorn_status - A munin plugin for Linux to monitor the memory
    usage of gunicorn processes

    Copyright (C) 2012 Azavea, Inc.
    Author: Andrew Jennings

    Like Munin, this plugin is licensed under the GNU GPL v2 license
    http://www.opensource.org/licenses/GPL-2.0

    If you've put your gunicorn pid somewhere other than the 
    default /var/run/gunicorn.pid, you can add a section like
    this to your munin-node's plugin configuration:
    
    [gunicorn_*]
    env.gunicorn_pid_path [path to your gunicorn pid]

    This plugin supports the following munin configuration parameters:
    #%# family=auto contrib
    #%# capabilities=autoconf

    """

    import sys, os, re
    from subprocess import check_output

    # set path to your gunicorn pid
    try:
        GUNICORN_PID_PATH = os.environ['gunicorn_pid_path']
    except:
        GUNICORN_PID_PATH = "/var/run/gunicorn.pid"


    class GunicornMemoryStatus():
        master_pid = ''
        """
        The Gunicorn master process pid, as a string
        """

        def __init__(self):
            try:
                self._get_master_pid()
            except:
                raise Exception("Couldn't read gunicorn pid information")

        def print_total_memory(self):
            print ('total_memory.value %d' % self._get_total_memory())

        def _get_master_pid(self):
            master_pid_file = open(GUNICORN_PID_PATH)
            self.master_pid = master_pid_file.read().rstrip()
            master_pid_file.close()    
            return True

        def _get_total_memory(self):
            master = self._get_master_memory()
            total = master +self. _get_worker_memory()
            total_in_mb = total / 1024
            return total_in_mb
            
        def _get_master_memory(self):
            master = int(check_output(
                ['ps', '--pid', self.master_pid, '-o', 'rss', '--no-headers']))
            return master

        def _get_worker_memory(self):
            worker_processes = check_output(
                ['ps', '--ppid', self.master_pid, '-o', 'rss', '--no-headers'])
            process_memory_usage = [int(rss) for rss in worker_processes.splitlines()]
            worker_memory_usage = sum(process_memory_usage)
            return worker_memory_usage

    def print_config():
        instance = None
        name = os.path.basename(sys.argv[0])
        if name != "gunicorn_memory_status":
            for r in ("^gunicorn_(.*?)_memory_status$", "^gunicorn_memory_status_(.*?)$"):
                m = re.match(r, name, re.IGNORECASE)
                if m:
                    instance = m.group(1)
                    break
        graph_title = "graph_title Gunicorn - Memory Usage"
        if instance:
            graph_title = "%s - %s" % (graph_title, instance)
        print graph_title
        print "graph_args --base 1024 -l 0"
        print "graph_vlabel Megabytes"
        print "graph_category appserver"
        print "total_memory.label Total Memory"

    if __name__ == "__main__":
        if len(sys.argv) == 2 and sys.argv[1] == 'config':
            print_config()
        elif len(sys.argv) == 2 and sys.argv[1] == 'autoconf':
            try:
                open(GUNICORN_PID_PATH).close()
                print "yes"
            except:
                print "no"
        # Some docs say it'll be called with fetch, some say no arg at all
        elif len(sys.argv) == 1 or (len(sys.argv) == 2 and sys.argv[1] == 'fetch'):
            try:
                status = GunicornMemoryStatus()
                status.print_total_memory()
            except:
                sys.exit("Couldn't retrieve gunicorn memory usage information")

Make sure to give those scripts the executeable flag:

.. code:: bash

    chmod +x /usr/share/munin/plugins/gunicorn_status
    chmod +x /usr/share/munin/plugins/gunicorn_memory_status


You can activate these scripts/metrics by creating symbolic links in ``/etc/munin/plugins/`` as follows:

.. code:: bash

    ln -s /usr/share/munin/plugins/gunicorn_status /etc/munin/plugins/gunicorn_status
    ln -s /usr/share/munin/plugins/gunicorn_memory_status /etc/munin/plugins/gunicorn_memory_status

In addition, make sure to add the following lines to ``/etc/munin/plugin-conf.d/munin-node``:

.. code::

    [gunicorn_status]
    env.gunicorn_pid_path /run/gunicorn/pid

    [gunicorn_memory_status]
    env.gunicorn_pid_path /run/gunicorn/pid



Above lines make sure that the ``gunicorn_*`` commands run with the appropriate gunicorn pid.

You can test those commands with ``munin-run`` as follows:

.. code::

    munin-run gunicorn_status
    munin-run gunicorn_memory_status


Monitoring Mod Passenger (deprecated)
-------------------------------------

**Note**: Monitoring mod passenger is no longer needed, as we are using gunicorn.

Mod Passenger offers two great commands that provide some information about the health of the server:

.. code:: bash

    passenger-status
    passenger-memory-stats

We can make use of those commands with the following scripts, which you need to manually create in ``/usr/share/munin/plugins/``:

* ``/usr/share/munin/plugins/passenger_proccesses``

.. code:: bash

    #!/bin/sh

    case $1 in
       config)
            cat <<'EOM'
    graph_category ModPassenger
    graph_title Mod Passenger Proccesses
    graph_vlabel passenger_proccesses
    passenger_proccesses.label passenger_proccesses
    EOM
            exit 0;;
    esac

    printf "passenger_proccesses.value "
    passenger-status | grep Processes | awk -F': ' '{print $2}'

* ``/usr/share/munin/plugins/passenger_memory_stats``

.. code:: bash

    #!/bin/sh

    case $1 in
       config)
            cat <<'EOM'
    graph_category ModPassenger
    graph_title Mod Passenger Total Memory
    graph_vlabel passenger_memory
    passenger_memory.label passenger_memory
    EOM
            exit 0;;
    esac

    printf "passenger_memory.value "
    passenger-memory-stats | tail -1 | awk -F': ' '{print $2}'

* ``/usr/share/munin/plugins/passenger_requests_queue``

.. code:: bash

    #!/bin/sh

    case $1 in
       config)
            cat <<'EOM'
    graph_category ModPassenger
    graph_title Mod Passenger Requests Queue
    graph_vlabel passenger_requests_queue
    passenger_requests_queue.label passenger_requests_queue
    EOM
            exit 0;;
    esac

    printf "passenger_requests_queue.value "
    passenger-status | grep "Requests in top-level queue" | awk -F': ' '{print $2}'


Make sure to give those scripts the executeable flag:

.. code:: bash

    chmod +x /usr/share/munin/plugins/passenger_proccesses
    chmod +x /usr/share/munin/plugins/passenger_memory_stats
    chmod +x /usr/share/munin/plugins/passenger_requests_queue


You can activate these scripts/metrics by creating symbolic links in ``/etc/munin/plugins/`` as follows:

.. code:: bash

    ln -s /usr/share/munin/plugins/passenger_proccesses /etc/munin/plugins/passenger_proccesses
    ln -s /usr/share/munin/plugins/passenger_memory_stats /etc/munin/plugins/passenger_memory_stats
    ln -s /usr/share/munin/plugins/passenger_requests_queue /etc/munin/plugins/passenger_requests_queue

In addition, make sure to add the following lines to ``/etc/munin/plugin-conf.d/munin-node``:

.. code::

    [passenger_*]
    user root


Above lines make sure that the ``passenger_`` commands run as user root.

You can test those commands with ``munin-run`` as follows:

.. code::

    munin-run passenger_proccesses
    munin-run passenger_memory_stats
    munin-run passenger_requests_queue

Monitoring Apache (deprecated)
------------------------------

**Note**: Apache does not need to be monitored anymore as we switched to nginx.

Munin offers multiple ways of monitoring apache. However, it does not seem to work very well with apache virtual hosts.

For monitoring the virtualhost, we use the following script, which you should place in ``/usr/share/munin/plugins/apache_vhosts_byprojects_access``:

.. code:: perl

    #!/usr/bin/perl -w
    use strict;
    #
    # byprojects_access
    #
    # Perl script to monitor access *byprojects* (e.g. vhost) from multiple files
    # and/or regex.
    #
    # Danny Fullerton <northox@mantor.org>
    # Mantor Organization <www.mantor.org>
    # This work is licensed under a MIT license.
    #
    # You need logtail (https://www.fourmilab.ch/webtools/logtail/)
    #
    # Log can be gathered from multiple sources by simply specifying multiple log
    # filename or using wildcards (glob). File content can be selected using regex.
    #
    # - 'prod' => [ {'path' => '/home/prod/log/access.log'} ],
    #   Prod graph will be using everything in /home/prod/log/access.log
    #
    # - 'test' => [ {'path' => '/var/log/access.log', 'regex' => '"[A-Z]+ /test/'},
    #               {'path' => '/home/test/log/access*.log'} ],
    #   Test graph will be using everything file matching /home/test/log/access*.log
    #   and stuff that match the expression '"[A-Z] /test/' in /var/log/access.log
    #   such as '"GET /test/'

    my $server = 'Apache';

    my $statepath = $ENV{MUNIN_PLUGSTATE};
    my $logtail = 'logtail';

    my %logs = (
        'apache'  => [
                    {'path' => '/var/log/apache2/access.log'},
                  ],
        'eRIC' => [
                    {'path' => '/var/log/apache2/other_vhosts_access.log'}
                  ],

    );

    ###########

    if(defined($ARGV[0])) {
      if ($ARGV[0] eq 'autoconf') {
        print "yes\n";
        exit(0);
      } elsif ($ARGV[0] eq 'config') {
        my $order = '';
        while ((my $project, my @files) = each(%logs)) { $order .= $project.' ' }
        print "graph_order $order\n";
        print "graph_title $server access byprojects\n";
        print "graph_total Total\n";
        print "graph_vlabel Access by \${graph_period}\n";
        print "graph_category webserver\n";
        print "graph_info This graph show $server access by various projects.\n";
        while ((my $project, my @files) = each(%logs)) {
          print $project.".label $project\n";
          print $project.".type DERIVE\n";
          print $project.".min 0\n";
        }
        exit(0);
      }
    }

    foreach my $project ( keys %logs )  {
      my $i = 0;
      my $x = 0;
      foreach my $log ( @{$logs{$project}} ) {
        my @paths = glob $log->{'path'};
        foreach my $path (@paths) {
          my $state = $statepath.'/'.$project.$x.'_access.state';
          open(LT, "$logtail -f ".$log->{'path'}." -o $state |") or
            die "Can't open $logtail : $!";
          while (<LT>) {
            my $buf = $_;
            if($buf eq '') { next }
            if(!defined($log->{'regex'}) || $buf =~ m/$log->{'regex'}/) {
              $i++;
            }
          }
          close(LT);
          $x++;
        }
      }
      print $project.".value $i\n";
    }


Make sure to create a symbolic link:

.. code:: bash

    ln -s /usr/share/munin/plugins/apache_vhosts_byprojects_access /etc/munin/plugins/apache_vhosts_byprojects_access

And add the following lines to to ``/etc/munin/plugin-conf.d/munin-node``:

.. code::

    [apache_vhosts_*]
    user root

You can test the command using ``munin-run apache_vhosts_byprojects_access``.


Monitoring PostgreSQL
---------------------

You need to install ``libdbd-pg-perl`` for the postgres monitoring to work properly:

.. code:: bash

    apt-get install libdbd-pg-perl


This is rather easy, as munin comes with already existing plugins. You only need to create the following symlinks:

.. code:: bash

    ln -s /usr/share/munin/plugins/postgres_autovacuum /etc/munin/plugins/postgres_autovacuum
    ln -s /usr/share/munin/plugins/postgres_bgwriter /etc/munin/plugins/postgres_bgwriter
    ln -s /usr/share/munin/plugins/postgres_cache_ /etc/munin/plugins/postgres_cache_ALL
    ln -s /usr/share/munin/plugins/postgres_checkpoints /etc/munin/plugins/postgres_checkpoints
    ln -s /usr/share/munin/plugins/postgres_locks_ /etc/munin/plugins/postgres_locks_ALL
    ln -s /usr/share/munin/plugins/postgres_querylength_ /etc/munin/plugins/postgres_querylength_ALL
    ln -s /usr/share/munin/plugins/postgres_size_ /etc/munin/plugins/postgres_size_ALL
    ln -s /usr/share/munin/plugins/postgres_transactions_ /etc/munin/plugins/postgres_transactions_ALL
    ln -s /usr/share/munin/plugins/postgres_xlog /etc/munin/plugins/postgres_xlog


Depending on your setup you might have to add the following lines to ``/etc/munin/plugin-conf.d/munin-node``:

.. code::

    [postgres_*]
    user postgres
    env.PGUSER postgres
    env.PGPORT 5432


Monitoring Redis
----------------

This can be accomplished by adding the following script to ``/usr/share/munin/plugins/redis_``

.. code:: bash

    #!/bin/bash
    #
    # The following code is released in public domain (where applicable).
    # http://creativecommons.org/publicdomain/zero/1.0/
    #%# family=auto
    #%# capabilities=autoconf suggest

    ip_socket=$(echo $0 | awk -F_ '{ print $2 }')
    if [ $ip_socket = "socket" ]; then
    tmp_var=$(echo $0 | awk -F_ '{ s = ""; for (i = 3; i <= NF; i++) s = s $i "/"; print s }')
    port_path=$(echo "/${tmp_var}" | sed 's,/$,,')
    else
    port_path=$(echo $0 | awk -F_ '{ print $3 }')
    fi

    if [ "$ip_socket" = "socket" ]; then
        ip_socket="-s";
    else
        if [ -z $ip_socket ] ; then
          ip_socket="-h 127.0.0.1"
        else
          ip_socket="-h $ip_socket"
        fi
    fi

    if [ -z "$port_path" ]; then
        port_path="-p 6379"
    elif [ "$ip_socket" = "-s" ]; then
        port_path="$port_path"
    else
        port_path="-p $port_path"
    fi

    # add the ability to set a password in a respective config file
    if [ -z "$password" ]; then
        passwd='' # no password was configured
    else
        passwd="-a $password"
    fi

    if [ "$1" = "autoconf" ]; then
        redis-cli $ip_socket $port_path $passwd info >/dev/null 2>&1 && echo yes && exit 0
        echo no
        exit 0
    fi

    if [ "$1" = "suggest" ]; then
        redis-cli $ip_socket $port_path $passwd info >/dev/null 2>&1 && echo ${ip_socket}_${port_path}
        exit 0
    fi

    if [ "$ip_socket" = "-s" ]; then
        tmp_muninport=$(echo "$port_path" | tr '/' '_')
        muninport=$(echo "${tmp_muninport:1}" | tr '.' '_')
    else
        muninport=$(echo "$port_path" | awk '{ print $2 }')
    fi

    if [ "$1" = "config" ]; then
        # Expose all possibles graphes according to server's capabilities
        redis-cli $ip_socket $port_path $passwd info | awk -v port=${muninport} -F: '

        /^changes_since_last_save:|^rdb_changes_since_last_save:/ {
            print "multigraph redis_changes_since_last_save_"port;
            print "graph_title Redis changes since last save Port: "port ;
            print "graph_info Number of write operations since last SAVE or BGSAVE";
            print "graph_category redis";
            print "changes.label changes";
        };

        /^keyspace_hits:/ {
            print "multigraph redis_commands_"port;
            print "graph_order commands hits misses";
            print "graph_title Redis commands rate Port: "port;
            print "graph_category redis";
            print "graph_vlabel commands/s";
            print "graph_info Redis commands per second";
            print "commands.label commands/s";
            print "commands.type COUNTER";
            print "commands.min 0";
            print "hits.label key hits";
            print "hits.type COUNTER";
            print "hits.min 0";
            print "misses.label key misses";
            print "misses.type COUNTER";
            print "misses.min 0";
        };

        /^total_connections_received:/ {
            print "multigraph redis_total_connections_"port;
            print "graph_title Redis connections rate Port: "port;
            print "graph_category redis";
            print "graph_vlabel connections/s";
            print "graph_info Connections per second to the Redis server";
            print "connections.label connections";
            print "connections.info connections per second";
            print "connections.type COUNTER";
            print "connections.min 0";
        };

        /^used_memory:/ {
            print "multigraph redis_memory_"port;
            print "graph_title Redis memory usage "port;
            print "graph_category redis";
            print "graph_vlabel mem used";
            print "graph_info Memory allocated by Redis";
            print "graph_args --base 1024 -l 0";
            print "memory.label memory";
            print "memory.info Amount of mem used by Redis";
            print "memory.type GAUGE";
            print "memory.min 0";
        };

        /^connected_clients:/ {
            print "multigraph redis_clients_"port;
            print "graph_title Redis connected clients port: "port;
            print "graph_category redis";
            print "graph_vlabel clients";
            print "graph_info Number of currently connected clients";
            print "clients.label clients";
            print "clients.type GAUGE";
            print "clients.min 0";
        };

        /^mem_fragmentation_ratio:/ {
            print "multigraph redis_fragmentation_"port;
            print "graph_title Redis memory fragmentation Port: "port;
            print "graph_category redis";
            print "graph_vlabel fragmentation ratio";
            print "graph_info Ratio between Redis RSS usage and allocated memory";
            print "frag.label fragmentation ratio";
            print "frag.type GAUGE";
            print "frag.min 0";
        };

        /^expired_keys:/ {
            print "multigraph redis_expired_keys_"port;
            print "graph_title Redis expired keys rate Port: "port;
            print "graph_category redis";
            print "graph_vlabel expired keys/s";
            print "graph_info Expired Redis keys per second";
            print "expired.label expired keys";
            print "expired.info expired keys per second";
            print "expired.type COUNTER";
            print "expired.min 0";
        };

        /^evicted_keys:/ {
            print "multigraph redis_evicted_keys_"port;
            print "graph_title Redis evicted keys rate Port: "port;
            print "graph_category redis";
            print "graph_vlabel evicted keys/s";
            print "graph_info Evicted Redis keys per second";
            print "evicted.label evicted keys";
            print "evicted.info evicted keys per second";
            print "evicted.type COUNTER";
            print "evicted.min 0";
        };

        /^pubsub_channels:/ {
            print "multigraph redis_pubsub_channels_"port;
            print "graph_title Redis pubsub channels Port: "port;
            print "graph_category redis";
            print "graph_vlabel channels";
            print "graph_info Number of pubsub channels";
            print "channels.label channels";
            print "channels.type GAUGE";
            print "channels.min 0";
        };

        /^blocked_clients:/ {
            print "multigraph redis_blocked_clients_"port;
            print "graph_title Redis blocked clients Port: "port;
            print "graph_category redis";
            print "graph_vlabel clients";
            print "graph_info Number of blocked clients";
            print "blocked.label clients";
            print "blocked.type GAUGE";
            print "blocked.min 0";
            print "blocked.warning 1";
        };

        /^db/ {
            split($2, where, "=|,");
            dbskeys[$1]    = where[2];
            dbsexpires[$1] = where[4];
        };

        END {
            print "multigraph redis_dbs_"port;
            print "graph_title Redis dbs Port: "port;
            print "graph_category redis";
            print "graph_vlabel keys";
            print "graph_info Number of keys per dbs";

            for (i in dbskeys)
                print i "keys.label " i " keys"
                print i "keys.type GAUGE"
                print i "keys.min 0"

            for (i in dbsexpires)
                print i "expires.label " i " keys with TTL"
                print i "expires.type GAUGE"
                print i "expires.min 0";
        };

        '
        exit $?
    fi

    redis-cli $ip_socket $port_path $passwd info | awk -v port=${muninport} -F: '

       /^changes_since_last_save:|^rdb_changes_since_last_save:/ {
            print "multigraph redis_changes_since_last_save_"port;
            print "changes.value " $2 ;
        };

        /^total_connections_received:/ {
            print "multigraph redis_total_connections_"port;
            print "connections.value " $2 ;
        };

        /^used_memory:/ {
            print "multigraph redis_memory_"port;
            print "memory.value " $2 ;
        };

        /^connected_clients:/ {
            print "multigraph redis_clients_"port;
            print "clients.value " $2 ;
        };

        /^mem_fragmentation_ratio:/ {
            print "multigraph redis_fragmentation_"port;
            print "frag.value " $2 ;
        };

        /^expired_keys:/ {
            print "multigraph redis_expired_keys_"port;
            print "expired.value " $2 ;
        };

        /^evicted_keys:/ {
            print "multigraph redis_evicted_keys_"port;
            print "evicted.value " $2 ;
        };

        /^pubsub_channels:/ {
            print "multigraph redis_pubsub_channels_"port;
            print "channels.value " $2 ;
        };

        /^blocked_clients:/ {
            print "multigraph redis_blocked_clients_"port;
            print "blocked.value " $2 ;
        };

        /^total_commands_processed:/ {
            commands=$2
        };

        /^keyspace_hits:/ {
            hits=$2
        };

        /^keyspace_misses:/ {
            misses=$2
        };

        /^db/ {
            split($2, where, "=|,");
            dbskeys[$1]    = where[2];
            dbsexpires[$1] = where[4];
        };

        END {
            print "multigraph redis_commands_"port;
            print "commands.value " commands;
            print "hits.value " hits;
            print "misses.value " misses;

            print "multigraph redis_dbs_"port;

            for (i in dbskeys)
                print i "keys.value "    dbskeys[i];

            for (i in dbsexpires)
                print i "expires.value " dbsexpires[i];
        };
    '

Make sure to give this file the executable flag:

.. code:: bash

    chmod +x redis_


Assuming your redis socket is located in ``/tmp/redis.sock``, create a symbolic link as follows:

.. code:: bash

    ln -s /usr/share/munin/plugins/redis_ /etc/munin/plugins/redis_socket_tmp_redis.sock


You will have to add the following lines to ``/etc/munin/plugin-conf.d/munin-node``:

.. code::

    [redis_*]
    user redis


Monitoring eRIC Workbench
-------------------------

eRIC Workbench comes with ``RequestTimeLogMiddleware``, which logs every single request to the REST API in a logfile.
Essentially the following data are stored:

- Who made the request
- When was the request made
- Which URI was this request made to
- Which type was this request (GET, PUT, POST, PATCH, etc...)
- How long did the request take (request duration)
- How many bytes were transferred (bytes transferred)

From all these data, the following two should be sufficient to determine the current load and state of the workbench:

- Request duration
- Bytes transferred

This can be accomplished with the following script, which you need to put into ``/usr/share/munin/plugins/django_request_time_middleware_logging``
(this script requires ``logtail`` to be installed):

.. code:: bash

    #!/bin/sh

    case $1 in
       config)
            cat <<'EOM'
    multigraph eric_traffic
    graph_category eRIC
    graph_title eRIC API
    graph_vlabel Traffic
    eric_response_bytes.label Total Response Size (byte)

    multigraph eric_response_time
    graph_category eRIC
    graph_title eRIC API
    graph_vlabel Response Time
    eric_response_time.label Avg Response Time (s)

    EOM
            exit 0;;
    esac

    logfile="/var/django/ericworkbench/app/logs/request_time_middleware.log"

    logfile_entries=`logtail $logfile | grep response | grep "/api/"`

    echo "multigraph eric_traffic"
    printf "eric_response_bytes.value "
    echo "$logfile_entries" | awk -F',' '{print $10}' | sed 's/sent//g' | sed 's/bytes//g' | awk -F',' '{sum+=$1; ++n} END { print sum }'

    echo "multigraph eric_response_time"
    printf "eric_response_time.value "
    echo "$logfile_entries" | awk -F',' '{sum+=$7; ++n} END { print sum/n }'


Make sure to give this script the executeable flag, and create a symlink:

.. code:: bash

    chmod +x django_request_time_middleware_logging
    ln -s /usr/share/munin/plugins/django_request_time_middleware_logging /etc/munin/plugins/django_request_time_middleware_logging
