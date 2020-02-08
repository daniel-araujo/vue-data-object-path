const assert = require('assert');
const Vue = require('vue');
const VueDataObjectPath = require('..');

Vue.use(VueDataObjectPath);

describe('VueDataObjectPath', () => {
  describe('get', () => {
    describe('root access', () => {
      it('retrieves value from vue property', () => {
        let vue = new Vue({
          data: {
            first: 'value'
          }
        });

        let value = vue.$objectPath.get(['first']);

        assert.equal(value, 'value');
      });

      it('returns undefined if property does not exist', () => {
        let vue = new Vue({
          data: {
            first: 'value'
          }
        });

        let value = vue.$objectPath.get(['doesnotexist']);

        assert.equal(value, undefined);
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

        assert.equal(value, 'value');
      });

      it('returns undefined if root property does not exist', () => {
        let vue = new Vue({
          data: {}
        });

        let value = vue.$objectPath.get(['first', 'asdfg']);

        assert.equal(value, undefined);
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

        assert.equal(value, undefined);
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

        assert.equal(value, 'value');
      });

      it('returns undefined if index is out of range', () => {
        let vue = new Vue({
          data: {
            first: ['value']
          }
        });

        let value = vue.$objectPath.get(['first', 1]);

        assert.equal(value, undefined);
      });
    });
  });

  describe('set', () => {
    it('fails if path is empty', () => {
      // Vue does not support this.

      let vue = new Vue({
        data: {}
      });

      assert.throws(
        () => {
          vue.$objectPath.set([], 'value');
        },
        {
          message: 'Path must not be empty'
        });
    });

    describe('root access', () => {
      it('overwrites existing value', () => {
        let vue = new Vue({
          data: {
            name: 'oldvalue'
          }
        });

        vue.$objectPath.set(['name'], 'newvalue');

        assert.equal(vue.name, 'newvalue');
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
    });

    describe('nested array', () => {
      it('creates array if it does not exist', () => {
        let vue = new Vue({
          data: { nested: {} }
        });

        vue.$objectPath.set(['nested', 'array', 0], 'value');

        assert(vue.nested.array instanceof Array);
        assert.equal(vue.nested.array.length, 1);
        assert.equal(vue.nested.array[0], 'value');
      });

      it('overwrites existing value', () => {
        let vue = new Vue({
          data: {
            first: ['oldvalue']
          }
        });

        vue.$objectPath.set(['first', 0], 'newvalue');

        assert.equal(vue.first[0], 'newvalue');
      });

      it('extends array if index is out of range', () => {
        let vue = new Vue({
          data: {
            first: []
          }
        });

        vue.$objectPath.set(['first', 2], 'value');

        assert.equal(vue.first.length, 3);
        assert.equal(vue.first[0], undefined);
        assert.equal(vue.first[1], undefined);
        assert.equal(vue.first[2], 'value');
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
  
        assert.equal(vue.first.name, 'newvalue');
      });

      it('creates property if it does not exist', () => {
        let vue = new Vue({
          data: {
            first: {}
          }
        });
  
        vue.$objectPath.set(['first', 'name'], 'value');
  
        assert.equal(vue.first.name, 'value');
      });
  
      it('creates nested objected when setting property of nested object', () => {
        let vue = new Vue({
          data: {
            first: {}
          }
        });
  
        vue.$objectPath.set(['first', 'name', 'name2'], 'value');
  
        assert.notEqual(vue.first, undefined);
        assert.equal(vue.first.name.name2, 'value');
      });
    });
  });

  describe('delete', () => {
    it('throws error when providing empty path', () => {
      let vue = new Vue({
        data: {
          first: 'value'
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.delete([]);
        },
        {
          message: 'Path must not be empty.'
        });
    });

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

      assert.equal(vue.nested.prop, undefined);
      assert('prop' in vue.nested === false);
    });

    it('deletes array item like the delete operator would', () => {
      let vue = new Vue({
        data: {
          array: ['first', 'second']
        }
      });

      vue.$objectPath.delete(['array', 0]);

      assert.equal(vue.array.length, 2);
      assert.equal(vue.array[0], undefined);
      assert.equal(vue.array[1], 'second');
      assert(0 in vue.array === false);
    });
  });

  describe('splice', () => {
    it('throws error when providing empty path', () => {
      let vue = new Vue({
        data: {
          first: 'value'
        }
      });

      assert.throws(
        () => {
          vue.$objectPath.splice([], 0);
        },
        {
          message: 'Path must not be empty.'
        });
    });

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

    it('does not throw error when path leads to undefined', () => {
      let vue = new Vue({
        data: {}
      });

      vue.$objectPath.splice(['doesNotExist'], 0);

      // Making sure it did nothing.
      assert(vue.doesNotExist === undefined);
    });

    it('removes all elements from start to the end of the array when deleteCount is omitted', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.splice(['array'], 1);

      // Making sure it did nothing.
      assert.equal(vue.array.length, 1);
      assert.equal(vue.array[0], 'one');
      assert.equal(vue.array[1], undefined);
    });

    it('assumes 0 when deleteCount is undefined', () => {
      // This is how standard built-in arrays work, too.

      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      vue.$objectPath.splice(['array'], 1, undefined);

      // Making sure it did nothing.
      assert.equal(vue.array.length, 3);
      assert.equal(vue.array[0], 'one');
      assert.equal(vue.array[1], 'two');
      assert.equal(vue.array[2], 'three');
    });

    it('returns empty array when path leads to undefined', () => {
      let vue = new Vue({
        data: {}
      });

      let result = vue.$objectPath.splice(['doesNotExist'], 0);

      assert(result instanceof Array);
      assert.equal(result.length, 0);
    });

    it('returns empty array when no elements are deleted', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.splice(['array'], 0, 0, 'one and a half');

      assert(result instanceof Array);
      assert.equal(result.length, 0);
    });

    it('returns deleted elements', () => {
      let vue = new Vue({
        data: {
          array: ['one', 'two', 'three']
        }
      });

      let result = vue.$objectPath.splice(['array'], 0, 1);

      assert(result instanceof Array);
      assert.equal(result.length, 1);
    });
  });
});