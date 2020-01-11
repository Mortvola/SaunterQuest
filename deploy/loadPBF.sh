#!/bin/bash

CARTO_STYLE_FILE=~/src/openstreetmap-carto/openstreetmap-carto.style
CARTO_LUA_FILE=~/src/openstreetmap-carto/openstreetmap-carto.lua
WEB_SITE=https://download.geofabrik.de/north-america/

fetchPBF ()
{
	FULLPATH=${WEB_SITE}${1}
	
	if [ ! -e ${1} ]; then
		wget ${FULLPATH}
		
		if [ ! $? -eq 0 ]; then
			rm -f ${1}
		fi
	fi
}


loadPBF ()
{
	if [ ! -e ${1}.done ]; then	
		osm2pgsql -d gis --append --slim  -G --hstore --tag-transform-script ${CARTO_LUA_FILE} -C 2500 --number-processes 1 -S ${CARTO_STYLE_FILE} ${1}
	
		if [ $? -eq 0 ]; then
			touch ${1}.done
		fi
	fi
}


PBF_FILES="us-west-latest.osm.pbf us-northeast-latest.osm.pbf"

for FILE in ${PBF_FILES}; do

	if [ ! -e ${FILE}.done ]; then
		fetchPBF ${FILE}
	
		if [ -e ${FILE} ]; then
			loadPBF ${FILE}
		fi
	fi
	
done

