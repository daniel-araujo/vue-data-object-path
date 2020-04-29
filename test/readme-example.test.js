// The code here is copy pasted to the README file.

const assert = require('assert');
const Vue = require('vue');

const VueDataObjectPath = require('..');

Vue.use(VueDataObjectPath);

it('readme example', () => {
  let vue = new Vue({
    data: {
      a: {
        b: 'd',
        c: ['e', 'f', 'g'],
        'dot.dot': 'value'
      }
    }
  });

  // Retrieves the property of a nested object:
  vue.$objectPath.get(['a', 'dot.dot']); // returns 'value'.

  assert.equal(vue.a['dot.dot'], 'value');

  // Retrieves an element of an array. Note that the index of the element must
  // be passed as a number.
  vue.$objectPath.get(['a', 'c', 1]); // returns 'f'.

  assert.equal(vue.a.c[1], 'f');

  // Creates a new observable property.
  vue.$objectPath.set(['a', 'd'], 'm'); // this.a.d is now 'm'.

  assert.equal(vue.a.d, 'm');

  // Deletes a property from an object.
  vue.$objectPath.delete(['a', 'd']); // this.a.d is now undefined.

  assert(!('d' in vue.a));

  // Set will create intermediate objects and arrays depending on the type. If
  // you pass a string, an object is created, if you pass a number an array is
  // created.
  vue.$objectPath.set(['a', 'd', 'c'], 'd'); // this.a.d.c is 'd'.
                                             // this.a.d is { c: 'd' }.
  vue.$objectPath.set(['a', 'e', 1], 'm'); // this.a.e[1] is 1.
                                           // this.a.e is [undefined, 1].

  assert.equal(vue.a.d.c, 'd');
  assert.equal(vue.a.e[0], undefined);
  assert.equal(vue.a.e[1], 'm');

  // Pushes an element into an array. Note that push can also create
  // intermediate objects and arrays.
  vue.$objectPath.push(['a', 'f'], 'o'); // this.a.f is now ['o']

  assert(vue.a.f instanceof Array);
  assert.equal(vue.a.f[0], 'o');

  // You can push multiple elements on the same call.
  vue.$objectPath.push(['a', 'f'], 'p', 'q'); // this.a.f is now ['o', 'p', 'q']

  assert.equal(vue.a.f[0], 'o');
  assert.equal(vue.a.f[1], 'p');
  assert.equal(vue.a.f[2], 'q');

  // Removes the first element of the array.
  vue.$objectPath.shift(['a', 'f']); // this.a.f is now ['p', 'q']

  assert.equal(vue.a.f[0], 'p');
  assert.equal(vue.a.f[1], 'q');

  // Removes the last element of the array.
  vue.$objectPath.pop(['a', 'f']); // this.a.f is now ['q']
  vue.$objectPath.pop(['a', 'f']); // this.a.f is now []

  assert(vue.a.f instanceof Array);
  assert.equal(vue.a.f.length, 0);

  // Removes 1 element from the array.
  vue.$objectPath.splice(['a', 'c'], 0, 1); // this.a.c is now ['f', 'g']

  assert.equal(vue.a.c.length, 2);
  assert.equal(vue.a.c[0], 'f');
  assert.equal(vue.a.c[1], 'g');

  // Removes 1 element and inserts 2 elements at the given index.
  vue.$objectPath.splice(['a', 'c'], 0, 1, 'h', 'i'); // this.a.c is now ['h', 'i', 'g']

  assert.equal(vue.a.c.length, 3);
  assert.equal(vue.a.c[0], 'h');
  assert.equal(vue.a.c[1], 'i');
  assert.equal(vue.a.c[2], 'g');

  // Removes all elements starting from the given index.
  vue.$objectPath.splice(['a', 'c'], 1); // this.a.c is now ['h']

  assert.equal(vue.a.c.length, 1);
  assert.equal(vue.a.c[0], 'h');
});
