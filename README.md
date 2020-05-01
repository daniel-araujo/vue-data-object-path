# vue-data-object-path

This Vue plugin allows you to retrieve and modify observable data properties
using paths encoded as arrays. It creates intermediate objects and arrays for
you. This turns out to be useful for very complex forms.

Tested against the latest versions of **2.0**, **2.1**, **2.2**, **2.3**,
**2.4**, **2.5** and **2.6** of Vue.js.


## Example

A form that contains fields for uploading attachments.

```html
<form>
  <label>Name:</label>
  <input :value.sync="fields.name">
  <p>{{ $op.get(['errors', 'name']) }}</p>

  <label>Attachments:</label> <button @click="addAttachment">+</button>
  <div v-for="(attachmentId, index) in fields.extra.attachments">
    <button @click="removeAttachment(index)">-</button
    <file-viewer :value="attachmentId"/>
    <p>{{ $op.get(['errors', 'extra', 'attachments', index]) }}</p>
  </div>
</form>
```

With this data.

```js
{
  fields: {
    name: 'Montly Report 2017/01',
    extra: {
      attachments: [38475893405, 9895735794]
    }
  },
  errors: {}
}
```

Validation is done on the fields. An attachment fails to pass a validation
rule. An error message is set.

```js
$op.set(['errors', 'extra', 'attachments', 1], 'Incorrect file format.');
```

The data structure looks like this now.

```js
{
  fields: {
    name: 'Montly Report 2017/01',
    extra: {
      attachments: [38475893405, 9895735794]
    }
  },
  errors: {
    extra: {
      attachments: [undefined, 'Incorrect file format.']
    }
  }
}
```

The user decides to remove the bad attachment. Error messages can be cleared.

```js
$op.remove(['fields', 'extra', 'attachments'], 1);

$op.empty(['errors']);
```

The data structure ends up like this.

```js
{
  form: {
    name: 'Montly Report 2017/01',
    extra: {
      attachments: [38475893405]
    }
  },
  errors: {}
}
```


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

The `$objectPath` property will be available on every Vue component. You can
start using it after the data method runs.

You can also use `$op` as a shortcut.


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
$op.get(['a', 'dot.dot']); // returns 'value'.

// Retrieves an element of an array. Note that the index of the element must
// be passed as a number.
$op.get(['a', 'c', 1]); // returns 'f'.

// Does not crash if intermediate paths do not exist.
$op.get(['a', 'doesNotExist', 'alsoDoeNotExist']); // returns undefined.
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
$op.set(['a', 'b'], 'm'); // this.a.b is now 'm'.

// Changes the element of an array
$op.set(['a', 'c', 1], 'm'); // this.a.c is now ['e', 'm', 'g']

// Will create intermediate objects and arrays depending on the type of the key. If
// you pass a string, an object is created, if you pass a number an array is
// created.
$op.set(['a', 'd', 'c'], 'm'); // this.a.d.c is 'd'.
                                       // this.a.d is { c: 'm' }.
$op.set(['a', 'e', 1], 'm'); // this.a.e[1] is 'm'.
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

$op.delete(['a', 'b']); // this.a.b is now undefined.
$op.delete(['a', 'c', 1]); // this.a.c is now ['e', undefined, 'g'].
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

$op.empty(['a', 'b']); // this.a.b is now ''.
$op.empty(['a', 'c']); // this.a.c is now [].
$op.empty(['a']); // this.a is now {}.
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
$op.push(['a', 'b'], 'o'); // this.a.b is now ['o']

// You can push multiple elements with a single function call.
$op.push(['a', 'b'], 'p', 'q'); // this.a.b is now ['o', 'p', 'q']
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
$op.pop(['a', 'b']); // Returns 'g' and this.a.b is now ['e', 'f'].
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
$op.shift(['a', 'b']); // Returns 'e' and this.a.b is now ['f', 'g']
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
$op.splice(['a', 'b'], 0, 1); // Returns ['e'] and this.a.b is now ['f', 'g']

// Removes 1 element and inserts 2 elements.
$op.splice(['a', 'b'], 0, 1, 'h', 'i'); // Returns ['f'] and this.a.b is now ['h', 'i', 'g']

// Removes all elements starting from the given index.
$op.splice(['a', 'b'], 1); // Returns ['i', 'g'] and this.a.b is now ['h']
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
        e: 'value'
      }
    };
  }
}

// Retrieves first non-undefined and non-null value.
$op.coalesce(['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e']); // returns 'value'.
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
$op.set(['newProperty'], 1);

// Allowed.
$op.set(['existingProperty', 'value'], 2);
$op.set(['existingProperty', 'intermediateObject', 'value'], 3);
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
