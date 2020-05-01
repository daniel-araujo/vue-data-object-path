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
const SANITIZE_PATH = Symbol();

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
   * @returns {any}
   */
  get(path) {
    path = this[SANITIZE_PATH](path);

    let current = this[DATA_OBJ]();

    for (let key of path) {
      if (current[key] !== undefined) {
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
   * Inspired by the COALESCE function present in SQL based databases. Retrieves
   * the first non-undefined and non-null value.
   * @param {...any} path
   * @returns {any}
   */
  coalesce(...paths) {
    for (let path of paths) {
      let value = this.get(path);

      if (value !== undefined && value !== null) {
        return value;
      }
    }

    // No values found.
    return undefined;
  }

  /**
   * Defines a value. Intermediate objects and arrays are created. If the key is
   * a number then an array is created, otherwise an object is.
   * @param {any[]} path
   * @param {any} value
   */
  set(path, value) {
    path = this[SANITIZE_PATH](path);

    if (path.length === 1) {
      return this[SET_ROOT](path, value);
    } else {
      return this[SET_NESTED](path, value);
    }
  }

  /**
   * Deletes a value.
   * Note that this behaves like the delete operator. This means that arrays
   * are not resized. Use the splice method if you need that behavior.
   * @param {any[]} path
   */
  delete(path) {
    path = this[SANITIZE_PATH](path);

    if (path.length === 1) {
      throw new VueDataObjectPathError('Vue does not support dynamic properties at the root level. Use a nested object, instead.');
    }

    let container = this.get(path.slice(0, path.length - 1));

    if (typeof container === 'object') {
      let lastKey = path[path.length - 1];

      if (container instanceof Array) {
        // When dealing with arrays, we have to set the value to undefined
        // because that is what the delete operator would do. Vue's $delete
        // method works more like splice.

        // Should only do something if the index is not out of range.
        if (lastKey < container.length) {
          // This might look silly but it is important. This makes it reactive.
          container.splice(lastKey, 1, undefined);

          // This does the actual job of deleting the element.
          delete container[lastKey];
        }
      } else {
        this[VUE].$delete(container, lastKey);
      }
    }
  }

  /**
   * Changes the contents of an array by removing or replacing existing elements
   * and/or adding new elements.
   * @param {any[]} path - Path to an array.
   * @param {number} start - The index at which to start changing the array.
   * @param {number=} deleteCount - An integer indicating the number of elements
   * in the array to remove from start. If omitted, all the elements from start
   * to the end of the array will be deleted. 
   * @param {...any=} items - The elements to add to the array, beginning from
   * start. If you do not specify any elements, this will only remove elements
   * from the array.
   * @returns {any[]} Elements that were removed from the array.
   */
  splice(path, start, deleteCount, ...items) {
    path = this[SANITIZE_PATH](path);

    let container = this.get(path);

    if (container === undefined) {
      if (path.length === 1) {
        throw new VueDataObjectPathError('Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.');
      }

      // Will create.
      this.set(path, []);
      container = this.get(path);
    }

    if (!(container instanceof Array)) {
      throw new VueDataObjectPathError('Path does not lead to an array.');
    }

    if (arguments.length < 3) {
      // This is how the standard built-in arrays work when the deleteCount
      // argument is omitted. The value undefined is treated as 0.
      deleteCount = container.length - start;
    }

    return container.splice(start, deleteCount, ...items);
  }

  /**
   * Inserts elements into an array.
   * @param {any[]} path - Path to an array.
   * @param {number} start - Where in the array to add elements.
   * @param {...any} items - The elements to add to the array.
   */
  insert(path, start, ...items) {
    if (items.length === 0) {
      throw new VueDataObjectPathError('No items to insert.');
    }

    // The splice method pretty much does insertion but people get frightened of
    // its power and versatility hence why this method exists.
    this.splice(path, start, 0, ...items);
  }

  /**
   * Adds one or more elements to the end of an array and returns the new length
   * of the array.
   * @param {any[]} path - Path to an array.
   * @param {...any=} items - The elements to add to the array.
   * @returns {number} Length of the array.
   */
  push(path, ...items) {
    path = this[SANITIZE_PATH](path);

    let container = this.get(path);

    if (container === undefined) {
      if (path.length === 1) {
        throw new VueDataObjectPathError('Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.');
      }

      // Will create.
      this.set(path, []);
      container = this.get(path);
    }

    if (!(container instanceof Array)) {
      throw new VueDataObjectPathError('Path does not lead to an array.');
    }

    return container.push(...items);
  }

  /**
   * Removes the last element from an array and returns that element.
   * @param {any[]} path - Path to an array.
   */
  pop(path) {
    path = this[SANITIZE_PATH](path);

    let container = this.get(path);

    if (container === undefined) {
      if (path.length === 1) {
        throw new VueDataObjectPathError('Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.');
      }

      // Will create.
      this.set(path, []);
      container = this.get(path);
    }

    if (!(container instanceof Array)) {
      throw new VueDataObjectPathError('Path does not lead to an array.');
    }

    return container.pop();
  }

  /**
   * Removes the first element from an array and returns that element.
   * @param {any[]} path - Path to an array.
   */
  shift(path) {
    path = this[SANITIZE_PATH](path);

    let container = this.get(path);

    if (container === undefined) {
      if (path.length === 1) {
        throw new VueDataObjectPathError('Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.');
      }

      // Will create.
      this.set(path, []);
      container = this.get(path);
    }

    if (!(container instanceof Array)) {
      throw new VueDataObjectPathError('Path does not lead to an array.');
    }

    return container.shift();
  }

  /**
   * Empties the value at the given path. The behavior of this function depends
   * on the type of the value:
   *
   * - Object: removes every property that can be iterated with a for in loop.
   * - Array: sets length to 0
   * - String: replaces with an empty string
   * - Undefined: does nothing
   *
   * Throws an error on any other type.
   * @param {any[]} path - Path to an array.
   */
  empty(path) {
    path = this[SANITIZE_PATH](path);

    let value = this.get(path);

    if (typeof value === 'string') {
      // Strings are immutable in JavaScript so this value has to be replaced.
      this.set(path, '');
    } else if (value instanceof Array) {
      // Have to use the splice method because Vue does not react to length set
      // to 0.
      value.splice(0);
    } else if (typeof value === 'object') {
      for (let key in value) {
        this[VUE].$delete(value, key);
      }
    } else if (typeof value === 'undefined') {
      // Do nothing.
    } else {
      throw new VueDataObjectPathError('Value cannot be emptied. Type not supported.');
    }
  }

  /**
   * Analyses path and returns a copy that can be trustworthy.
   * @throws {VueDataObjectPathError} - If path cannot be used.
   * @param {string[]} path
   * @returns {string[]}
   */
  [SANITIZE_PATH](path) {
    if (path.length === 0) {
      throw new VueDataObjectPathError('Path must not be empty.');
    }

    if (!(path instanceof Array)) {
      throw new VueDataObjectPathError('Path must be an array.');
    }

    return path.concat();
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
          throw new VueDataObjectPathError('Negative indexes are not allowed.');
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
        throw new VueDataObjectPathError('Negative indexes are not allowed.');
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
    if (this[VUE].$data === undefined) {
      // Assuming it has not been initialized. The user is most likely accessing
      // this object before the data method has finished running.
      throw new VueDataObjectPathError('Data object is not accessible. Has the component finished running the data method?');
    }

    return this[VUE].$data;
  }
};

VueDataObjectPath.install = function (Vue) {
  if (VueDataObjectPath.install.installed) {
    return;
  }

  Vue.mixin({
    beforeCreate() {
      this.$op = this.$objectPath = new VueDataObjectPath(this);
    }
  })

  VueDataObjectPath.install.installed;
};

module.exports = VueDataObjectPath;
