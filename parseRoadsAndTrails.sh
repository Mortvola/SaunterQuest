#/bin/bash

pushd trails

rm trails.json roads.json
rm *.trails
rm *.inter.json
rm *.connectors.json
rm *.initial
rm trails.combined.json
rm trails.sorted.json

echo "Extracting trail data"
ogrinfo $HOME/S_USA.TrailNFS_Publish.gdb/ -al | awk -f ../parseTrails.awk >trails.json
echo "Extracting road data"
ogrinfo $HOME/S_USA.RoadCore_FS.gdb/ -al | awk -f ../parseRoads.awk >roads.json

echo "Sorting trails and roads"
sort trails.json >trails.sorted.json
sort roads.json >>trails.sorted.json

popd

echo "Combining and parsing trails and roads"
php -f combineTrails.php trails/trails.sorted.json >trails/trails.combined.json
php -f parseTrails.php trails/trails.combined.json

echo "Deduping trails and roads"
for file in trails/*.initial; do
	php -f dedupTrails.php $file
done

echo "Generating trail and road graphs"
for file in trails/*.trails; do
	php -f trailJunctions.php $file
done

echo "Removing old data"
sudo rm /var/www/html/trails/*.trails
sudo rm /var/www/html/trails/*.inter.json
sudo rm /var/www/html/trails/*.connectors.json

echo "Copying new data"
sudo cp trails/*.trails /var/www/html/trails/
sudo cp trails/*.inter.json /var/www/html/trails/
sudo cp trails/*.connectors.json /var/www/html/trails/
