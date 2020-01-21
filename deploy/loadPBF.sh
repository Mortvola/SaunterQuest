#!/bin/bash

CARTO_STYLE_FILE=~/src/openstreetmap-carto/openstreetmap-carto.style
CARTO_LUA_FILE=~/src/openstreetmap-carto/openstreetmap-carto.lua
WEB_SITE=https://download.geofabrik.de/

PBF_FILES="north-america-latest.osm.pbf"


fetchPBF ()
{
	FULLPATH=${WEB_SITE}${1}
	
	if [ ! -e ${1} ]; then
		wget ${FULLPATH}
		
		if [ ! $? -eq 0 ]; then
			rm -f ${1}
			exit
		fi
	fi
}


load ()
{
	if [ ! -e ${1}.done ]; then	
		osm2pgsql -d gis --create --slim  -G --hstore \
			--tag-transform-script ${CARTO_LUA_FILE} \
			--number-processes 4 \
			-S ${CARTO_STYLE_FILE} ${1} \
			--disable-parallel-indexing \
			--flat-nodes ./nodes.cache \
			-C 6000
	
		if [ $? -eq 0 ]; then
			touch ${1}.done
		else
			exit
		fi
	fi
}

download ()
{
	for FILE in ${PBF_FILES}; do
	
		if [ ! -e ${FILE}.done ]; then
			fetchPBF ${FILE}
		fi
		
	done
}

merge ()
{
	for FILE in ${PBF_FILES}; do
	
		if [ ! -e ${FILE}.done ]; then
			loadPBF ${FILE}
		fi
		
	done
}

download
merge
load  

