# vue-data-object-path

This plugin allows you to retrieve and modify observable data properties using
paths encoded as arrays.

```js
// From this.
{
  anObject: {}
}

$objectPath.set(['anObject', 'firstLayer', 'secondLayer'], 'value');

// To this.
{
  anObject: {
    firstlayer: {
      secondLayer: 'value'
    }
  }
}
```

Tested against versions 2.0, 2.1, 2.2, 2.3, 2.4, 2.5 and 2.6.


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

The `$objectPath` property will be available on every Vue component. You can
start using it after the data method runs.

### Methods

#### `get(path)`

Retrieves an object's property or an array's element.

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

// Does not crash if intermediate paths do not exist.
$objectPath.get(['a', 'doesNotExist', 'alsoDoeNotExist']); // returns undefined.
```


#### `set(path, value)`

Changes the value of a property of an object or the element of an array.

If the property does not exist it will be created and it will be reactive.

Intermediate paths that lead to no objects will automatically be created.

```js
{
  data() {
    return {
      a: {
        b: 'd',
        c: ['e', 'f', 'g'],
      }
    };
  }
}

// Changes an existing property.
$objectPath.set(['a', 'b'], 'm'); // this.a.b is now 'm'.

// Changes the element of an array
$objectPath.set(['a', 'c', 1], 'm'); // this.a.c is now ['e', 'm', 'g']

// Will create intermediate objects and arrays depending on the type of the key. If
// you pass a string, an object is created, if you pass a number an array is
// created.
$objectPath.set(['a', 'd', 'c'], 'm'); // this.a.d.c is 'd'.
                                       // this.a.d is { c: 'm' }.
$objectPath.set(['a', 'e', 1], 'm'); // this.a.e[1] is 'm'.
                                     // this.a.e is [undefined, 'm'].
```


#### `delete(path)`

Acts very much like the delete operator.

```js
{
  data() {
    return {
      a: {
        b: 'd',
        c: ['e', 'f', 'g'],
      }
    };
  }
}

$objectPath.delete(['a', 'b']); // this.a.b is now undefined.
$objectPath.delete(['a', 'c', 1]); // this.a.c is now ['e', undefined, 'g'].
```


#### `empty(path)`

Empties objects, arrays and strings.

```js
{
  data() {
    return {
      a: {
        b: 'd',
        c: ['e', 'f', 'g'],
      }
    };
  }
}

$objectPath.empty(['a', 'b']); // this.a.b is now ''.
$objectPath.empty(['a', 'c']); // this.a.c is now [].
$objectPath.empty(['a']); // this.a is now {}.
```


#### `push(path, ...value)`

Works just like JavaScript's push method. Only works on Arrays.

```js
{
  data() {
    return {
      a: {}
    };
  }
}

// Pushes an element into an array. Note that push can also create
// intermediate objects and arrays.
$objectPath.push(['a', 'b'], 'o'); // this.a.b is now ['o']

// You can push multiple elements with a single function call.
$objectPath.push(['a', 'b'], 'p', 'q'); // this.a.b is now ['o', 'p', 'q']
```


#### `pop(path)`

Works just like JavaScript's pop method. Only works on Arrays.

```js
{
  data() {
    return {
      a: {
        b: ['e', 'f', 'g'],
      }
    };
  }
}

// Removes the last element of the array.
$objectPath.pop(['a', 'b']); // Returns 'g' and this.a.b is now ['e', 'f'].
```


#### `shift(path)`

Works just like JavaScript's shift method. Only works on Arrays.

```js
{
  data() {
    return {
      a: {
        b: ['e', 'f', 'g'],
      }
    };
  }
}

// Removes the first element of the array.
$objectPath.shift(['a', 'b']); // Returns 'e' and this.a.b is now ['f', 'g']
```


#### `splice(path, start, deleteCount, ...items)`

Works just like JavaScript's splice method. Only works on Arrays.

```js
{
  data() {
    return {
      a: {
        b: ['e', 'f', 'g'],
      }
    };
  }
}

// Removes 1 element from the array.
$objectPath.splice(['a', 'b'], 0, 1); // Returns ['e'] and this.a.b is now ['f', 'g']

// Removes 1 element and inserts 2 elements.
$objectPath.splice(['a', 'b'], 0, 1, 'h', 'i'); // Returns ['f'] and this.a.b is now ['h', 'i', 'g']

// Removes all elements starting from the given index.
$objectPath.splice(['a', 'b'], 1); // Returns ['i', 'g'] and this.a.b is now ['h']
```


### Caveats

You cannot create new properties directly on the data object. This is a
limitation imposed by Vue.js

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

// Not allowed. Throws error.
$objectPath.set(['newProperty'], 1);

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
