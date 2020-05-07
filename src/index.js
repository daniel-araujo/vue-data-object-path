const { VueDataObjectPathSyntaxError } = require('./string-path-parser');
const { VueDataObjectPathError } = require('./vue-data-object-path-error');
const { VueDataObjectPath } = require('./vue-data-object-path');

// Whether the Vue plugin has been installed.
let installed = false;

exports.install = function (Vue) {
  if (installed) {
    // Already installed. There is nothing to do.
    return;
  }

  Vue.mixin({
    beforeCreate() {
      this.$op = this.$objectPath = new VueDataObjectPath(this);
    }
  });

  installed = true;
};

exports.VueDataObjectPathError = VueDataObjectPathError;

exports.VueDataObjectPathSyntaxError = VueDataObjectPathSyntaxError;
