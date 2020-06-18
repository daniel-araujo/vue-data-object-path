# vue-data-object-path

This Vue plugin allows you to retrieve and modify observable data properties in
deeply nested structures using paths encoded in strings
(`"form.attachments[1]"`) or arrays (`["form", "attachments", 1]`). Intermediate
objects are automatically created for you.

```js
$op.set('a.b.c.d.e.f', 'gun');

// Creates this:
{
  a: {
    b: {
      c: {
        d: {
          e: {
            f: 'gun'
          }
        }
      }
    }
  }
}

$op.get('a.b.c.d.e.f'); // returns 'gun'.
```

Tested with the latest release of every minor version of Vue.js 2 (from **2.0**
to **2.6**).


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

You will then have access to `$objectPath` and `$op` in every Vue component.


## Documentation

`$op` and its long version `$objectPath` are available in every Vue component.
You can use them after the data method has run. They have the following methods:


| Method                                     | Short description                              |
|--------------------------------------------|------------------------------------------------|
| set(path)                                  | Stores a value                                 |
| get(path)                                  | Retrieves a value                              |
| has(path)                                  | Checks if value exists                         |
| insert(path, start, ...items)              | Inserts elements into array                    |
| remove(path, start, deleteCount)           | Removes elements from array                    |
| empty(path)                                | Empties objects and arrays                     |
| delete(path)                               | Works like the delete operator                 |
| push(path, ...value)                       | Inserts elements to the end of array           |
| pop(path)                                  | Removes and returns last element of array      |
| shift(path)                                | Removes and returns first element of array     |
| splice(path, start, deleteCount, ...items) | Removes and inserts elements into array        |
| coalesce(...path)                          | Returns first non-null and non-undefined value |

For examples and more detailed descriptions, please read on.


### Methods

#### `get(path)`

Retrieves an object's property or an array's element.

Returns undefined if path does not lead to a value.

```js
{
  data() {
    return {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: 'gun'
              }
            }
          }
        }
        'dot.dot': 'value'
        array: ['first', 'second']
      }
    };
  }
}

// Retrieves value from nested property.
$op.get('a.b.c.d.e.f'); // returns 'gun'.

// Accesses a property using an array to prevent disambiguation.
$op.get(['a', 'dot.dot']); // returns 'value'.

// Retrieves element of array.
$op.get('a.array[1]'); // returns 'second'.

// Accessing same element but with an array path. Note that the index
// of the element must be passed as a number.
$op.get(['a', 'array', 1]); // returns 'second'.

// Does not crash if intermediate paths do not exist.
$op.get('a.doesNotExist.alsoDoesNotExist'); // returns undefined.
```


#### `set(path, value)`

Changes the value of a property of an object or the element of an array.

If the property does not exist it will be created and it will be reactive.

Intermediate objects and arrays will automatically be created.

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
$op.set('a.b', 'm'); // this.a.b is now 'm'.

// Changes the element of an array
$op.set('a.c[1]', 'm'); // this.a.c is now ['e', 'm', 'g']

// Will create intermediate objects and arrays depending on the type of the key. If
// you pass a string, an object is created, if you pass a number an array is
// created.
$op.set(['a', 'd', 'c'], 'm'); // this.a.d.c is 'd'.
                               // this.a.d is { c: 'm' }.
$op.set(['a', 'e', 1], 'm'); // this.a.e[1] is 'm'.
                             // this.a.e is [undefined, 'm'].
```


#### `has(path)`

Checks if path leads to a meaningful value.

Null and undefined are values that are not considered meaningful.

```js
{
  data() {
    return {
      a: {
        b: 'd',
        c: ['e', 'f', 'g'],
        d: undefined,
        e: null
      }
    };
  }
}

$op.has('a'); // returns true.
$op.has('a.b'); // returns true.
$op.has('a.b.c[0]'); // returns true.

$op.has('b'); // returns false.
$op.has('a.c'); // returns false.
$op.has('a.b.c[3]'); // returns false.
$op.has('a.b.d'); // returns false.
$op.has('a.b.e'); // returns false.
```


#### `insert(path, start, ...items)`

Adds elements to an array.

If the array does not exist it will be created.

Fails if the path leads to a value that is not an array.

```js
{
  data() {
    return {
      a: {
        b: ['c', 'e', 'f'],
      }
    };
  }
}

// Inserting a single element.
$op.insert('a.b', 1, 'd'); // this.a.b is now ['c', 'd', 'e', 'f']

// Creating a new array and inserting an element.
$op.insert('a.c', 0, 'd'); // this.a.c is now ['d']

// Inserting multiple elements.
$op.insert('a.c', 1, 'e', 'f'); // this.a.c is now ['d', 'e', 'f']
```


#### `remove(path, start, deleteCount)`

Removes elements from an array.

The deleteCount parameter is optional. When omitted, only a single element will
be removed. So it is equivalent to passing 1.

It returns the elements that were removed.

The method does nothing if path leads to no value but fails if path leads to a
value that is not an array.

```js
{
  data() {
    return {
      a: {
        b: ['c', 'd', 'e', 'f', 'g'],
      }
    };
  }
}

// Removes element at index 1
$op.remove('a.b', 1); // this.a.b is now ['c', 'e', 'f', 'g']

// Removes 2 elements starting at index 1.
$op.remove('a.b', 1, 2); // this.a.b is now ['c', 'g']

// Does nothing when a path leads to no value.
$op.remove('a.c', 1); // this.a.c is undefined
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

$op.delete('a.b'); // this.a.b is now undefined.
$op.delete('a.c[1]'); // this.a.c is now ['e', undefined, 'g'].
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

$op.empty('a.b'); // this.a.b is now ''.
$op.empty('a.c'); // this.a.c is now [].
$op.empty('a'); // this.a is now {}.
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
$op.push('a.b', 'o'); // this.a.b is now ['o']

// You can push multiple elements with a single function call.
$op.push('a.b', 'p', 'q'); // this.a.b is now ['o', 'p', 'q']
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
$op.pop('a.b'); // Returns 'g' and this.a.b is now ['e', 'f'].
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
$op.shift('a.b'); // Returns 'e' and this.a.b is now ['f', 'g']
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
$op.splice('a.b', 0, 1); // Returns ['e'] and this.a.b is now ['f', 'g']

// Removes 1 element and inserts 2 elements.
$op.splice('a.b', 0, 1, 'h', 'i'); // Returns ['f'] and this.a.b is now ['h', 'i', 'g']

// Removes all elements starting from the given index.
$op.splice('a.b', 1); // Returns ['i', 'g'] and this.a.b is now ['h']
```


#### `coalesce(...path)`

Inspired by the COALESCE function present in SQL based databases. Retrieves the
first non-undefined and non-null value.

```js
{
  data() {
    return {
      a: {
        b: undefined,
        c: null,
        e: 'first',
        f: 'second'
      }
    };
  }
}

// Retrieves first non-undefined and non-null value.
$op.coalesce('a.b', 'a.c', 'a.d', 'a.e', 'a.f'); // returns 'first'.
```


### Caveats

You cannot create new properties directly on the data object. This is a
limitation imposed by Vue.js

```js
{
  data() {
    return {
      existingProperty: 1,
      object: {
        property: 'value'
      }
    };
  }
}

// Throws error. Not allowed to create properties at the root level.
$op.set('newProperty', 'no');

// Allowed to change existing properties.
$op.set('existingProperty', 2);

// Allowed to create new nested properties.
$op.set('object.newProperty', 'yes');
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
