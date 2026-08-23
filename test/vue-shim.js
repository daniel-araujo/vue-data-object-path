const VueDataObjectPath = require('..');

// Reading the version from package.json (rather than requiring 'vue' itself)
// lets us detect the major version and set up a DOM, if needed, before any
// of Vue's own modules load. @vue/runtime-dom captures a reference to the
// global `document` at module-load time, not lazily, so setting up jsdom
// after requiring 'vue' would be too late.
const isVue3 = require('vue/package.json').version.startsWith('3.');

let ShimVue;

if (isVue3) {
  // Vue 3's Options API does not run data()/lifecycle hooks until the
  // component is actually mounted, and mounting needs a real DOM.
  if (typeof document === 'undefined') {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!doctype html><html><body></body></html>');

    global.window = dom.window;
    global.document = dom.window.document;

    for (const key of Object.getOwnPropertyNames(dom.window)) {
      if (!(key in global)) {
        global[key] = dom.window[key];
      }
    }
  }

  const Vue = require('vue');

  // A drop-in replacement for `new Vue(options)`: creates an independent
  // app (so the per-app install tracking in src/index.js is exercised the
  // same way a real consumer would use it), installs the plugin on it, and
  // mounts it so data()/beforeCreate/created actually run. Returns the
  // public component instance, which supports the same surface the tests
  // already rely on: $data, $watch, $objectPath/$op, reactive properties.
  ShimVue = function (options = {}) {
    // Some existing tests pass `data` as a plain object, which Vue 2 allows
    // for root instances. Vue 3 always expects a function.
    if (options.data && typeof options.data !== 'function') {
      const data = options.data;
      options = { ...options, data: () => data };
    }

    const app = Vue.createApp({ render: () => null, ...options });
    app.use(VueDataObjectPath);
    return app.mount(document.createElement('div'));
  };

  // Tests call `Vue.use(VueDataObjectPath)` once at module load. Real
  // installation happens per-app inside the factory above instead.
  ShimVue.use = function () {};
  ShimVue.version = Vue.version;
} else {
  // Vue 2: passthrough, unchanged behavior.
  ShimVue = require('vue');
}

module.exports = ShimVue;
