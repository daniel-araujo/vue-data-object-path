#!/bin/sh

# Bails when one version fails.
set -e

# Vue versions that this library will be tested against.
vue_versions="~2.0.0 ~2.1.0 ~2.2.0 ~2.3.0 ~2.4.0 ~2.5.0 ~2.6.0"

for vue_version in $vue_versions; do
  # The module of this version of vue is installed temporarily so that in case
  # the test fails you will be able to debug the code faster by directly
  # executing the command that runs the unit tests.
  npm install --no-save "vue@$vue_version"

  # Runs unit tests against this version.
  npx mocha
done