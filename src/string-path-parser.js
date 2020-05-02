const { VueDataObjectPathError } = require('./vue-data-object-path-error');

class VueDataObjectPathSyntaxError extends VueDataObjectPathError {
  constructor(message) {
    super(message);
    this.name = 'VueDataObjectPathSyntaxError';

    // The setLocation method defines these values.
    this.from = null;
    this.to = null;
  }
}

/**
 * Represents parsing state.
 */
class State {
  constructor(payload) {
    /**
     * The entire payload that needs to be parsed.
     * @param {string}
     */
    this.s = payload;

    /**
     * Current position. An index into s.
     * @param {number}
     */
    this.pos = 0;
  }

  /**
   * Returns a character relative to the current position.
   * @param {number=} n - Offset. Defaults to 0.
   */
  at(n = 0) {
    return this.s[this.pos + n];
  }

  /**
   * Moves n many characters. Only lets you move one past the end.
   * @param {number=} n - How many positions to move. You can pass negative
   * values to backtrack. Defaults to 1.
   */
  move(n = 1) {
    this.pos = Math.min(this.pos + n, this.s.length);
  }

  /**
   * How many characters are left.
   * @returns {number}
   */
  left() {
    return Math.max(this.s.length - this.pos, 0);
  }

  /**
   * Whether we've reached the end.
   * @returns {boolean}
   */
  end() {
    return this.pos === this.s.length;
  }

  /**
   * Creates snapshot of current state.
   * @returns {StateSnapshot}
   */
  save() {
    return new StateSnapshot(this);
  }

  /**
   * Loads state from snapshot.
   * @param {StateSnapshot} snapshot
   */
  load(snapshot) {
    this.pos = snapshot.pos
  }
}

/**
 * A save point.
 */
class StateSnapshot {
  constructor(state) {
    this.pos = state.pos;
  }
}

/**
 * Verifies if a character is a decimal digit.
 * @param {string} char
 * @returns {boolean}
 */
function isDecimalDigit(char) {
  // UTF knowledge.
  const zeroCode = 48;
  const nineCode = 57;

  let charCode = char.charCodeAt(0);

  return charCode >= zeroCode && charCode <= nineCode;
}

/**
 * Verifies if a character is part of the English language alphabet.
 * @param {string} char
 * @returns {boolean}
 */
function isEnglishLetter(char) {
  // UTF knowledge.
  // a to z
  const smallCodeStart = 97;
  const smallCodeEnd = 122;
  // A to Z
  const bigCodeStart = 65;
  const bigCodeEnd = 90;

  let charCode = char.charCodeAt(0);

  return (charCode >= smallCodeStart && charCode <= smallCodeEnd)
    || (charCode >= bigCodeStart && charCode <= bigCodeEnd);
}

/**
 * Parses a 4 hexadecimal digit unicode sequence.
 * @param {State} state
 * @returns {string}
 */
function unicodeEscape(state) {
  if (state.left() < 4) {
    // JavaScript throws this error too.
    throw new VueDataObjectPathSyntaxError('Invalid Unicode escape sequence');
  }

  let uffff = 0;

  for (let i = 0; i < 4; i += 1) {
    let hex = parseInt(state.at(), 16);

    if (!Number.isFinite(hex)) {
      // JavaScript throws this error too.
      throw new VueDataObjectPathSyntaxError('Invalid Unicode escape sequence');
    }

    uffff = uffff * 16 + hex;

    state.move();
  }

  return String.fromCharCode(uffff);
}

/**
 * Builds a string literal grammar.
 * @param {string} delimiter - The character that encloses the text.
 * @param {string} escape - The character that starts an escape sequence.
 * @param {object} esc - Mapping of escape sequences.
 */
function makeStringGrammar(delimiter, escape, esc) {
  return function (state) {
    let value = '';

    if (state.at() === delimiter) {
      state.move()

      while (!state.end()) {
        if (state.at() === delimiter) {
          // Reached the end.
          state.move();
          return value;
        }

        if (state.at() === escape) {
          // Hit an escape sequence.
          state.move();

          // Lookup resolver for this escape sequence.
          let resolver = esc[state.at()];

          if (typeof resolver === 'string') {
            // A simple string replacement.
            value += resolver;
            state.move()
          } else if (typeof resolver === 'function') {
            // A more complex situation.
            state.move()
            value += resolver(state);
          } else {
            // Bad escape sequence.
            // JavaScript seems to just place the character in the string.
            value += state.at();

            // Move on to the next one.
            state.move()
          }
        } else {
          // Straight copy.
          value += state.at();

          // Move on to the next one.
          state.move()
        }
      }
    }

    // JavaScript throws this error too.
    throw new VueDataObjectPathSyntaxError('Invalid or unexpected token.');
  }
}

/**
 * Sets parse error location.
 * @param {Error} error
 * @param {number} from
 * @param {number} to
 */
function setLocation(error, from, to) {
  if (!(error instanceof VueDataObjectPathSyntaxError)) {
    return;
  }

  if (error.from !== null) {
    return;
  }

  error.from = from;
  error.to = to;

  let lineInfo = `near column ${from}`;

  if (to !== from) {
    lineInfo += ` up to ${to}`;
  }

  error.message = `${error.message} (${lineInfo})`;
}

const parser = {
  /**
   * Tries to parse a list of grammars. When one fails, tries next. Returns
   * undefined if none work.
   * @param {State} state
   * @param {...string} names
   */
  try(state, ...names) {
    for (let name of names) {
      let snapshot = state.save();
      try {
        return grammar[name].call(this, state);
      } catch (e) {
        // Errors are ignored.
        state.load(snapshot);
      }
    }
  },

  /**
   * Tries to parse a list of grammars. When one fails, tries next. Throws error
   * when last one fails.
   * @throws {VueDataObjectPathSyntaxError}
   * @param {State} state
   * @param {...string} names
   */
  require(state, ...names) {
    let lastError = null;

    for (let name of names) {
      let snapshot = state.save();
      try {
        return grammar[name].call(this, state);
      } catch (e) {
        setLocation(e, snapshot.pos, state.pos);
        lastError = e;
        state.load(snapshot);
      }
    }

    if (lastError !== null) {
      throw lastError;
    }
  }
};

const grammar = {
  path(state) {
    let path = [];

    path.push(this.require(state, 'rootProperty'));

    while (!state.end()) {
      path.push(this.require(state, 'accessProperty'));
    }

    return path;
  },

  rootProperty(state) {
    return this.require(state, 'word');
  },

  accessProperty(state) {
    if (state.at() === '.') {
      // Guaranteed to be dot notation. This prevents
      // accessPropertyBracketNotation error message from taking precedence.
      return this.require(state, 'accessPropertyDotNotation');
    } else {
      return this.require(state, 'accessPropertyBracketNotation');
    }
  },

  accessPropertyDotNotation(state) {
    if (state.at() === '.') {
      state.move();

      if (state.end()) {
        throw new VueDataObjectPathSyntaxError('Unexpected end of input.');
      }

      return this.require(state, 'word')
    } else {
      throw new VueDataObjectPathSyntaxError('Unexpected character.');
    }
  },

  accessPropertyBracketNotation(state) {
    if (state.at() === '[') {
      if (state.end()) {
        throw new VueDataObjectPathSyntaxError('Unexpected end of input.');
      }

      state.move();
      let result = this.try(state, 'number', 'stringSingle', 'stringDouble');

      if (state.end()) {
        throw new VueDataObjectPathSyntaxError('Unexpected end of input.');
      }

      if (state.at() === ']') {
        state.move();
        return result;
      } else {
        throw new VueDataObjectPathSyntaxError('Unexpected character.');
      }
    } else {
      throw new VueDataObjectPathSyntaxError('Unexpected character.');
    }
  },

  word(state) {
    let result = '';

    let first = state.at();

    // First character is a special case.
    if (isEnglishLetter(first) || first === '_' || first === '$') {
      result += first;
      state.move();
    } else {
      throw new VueDataObjectPathSyntaxError('Unexpected character.');
    }

    while (!state.end()) {
      let char = state.at();

      if (isEnglishLetter(char) || isDecimalDigit(char) || char === '_' || char === '$') {
        result += char;
        state.move();
      } else {
        break;
      }
    }

    return result;
  },

  number(state) {
    let result = '';

    let first = state.at();

    if (isDecimalDigit(first)) {
      result += first;
      state.move();
    } else {
      throw new VueDataObjectPathSyntaxError('Unexpected character.');
    }
  
    while (!state.end()) {
      let char = state.at();

      if (isDecimalDigit(char)) {
        result += char;
        state.move();
      } else {
        break;
      }
    }
  
    return parseInt(result);
  },

  stringSingle: makeStringGrammar('\'', '\\', {
    '\'': '\'',
    '\\': '\\',
    '/': '/',
    u: unicodeEscape,
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
  }),
  
  stringDouble: makeStringGrammar('"', '\\', {
    '"': '"',
    '\\': '\\',
    '/': '/',
    u: unicodeEscape,
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
  }),
};

exports.parseStringPath = function (path) {
  return parser.require(new State(path), 'path');
};

exports.VueDataObjectPathSyntaxError = VueDataObjectPathSyntaxError;
