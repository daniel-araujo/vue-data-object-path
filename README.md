# vue-data-object-path

This plugin adds methods for retrieving and modifying observable data properties
with paths encoded as arrays.

Tested with Vue 2.6.


## Install

```
npm install vue-data-object-path
```


## Usage

Require the module `vue-data-object-path` and pass it to `Vue.use`.

```js
const VueDataObjectPath = require('vue-data-object-path')

Vue.use(VueDataObjectPath)
```

You will then have access to the $objectPath object in every Vue component.


## Documentation

```js
{
  data() {
    return {
      a: {
        b: 'd',
        c: ['e', 'f', 'g'],
        'dot.dot': 'value'
      }
    };
  }
}

// Retrieves the property of a nested object:
$objectPath.get(['a', 'dot.dot']); // returns 'value'.

// Retrieves an element of an array. Note that the index of the element must
// be passed as a number.
$objectPath.get(['a', 'c', 1]); // returns 'f'.

// Creates a new observable property.
$objectPath.set(['a', 'c'], 'm'); // this.a.c is now 'm'.

// Set will create intermediate objects and arrays depending on the type. If
// you pass a string, an object is created, if you pass a number an array is
// created.
$objectPath.set(['b', 'c'], 'm'); // this.b.c is 'm'.
                                  // this.b is { c: 'm' }.
$objectPath.set(['c', 1], 'm'); // this.c[1] is 1.
                                // this.c is [undefined, 1].
```


## Contributing

The easiest way to contribute is by starring this project on GitHub!

https://github.com/daniel-araujo/vue-data-object-path

If you've found a bug, would like to suggest a feature or need help, feel free
to create an issue on GitHub:

https://github.com/daniel-araujo/vue-data-object-path/issues


## Special thanks

This library was inspired by object-path:
https://github.com/mariocasciaro/object-path
