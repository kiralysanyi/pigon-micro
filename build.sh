#/bin/bash

rm -rf ./build
cd ./pigon-micro-web
npm i
npm run build
cd ..
cd ./server
npm i
npm run build
cd ..
cp -r ./server/dist ./build
cp -r ./server/src/assets ./build/assets
cp ./server/package.json ./build/package.json
cp ./server/package-lock.json ./build/package-lock.json
cp -r ./pigon-micro-web/dist ./build/public
cp Dockerfile ./build