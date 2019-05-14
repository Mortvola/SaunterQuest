#/bin/bash

pushd trails

rm trails.json roads.json
rm *.trails

ogrinfo $HOME/S_USA.TrailNFS_Publish.gdb/ -al | awk -f ../parseTrails.awk >trails.json
ogrinfo $HOME/S_USA.RoadCore_FS.gdb/ -al | awk -f ../parseRoads.awk >roads.json

php -f ../parseTrails.php

sudo rm /var/www/html/trails/*.trails
sudo cp *.trails /var/www/html/trails/

popd
