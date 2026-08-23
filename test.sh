#!/bin/sh

# Bails when one version fails.
set -e

# Vue versions that this library will be tested against.
# ~3.0.0 is intentionally excluded: it has an upstream reactivity bug where a
# $watch on a not-yet-existing deep path does not fire after the path is
# created which was fixed by Vue itself in 3.1.
vue_versions="~2.0.0 ~2.1.0 ~2.2.0 ~2.3.0 ~2.4.0 ~2.5.0 ~2.6.0 ~2.7.0 ~3.1.0 ~3.2.0 ~3.3.0 ~3.4.0 ~3.5.0"

for vue_version in $vue_versions; do
  # The module of this version of vue is installed temporarily so that in case
  # the test fails you will be able to debug the code faster by directly
  # executing the command that runs the unit tests.
  npm install --no-save "vue@$vue_version"

  # Runs unit tests against this version.
  # --exit is needed because Vue 2's nextTick scheduler opens a MessageChannel
  # in Node that keeps the process alive after the tests finish.
  npx mocha --exit
done