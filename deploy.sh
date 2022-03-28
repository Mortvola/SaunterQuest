#!/bin/bash

set -e

# . $HOME/.bash_aliases

./build.sh

FILE=saunter-quest-build.zip

rm -f $FILE
zip -r $FILE build
# to-sq $FILE
scp -i ~/.ssh/sq.pem $FILE saunterquest@saunterquest.com:

