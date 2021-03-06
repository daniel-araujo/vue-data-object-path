const assert = require('assert');
const Vue = require('vue');
const VueDataObjectPath = require('..');

Vue.use(VueDataObjectPath);

/**
 * Generates tests for invalid paths.
 * @param {function} use - Receives path as an argument. This will be called to
 * perform the test.
 */
function createTestsForInvalidPaths(use) {
  it('fails when path is empty', () => {
    let vue = new Vue();

    assert.throws(
      () => use(vue, []),
      {
        message: 'Path must not be empty.'
      });
  });

  it('fails when path is not an array or a string', () => {
    let vue = new Vue();

    assert.throws(
      () => use(vue, null),
      {
        message: 'Path must be an array or a string.'
      });

    assert.throws(
      () => use(vue, undefined),
      {
        message: 'Path must be an array or a string.'
      });

    assert.throws(
      () => use(vue, false),
      {
        message: 'Path must be an array or a string.'
      });

    assert.throws(
      () => use(vue, 0),
      {
        message: 'Path must be an array or a string.'
      });

    assert.throws(
      () => use(vue, Symbol()),
      {
        message: 'Path must be an array or a string.'
      });

    assert.throws(
      () => use(vue, {}),
      {
        message: 'Path must be an array or a string.'
      });
  });
}

describe('VueDataObjectPath', () => {
  it('should have $op as a shortcut', () => {
    let vue = new Vue();

    assert.strictEqual(vue.$op, vue.$objectPath);
  });

  describe('corner cases', () => {
    it('fails when attempting to use before data method runs', async () => {
      await assert.rejects(
        new Promise((resolve, reject) => {
          new Vue({
            data() {
              try {
                this.$objectPath.get(['first']);

                resolve();
              } catch (e) {
                reject(e);
              }

              // This line only exists in case that does not fail otherwise Vue
              // will complain about the data method not returning an object.
              return {};
            }
          });
        }),
        {
          message: 'Data object is not accessible. Has the component finished running the data method?'
        });
    });
  });

  describe('string path', () => {
    // These tests will use the get method but the underlying implementation is
    // used in every method that takes a path.

    // They are also very shallow because we have a dedicated test suite just
    // for parsing the path.

    // This is mostly just a sanity check.

    it('accesses root property', () => {
      let vue = new Vue({
        data: {
          property: 'value',
        }
      });

      assert.strictEqual(vue.$objectPath.get('property'), 'value');
    });

    it('accesses nested property using dot notation', () => {
      let vue = new Vue({
        data: {
          nested: {
            property: 'value',
          }
        }
      });

      assert.strictEqual(vue.$objectPath.get('nested.property'), 'value');
    });

    it('accesses array element with square brackets', () => {
      let vue = new Vue({
        data: {
          array: ['value']
        }
      });

      assert.strictEqual(vue.$objectPath.get('array[0]'), 'value');
    });

    it('throws VueDataObjectPathError', () => {
      let vue = new Vue({
        data: {
          array: ['value']
        }
      });

      assert.throws(
        () => vue.$objectPath.get('array.0'),
        {
          name: 'VueDataObjectPathSyntaxError',
          message: 'Unexpected character. (near column 6)'
        });
    });

    it('throws when string is empty', () => {
      let vue = new Vue({
        data: {
          array: ['value']
        }
      });

      assert.throws(
        () => vue.$objectPath.get(''),
        {
          message: 'Path must not be empty.'
        });
    });
  });

  describe('get', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.get(path));

    it('does not mistake falsy values for undefined', () => {
      // This bug actually exists in versions prior to 1.4. That's the
      // punishment I get for saving a couple of key strokes.

      let vue = new Vue({
        data: {
          booleanFalse: false,
          stringEmpty: '',
          numberZero: 0,
          numberNegativeZero: -0,
          null: null,
          nan: NaN,
          undefined: undefined,
        }
      });

      assert.strictEqual(vue.$objectPath.get(['undefined']), undefined);
      assert.strictEqual(vue.$objectPath.get(['nan']), vue.nan); // Wow.
      assert.strictEqual(vue.$objectPath.get(['null']), vue.null);
      assert.strictEqual(vue.$objectPath.get(['numberNegativeZero']), vue.numberNegativeZero);
      assert.strictEqual(vue.$objectPath.get(['numberZero']), vue.numberZero);
      assert.strictEqual(vue.$objectPath.get(['stringEmpty']), vue.stringEmpty);
      assert.strictEqual(vue.$objectPath.get(['booleanFalse']), vue.booleanFalse);
    });

    describe('root access', () => {
      it('retrieves value from vue property', () => {
        let vue = new Vue({
          data: {
            first: 'value'
          }
        });

        let value = vue.$objectPath.get(['first']);

        assert.strictEqual(value, 'value');
      });

      it('returns undefined if property does not exist', () => {
        let vue = new Vue({
          data: {
            first: 'value'
          }
        });

        let value = vue.$objectPath.get(['doesnotexist']);

        assert.strictEqual(value, undefined);
      });

      it('is reactive by simple assignment', () => {
        let called = 0;

        let vue = new Vue({
          data: {
            first: 'before',
          },

          computed: {
            get() {
              called += 1;
              return this.$objectPath.get(['first']);
            }
          }
        });

        assert.strictEqual(vue.get, 'before');

        vue.first = 'after';

        assert.strictEqual(vue.get, 'after');
        assert.strictEqual(called, 2);
      });

      it('is reactive by assignment with $objectPath.set', () => {
        let called = 0;

        let vue = new Vue({
          data: {
            first: null
          },

          computed: {
            get() {
              called += 1;
              return this.$objectPath.get(['first']);
            }
          }
        });

        assert.strictEqual(vue.get, null);

        vue.$objectPath.set(['first'], 'after');

        assert.strictEqual(vue.get, 'after');
        assert.strictEqual(called, 2);
      });
    });

    describe('nested object', () => {
      it('retrieves value on the second level', () => {
        let vue = new Vue({
          data: {
            first: {
              second: 'value'
            }
          }
        });

        let value = vue.$objectPath.get(['first', 'second']);

        assert.strictEqual(value, 'value');
      });

      it('returns undefined if root property does not exist', () => {
        let vue = new Vue({
          data: {}
        });

        let value = vue.$objectPath.get(['first', 'asdfg']);

        assert.strictEqual(value, undefined);
      });

      it('returns undefined if nested property does not exist', () => {
        let vue = new Vue({
          data: {
            first: {
              second: 'value'
            }
          }
        });

        let value = vue.$objectPath.get(['first', 'asdfg']);

        assert.strictEqual(value, undefined);
      });

      it('is reactive by simple assignment', () => {
        let called = 0;

        let vue = new Vue({
          data: {
            first: {
              second: 'before',
            }
          },

          computed: {
            get() {
              called += 1;
              return this.$objectPath.get(['first', 'second']);
            }
          }
        });

        assert.strictEqual(vue.get, 'before');

        vue.first.second = 'after';

        assert.strictEqual(vue.get, 'after');
        assert.strictEqual(called, 2);
      });

      it('is reactive by assignment with $objectPath.set', () => {
        let called = 0;

        let vue = new Vue({
          data: {
            nested: {
              prop: null
            }
          },

          computed: {
            get() {
              called += 1;
              return this.$objectPath.get(['nested', 'prop']);
            }
          }
        });

        assert.strictEqual(vue.get, null);

        vue.$objectPath.set(['nested', 'prop'], 'after');

        assert.strictEqual(vue.get, 'after');
        assert.strictEqual(called, 2);
      });

      it('is reactive after creating object', () => {
        let called = 0;

        let vue = new Vue({
          data: {
            nested: {},
          },

          computed: {
            get() {
              called += 1;
              return this.$objectPath.get(['nested', 'object', 'prop']);
            }
          }
        });

        assert.strictEqual(vue.get, undefined);

        vue.$objectPath.set(['nested', 'object', 'prop'], 'after');

        assert.strictEqual(vue.get, 'after');
        assert.strictEqual(called, 2);
      });
    });

    describe('nested array', () => {
      it('retrieves value by index', () => {
        let vue = new Vue({
          data: {
            first: ['value']
          }
        });

        let value = vue.$objectPath.get(['first', 0]);

        assert.strictEqual(value, 'value');
      });

      it('returns undefined if index is out of range', () => {
        let vue = new Vue({
          data: {
            first: ['value']
          }
        });

        let value = vue.$objectPath.get(['first', 1]);

        assert.strictEqual(value, undefined);
      });

      it('is not reactive by simple assignment', () => {
        let called = 0;

        let vue = new Vue({
          data: {
            first: ['before'],
          },

          computed: {
            get() {
              called += 1;
              return this.$objectPath.get(['first', 0]);
            }
          }
        });

        assert.strictEqual(vue.get, 'before');

        vue.first[0] = 'after';

        assert.strictEqual(vue.get, 'before');
        assert.strictEqual(called, 1);
      });

      it('is reactive by assignment with $objectPath.set', () => {
        let called = 0;

        let vue = new Vue({
          data: {
            first: ['before'],
          },

          computed: {
            get() {
              called += 1;
              return this.$objectPath.get(['first', 0]);
            }
          }
        });

        assert.strictEqual(vue.get, 'before');

        vue.$objectPath.set(['first', 0], 'after');

        assert.strictEqual(vue.get, 'after');
        assert.strictEqual(called, 2);
      });

      it('is reactive after creating array', () => {
        let called = 0;

        let vue = new Vue({
          data: {
            nested: {},
          },

          computed: {
            get() {
              called += 1;
              return this.$objectPath.get(['nested', 'array', 0]);
            }
          }
        });

        assert.strictEqual(vue.get, undefined);

        vue.$objectPath.set(['nested', 'array', 0], 'after');

        assert.strictEqual(vue.get, 'after');
        assert.strictEqual(called, 2);
      });
    });
  });

  describe('has', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.has(path));

    it('does not return false when value is falsy', () => {
      let vue = new Vue({
        data: {
          booleanFalse: false,
          stringEmpty: '',
          numberZero: 0,
          numberNegativeZero: -0,
          nan: NaN,
        }
      });

      assert.strictEqual(vue.$objectPath.has(['nan']), true);
      assert.strictEqual(vue.$objectPath.has(['numberNegativeZero']), true);
      assert.strictEqual(vue.$objectPath.has(['numberZero']), true);
      assert.strictEqual(vue.$objectPath.has(['stringEmpty']), true);
      assert.strictEqual(vue.$objectPath.has(['booleanFalse']), true);
    });

    it('returns false when value is null', () => {
      let vue = new Vue({
        data: {
          null: null,
        }
      });

      assert.strictEqual(vue.$objectPath.has(['null']), false);
    });

    it('returns false when value is undefined', () => {
      let vue = new Vue({
        data: {
          undefined: undefined,
        }
      });

      assert.strictEqual(vue.$objectPath.has(['undefined']), false);
    });

    it('returns true when path leads to a value', () => {
      let vue = new Vue({
        data: {
          a: 'value',
        }
      });

      assert.strictEqual(vue.$objectPath.has(['a']), true);
    });

    it('returns false when path leads to no value', () => {
      let vue = new Vue();

      assert.strictEqual(vue.$objectPath.has(['doesNotExist']), false);
    });

    it('returns false even when path leads halfway to a value', () => {
      let vue = new Vue({
        data: {
          nested: {
            empty: {}
          }
        }
      });

      assert.strictEqual(vue.$objectPath.has(['nested', 'empty', 'object']), false);
    });

    it('is reactive with existing value', () => {
      let called = 0;

      let vue = new Vue({
        data: {
          value: null,
        },

        computed: {
          has() {
            called += 1;
            return this.$objectPath.has(['value']);
          }
        }
      });

      assert.strictEqual(vue.has, false);

      vue.value = 1;

      assert.strictEqual(vue.has, true);
      assert.strictEqual(called, 2);
    });

    it('is reactive after last property is created', () => {
      let called = 0;

      let vue = new Vue({
        data: {
          nested: {},
        },

        computed: {
          has() {
            called += 1;
            return this.$objectPath.has(['nested', 'value']);
          }
        }
      });

      assert.strictEqual(vue.has, false);

      vue.$objectPath.set(['nested', 'value'], 1);

      assert.strictEqual(vue.has, true);
      assert.strictEqual(called, 2);
    });

    it('is reactive after intermediate property is created', () => {
      let called = 0;

      let vue = new Vue({
        data: {
          nested: {},
        },

        computed: {
          has() {
            called += 1;
            return this.$objectPath.has(['nested', 'intermediate', 'value']);
          }
        }
      });

      assert.strictEqual(vue.has, false);

      vue.$objectPath.set(['nested', 'intermediate'], {});

      assert.strictEqual(vue.has, false);
      assert.strictEqual(called, 2);
    });
  });

  describe('coalesce', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.coalesce(path));

    it('returns undefined when path leads to no value', () => {
      let vue = new Vue();

      let value = vue.$objectPath.coalesce(['one'], ['two']);

      assert.strictEqual(value, undefined);
    });

    it('returns the value of the first path that leads to a defined value', () => {
      let vue = new Vue({
        data: {
          two: 'second',
          three: 'third',
        }
      });

      let value = vue.$objectPath.coalesce(['one'], ['two'], ['three']);

      assert.strictEqual(value, 'second');
    });

    it('does not skip falsy values', () => {
      let vue = new Vue({
        data: {
          booleanFalse: false,
          stringEmpty: '',
          numberZero: 0,
          numberNegativeZero: -0,
          nan: NaN
        }
      });

      assert.strictEqual(vue.$objectPath.coalesce(['notFound'], ['nan']), vue.nan);
      assert.strictEqual(vue.$objectPath.coalesce(['notFound'], ['numberNegativeZero']), vue.numberNegativeZero);
      assert.strictEqual(vue.$objectPath.coalesce(['notFound'], ['numberZero']), vue.numberZero);
      assert.strictEqual(vue.$objectPath.coalesce(['notFound'], ['stringEmpty']), vue.stringEmpty);
      assert.strictEqual(vue.$objectPath.coalesce(['notFound'], ['booleanFalse']), vue.booleanFalse);
    });

    it('skips values that are set to null', () => {
      let vue = new Vue({
        data: {
          one: null,
          two: 'value'
        }
      });

      let value = vue.$objectPath.coalesce(['one'], ['two']);

      assert.strictEqual(value, 'value');
    });

    it('skips values that are actually set to undefined', () => {
      let vue = new Vue({
        data: {
          one: undefined,
          two: 'value'
        }
      });

      let value = vue.$objectPath.coalesce(['one'], ['two']);

      assert.strictEqual(value, 'value');
    });

    it('returns undefined when last path leads to a null value', () => {
      let vue = new Vue({
        data: {
          one: undefined,
          two: null
        }
      });

      let value = vue.$objectPath.coalesce(['one'], ['two']);

      assert.strictEqual(value, undefined);
    });
  });

  describe('set', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.set(path, 'value'));

    describe('root access', () => {
      it('overwrites existing value', () => {
        let vue = new Vue({
          data: {
            name: 'oldvalue'
          }
        });

        vue.$objectPath.set(['name'], 'newvalue');

        assert.strictEqual(vue.name, 'newvalue');
      });

      it('fails to create property if it does not exist', () => {
        // Vue does not support this.

        let vue = new Vue({
          data: {}
        });

        assert.throws(
          () => {
            vue.$objectPath.set(['name'], 'value');
          },
          {
            message: 'Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.'
          });
      });

      it('is reactive', async () => {
        await new Promise((resolve, reject) => {
          let vue = new Vue({
            data: {
              property: 'oldValue'
            },
          });

          vue.$watch('property', (newVal, oldVal) => {
            if (newVal === 'newValue') {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

          vue.$objectPath.set(['property'], 'newValue');

          // This reject call will only work if resolve wasn't called.
          setImmediate(() => reject(new Error('Did not react')));
        });
      });
    });

    describe('nested array', () => {
      it('creates array if it does not exist', () => {
        let vue = new Vue({
          data: { nested: {} }
        });

        vue.$objectPath.set(['nested', 'array', 0], 'value');

        assert(vue.nested.array instanceof Array);
        assert.strictEqual(vue.nested.array.length, 1);
        assert.strictEqual(vue.nested.array[0], 'value');
      });

      it('overwrites existing value', () => {
        let vue = new Vue({
          data: {
            first: ['oldvalue']
          }
        });

        vue.$objectPath.set(['first', 0], 'newvalue');

        assert.strictEqual(vue.first[0], 'newvalue');
      });

      it('extends array if index is out of range', () => {
        let vue = new Vue({
          data: {
            first: []
          }
        });

        vue.$objectPath.set(['first', 2], 'value');

        assert.strictEqual(vue.first.length, 3);
        assert.strictEqual(vue.first[0], undefined);
        assert.strictEqual(vue.first[1], undefined);
        assert.strictEqual(vue.first[2], 'value');
      });

      it('negative indexes are not allowed', () => {
        let vue = new Vue({
          data: {
            first: ['oldvalue']
          }
        });

        assert.throws(
          () => {
            vue.$objectPath.set(['first', -1], 'newvalue');
          },
          {
            message: 'Negative indexes are not allowed.'
          });
      });

      it('is reactive', async () => {
        await new Promise((resolve, reject) => {
          let vue = new Vue({
            data: {
              array: ['existingValue']
            },
          });

          vue.$watch(
            () => vue.array[1],
            (newVal, oldVal) => {
              if (newVal === 'newvalue') {
                // As expected.
                resolve();
              } else {
                reject(new Error('Reacted but the new value is incorrect.'));
              }
            });

          vue.$objectPath.set(['array', 1], 'newvalue');

          // This reject call will only work if resolve wasn't called.
          setImmediate(() => reject(new Error('Did not react')));
        });
      });
    });

    describe('nested object', () => {
      it('overwrites existing value', () => {
        let vue = new Vue({
          data: {
            first: {
              name: 'oldvalue'
            }
          }
        });

        vue.$objectPath.set(['first', 'name'], 'newvalue');

        assert.strictEqual(vue.first.name, 'newvalue');
      });

      it('creates property if it does not exist', () => {
        let vue = new Vue({
          data: {
            first: {}
          }
        });

        vue.$objectPath.set(['first', 'name'], 'value');

        assert.strictEqual(vue.first.name, 'value');
      });

      it('creates nested objected when setting property of nested object', () => {
        let vue = new Vue({
          data: {
            first: {}
          }
        });

        vue.$objectPath.set(['first', 'name', 'name2'], 'value');

        assert.notEqual(vue.first, undefined);
        assert.strictEqual(vue.first.name.name2, 'value');
      });

      it('is reactive', async () => {
        await new Promise((resolve, reject) => {
          let vue = new Vue({
            data: {
              first: {}
            },
          });

          vue.$watch('first.nested.property', (newVal, oldVal) => {
            if (newVal === 'newValue') {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

          vue.$objectPath.set(['first', 'nested', 'property'], 'newValue');

          // This reject call will only work if resolve wasn't called.
          setImmediate(() => reject(new Error('Did not react')));
        });
      });
    });
  });

  describe('delete', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.delete(path));

    it('throws error when attempting to delete root property', () => {
      let vue = new Vue({
        data: {
          first: 'value'
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.delete(['first']);
        },
        {
          message: 'Vue does not support dynamic properties at the root level. Use a nested object, instead.'
        });
    });

    it('does nothing if path does not reach an object property or an array item', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      vue.$objectPath.delete(['nested', 'doesNotExist']);
    });

    it('deletes object property like the delete operator would', () => {
      let vue = new Vue({
        data: {
          nested: {
            prop: 'value'
          }
        }
      });

      vue.$objectPath.delete(['nested', 'prop']);

      assert.strictEqual(vue.nested.prop, undefined);
      assert('prop' in vue.nested === false);
    });

    it('deletes array item like the delete operator would', () => {
      let vue = new Vue({
        data: {
          array: ['first', 'second']
        }
      });

      vue.$objectPath.delete(['array', 0]);

      assert.strictEqual(vue.array.length, 2);
      assert.strictEqual(vue.array[0], undefined);
      assert.strictEqual(vue.array[1], 'second');
      assert(0 in vue.array === false);
    });

    it('is reactive with object properties', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            firstLayer: {
              secondLayer: 1
            }
          },
        });

        vue.$watch('firstLayer.secondLayer', (newVal, oldVal) => {
          if (newVal === undefined) {
            // As expected.
            resolve();
          } else {
            reject(new Error('Reacted but the new value is incorrect.'));
          }
        });

        vue.$objectPath.delete(['firstLayer', 'secondLayer']);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });

    it('is reactive with array elements', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            firstLayer: [1]
          },
        });

        vue.$watch(
          () => vue.firstLayer[0],
          (newVal, oldVal) => {
            if (newVal === undefined) {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.delete(['firstLayer', 0]);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });

    it('does nothing if index is out of range', () => {
      let vue = new Vue({
        data: {
          array: [1]
        },
      });

      vue.$objectPath.delete(['array', 1]);

      assert.strictEqual(vue.array.length, 1);
      assert.strictEqual(vue.array[0], 1);
      assert(1 in vue.array === false);
    });
  });

  describe('splice', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.splice(path));

    it('throws error when path leads to an object', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.splice(['nested'], 0);
        },
        {
          message: 'Path does not lead to an array.'
        });
    });

    it('throws error if array were to be created in root', () => {
      let vue = new Vue({
        data: {}
      });

      assert.throws(
        () => {
          vue.$objectPath.splice(['nested'], 0);
        },
        {
          message: 'Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.'
        });
    });

    it('creates array when path leads to undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      vue.$objectPath.splice(['nested', 'doesNotExist'], 0);

      assert(vue.nested.doesNotExist instanceof Array);
    });

    it('can only return empty array when path is undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      let result = vue.$objectPath.splice(['nested', 'doesNotExist'], 0);

      assert.strictEqual(result.length, 0);
    });

    it('inserts elements when path is undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      let result = vue.$objectPath.splice(['nested', 'doesNotExist'], 0, 0, 1, 2, 3);

      assert.strictEqual(result.length, 0);
      assert.strictEqual(vue.nested.doesNotExist.length, 3);
      assert.strictEqual(vue.nested.doesNotExist[0], 1);
      assert.strictEqual(vue.nested.doesNotExist[1], 2);
      assert.strictEqual(vue.nested.doesNotExist[2], 3);
    });

    it('removes all elements from start to the end of the array when deleteCount is omitted', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.splice(['array'], 1);

      assert.strictEqual(vue.array.length, 1);
      assert.strictEqual(vue.array[0], 'one');
      assert.strictEqual(vue.array[1], undefined);
    });

    it('assumes 0 when deleteCount is undefined', () => {
      // This is how standard built-in arrays work, too.

      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.splice(['array'], 1, undefined);

      assert.strictEqual(vue.array.length, 3);
      assert.strictEqual(vue.array[0], 'one');
      assert.strictEqual(vue.array[1], 'two');
      assert.strictEqual(vue.array[2], 'three');
    });

    it('returns empty array when no elements are deleted', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.splice(['array'], 0, 0, 'one and a half');

      assert(result instanceof Array);
      assert.strictEqual(result.length, 0);
    });

    it('returns deleted elements', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.splice(['array'], 0, 1);

      assert(result instanceof Array);
      assert.strictEqual(result.length, 1);
    });

    it('is reactive', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            array: ['one', 'two', 'three']
          },
        });

        vue.$watch(
          () => vue.array[0],
          (newVal, oldVal) => {
            if (newVal === 'two') {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.splice(['array'], 0, 1);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });
  });

  describe('insert', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.insert(path, 0, 'value'));

    it('throws error when path leads to an object', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.insert(['nested'], 0, 'value');
        },
        {
          message: 'Path does not lead to an array.'
        });
    });

    it('throws error if array were to be created in root', () => {
      let vue = new Vue({
        data: {}
      });

      assert.throws(
        () => {
          vue.$objectPath.insert(['nested'], 0, 'value');
        },
        {
          message: 'Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.'
        });
    });

    it('creates array when path leads to undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      vue.$objectPath.insert(['nested', 'doesNotExist'], 0, 'value');

      assert(vue.nested.doesNotExist instanceof Array);
    });

    it('inserts elements when path is undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      vue.$objectPath.insert(['nested', 'doesNotExist'], 0, 1, 2, 3);

      assert.strictEqual(vue.nested.doesNotExist.length, 3);
      assert.strictEqual(vue.nested.doesNotExist[0], 1);
      assert.strictEqual(vue.nested.doesNotExist[1], 2);
      assert.strictEqual(vue.nested.doesNotExist[2], 3);
    });

    it('fails when no items are provided', () => {
      let vue = new Vue({
        data: {
          array: [1, 2]
        }
      });

      assert.throws(
        () => vue.$objectPath.insert(['array'], 0),
        {
          message: 'No items to insert.'
        });
    });

    it('is reactive', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            array: ['one', 'two', 'three']
          },
        });

        vue.$watch(
          () => vue.array[1],
          (newVal, oldVal) => {
            if (newVal === 'oneAndAHalf') {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.insert(['array'], 1, 'oneAndAHalf');

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });
  });

  describe('remove', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.remove(path, 0));

    it('throws error when path leads to an object', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.remove(['nested'], 0);
        },
        {
          message: 'Path does not lead to an array.'
        });
    });

    it('should only return empty array when path is undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      let result = vue.$objectPath.splice(['nested', 'doesNotExist'], 0);

      assert.strictEqual(result.length, 0);
    });

    it('removes only one element when deleteCount is omitted', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.remove(['array'], 1);

      assert.strictEqual(vue.array.length, 2);
    });

    it('shifts elements to take place of deleted element', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.remove(['array'], 1);

      assert.strictEqual(vue.array[0], 'one');
      assert.strictEqual(vue.array[1], 'three');
    });

    it('assumes 1 when deleteCount is undefined', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.remove(['array'], 1, undefined);

      assert.strictEqual(vue.array.length, 2);
    });

    it('allows deleteCount to be 0', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.remove(['array'], 0, 0);

      assert.strictEqual(vue.array.length, 3);
    });

    it('returns empty array when no elements are deleted', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.remove(['array'], 0, 0);

      assert(result instanceof Array);
      assert.strictEqual(result.length, 0);
    });

    it('returns deleted elements', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.remove(['array'], 0);

      assert(result instanceof Array);
      assert.strictEqual(result.length, 1);
    });

    it('does not change path if path leads to no value', () => {
      let vue = new Vue();

      vue.$objectPath.remove(['array'], 0);

      assert.strictEqual(vue.array, undefined);
    });

    it('returns empty array when path leads to no value', () => {
      let vue = new Vue();

      let result = vue.$objectPath.remove(['array'], 0);

      assert(result instanceof Array);
      assert.strictEqual(result.length, 0);
    });

    it('is reactive', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            array: ['one', 'two', 'three']
          },
        });

        vue.$watch(
          () => vue.array[0],
          (newVal, oldVal) => {
            if (newVal === 'two') {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.remove(['array'], 0);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });
  });

  describe('push', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.push(path, 'value'));

    it('throws error when path leads to an object', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.push(['nested'], 0);
        },
        {
          message: 'Path does not lead to an array.'
        });
    });

    it('creates array when path leads to undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      vue.$objectPath.push(['nested', 'doesNotExist'], 0);

      assert(vue.nested.doesNotExist instanceof Array, 'Should create array');
      assert.strictEqual(vue.nested.doesNotExist.length, 1, 'Should add element to array');
      assert.strictEqual(vue.nested.doesNotExist[0], 0, 'Should have correct element');
    });

    it('throws error if array were to be created in root', () => {
      let vue = new Vue({
        data: {}
      });

      assert.throws(
        () => {
          vue.$objectPath.push(['doesNotExist'], 0);
        },
        {
          message: 'Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.'
        });
    });

    it('returns new length', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.push(['array'], 'four');

      assert.strictEqual(result, 4);
    });

    it('returns correct length when adding more than one item', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.push(['array'], 'four', 'five', 'six');

      assert.strictEqual(result, 6);
    });

    it('is reactive', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            array: ['one', 'two', 'three']
          },
        });

        vue.$watch(
          () => vue.array[3],
          (newVal, oldVal) => {
            if (newVal === 'four') {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.push(['array'], 'four');

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });
  });

  describe('pop', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.pop(path));

    it('throws error when path leads to an object', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.pop(['nested']);
        },
        {
          message: 'Path does not lead to an array.'
        });
    });

    it('creates array when path leads to undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      vue.$objectPath.pop(['nested', 'doesNotExist']);

      assert(vue.nested.doesNotExist instanceof Array, 'Should create array');
      assert.strictEqual(vue.nested.doesNotExist.length, 0, 'Should be empty');
    });

    it('throws error if array were to be created in root', () => {
      let vue = new Vue({
        data: {}
      });

      assert.throws(
        () => {
          vue.$objectPath.pop(['doesNotExist']);
        },
        {
          message: 'Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.'
        });
    });

    it('returns removed element', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.pop(['array']);

      assert.strictEqual(vue.array.length, 2);
      assert.strictEqual(result, 'three');
    });

    it('returns undefined if array is empty', () => {
      let vue = new Vue({
        data: {
          array: []
        }
      });

      let result = vue.$objectPath.pop(['array']);

      assert.strictEqual(vue.array.length, 0);
      assert.strictEqual(result, undefined);
    });

    it('is reactive', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            array: ['one', 'two', 'three']
          },
        });

        vue.$watch(
          () => vue.array[2],
          (newVal, oldVal) => {
            if (newVal === undefined) {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.pop(['array']);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });
  });

  describe('shift', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.shift(path));

    it('throws error when path leads to an object', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.shift(['nested']);
        },
        {
          message: 'Path does not lead to an array.'
        });
    });

    it('creates array when path leads to undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      vue.$objectPath.shift(['nested', 'doesNotExist']);

      assert(vue.nested.doesNotExist instanceof Array, 'Should create array');
      assert.strictEqual(vue.nested.doesNotExist.length, 0, 'Should be empty');
    });

    it('throws error if array were to be created in root', () => {
      let vue = new Vue({
        data: {}
      });

      assert.throws(
        () => {
          vue.$objectPath.shift(['doesNotExist']);
        },
        {
          message: 'Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.'
        });
    });

    it('returns removed element', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.shift(['array']);

      assert.strictEqual(vue.array.length, 2);
      assert.strictEqual(result, 'one');
    });

    it('returns undefined if array is empty', () => {
      let vue = new Vue({
        data: {
          array: []
        }
      });

      let result = vue.$objectPath.shift(['array']);

      assert.strictEqual(vue.array.length, 0);
      assert.strictEqual(result, undefined);
    });

    it('is reactive', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            array: ['one', 'two', 'three']
          },
        });

        vue.$watch(
          () => vue.array[0],
          (newVal, oldVal) => {
            if (newVal === 'two') {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.shift(['array']);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });
  });

  describe('unshift', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.unshift(path, 'value'));

    it('throws error when path leads to an object', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.unshift(['nested'], 0);
        },
        {
          message: 'Path does not lead to an array.'
        });
    });

    it('creates array when path leads to undefined', () => {
      let vue = new Vue({
        data: {
          nested: {}
        }
      });

      vue.$objectPath.unshift(['nested', 'doesNotExist'], 0);

      assert(vue.nested.doesNotExist instanceof Array, 'Should create array');
      assert.strictEqual(vue.nested.doesNotExist.length, 1, 'Should add element to array');
      assert.strictEqual(vue.nested.doesNotExist[0], 0, 'Should have correct element');
    });

    it('throws error if array were to be created in root', () => {
      let vue = new Vue({
        data: {}
      });

      assert.throws(
        () => {
          vue.$objectPath.unshift(['doesNotExist'], 0);
        },
        {
          message: 'Vue does not support dynamic properties at the root level. Either explicitly declare the property or use a nested object.'
        });
    });

    it('returns new length', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.unshift(['array'], 'four');

      assert.strictEqual(result, 4);
    });

    it('returns correct length when adding more than one item', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.unshift(['array'], 'four', 'five', 'six');

      assert.strictEqual(result, 6);
    });

    it('inserts element to beginning of array', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.unshift(['array'], 'zero');

      assert.strictEqual(vue.array.length, 4);
      assert.strictEqual(vue.array[0], 'zero');
      assert.strictEqual(vue.array[1], 'one');
      assert.strictEqual(vue.array[2], 'two');
      assert.strictEqual(vue.array[3], 'three');
    });

    it('inserts elements to beginning of array in order they were passed', () => {
      let vue = new Vue({
        data: {
          array: ['two', 'three']
        }
      });

      vue.$objectPath.unshift(['array'], 'zero', 'one');

      assert.strictEqual(vue.array.length, 4);
      assert.strictEqual(vue.array[0], 'zero');
      assert.strictEqual(vue.array[1], 'one');
      assert.strictEqual(vue.array[2], 'two');
      assert.strictEqual(vue.array[3], 'three');
    });

    it('is reactive', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            array: ['one', 'two', 'three']
          },
        });

        vue.$watch(
          () => vue.array[0],
          (newVal, oldVal) => {
            if (newVal === 'four') {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.unshift(['array'], 'four');

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });
  });

  describe('empty', () => {
    createTestsForInvalidPaths((vue, path) => vue.$objectPath.empty(path));

    it('sets array length to 0', () => {
      let array = ['value'];

      let vue = new Vue({
        data: {
          array
        }
      });

      vue.$objectPath.empty(['array']);

      assert.strictEqual(vue.array.length, 0);
      assert.strictEqual(vue.array, array, 'Must reference same object.');
    });

    it('does nothing if array is already empty', () => {
      let array = [];

      let vue = new Vue({
        data: {
          array
        }
      });

      vue.$objectPath.empty(['array']);

      assert.strictEqual(vue.array.length, 0);
      assert.strictEqual(vue.array, array, 'Must reference same object.');
    });

    it('removes every key that the object owns', () => {
      let object = {
        first: 1,
        second: 1,
      };

      let vue = new Vue({
        data: {
          object
        }
      });

      vue.$objectPath.empty(['object']);

      assert.strictEqual(Object.keys(vue.object).length, 0);
      assert.strictEqual(vue.object.first, undefined);
      assert.strictEqual(vue.object.second, undefined);
      assert.strictEqual(vue.object, object, 'Must reference same object.');
    });

    it('does not remove object keys that are not enumerable', () => {
      let object = {
        first: 1,
      };

      Object.defineProperty(object, 'second', {
        value: 2,
        enumerable: false
      });

      let vue = new Vue({
        data: {
          object
        }
      });

      vue.$objectPath.empty(['object']);

      assert.strictEqual(Object.keys(vue.object).length, 0);
      assert.strictEqual(vue.object.first, undefined);
      assert.strictEqual(vue.object.second, 2);
      assert.strictEqual(vue.object, object, 'Must reference same object.');
    });

    it('does nothing if object is already empty', () => {
      let object = {};

      let vue = new Vue({
        data: {
          object
        }
      });

      vue.$objectPath.empty(['object']);

      assert.strictEqual(Object.keys(vue.object).length, 0);
      assert.strictEqual(vue.object, object, 'Must reference same object.');
    });

    it('replaces string with empty string', () => {
      let vue = new Vue({
        data: {
          text: 'a'
        }
      });

      vue.$objectPath.empty(['text']);

      assert.strictEqual(typeof vue.text, 'string');
      assert.strictEqual(vue.text.length, 0);
    });

    it('does nothing if string is already empty', () => {
      let vue = new Vue({
        data: {
          text: ''
        }
      });

      vue.$objectPath.empty(['text']);

      assert.strictEqual(typeof vue.text, 'string');
      assert.strictEqual(vue.text.length, 0);
    });

    it('does nothing if path does not lead to a value', () => {
      let vue = new Vue({
        data: {
          something: '12'
        }
      });

      vue.$objectPath.empty(['doesNotExist']);

      assert.strictEqual(vue.doesNotExist, undefined);
    });

    it('does nothing if path is null', () => {
      let vue = new Vue({
        data: {
          something: null
        }
      });

      vue.$objectPath.empty(['something']);

      assert.strictEqual(vue.something, null);
    });

    it('fails when value is boolean', () => {
      let vue = new Vue({
        data: {
          t: true,
          f: false
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.empty(['t']);
        },
        {
          message: 'Value cannot be emptied. Type not supported.'
        });

      assert.throws(
        () => {
          vue.$objectPath.empty(['f']);
        },
        {
          message: 'Value cannot be emptied. Type not supported.'
        });
    });

    it('fails when value is a number', () => {
      let vue = new Vue({
        data: {
          zero: 0,
          one: 1,
          infinity: Infinity,
          nan: NaN
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.empty(['zero']);
        },
        {
          message: 'Value cannot be emptied. Type not supported.'
        });

      assert.throws(
        () => {
          vue.$objectPath.empty(['infinity']);
        },
        {
          message: 'Value cannot be emptied. Type not supported.'
        });

      assert.throws(
        () => {
          vue.$objectPath.empty(['one']);
        },
        {
          message: 'Value cannot be emptied. Type not supported.'
        });

      assert.throws(
        () => {
          vue.$objectPath.empty(['nan']);
        },
        {
          message: 'Value cannot be emptied. Type not supported.'
        });
    });

    it('is reactive with strings', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            text: 'asdasd'
          },
        });

        vue.$watch('text', (newVal, oldVal) => {
          if (newVal === '') {
            // As expected.
            resolve();
          } else {
            reject(new Error('Reacted but the new value is incorrect.'));
          }
        });

        vue.$objectPath.empty(['text']);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });

    it('is reactive with objects', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            object: {
              one: 1,
              two: 2
            }
          },
        });

        vue.$watch('object.one', (newVal, oldVal) => {
          if (newVal === undefined) {
            // As expected.
            resolve();
          } else {
            reject(new Error('Reacted but the new value is incorrect.'));
          }
        });

        vue.$objectPath.empty(['object']);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });

    it('is reactive with arrays', async () => {
      await new Promise((resolve, reject) => {
        let vue = new Vue({
          data: {
            array: ['one', 'two', 'three']
          },
        });

        vue.$watch(
          () => vue.array[0],
          (newVal, oldVal) => {
            if (newVal === undefined) {
              // As expected.
              resolve();
            } else {
              reject(new Error('Reacted but the new value is incorrect.'));
            }
          });

        vue.$objectPath.empty(['array']);

        // This reject call will only work if resolve wasn't called.
        setImmediate(() => reject(new Error('Did not react')));
      });
    });
  });
});