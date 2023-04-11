#!/bin/bash
directoriesExcluded=("build/" "images/demo/")
filesExcluded=("*.sh" "*.md")

# first argument is the version number
if [ -z "$1" ]; then
    echo "No version number supplied"
    exit 1
fi
version=$1
filename="CSS-QuickSelector-$version.zip"

# create build directory if it doesn't exist
if [ ! -d "build" ]; then
    mkdir build
fi

for dir in "${directoriesExcluded[@]}" ; do
    filesExcluded+=("$dir**")
    filesExcluded+=("$dir")
done

command="zip -r build/$filename *"
for file in "${filesExcluded[@]}" ; do
    command+=" -x $file"
done
echo "Command: $command"
eval $command