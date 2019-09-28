#!/bin/bash

FILE=${1}.SRTMGL1.hgt.zip
wget --user=Mortvola --ask-password http://e4ftl01.cr.usgs.gov/MEASURES/SRTMGL1.003/2000.02.11/${FILE}
unzip ${FILE}
rm ${FILE}

