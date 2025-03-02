#!/bin/bash

# Ensure rbenv is initialized
export PATH="$HOME/.rbenv/shims:$PATH"

# Print paths for debugging
echo "Using pod at: $(which pod)"
echo "Pod version: $(pod --version)"
echo "Using ruby at: $(which ruby)"
echo "Ruby version: $(ruby --version)"

# Run your Expo build command
npx expo prebuild --platform ios && npx expo run:ios 