#!/bin/bash

DSTFILE=${1}.hgt
FILE=${1}.SRTMGL1.hgt.zip
PASSWORD=${2}

if [ ! -e ${DSTFILE} ]; then
	wget --user=Mortvola --password=${PASSWORD} https://e4ftl01.cr.usgs.gov/MEASURES/SRTMGL1.003/2000.02.11/${FILE}
	#FILE=${1}.hgt.zip
	#wget https://dds.cr.usgs.gov/srtm/version2_1/SRTM1/Region_04/${FILE}
	unzip ${FILE}
	rm ${FILE}
fi

