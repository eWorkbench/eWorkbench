#!/usr/bin/perl -w
#####################################################################
## This script checks all DSS CES servers for exported filesystems
##   that can be mounted via autofs
##
## Takes automounter key ($1) as /dss/<filesystem> to look for
##
## This file must be executable to work! chmod 755!
##
##    Copyright (C) 2019 M. Stephan (m.stephan@lrz.de)
##
##    This program is free software: you can redistribute it and/or modify
##    it under the terms of the GNU General Public License as published by
##    the Free Software Foundation, either version 3 of the License, or
##    (at your option) any later version.
##
##    This program is distributed in the hope that it will be useful,
##    but WITHOUT ANY WARRANTY; without even the implied warranty of
##    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
##    GNU General Public License for more details.
##
##    You should have received a copy of the GNU General Public License
##    along with this program.  If not, see <https://www.gnu.org/licenses/>.
##
#####################################################################
# main program
#####################################################################
use strict;
use POSIX;
use FindBin;
#####################################################################
# make sure we have the corret path to showmount
my $SHOWMOUNT_CMD="/sbin/showmount";

# List of all potential NFS servers
my @DSSNFSSERVER = ( "nfs" );

# NFS mount options
#   add "nosymlink" here if you want to suppress symlinking local filesystems
#   add "nonstrict" to make it OK for some filesystems to not mount
my $NFSOPTS="-fstype=nfs,hard,intr,nodev,nosuid,gid=1002,uid=1001";

#####################################################################
# Takes automounter key ($1) as /dss/<filesystem> to look for
exit 1 if (! $ARGV[0] );
my $DSSFILESYSTEM=$ARGV[0];

# Empty hash for exports/servers
my %EXPORTLIST = ();

#####################################################################
# Check all server(s) for requested exports
foreach my $nfsserver ( @DSSNFSSERVER ) {
  open(SMNT,"$SHOWMOUNT_CMD -e $nfsserver |") || next;
  while(<SMNT>) {
    if( $_ =~ /^(\/mnt\/dss\/$DSSFILESYSTEM\/\S+)\s+[0-9,\.]+/ ) {
      $EXPORTLIST{$1} = $nfsserver;
    }
  }
  close(SMNT);
}


#####################################################################
# exit with return code 1 if no export was found
exit 1 if (! keys(%EXPORTLIST) );

#####################################################################
# Return list of existing exports to autofs
print "$NFSOPTS";
foreach my $export ( keys(%EXPORTLIST) ) {
  $export =~ /^\/mnt\/dss\/$DSSFILESYSTEM(\/\S+)/;
  print " \\\n  $1 $EXPORTLIST{$export}:$export";
}
print "\n";

exit 0;
# Done
#####################################################################
