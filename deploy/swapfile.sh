#!/bin/bash

SWAPFILE=/swapfile
SIZE=12

if [ ! -e ${SWAPFILE} ]; then 
	dd if=/dev/zero of=${SWAPFILE} count=${SIZE}K bs=1M
	mkswap ${SWAPFILE}
	chmod 600 ${SWAPFILE}
	swapon ${SWAPFILE}
else
	echo "${SWAPFILE} already exists."
fi

