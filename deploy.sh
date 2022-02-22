#!/bin/bash

set -e

. $HOME/.bash_aliases

npm run welcome-build
npm run client-build
npm run server-build

rm -f build/.env

FILE=saunter-quest-build.zip

rm -f $FILE
zip -r $FILE build
to-sq $FILE

