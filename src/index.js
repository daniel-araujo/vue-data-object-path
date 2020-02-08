class VueDataObjectPathError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VueDataObjectPathError';
  }
}

// Symbols for private properties.
const VUE = Symbol();
const SET_ROOT = Symbol();
const SET_NESTED = Symbol();
const INTERMEDIATE_ACCESS = Symbol();
const DATA_OBJ = Symbol();

class VueDataObjectPath {
  /**
   * The $objectPath. Gives you access to the API.
   * @param {Vue} vue
   */
  constructor(vue) {
    /**
     * The Vue instance.
     * @member {Vue}
     */
    this[VUE] = vue;
  }

  /**
   * Retrieves a value.
   * @param {any[]} path
   */
  get(path) {
    let current = this[DATA_OBJ]();

    for (let key of path) {
      if (current[key]) {
        // We can access objects and arrays in the same way.
        current = current[key];
      } else {
        // We can't go any further.
        return undefined;
      }
    }

    return current;
  }

  /**
   * Defines a value. Intermediate objects and arrays are created. If the key is
   * a number then an array is created, otherwise an object is.
   * @param {any[]} path
   * @param {any} value
   */
  set(path, value) {
    if (path.length === 0) {
      throw new VueDataObjectPathError('Path must not be empty');
    } else if (path.length === 1) {
      return this[SET_ROOT](path, value);
    } else {
      return this[SET_NESTED](path, value);
    }
  }

  /**
   * Deletes a value.
   * Note that this behaves like the delete operator. This means that arrays
   * are not resized.
   * @param {any[]} path
   */
  delete(path) {
    if (path.length === 0) {
      throw new VueDataObjectPathError('Path must not be empty.');
    } else if (path.length === 1) {
      throw new VueDataObjectPathError('Vue does not support dynamic properties at the root level. Use a nested object, instead.');
    }

    let container = this.get(path.slice(0, path.length - 1));

    if (typeof container === 'object') {
      let lastKey = path[path.length - 1];

      // Works on objects and arrays alike.
      delete container[lastKey];
    }
  }

  /**
   * For setting properties on the root level.
   */
  [SET_ROOT](path, value) {
    let key = path[0];
    let data = this[DATA_OBJ]();

    if (key in data) {
      data[key] = value;
    } else {
      throw new VueDataObjectPathError('Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.');
    }
  }

  /**
   * For setting properties in deeper levels.
   */
  [SET_NESTED](path, value) {
    let current = this[DATA_OBJ]();

    // Root level.
    {
      let key = path[0];
  
      if (key in current) {
        current = current[key];
      } else {
        throw new VueDataObjectPathError('Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.');
      }
    }

    // Any intermediate levels are here.
    for (let i = 1; i < (path.length - 1); i++) {
      let key = path[i];
      let nextKey = path[i + 1];

      this[INTERMEDIATE_ACCESS](current, key, nextKey);

      current = current[key];
    }

    // Last level access.
    {
      let lastKey = path[path.length - 1];

      if (typeof lastKey === 'number') {
        if (lastKey < 0) {
          throw new Error('Negative indexes are not allowed.');
        }
      }

      // Works on objects and arrays.
      this[VUE].$set(current, lastKey, value);
    }
  }

  /**
   * Creates intermediate object or array if necessary.
   * @param {object|array} current
   * @param {string|number} key
   * @param {string|number} nextKey
   */
  [INTERMEDIATE_ACCESS](current, key, nextKey) {
    if (typeof nextKey === 'number') {
      // This is treated as an array.

      if (current[key] === undefined) {
        this[VUE].$set(current, key, []);
      }

      if (nextKey < 0) {
        throw new Error('Negative indexes are not allowed.');
      } else if (nextKey > current[key].length) {
        // Out of range. Extend array.
        current.length = key;
      }
    } else {
      // This is treated as an object.

      if (current[key] === undefined) {
        this[VUE].$set(current, key, {});
      }
    }
  }

  /**
   * Return a direct reference to the data object.
   * @returns {object}
   */
  [DATA_OBJ]() {
    return this[VUE].$data;
  }
};

VueDataObjectPath.install = function (Vue) {
  if (VueDataObjectPath.install.installed) {
    return;
  }

  Vue.mixin({
    beforeCreate() {
      this.$objectPath = new VueDataObjectPath(this);
    }
  })

  VueDataObjectPath.install.installed;
};

module.exports = VueDataObjectPath;
