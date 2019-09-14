#!/bin/bash

TILE=N325W1080

cp trails/${TILE}.initial trails/${TILE}.trails
php artisan trail:analyze --tile=${TILE} --repair
php artisan trail:analyze --tile=${TILE} --remove-point-duplicates
php artisan trail:combinePaths ${TILE}
php artisan tile:generateGraph ${TILE}

