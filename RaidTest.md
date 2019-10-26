
Linux Software Raid
===
Objective
---
Testing the software raid capabilities on a Linux system


Tests performed
---
Created 2 files of 20GB in /root/RaidSoft:

    dd if=/dev/zero of=20G-1.dat bs=1024 count=20000000
    cp 20G-1.dat 20G-2.dat
    ls -l
    total 24575372
    -rw-r--r-- 1 root root 20480000000 Jul  8 14:57 20G-1.dat
    -rw-r--r-- 1 root root  20480000000 Jul  8 15:00 20G-2.dat

Create the loop devices:

    losetup -fP 20G-1.dat
    losetup -fP 20G-2.dat

View the created devices:

    losetup -a

View the devices:

    lsblk -o NAME,SIZE,FSTYPE,TYPE,MOUNTPOINT

install mdadm:

    apt install mdadm

Now creating the raid itself:

    mdadm --create --verbose /dev/md5 --level=1 --raid-devices=2 \
    /dev/loop0 /dev/loop1

View details of the created raid :

    mdadm --detail /dev/md5
    #aka:
    mdadm -D /dev/md5

Check the resync status to complete 100%, monitory the progress with :

    watch -n1 'mdadm --detail /dev/md5'
    # For shorter view:
    mdadm -Q /dev/md5

Another way to see is in the /proc/ filesystem:

    cat /proc/mdstat

Create a filesystem on it:

    mkfs.ext4 /dev/md5

Mount it:

    mkdir /mnt/raidsoft
    mount /dev/md5 /mnt/raidsoft
    check the new mounted filesystem:
    df -h

Put a big file on it:

    openssl rand -out /mnt/raidsoft/irandman.mkv -base64 $(( 2**30 * 3/4 ))

See the "active" state in the mdadm detail view

    mdadm -D /dev/md5

How is the iowait ?
It goes quite high when writing, not at all when reading

Wring stuff on one, see the sync in action:
not much to see, except high iowait

Simulating a fail on the second device using the command fail:

    mdadm /dev/md5 -f /dev/loop1

(Check the details)

Then remove:

    mdadm /dev/md5 -r /dev/loop1

It will not show in losetup -a anymore:

    losetup -a

But of course the file is still there, because Raid1:

    shasum /mnt/raidsoft/irandman.mkv
    1f1646e77138d279d561901702a98f8594786e8d  irandman.mkv

Now creating a new blank drive:

    dd if=/dev/zero of=20G-3.dat bs=1024 count=20000000

Adding the loop0 device on it:

    losetup -fP 20G-3.dat

Then adding the fresh drive to rebuild the raid:

    mdadm /dev/md5 -a /dev/loop1

Then sync restarts, wait for the rebuild to reach 100% (iowait will be quite high)

Testing a second generation recovery, with another new file loop:
now failing the loop0:

    mdadm /dev/md5 -f /dev/loop0
    mdadm /dev/md5 -r /dev/loop0
    shasum irandman.mkv
    1f1646e77138d279d561901702a98f8594786e8d

Removing loop0:

    losetup -d /dev/loop0

Not there anymore:

    losetup -a

Creating a new blank file and adding loop to the raid:

    dd if=/dev/zero of=20G-4.dat bs=1024 count=20000000
    losetup -fP 20G-4.dat
    mdadm /dev/md5 -a /dev/loop0

Resync finishes : all good !


Now trying to start the raid from scratch with no current raid  running (on a new system).
First, unmount:

    umount /mnt/raidsoft

Then stopping the raid array:

    mdadm --stop /dev/md5

Staring the array again:

    mdadm --assemble /dev/md5 /dev/loop0 /dev/loop1

This can be done with just one loop dev, it will start, just replace the device by "missing"

To make it resilient after reboot, add the mdadm config in static:

    mdadm --detail --brief /dev/md5 >> /etc/mdadm/mdadm.conf

Have a mail  notification when the raid state is failed.

    TBD

Can it be started with only one device ?
yes, just specify "missing" in the command line to create:

    mdadm --create --verbose /dev/md2 --level=1 --raid-devices=2 /dev/loop0 missing

Creating a new raid with one device from a previous one.
The uuid needs to be changed before.
get a new uuid:

    cat /proc/sys/kernel/random/uuid

Then reassemble a new raid, changing the uuid:

    mdadm --assemble /dev/md3 --update=uuid \
     --uuid=f4c40939-a4b5-490c-b44a-bc69e250b7af \
     /dev/loop1 missing --run

Then mounting it:

    mkdir /mnt/200megbis/
    mount /dev/md3 /mnt/200megbis/
    shasum /mnt/200megbis/100m.rand
    359fb25b02e0a6bb0aea75142b72939c1c362add  /mnt/200megbis/100m.rand

Compare speed of a simple filesystem versus a raid1:

    dd if=/dev/zero of=200M.dat bs=1024 count=200000
    losetup -fP 200M.dat
    mkfs.ext4 /dev/loop0
    mkdir /mnt/simple200m
    mount /dev/loop0 /mnt/simple200m
    df -h /mnt/simple200m
    Filesystem      Size  Used Avail Use% Mounted on
    /dev/loop0      186M  1.6M  170M   1% /mnt/simple200m
    
See the speed of creation:

    while true; do dd if=/dev/zero of=/mnt/simple200m/50rand.dat \
    bs=1024 count=50000; done

Results:

    51200000 bytes (51 MB, 49 MiB) copied, 1.79169 s, 28.6 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 0.440203 s, 116 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 0.443469 s, 115 MB/s
	C50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 1.87472 s, 27.3 MB/s
	dd: closing input file '/dev/urandom': Bad file descriptor
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 0.477374 s, 107 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 0.467633 s, 109 MB/s
	^C12406+0 records in
	12405+0 records out
	12702720 bytes (13 MB, 12 MiB) copied, 0.126689 s, 100 MB/s

Rather inconsistent, but let's compare with the same test on a raid1:

Creating the raid:

    dd if=/dev/zero of=200M-1.dat bs=1024 count=200000
    dd if=/dev/zero of=200M-2.dat bs=1024 count=200000
    losetup -fP 200M-1.dat
    losetup -fP 200M-2.dat
    losetup -a
    mdadm --create --verbose /dev/md4 --level=1 --raid-devices=2 \
    /dev/loop1 /dev/loop2
    mkfs.ext4 /dev/md4
    mount /dev/md4 /mnt/200meg
    df -h /mnt/200meg
    Filesystem      Size  Used Avail Use% Mounted on
	/dev/md4        185M  1.6M  170M   1% /mnt/200meg
  
Speed test with the same loop:

    cd /mnt/200meg
    while true; do dd if=/dev/zero of=/mnt/200meg/50rand.dat \
    bs=1024 count=50000; done
    51200000 bytes (51 MB, 49 MiB) copied, 0.507999 s, 101 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 1.02119 s, 50.1 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 2.93956 s, 17.4 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 0.368217 s, 139 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 1.12609 s, 45.5 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 3.01387 s, 17.0 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 0.415404 s, 123 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 1.03551 s, 49.4 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 3.68676 s, 13.9 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 0.507371 s, 101 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 1.34597 s, 38.0 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 3.49395 s, 14.7 MB/s
	50000+0 records in
	50000+0 records out
	51200000 bytes (51 MB, 49 MiB) copied, 0.457417 s, 112 MB/s
	50000+0 records in


This is much much slower, as expected !

The End
===
