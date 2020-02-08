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
});