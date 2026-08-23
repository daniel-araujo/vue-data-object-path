const { VueDataObjectPathSyntaxError } = require('./string-path-parser');
const { VueDataObjectPathError } = require('./vue-data-object-path-error');
const { VueDataObjectPath } = require('./vue-data-object-path');

// Tracks install targets (a Vue 2 constructor, or a Vue 3 app instance) that
// have already had this plugin installed onto them. A WeakSet lets each
// independently created Vue 3 app get installed independently, while a
// single Vue 2 constructor still only ever gets a single entry, which is
// the same effective behavior as the boolean flag this used to be.
const installedOn = new WeakSet();

exports.install = function (VueOrApp) {
  if (installedOn.has(VueOrApp)) {
    // Already installed. There is nothing to do.
    return;
  }

  VueOrApp.mixin({
    beforeCreate() {
      this.$op = this.$objectPath = new VueDataObjectPath(this);
    }
  });

  installedOn.add(VueOrApp);
};

exports.VueDataObjectPathError = VueDataObjectPathError;

exports.VueDataObjectPathSyntaxError = VueDataObjectPathSyntaxError;
