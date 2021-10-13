#!/bin/bash -x
set -e

rm -fr SaunterQuest.old
if [ -e SaunterQuest ]; then
	mv SaunterQuest SaunterQuest.old
fi

unzip build.zip
mv build SaunterQuest

cp .env SaunterQuest 
cp .npmrc SaunterQuest 
cd SaunterQuest 
npm ci --production
npm i source-map-support
node ace migration:run

pm2 restart server
pm2 logs --nostream

