const assert = require('assert');
const { parseStringPath } = require('../src/string-path-parser');

describe('StringPathParser', () => {
  it('parses root access', () => {
    assert.deepStrictEqual(parseStringPath('root'), ['root']);
  });

  it('parses first level dot notation', () => {
    assert.deepStrictEqual(parseStringPath('root.first'), ['root', 'first']);
  });

  it('parses first level bracket notation', () => {
    assert.deepStrictEqual(parseStringPath('root[1]'), ['root', 1]);
  });

  it('parses second level dot notation', () => {
    assert.deepStrictEqual(parseStringPath('root.first.second'), ['root', 'first', 'second']);
    assert.deepStrictEqual(parseStringPath('root[1].second'), ['root', 1, 'second']);
  });

  it('parses second level bracket notation', () => {
    assert.deepStrictEqual(parseStringPath('root.first[0]'), ['root', 'first', 0]);
    assert.deepStrictEqual(parseStringPath('root[1][2]'), ['root', 1, 2]);
  });

  it('parses property name in double quotes inside bracket notation', () => {
    assert.deepStrictEqual(parseStringPath('root["first"]'), ['root', 'first']);
  });

  it('parses property name with spaces in double quotes inside bracket notation', () => {
    assert.deepStrictEqual(parseStringPath('root["one two"]'), ['root', 'one two']);
  });

  it('parses property name with escape sequences in single quotes inside bracket notation', () => {
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\u1234two']`), ['root', "one\u1234two"]);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\btwo']`), ['root', "one\btwo"]);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\ftwo']`), ['root', "one\ftwo"]);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\ntwo']`), ['root', "one\ntwo"]);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\rtwo']`), ['root', "one\rtwo"]);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\ttwo']`), ['root', "one\ttwo"]);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\/two']`), ['root', "one\/two"]);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\\two']`), ['root', "one\\two"]);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\"two']`), ['root', "one\"two"]);
  });

  it('parses property name in single quotes inside bracket notation', () => {
    assert.deepStrictEqual(parseStringPath('root[\'first\']'), ['root', 'first']);
  });

  it('parses property name with spaces in single quotes inside bracket notation', () => {
    assert.deepStrictEqual(parseStringPath('root[\'one two\']'), ['root', 'one two']);
  });

  it('parses property name with escape sequences in single quotes inside bracket notation', () => {
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\u1234two']`), ['root', 'one\u1234two']);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\btwo']`), ['root', 'one\btwo']);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\ftwo']`), ['root', 'one\ftwo']);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\ntwo']`), ['root', 'one\ntwo']);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\rtwo']`), ['root', 'one\rtwo']);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\ttwo']`), ['root', 'one\ttwo']);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\/two']`), ['root', 'one\/two']);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\\two']`), ['root', 'one\\two']);
    assert.deepStrictEqual(parseStringPath(String.raw`root['one\'two']`), ['root', 'one\'two']);
  });

  it('fails if root access starts with a digit', () => {
    assert.throws(
      () => parseStringPath('0root'),
      {
        message: 'Unexpected character. (near column 0)'
      });
  });

  it('fails if root access is bracket notation', () => {
    assert.throws(
      () => parseStringPath('[0]'),
      {
        message: 'Unexpected character. (near column 0)'
      });
  });

  it('fails if bracket notation contains a word', () => {
    assert.throws(
      () => parseStringPath('root[figaro]'),
      {
        message: 'Unexpected character. (near column 4 up to 5)'
      });
  });

  it('fails if bracket notation is not closed', () => {
    assert.throws(
      () => parseStringPath('root[0'),
      {
        message: 'Unexpected end of input. (near column 4 up to 6)'
      });
  });

  it('fails if bracket notation is left open', () => {
    assert.throws(
      () => parseStringPath('root['),
      {
        message: 'Unexpected end of input. (near column 4 up to 5)'
      });
  });

  it('fails if dot notation has no word', () => {
    assert.throws(
      () => parseStringPath('root.'),
      {
        message: 'Unexpected end of input. (near column 4 up to 5)'
      });
  });

  it('fails if dot notation starts with number', () => {
    assert.throws(
      () => parseStringPath('root.0'),
      {
        message: 'Unexpected character. (near column 5)'
      });
  });
});