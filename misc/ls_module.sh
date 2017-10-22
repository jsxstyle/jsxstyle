#!/usr/bin/env bash
LOADER_TMPFILE=$(npm --silent pack) && tar -tf $LOADER_TMPFILE && echo && rm -i $LOADER_TMPFILE
