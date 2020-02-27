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

You will then have access to the `$objectPath` object in every Vue component.


## Documentation

The `$objectPath` property will be available on every Vue component. You can use
it after the data method is finished executing. It provides the following
operations:

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
$objectPath.set(['a', 'd', 'c'], 'd'); // this.a.d.c is 'd'.
                                       // this.a.d is { c: 'd' }.
$objectPath.set(['a', 'e', 1], 'm'); // this.a.e[1] is 1.
                                     // this.a.e is [undefined, 1].

// Pushes an element into an array. Note that push can also create
// intermediate objects and arrays.
$objectPath.push(['a', 'f'], 'o'); // this.a.f is now ['o']

// You can push multiple elements on the same call.
$objectPath.push(['a', 'f'], 'p', 'q'); // this.a.f is now ['o', 'p', 'q']

// Removes the last element of the array.
$objectPath.shift(['a', 'f']); // this.a.f is now ['p', 'q']

// Removes the last element of the array.
$objectPath.pop(['a', 'f']); // this.a.f is now ['q']
$objectPath.pop(['a', 'f']); // this.a.f is now []

// Removes 1 element from the array.
$objectPath.splice(['a', 'c'], 0, 1); // this.a.c is now ['f', 'g']

// Removes 1 element and inserts 2 elements at the given index.
$objectPath.splice(['a', 'c'], 0, 1, 'h', 'i']); // this.a.c is now ['h', 'i', 'g']

// Removes all elements starting from the given index.
$objectPath.splice(['a', 'c'], 1); // this.a.c is now ['h']

// Deletes a property from an object.
$objectPath.delete(['a', 'b'); // this.a.b is now undefined.
```

You are not allowed to create new properties in the data object. You can only
create nested properties, either explicitly or through intermediate access:

```js
{
  data() {
    return {
      existingProperty: {
        value: 1
      }
    };
  }
}

// Not allowed.
$objectPath.set(['new-property'], 1);

// Allowed.
$objectPath.set(['existingProperty', 'value'], 2);
$objectPath.set(['existingProperty', 'intermediateObject', 'value'], 3);
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
