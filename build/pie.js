(function(window) {
// # Pie
// The top level namespace of the framework.
var pie = window.pie = {

  apps: {},

  /* native extensions */
  array: {},
  browser: {},
  date: {},
  dom: {},
  fn: {},
  math: {},
  object: {},
  string: {},

  /* extensions to be used within pie apps. */
  mixins: {},

  pieId: 1,


  // ** pie.guid **
  //
  // Generate a globally unique id.
  guid: function() {
    var r, v;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      r = Math.random()*16|0,
      v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  },

  // ** pie.ns **
  //
  // If it's not already present, build a path on `base`.
  // By default, `base` is the global `window`.
  // The deepest namespace object is returned so you can immediately use it.
  // ```
  // pie.ns('lib.foo.bar').baz = function(){};
  // //=> generates { lib: { foo: { bar: { baz: function(){} } } } }
  // ```
  ns: function(path, base) {
    base = base || window;
    return pie.object.getPath(base, path) || pie.object.setPath(base, path, {});
  },

  // ** pie.qs **
  //
  // Alias for `document.querySelector`
  qs: function() {
    return document.querySelector.apply(document, arguments);
  },

  // ** pie.qsa **
  //
  // Alias for `document.querySelectorAll`
  qsa: function() {
    return document.querySelectorAll.apply(document, arguments);
  },

  // ** pie.setUid **
  //
  // Set the `pieId` of `obj` if it isn't already present.
  setUid: function(obj) {
    return obj.pieId = obj.pieId || pie.unique();
  },

  // ** pie.unique **
  //
  // Provide a unique integer not yet used by pie.
  // This is good for unique local ids.
  unique: function() {
    return String(pie.pieId++);
  },

  // ** pie.util **
  //
  // Provide a util object for your app which utilizes pie's features.
  // ```
  // window._ = pie.util();
  // _.a.detect(/* .. */);
  // _.o.merge(a, b);
  // _.unique(); //=> '95'
  // ```
  util: function() {
    var o = {};

    o.a   = pie.array;
    o.b   = pie.browser;
    o.d   = pie.date;
    o.$   = pie.dom;
    o.fn  = pie.fn;
    o.m   = pie.math;
    o.o   = pie.object;
    o.s   = pie.string;
    o.x   = pie.mixins;

    o.guid    = pie.guid;
    o.ns      = pie.ns;
    o.qs      = pie.qs;
    o.qsa     = pie.qsa;
    o.setUid  = pie.setUid;
    o.unique  = pie.unique;

    return o;
  },

  _debugArgs: function(msg) {
    return ["%c[pie] %c" + msg, "color: orange; font-weight: bold;", "color: inherit; font-weight: inherit;"];
  }

};
// # Pie Array Utilities
// A series of helpful methods for working with arrays.

// ** pie.array.areAll **
//
// Provides a way to test if all items of `a` match the function `f`.
// Since this uses `pie.object.getValue` you can pass an attribute name for `f` as well.
// ```
// pie.array.areAll([0,1,2,3,4], function(x){ return x % 2 === 0; });
// //=> false
//
// pie.array.areAll([o1,o2], 'computed')
// //=> !!(o1.computed && o2.computed)
// ```
pie.array.areAll = function(a, f) {
  a = pie.array.from(a);
  var i = 0;
  for(;i < a.length; i++) {
    if(!pie.object.getValue(a[i], f)) return false;
  }
  return true;
};

// ** pie.array.areAny **
//
// Tests whether any items of `a` match the function `f`.
// Since this uses `pie.object.getValue` you can pass an attribute name for `f` as well.
// ```
// pie.array.areAny([0,1,2,3,4], function(x){ return x % 2 === 0; });
// //=> true
//
// pie.array.areAny([o1,o2], 'computed')
// // => !!(o1.computed || o2.computed)
// ```
pie.array.areAny = function(a, f) {
  a = pie.array.from(a);
  var i = 0;
  for(;i < a.length; i++) {
    if(pie.object.getValue(a[i], f)) return true;
  }
  return false;
};

// ** pie.array.avg **
//
// Find the average of a series of numbers.
// ```
// pie.array.avg([1,2,3,4,5,8])
// //=> 3.8333
// ```
pie.array.avg = function(a) {
  a = pie.array.from(a);
  var s = pie.array.sum(a), l = a.length;
  return l ? (s / l) : 0;
};

// ** pie.array.change **
//
// Change an array by many `pie.array` utilities.
// ```
// pie.array.change(arguments, 'from', 'flatten', 'compact', 'unique');
// // is equivalent to:
// arr = pie.array.from(arguments);
// arr = pie.array.flatten(arr);
// arr = pie.array.compact(arr);
// arr = pie.array.unique(arr);
// ```
pie.array.change = function() {
  var args = pie.array.from(arguments),
  arr = args.shift();
  args.forEach(function(m) {
    arr = pie.array[m](arr);
  });

  return arr;
};

// ** pie.array.compact **
//
// Remove all null or undefined items.
// Optionally remove all falsy values by providing true for `removeAllFalsy`.
// ```
// pie.array.compact([true, false, null, undefined, 1, 0])
// //=> [true, false, 1, 0]
//
// pie.array.compact([true, false, null, undefined, 1, 0], true)
// //=> [true, 1]
// ```
pie.array.compact = function(a, removeAllFalsy){
  a = pie.array.from(a);
  return a.filter(function(i){
    /* jslint eqeq:true */
    return removeAllFalsy ? !!i : (i != null);
  });
};

// ** pie.array.count **
//
// Count the number of items that match a given criteria defined by `f`.
// ```
// pie.array.count([0, 1, 2, 3], function(i){ return i % 2 === 0; });
// //=> 2
//
// pie.array.count(['foo', 'bar', 'q', 'ux'], function(i){ return i.length === 3; })
// //=> 2
// ```
pie.array.count = function(a, f) {
  var cnt = 0;
  pie.array.from(a).forEach(function(i){
    if(pie.object.getValue(i, f)) cnt++;
  });
  return cnt;
};

// ** pie.array.detect **
//
// Return the first item where the provided function evaluates to a truthy value.
// If a function is not provided, the second argument will be assumed to be an attribute check.
// ```
// pie.array.detect([1,3,4,5], function(e){ return e % 2 === 0; })
// //=> 4
//
// pie.array.detect([{foo: 'bar'}, {baz: 'foo'}], 'baz')
// //=> {baz: 'foo'}
// ```
pie.array.detect = function(a, f) {
  a = pie.array.from(a);
  var i = 0, l = a.length;
  for(;i<l;i++) {
    if(pie.object.getValue(a[i], f)) {
      return a[i];
    }
  }
};

// ** pie.array.detectLast **
//
// Return the last item where the provided function evaluates to a truthy value.
// If a function is not provided, the second argument will be assumed to be an attribute check.
// ```
// pie.array.detectLast([1,2,4,5], function(e){ return e % 2 === 0; })
// //=> 4
//
//
// pie.array.detectLast([{foo: 'bar'}, {baz: 'foo'}], 'baz')
// //=> {baz: 'foo'}
// ```
pie.array.detectLast = function(a, f) {
  a = pie.array.from(a);
  var i = a.length-1, l = 0;
  for(;i>=l;i--) {
    if(pie.object.getValue(a[i], f)) {
      return a[i];
    }
  }
};

// ** pie.array.dup **
//
// Return a new array containing the same values of the provided array `a`.
pie.array.dup = function(a) {
  return pie.array.from(a).slice(0);
};

// ** pie.array.filter **
//
// Return the elements of the array that match `fn`.
// The `fn` can be a function or attribut of the elements.
// ```
// var arr = ['', ' ', 'foo'];
// pie.array.filter(arr, 'length');
// //=> [' ', 'foo']
// ```
pie.array.filter = function(arr, fn) {
  return pie.array.from(arr).filter(function(i){
    return pie.object.getValue(i, fn);
  });
};


// ** pie.array.flatten **
//
// Flattens an array of arrays or elements into a single depth array
// ```
// pie.array.flatten(['a', ['b', 'c']])
// //=> ['a', 'b', 'c']
// ```
// You may also restrict the depth of the flattening:
// ```
// pie.array.flatten([['a'], ['b', ['c']]], 1)
// //=> ['a', 'b', ['c']]
// ```
pie.array.flatten = function(a, depth, into) {
  into = into || [];

  if(Array.isArray(a) && depth !== -1) {

    if(depth != null) depth--;

    a.forEach(function(e){
      pie.array.flatten(e, depth, into);
    });

  } else {
    into.push(a);
  }

  return into;
};

// ** pie.array.from **
//
// Return an array from a value. if the value is an array it will be returned.
// If the value is a NodeList or an HTMLCollection, you will get back an array.
// If the value is undefined or null, you'll get back an empty array.
// ```
// pie.array.from(null)
// //=> []
//
// pie.array.from(['foo'])
// //=> ['foo']
//
// pie.array.from('value')
// //=> ['value']
//
// pie.array.from(document.querySelectorAll('body'))
// //=> [<body>]
// ```
pie.array.from = function(value) {
  if(Array.isArray(value)) return value;
  if(pie.object.isArguments(value) || value instanceof NodeList || value instanceof HTMLCollection) return Array.prototype.slice.call(value, 0);
  return pie.array.compact([value], false);
};

// ** pie.array.get **
//
// Retrieve a value or a range of values from an array.
// Negative values are allowed and are considered to be relative to the end of the array.
// ```
// arr = ['a', 'b', 'c', 'd', 'e']
// pie.array.get(arr, 1)
// //=> 'b'
//
// pie.array.get(arr, -2)
// //=> 'd'
//
// pie.array.get(arr, -1)
// //=> 'e'
//
// pie.array.get(arr, 1, -2)
// //=> ['b', 'c', 'd']
// ```
pie.array.get = function(arr, startIdx, endIdx) {
  arr = pie.array.from(arr);
  if(startIdx < 0) startIdx += arr.length;

  if(endIdx !== undefined) {
    if(endIdx < 0) endIdx += arr.length;
    return arr.slice(startIdx, endIdx + 1);
  }

  return arr[startIdx];
};

// ** pie.array.grep **
//
// Return string based matches of `regex` from the provided array `arr`.
// ```
// arr = ['foo', 'too', 'bar', 'baz', 'too']
// pie.array.grep(arr, /oo/)
// //=> ['foo', 'too', 'too']
// ```
pie.array.grep = function(arr, regex) {
  return pie.array.from(arr).filter(function(a){ return regex.test(String(a)); });
};


// ** pie.array.groupBy **
//
// Construct an object of arrays representing the items grouped by `groupingF`.
// The grouping function can be a function or an attribute of the objects.
// ```
// arr = [0,1,2,3,4,5]
// fn = function(x){ return x % 2 === 0; }
// pie.array.groupBy(arr, fn)
// //=> { true : [0, 2, 4], false : [1, 3, 5] }
// ```
pie.array.groupBy = function(arr, groupingF) {
  var h = {}, g;
  pie.array.from(arr).forEach(function(a){

    g = pie.object.getValue(a, groupingF);

    /* jslint eqeq:true */
    if(g != null) {
      h[g] = h[g] || [];
      h[g].push(a);
    }
  });

  return h;
};

// ** pie.array.hasAny **
//
// Determine if the given array `a` has any of the provided values.
// ```
// arr = ["foo", "bar", "baz"]
// pie.array.hasAny(arr, "foo")
// //=> true
// pie.array.hasAny(arr, ["food", "bar"])
// //=> true
// pie.array.hasAny(arr, "qux")
// //=> false
pie.array.hasAny = function(/* a, *values */) {
  var a = pie.array.from(arguments[0]),
  values = pie.array.get(arguments, 1, -1), i;
  values = pie.array.flatten(values);
  for(i=0;i<values.length;i++) {
    if(~a.indexOf(values[i])) return true;
  }
  return false;
};

// ** pie.array.indexOf **
//
// Find the first index of the item that matches `f`.
// The function `f` can be a function or an attribute.
// ```
// arr = [{foo: true}, {bar: true}, {bar: true, foo: true}]
// pie.array.indexOf(arr, 'foo')
// //=> 0
pie.array.indexOf = function(a, f) {
  a = pie.array.from(a);
  var i = 0, l = a.length;
  for(;i<l;i++) {
    if(pie.object.getValue(a[i], f)) {
      return i;
    }
  }

  return -1;
};

// ** pie.array.intersect **
//
// Retrieve the intersection of two arrays `a` and `b`.
// ```
// a = [0, 1, 2, 3, 4]
// b = [0, 2, 4, 6, 8]
// pie.array.intersect(a, b)
// //=> [0, 2, 4]
// ```
pie.array.intersect = function(a, b) {
  return pie.array.from(a).filter(function(i) { return ~b.indexOf(i); });
};


// ** pie.array.last **
//
// Retrieve the last item of the array.
pie.array.last = function(arr) {
  arr = arr && pie.array.from(arr);
  if(arr && arr.length) return arr[arr.length - 1];
};


// ** pie.array.map **
//
// Return an array filled with the return values of `f`.
// If f is not a function, it will be assumed to be a key of the item.
// If the resulting value is a function, it can be invoked by passing true as the third argument.
// ```
// pie.array.map(["a", "b", "c"], function(e){ return e.toUpperCase(); })
// //=> ["A", "B", "C"]
//
// pie.array.map(["a", "b", "c"], 'length')
// //=> [1, 1, 1]
//
// pie.array.map([0,1,2], 'toFixed')
// //=> [toFixed(){}, toFixed(){}, toFixed(){}]
//
// pie.array.map([0,1,2], 'toFixed', true)
// //=> ["0", "1", "2"]
// ```
pie.array.map = function(a, f, callInternalFunction){
  var callingF;

  if(!pie.object.isFunction(f)) {
    callingF = function(e){
      var ef = e[f];

      if(callInternalFunction && pie.object.isFunction(ef))
        return ef.apply(e);
      else
        return ef;
    };
  } else {
    callingF = f;
  }

  return pie.array.from(a).map(function(e){ return callingF(e); });
};

// **pie.array.partition**
//
// Partition an array based on a set of functions. You will end up with an array of arrays the length of which
// will be fns.length + 1.
// ```
// var arr = [0, 1, 2, 3, 4];
// var results = pie.array.partition(arr, isOdd);
// var odds = results[0];
// //=> [1, 3]
// var evens = results[1];
// //=> [0, 2, 4]
// ```
// ```
// var arr = ["a", 4, true, false, 5, "b"];
// var results = pie.array.partition(arr, pie.object.isString, pie.object.isNumber);
// var strings = results[0];
// //=> ["a", "b"]
// var numbers = results[1];
// //=> [4, 5]
// var others = results[2];
// //=> [true, false]
// ```
pie.array.partition = function(/* a, fn1, fn2 */) {
  var out = [],
  fns = pie.array.from(arguments),
  arr = pie.array.from(fns.shift());

  fns.forEach(function(fn, j){
    out[j] = [];
    out[j+1] = out[j+1] || [];
    arr.forEach(function(e){
      if(!!pie.object.getValue(e, fn)) out[j].push(e);
      else out[j+1].push(e);
    });

    arr = pie.array.dup(out[j+1]);
  });

  return out;
};

// **pie.array.partitionAt**
//
// Split an array up at the first occurrence where fn evaluates to true.
// ```
// arr = [a(), b(), "string", "string", c()]
// pie.array.partitionAt(arr, pie.object.isNotFunction)
// //=> [ [a(), b()], ["string", "string", c()] ]
// ```
pie.array.partitionAt = function(arr, fn) {
  var a = [], b = [], stillA = true;

  pie.array.from(arr).forEach(function(i){
    if(stillA && !!pie.object.getValue(i, fn)) stillA = false;
    (stillA ? a : b).push(i);
  });

  return [a, b];
};


// ** pie.array.remove **
//
// Remove all occurences of object `o` from array `a`.
// ```
// a = [0, 1, 3, 5, 0, 2, 4, 0]
// pie.array.remove(a, 0)
// //=> [1, 3, 5, 2, 4]
pie.array.remove = function(a, o) {
  a = pie.array.from(a);
  var idx;
  while(~(idx = a.indexOf(o))) {
    a.splice(idx, 1);
  }
  return a;
};


// ** pie.array.subtract **
//
// Return an array that consists of any `a` elements that `b` does not contain.
// ```
// a = [0, 1, 2, 3, 4]
// b = [0, 2, 4, 6, 8]
// pie.array.subtract(a, b)
// //=> [1, 3]
pie.array.subtract = function(a, b) {
  return pie.array.from(a).filter(function(i) { return !~b.indexOf(i); });
};

// ** pie.array.sum **
//
// Sum the values of `a` and return a float.
// ```
// arr = [1, 2, 5]
// pie.array.sum(arr)
// //=> 8.0
// ```
pie.array.sum = function(a) {
  return pie.array.from(a).reduce(function(a,b){ return a + parseFloat(b); }, 0);
};

// ** pie.array.sortBy **
//
// Sort the array based on the value dictated by the function `sortF`.
// The function can also be an attribute of the array's items.
// ```
// arr = [{name: 'Doug'}, {name: 'Alex'}, {name: 'Bill'}]
// pie.array.sortBy(arr, 'name')
// //=> [{name: 'Alex'}, {name: 'Bill'}, {name: 'Doug'}]
// ```
pie.array.sortBy = function(arr, sortF){
  var aVal, bVal;
  return pie.array.from(arr).sort(function(a, b) {
    aVal = pie.object.getValue(a, sortF);
    bVal = pie.object.getValue(b, sortF);
    if(aVal === bVal) return 0;
    if(aVal < bVal) return -1;
    return 1;
  });
};


// ** pie.array.toSentence **
//
// Convert a series of words into a human readable sentence.
// Available options:
//   * **i18n** - the i18n instance to be used for lookups. Defaults to `pie.appInstance.i18n`.
//   * **delimeter** - the delimeter to be placed between the 0 - N-1 items. Defaults to `', '`.
//   * **conjunction** - the conjunction to be placed between the last two items. Defaults to `' and '`.
//   * **punctuate** - the punctuation to be added to the end. If `true` is provided, a `'.'` will be used. Defaults to none.
//
// ```
// words = ['foo', 'bar', 'baz']
// pie.array.toSentence(words)
// "foo, bar and baz"
// ```
pie.array.toSentence = function(arr, options) {
  arr = pie.array.from(arr);
  if(!arr.length) return '';

  options = pie.object.merge({
    i18n: pie.object.getPath(pie, 'appInstance.i18n')
  }, options);

  options.delimeter = options.delimeter || options.i18n && options.i18n.t('app.sentence.delimeter', {default: ', '});
  options.conjunction = options.conjunction || options.i18n && options.i18n.t('app.sentence.conjunction', {default: ' and '});
  options.punctuate = options.punctuate === true ? '.' : options.punctuate;

  if(arr.length > 2) arr = [arr.slice(0,arr.length-1).join(options.delimeter), arr.slice(arr.length-1)];

  var sentence = arr.join(options.conjunction);
  if(options.punctuate && !pie.string.endsWith(sentence, options.punctuate)) sentence += options.punctuate;

  return sentence;
};


// ** pie.array.union **
//
// Return the union of N provided arrays.
// a = [1, 2]
// b = [2, 3, 4]
// c = [3, 4, 5]
// pie.array.union(a, b, c)
// //=> [1, 2, 3, 4, 5]
pie.array.union = function() {
  var arrs = pie.array.from(arguments);
  arrs = pie.array.compact(arrs, true);
  arrs = pie.array.flatten(arrs);
  arrs = pie.array.unique(arrs);
  return arrs;
};


// ** pie.array.unique **
//
// Remove any duplicate values from the provided array `arr`.
// ```
// arr = [0, 1, 3, 2, 1, 0, 4]
// pie.array.unique(arr)
// [0, 1, 3, 2, 4]
// ```
pie.array.unique = function(arr) {
  return pie.array.from(arr).filter(function(e, i){ return arr.indexOf(e) === i; });
};
/* From old jQuery */
pie.browser.agent = function() {
  if(pie.browser.__agent) return pie.browser.__agent;

  var ua = navigator.userAgent.toLowerCase(),
  match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
    /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
    /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
    /(msie) ([\w.]+)/.exec( ua ) ||
    ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
    [];

  var b = {
    browser: match[ 1 ] || "",
    version: match[ 2 ] || "0"
  };

  if(b.browser) {
    b[b.browser] = true;
  }

  // Chrome is Webkit, but Webkit is also Safari.
  if ( b.chrome ) {
    b.webkit = true;
  } else if ( b.webkit ) {
    b.safari = true;
  }

  return pie.browser.__agent = b;
};

pie.browser.getCookie = function(key, options) {
  var decode = options && options.raw ? function(s) { return s; } : decodeURIComponent,
  pairs = document.cookie.split('; '),
  pair;

  for(var i = 0; i < pairs.length; i++) {
    pair = pairs[i];
    if(!pair) continue;

    pair = pair.split('=');
    if(decode(pair[0]) === key) return decode(pair[1] || '');
  }

  return null;
};


pie.browser.isRetina = function() {
  return window.devicePixelRatio > 1;
};


pie.browser.isTouchDevice = function() {
  return pie.object.has(window, 'ontouchstart') ||
    (window.DocumentTouch && document instanceof window.DocumentTouch) ||
    navigator.MaxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;
};

pie.browser.testMediaQuery = function(query) {
  query = pie.browser.mediaQueries[query] || query;
  var matchMedia = window.matchMedia || window.msMatchMedia;
  if(matchMedia) return matchMedia(query).matches;
  return undefined;
};

pie.browser.orientation = function() {
  switch (window.orientation) {
  case 90:
  case -90:
    return 'landscape';
  default:
    return 'portrait';
  }
};

pie.browser.setCookie = function(key, value, options) {
  options = pie.object.merge({}, options);

  /* jslint eqnull:true */
  if(value == null) options.expires = -1;

  if (pie.object.isNumber(options.expires)) {
    var days = options.expires;
    options.expires = new Date();
    options.expires.setDate(options.expires.getDate() + days);
  }

  value = String(value);

  var cookieValue = [
    encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
    options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
    options.path    ? '; path=' + options.path : '',
    options.domain  ? '; domain=' + options.domain : '',
    options.secure  ? '; secure' : ''
  ].join('');

  document.cookie = cookieValue;
  return cookieValue;
};
// takes a iso date string and converts to a local time representing 12:00am, on that date.
pie.date.dateFromISO = function(isoDateString) {
  if(!isoDateString) return null;
  var parts = isoDateString.split(/T|\s/)[0].split('-');
  return new Date(parts[0], parts[1] - 1, parts[2]);
};


// current timestamp
pie.date.now = function(secondsPlease) {
  var t = new Date().getTime();
  if(secondsPlease) t = parseInt(t / 1000, 10);
  return t;
};

/**
 * STOLEN FROM HERE:
 * Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
 * © 2011 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */

pie.date.timeFromISO = (function() {

  var numericKeys = [1, 4, 5, 6, 7, 10, 11];

  return function(date) {
    if(!date) return NaN;
    if(!/T|\s/.test(date)) return pie.date.dateFromISO(date);

    var timestamp, struct, minutesOffset = 0;

    // ES5 §15.9.4.2 states that the string should attempt to be parsed as a Date Time String Format string
    // before falling back to any implementation-specific date parsing, so that’s what we do, even if native
    // implementations could be faster
    //              1 YYYY                2 MM       3 DD           4 HH    5 mm       6 ss        7 msec        8 Z 9 ±    10 tzHH    11 tzmm
    if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
      // avoid NaN timestamps caused by “undefined” values being passed to Date.UTC
      for (var i = 0, k; (k = numericKeys[i]); ++i) {
        struct[k] = +struct[k] || 0;
      }

      // allow undefined days and months
      struct[2] = (+struct[2] || 1) - 1;
      struct[3] = +struct[3] || 1;

      if (struct[8] !== 'Z' && struct[9] !== undefined) {
        minutesOffset = struct[10] * 60 + struct[11];

        if (struct[9] === '+') {
          minutesOffset = 0 - minutesOffset;
        }
      }

      timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
    } else {
      timestamp = NaN;
    }

    return new Date(timestamp);
  };

})();
// # Pie DOM Utilities
// A series of helpful methods for working with DOM elements.

pie.dom._all = function(originalArgs, returnValues) {
  var nodes = pie.array.from(originalArgs[0]),
  meths = originalArgs[1].split('.'),
  args = Array.prototype.slice.call(originalArgs, 2),
  meth = meths[meths.length-1],
  assign = /=$/.test(meth),
  r, f, i, v;

  if(assign) meth = meth.substr(0,meth.length-1);
  if(returnValues) r = [];

  nodes.forEach(function(e){
    for(i=0;i < meths.length-1;i++) {
      f = e[meths[i]];
      e = pie.fn.valueFrom(f);
    }
    if(assign) v = e[meth] = args[0];
    else {
      f = e[meth];
      v = pie.fn.valueFrom(f, e, args);
    }

    if(returnValues) r.push(v);
  });

  return returnValues ? r : undefined;
};

// **pie.dom.all**
//
// Invokes the provided method or method chain with the provided arguments to all elements in the nodeList.
// `nodeList` can either be a node, nodeList, or an array of nodes.
// `methodName` can be a string representing a method name, an attribute, or a property. Can be chained with periods. Can end in a `=` to invoke an assignment.
// ```
// pie.dom.all(nodeList, 'setAttribute', 'foo', 'bar');
// pie.dom.all(nodeList, 'classList.add', 'active');
// pie.dom.all(nodeList, 'clicked=', true);
// ```
pie.dom.all = function(/* nodeList, methodName[, arg1, arg2, ...] */) {
  return pie.dom._all(arguments, false);
};

// **pie.dom.closest**
//
// Retrieve the closest ancestor of `el` which matches the provided `sel`.
// ```
// var form = pie.dom.closest(input, 'form');
// form.submit();
// ```
pie.dom.closest = function(el, sel) {
  while((el = el.parentNode) && !pie.dom.isDocument(el)) {
    if(pie.dom.matches(el, sel)) return el;
  }
};

// **pie.dom.createElement**
//
// Create an element based on the string content provided.
// ```
// var el = pie.dom.createElement('<div class="foo"><strong>Hi</strong>, John</div>')
// el.innerHTML
// //=> "<strong>Hi</strong>, John"
// el.classList
// //=> ['foo']
// ```
pie.dom.createElement = function(str) {
  var wrap = document.createElement('div');
  wrap.innerHTML = str;
  return wrap.removeChild(wrap.firstElementChild);
};

// **pie.dom.cache**
//
// A cache created solely for caching element specific information,
// easier for cleanup via `pie.dom.remove()`.
pie.dom.cache = function() {
  pie.elementCache = pie.elementCache || new pie.cache();
  return pie.elementCache;
};

// **pie.dom.getAll**
//
// Has the same method signature of `pie.dom.all` but returns the values of the result
// ```
// pie.dom.getAll(nodeList, 'clicked')
// //=> [true, true, false]
// ```
pie.dom.getAll = function() {
  return pie.dom._all(arguments, true);
};

// **pie.dom.isDocument**
//
// Determine whether the `el` is a document node.
pie.dom.isDocument = function(el) {
  return el && el.nodeType === el.DOCUMENT_NODE;
};

// **pie.dom.isWindow**
//
// Determine whether the provided `el` is the `window`.
pie.dom.isWindow = function(el) {
  return el === window;
};

// **pie.dom.matches**
//
// Test whether an element matches a given selector.
// ```
// pie.dom.matches(form, 'input');
// //=> false
// pie.dom.matches(form, 'form');
// //=> true
// ```
pie.dom.matches = function(el, sel) {
  var fn = pie.dom.prefixed(el, 'matches');
  if(fn) return fn(sel);

  fn = pie.dom.prefixed(el, 'matchesSelector');
  if(fn) return fn(sel);

  var parent = el.parentNode || el.document;
  if(!parent || !parent.querySelector) return false;

  pie.setUid(el);
  el.setAttribute('data-pie-id', el.pieId);

  sel += '[data-pie-id="' + el.pieId + '"]';
  return parent.querySelector(sel) === el;
};

// **pie.dom.off**
//
// Remove an observer from an element. The more information provided the more tests will be run to determine
// whether the observer is a match. Support of namespaces are the same as `pie.dom.on`, however, in the case
// of `off`, `"*"` can be provided to remove all events within a namespace.
// ```
// pie.dom.off(document.body, 'click');
// pie.dom.off(document.body', 'click.fooNs');
// pie.dom.off(document.body', '*.fooNs');
// ```

pie.dom.off = function(el, event, fn, selector, cap) {
  var eventSplit = event.split('.'),
    namespace, all, events, compactNeeded;

  pie.setUid(el);
  event = eventSplit.shift();
  namespace = eventSplit.join('.');
  all = event === '*';

  events = pie.dom.cache().getOrSet('element-' + el.pieId + '.dom-events', {});

  (all ? Object.keys(events) : [event]).forEach(function(k) {
    compactNeeded = false;

    pie.array.from(events[k]).forEach(function(obj, i, ary) {
      if(cap == null && (k === 'focus' || k === 'blur') && obj.sel) cap = true;
      if((namespace == null || namespace === obj.ns) &&
          (fn == null || fn === obj.fn) &&
          (selector == null || selector === obj.sel) &&
          (cap === obj.cap)) {
        el.removeEventListener(k, obj.cb, obj.cap);
        delete ary[i];
        compactNeeded = true;
      }
    });

    if(compactNeeded) events[k] = pie.array.compact(events[k]);

  });
};

// **pie.dom.on**
//
// Observe an event on a particular `el`.
// ```
// var handler = function(e){
//   var btn = e.delegateTarget;
//   btn.classList.toggle('is-loading');
// }
// pie.dom.on(pie.qs('.btn'), 'click', handler);
// // => all events on the first .btn will be observed.
// ```
// Optionally, the event can be filtered by a `selector`.
// If a selector is provided, a `delegateTarget` which represents the
// matching target as defined by `selector` will be placed
// on the event. The event is then provided to `fn`.
//
// ```
// pie.dom.on(document.body, 'click', handler, '.btn');
// //=> all events that bubble to document.body and pass through or
// //=> originate from a .btn, will be observed.
// ```
pie.dom.on = function(el, event, fn, selector, capture) {
  var eventSplit = event.split('.'),
      cb, namespace, events;

  event = eventSplit.shift();
  namespace = eventSplit.join('.');
  pie.setUid(el);

  // we force capture so that delegation works.
  if(!capture && (event === 'focus' || event === 'blur') && selector) capture = true;

  events = pie.dom.cache().getOrSet('element-' + el.pieId  + '.dom-events', {});
  events[event] = events[event] || [];

  cb = function(e) {
    var targ, els, qel;

    if(namespace) {
      e.namespace = namespace;
    }

    if(!selector) {
      fn.call(el, e);
    } else {
      // if the target matches the selector, it is the delegateTarget.
      targ = pie.dom.matches(e.target, selector) ? e.target : null;

      // othwerwise, try to find a parent that is a child of el which matches the selector.
      if(!targ) {
        qel = pie.dom.closest(e.target, selector);
        if(qel && el.contains(qel)) targ = qel;
      }

      if(targ) {
        e.delegateTarget = targ;
        fn.call(targ, e);
      }
    }
  };

  events[event].push({
    ns: namespace,
    sel: selector,
    cb: cb,
    fn: fn,
    cap: capture
  });

  el.addEventListener(event, cb, capture);
  return cb;
};

// **pie.dom.parseForm**
//
// Given a form element `el` parse the names & values from it.
// Optionally, the fields to parse can be filtered by providing a list of names.
//
// Given the markup:
// ```
// <form>
//   <input name="fullName" />
//   <input name="email" />
//   <select name="interest">...</select>
// </form>
// ```
// We can retrieve the fields using `parseForm`.
// ```
// pie.dom.parseForm(form)
// //=> {fullName: 'foo', email: 'foo@bar.com', interest: 'user'}
// pie.dom.parseForm(form, 'fullName')
// //=> {fullName: 'foo'}
// ```
pie.dom.parseForm = function(/* el, *fields */) {
  var args = pie.array.from(arguments),
  form = args.shift(),
  names = pie.array.flatten(args),
  inputs = form.querySelectorAll('input[name], select[name], textarea[name]'),
  o = {},
  origLength;

  inputs = pie.array.groupBy(inputs, 'name');

  pie.object.forEach(inputs, function(name,fields) {
    if(names.length && names.indexOf(name) < 0) return;

    origLength = fields.length;

    if(fields[0].type === 'radio') {
      origLength = 1;
      fields = fields.filter(function(f){ return f.checked; });
    } else {
      fields = fields.filter(function(f){ return f.type === 'checkbox' ? f.checked : true; });
    }


    if(origLength > 1) o[name] = pie.array.map(fields, 'value');
    else o[name] = fields[0] && fields[0].value;
  });

  return o;
};

// **pie.dom.prependChild**
//
// Insert a child at the top of the parent.
// ```
// // el = <div><p>Things</p></div>
// // child = <h3>Title</h3>
// pie.dom.prependChild(el, child)
// // el = <div><h3>Title</h3><p>Things</p></div>
// ```
pie.dom.prependChild = function(el, child) {
  el.insertBefore(child, el.firstChild);
};

// **pie.dom.remove**
//
// Remove `el` from the dom, clearing any cache we've constructed.
// If you intend on adding the element back into the dom you should
// remove `el` manually, not via `pie.dom.remove`.
//
// ```
// pie.dom.remove(el)
// // => el.parentNode == null;
// ```
pie.dom.remove = function(el) {
  pie.setUid(el);
  pie.dom.cache().del('element-' + el.pieId);
  if(el.parentNode) el.parentNode.removeChild(el);
};

// **pie.dom.scrollParents**
//
// Find all the parent elements of `el` that have a scroll property.
// Useful for spying on scroll and determing element position.
// Optionally, you can provide the following options:
//  * direction = 'x' or 'y', defaults to null (both)
//  * includeSelf - if `true` it will evaluate `el`'s scroll property and include it in the parent list.
//  * closest - if `true` it will return the first scroll parent instead of all of them.
//
// ```
// pie.dom.scrollParents(el)
// //=> document.body
// ```
// **Note** window will not be included in the response.
pie.dom.scrollParents = (function(){
  var regex = /scroll|auto/,
  prop = function(el, dir) {
    var style = getComputedStyle(el),
    flow = style.getPropertyValue('overflow');
    if(!dir || dir === 'x') flow += style.getPropertyValue('overflow-x');
    if(!dir || dir === 'y') flow += style.getPropertyValue('overflow-y');
    return flow;
  };

  return function(el, options) {
    var parents = options && options.closest ? undefined : [],
    style;

    if(!options || !options.includeSelf) el = el.parentNode;

    while(el && !pie.dom.isDocument(el)) {
      style = prop(el, options && options.direction);

      if(regex.test(style)) {
        if(options && options.closest) return el;
        parents.unshift(el);
      }

      el = el.parentNode;
    }

    return parents;
  };
})();

// **pie.dom.scrollTo**
//
// Scroll the page to `sel`.
// If `sel` is a string it will find the first occurrence via a querySelector.
// Available options:
//  * container - the container to scroll, defaults to document.body
//  * cb - the callback to invoke when scrolling is finished.
//  * onlyUp - only scrolls if the element is above the current position.
//  * onlyDown - only scrolls if the element is below the current position.
//  * * - any option available in pie.fn.ease
//
// ```
// pie.dom.scrollTo('header', {onlyUp: true, cb: fn, name: 'easeInQuart'});
pie.dom.scrollTo = function(sel, options) {
  var position = 0,
  container = options && options.container || document.body,
  cb = options && options.cb,
  quit = false;

  if(sel) {
    var target = pie.object.isString(sel) ? container.querySelector(sel) : sel;
    while(target && target !== container) {
      position += (target.offsetTop - target.scrollTop);
      target = target.offsetParent;
    }
  }

  if(options) {
    if(options.onlyUp && container.scrollTop <= position) quit = true;
    if(options.onlyDown && container.scrollTop >= position) quit = true;
  }

  if(position === container.scrollTop) quit = true;

  if(quit) {
    if(cb) cb();
    return;
  }

  options = pie.object.merge({
    from: container.scrollTop,
    to: position,
    name: 'easeInOutCubic',
    duration: 250
  }, options);

  delete options.cb;
  delete options.container;
  delete options.onlyUp;
  delete options.onlyDown;

  pie.fn.ease(function(p){
    container.scrollTop = p;
  }, options, cb);

};

// **pie.dom.trigger**
//
// Trigger an event `e` on `el`.
// If the event is a click, it will invoke the click() handler instead of creating
// a dom event. This is for browser compatability reasons (certain versions of FF).
// If you want to force an event, pass true as the third argument.
//
// ```
// pie.dom.trigger(el, 'click');
// pie.dom.trigger(el, 'foo.bar');
// ```
//
pie.dom.trigger = function(el, e, forceEvent) {

  if(!forceEvent && e === 'click') return el.click();

  var event = document.createEvent('Event');
  event.initEvent(e, true, true);
  return el.dispatchEvent(event);
};

// **pie.dom.prefixed**
//
// Find the first available version of the desired function, including browser specific implementations.
// ```
// pie.dom.prefixed(el, 'matches');
// pie.dom.prefixed(el, 'matchesSelector');
// pie.dom.prefixed(getComputedStyle(document.body), 'animation-delay')
// ```
pie.dom.prefixed = (function(){
  var prefixes = ['', 'webkit', 'moz', 'ms', 'o'],
  returnVal = function(val, el){
    return pie.object.isFunction(val) ? val.bind(el) : val;
  };

  return function(el, standardName) {
    var prefix, i = 0,
    capd = pie.string.capitalize(standardName);

    for(; i < prefixes.length; i++) {
      prefix = prefixes[i];

      if(el[prefix + standardName]) return returnVal(el[prefix + standardName], el);
      if(el['-' + prefix + '-' + standardName]) return returnVal(el['-' + prefix + '-' + standardName], el);
      if(el[prefix + capd]) return returnVal(el[prefix + capd], el);
    }
  };
})();
// **pie.fn.async**
//
// Invoke all `fns` and when they have completed their execution, invoke the callback `cb`.
// Each provided function is expected to invoke a callback supplied as it's first argument.
// ```
// var a = function(cb){ console.log('hey'); cb(); };
// var b = function(cb){ app.ajax.get(...).complete(cb); };
// var complete = function(){ console.log('complete!'); };
//
// pie.fn.async([a, b], complete);
// //=> "hey" is logged, ajax is completed, then "complete!" is logged.
// ```

pie.fn.async = function(fns, cb, counterObserver) {

  if(!fns.length) {
    cb();
    return;
  }

  var completeCount = fns.length,
  completed = 0,
  counter = function() {
    if(counterObserver) counterObserver.apply(null, arguments);
    if(++completed === completeCount) {
      if(cb) cb();
    }
  };

  fns.forEach(function(fn) { fn(counter); });
};

// **pie.fn.debounce**
//
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// Lifted from underscore.js
// ```
// pie.fn.debounce(submitForm, 500);
// ```
pie.fn.debounce = function(func, wait, immediate) {
  var timeout, args, context, timestamp, result;

  var later = function() {
    var last = pie.date.now() - timestamp;

    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function() {
    context = this;
    args = arguments;
    timestamp = pie.date.now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};


// **pie.fn.ease**
//
// Invoke a callback `cb` with the coordinates of an easing function.
// The callback will receive the `y` & `t` values where t ranges from 0 to 1 and `y` ranges
// from the `from` and to the `to` options. The easing function can be described by passing
// a name option which coincides with the easing functions defined in `pie.math`.
// ```
// pie.fn.ease(function(y, t){
//   window.scrollTo(0, y);
// }, { from: 0, to: 300, name: 'easeOutCubic' });
// ```
pie.fn.ease = function(each, o, complete) {
  o = pie.object.merge({
    name: 'linear',
    duration: 250,
    from: 0,
    to: 1
  }, o);

  if(o.name === 'none') {
    each(o.to, 1);
    return;
  }

  o.steps = o.steps || Math.max(o.duration / 16, 12);

  /* the easing function */
  var fn = pie.math.easing[o.name],
  // the current "time" 0 to 1.
  t = 0,
  delta = (o.to - o.from),
  dt = (1 / o.steps),
  dy,
  y,
  pid,
  runner = function(){
    dy = fn(t);
    y = o.from + (dy * delta);
    each(y, t);
    if(t >= 1) {
      t = 1;
      clearInterval(pid);
      if(complete) complete();
    } else t += dt;
    // return ourself so we can invoke as part of setInterval
    return runner;
  };

  pid = setInterval(runner(), o.duration / o.steps);
  return pid;
};

// **pie.fn.once**
//
// Only ever invoke the function `f` once. The return value will always be the same.
// ```
// var count = 0;

// var f = pie.fn.once(function(){
//   count++;
//   return count;
// });
//
// f();
// //=> 1
// f();
// //=> 1
// ```
pie.fn.once = function(f) {
  var called = false,
  result;

  return function() {

    if(!called) {
      called = true;
      result = f.apply(null, arguments);
    }

    return result;
  };
};

// **pie.fn.throttle**
//
// Trigger an event no more than the specified rate.
// Note that the functions do not pile up and continue executing,
// they only execute at the rate specified while still being invoked.
//
// ```
// fn = pie.fn.throttle(fn, 250);
// fn(); fn();
// //=> fires once
// ```
pie.fn.throttle = function(fn, threshold, scope) {
  threshold = threshold || 250;
  var last, deferTimer;

  return function () {
    var context = scope || this;

    var now = pie.date.now(),
        args = arguments;

    if (last && now < last + threshold) {
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
};


// **pie.fn.valueFrom**
//
// If a function is provided, it will be invoked otherwise the provided value will be returned.
// ```
// pie.fn.valueFrom(4)
// //=> 4
// pie.fn.valueFrom(function(){ return 5; });
// //=> 5
// pie.fn.valueFrom(function(){ return Object.keys(this); }, {'foo' : 'bar'});
// //=> ["foo"];
// pie.fn.valueFrom(function(o){ return Object.keys(o); }, null, {'foo' : 'bar'});
// //=> ["foo"];
// ```
pie.fn.valueFrom = function(f, binding, args) {
  if(pie.object.isFunction(f)) return f.apply(binding, args) ;
  return f;
};
pie.math.precision = function(number, places) {
  return Math.round(number * Math.pow(10, places)) / Math.pow(10, places);
};

pie.math.easing = {
  // no easing, no acceleration
  linear: function (t) { return t; },
  // just get us to the end.
  none: function(/* t */){ return 1; },
  // accelerating from zero velocity
  easeInQuad: function (t) { return t*t; },
  // decelerating to zero velocity
  easeOutQuad: function (t) { return t*(2-t); },
  // acceleration until halfway, then deceleration
  easeInOutQuad: function (t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; },
  // accelerating from zero velocity
  easeInCubic: function (t) { return t*t*t; },
  // decelerating to zero velocity
  easeOutCubic: function (t) { return (--t)*t*t+1; },
  // acceleration until halfway, then deceleration
  easeInOutCubic: function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },
  // accelerating from zero velocity
  easeInQuart: function (t) { return t*t*t*t; },
  // decelerating to zero velocity
  easeOutQuart: function (t) { return 1-(--t)*t*t*t; },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function (t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },
  // accelerating from zero velocity
  easeInQuint: function (t) { return t*t*t*t*t; },
  // decelerating to zero velocity
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t; },
  // acceleration until halfway, then deceleration
  easeInOutQuint: function (t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; }
};
// deletes all undefined and null values.
// returns a new object less any empty key/values.
pie.object.compact = function(a, removeEmpty){
  var b = pie.object.merge({}, a);
  Object.keys(b).forEach(function(k) {
    /* jslint eqnull:true */
    if(b[k] == null || (removeEmpty && b[k].toString().length === 0)) delete b[k];
  });
  return b;
};


// deep merge. Does not preserve identity of inner objects.
pie.object.deepMerge = function() {
  var args = pie.array.from(arguments),
      targ = args.shift(),
      obj;

  function fn(k) {

    if(pie.object.has(targ, k) && pie.object.isPlainObject(targ[k])) {
      targ[k] = pie.object.deepMerge({}, targ[k], obj[k]);
    } else if(pie.object.isPlainObject(obj[k])) {
      targ[k] = pie.object.deepMerge({}, obj[k]);
    } else {
      targ[k] = obj[k];
    }
  }

  // iterate over each passed in obj remaining
  for (; args.length;) {
    obj = args.shift();
    if(obj) Object.keys(obj).forEach(fn);
  }
  return targ;
};


// grab the sub-object from the provided object less the provided keys.
// pie.object.except({foo: 'bar', biz: 'baz'}, 'biz') => {'foo': 'bar'}
pie.object.except = function(){
  var keys = pie.array.from(arguments),
  a = keys.shift(),
  b = {};

  keys = pie.array.flatten(keys);

  Object.keys(a).forEach(function(k){
    if(keys.indexOf(k) < 0) b[k] = a[k];
  });

  return b;
};

// delete a path,
pie.object.deletePath = function(obj, path, propagate) {

  if(!~path.indexOf('.')) {
    delete obj[path];
  }

  var steps = pie.string.pathSteps(path), attr, subObj;

  while(steps.length) {
    attr = pie.array.last(steps.shift().split('.'));
    subObj = pie.object.getPath(obj, steps[0]);
    if(!subObj) return;
    delete subObj[attr];
    if(!propagate || Object.keys(subObj).length) return;
  }

};

pie.object.dup = function(obj, deep) {
  return pie.object[deep ? 'deepMerge' : 'merge']({}, obj);
};

pie.object.flatten = function(a, object, prefix) {
  var b = object || {};
  prefix = prefix || '';

  pie.object.forEach(a, function(k,v) {
    if(pie.object.isPlainObject(v)) {
      pie.object.flatten(v, b, k + '.');
    } else {
      b[prefix + k] = v;
    }
  });

  return b;
};

pie.object.isWindow = function(obj) {
  return obj && typeof obj === "object" && "setInterval" in obj;
};


/* From jQuery */
pie.object.isPlainObject = function(obj) {

  if ( !obj || !pie.object.isObject(obj) || obj.nodeType || pie.object.isWindow(obj) ) {
    return false;
  }

  if ( obj.constructor &&
    !pie.object.has(obj, "constructor") &&
    !pie.object.has(obj.constructor.prototype, "isPrototypeOf") ) {
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.
  var key;
  for ( key in obj ) {}
  return key === undefined || pie.object.has(obj, key);
};

pie.object.isNotPlainObject = function(obj) {
  return !pie.object.isPlainObject(obj);
};


['Object', 'Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Boolean'].forEach(function(name) {
  pie.object['is' + name] = function(obj) {
    return Object.prototype.toString.call(obj) === '[object ' + name + ']';
  };

  pie.object['isNot' + name] = function(obj) {
    return !pie.object['is' + name](obj);
  };
});

(function(){
  if(!pie.object.isArguments(arguments)) {
    pie.object.isArguments = function(obj) {
      return obj && obj.hasOwnProperty('callee');
    };
  }
})();

pie.object.isUndefined = function(obj) {
  return obj === void 0;
};
pie.object.isNotUndefined = function(obj) {
  return !pie.object.isUndefined();
};

// shallow merge
pie.object.merge = function() {
  var args = pie.array.from(arguments),
      targ = args.shift(),
      obj;

  function fn(k) {
    targ[k] = obj[k];
  }

  // iterate over each passed in obj remaining
  for (; args.length; ) {
    obj = args.shift();
    if(obj) Object.keys(obj).forEach(fn);
  }

  return targ;
};


// yield each key value pair to a function
// pie.object.forEach({'foo' : 'bar'}, function(k,v){ console.log(k, v); });
//
// => foo, bar
pie.object.forEach = function(o, f) {
  if(!o) return;

  Object.keys(o).forEach(function(k) {
    f(k, o[k]);
  });
};


pie.object.getPath = function(obj, path) {
  if(!path) return obj;
  if(!~path.indexOf('.')) return obj[path];

  var p = path.split('.'), key;
  while(p.length) {
    if(!obj) return obj;
    key = p.shift();
    if (!p.length) return obj[key];
    else obj = obj[key];
  }
  return obj;
};


pie.object.getValue = function(o, attribute) {
  if(pie.object.isFunction(attribute))          return attribute.call(null, o);
  else if (o == null)                           return void 0;
  else if(pie.object.isFunction(o[attribute]))  return o[attribute].call(o);
  else if(pie.object.has(o, attribute, true))   return o[attribute];
  else                                          return void 0;
};

pie.object.has = function(obj, key, includeInherited) {
  return obj && (obj.hasOwnProperty(key) || (includeInherited && (key in obj)));
};

pie.object.hasAny = function(/* obj, *keys */) {
  var obj = arguments[0], keys, checks;
  if(!obj) return false;

  if(arguments.length === 1) return !!Object.keys(obj).length;

  checks = pie.array.flatten(pie.array.get(arguments, 1, -1));
  for(var i=0;i<checks.length;i++) {
    if(pie.object.has(obj, checks[i])) return true;
  }

  return false;
};


// does the object have the described path
pie.object.hasPath = function(obj, path) {
  if(!~path.indexOf('.')) return pie.object.has(obj, path);

  var parts = path.split('.'), part;
  while(part = parts.shift()) {

    /* jslint eqeq:true */
    if(pie.object.has(obj, part)) {
      obj = obj[part];
    } else {
      return false;
    }
  }

  return true;
};

pie.object.reverseMerge = function(/* args */) {
  var args = pie.array.from(arguments);
  args.reverse();
  return pie.object.merge.apply(null, args);
};

// serialize object into query string
// {foo: 'bar'} => foo=bar
// {foo: {inner: 'bar'}} => foo[inner]=bar
// {foo: [3]} => foo[]=3
// {foo: [{inner: 'bar'}]} => foo[][inner]=bar
pie.object.serialize = function(obj, removeEmpty) {
  var s = [], append, appendEmpty, build, rbracket = /\[\]$/;

  append = function(k,v){
    v = pie.fn.valueFrom(v);
    if(removeEmpty && !rbracket.test(k) && (v == null || !v.toString().length)) return;
    s.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
  };

  appendEmpty = function(k) {
    s.push(encodeURIComponent(k) + '=');
  };

  build = function(prefix, o, append) {
    if(Array.isArray(o)) {
      o.forEach(function(v) {
        build(prefix + '[]', v, append);
      });
    } else if(pie.object.isPlainObject(o)) {
      Object.keys(o).sort().forEach(function(k){
        build(prefix + '[' + k + ']', o[k], append);
      });
    } else {
      append(prefix, o);
    }
  };

  Object.keys(obj).sort().forEach(function(k) {
    build(k, obj[k], append);
  });

  return s.join('&');
};


pie.object.setPath = function(obj, path, value) {
  if(!~path.indexOf('.')) return obj[path] = value;

  var p = path.split('.'), key;
  while(p.length) {
    key = p.shift();
    if (!p.length) return obj[key] = value;
    else if (obj[key]) obj = obj[key];
    else obj = obj[key] = {};
  }
};


// grab a sub-object from the provided object.
// pie.object.slice({foo: 'bar', biz: 'baz'}, 'biz') => {'biz': 'baz'}
pie.object.slice = function() {
  var keys = pie.array.from(arguments),
  a = keys.shift(),
  b = {};

  keys = pie.array.flatten(keys);
  keys.forEach(function(k){
    if(pie.object.has(a, k)) b[k] = a[k];
  });

  return b;
};

// return all the values of the object
pie.object.values = function(a) {
  return Object.keys(a).map(function(k) { return a[k]; });
};
pie.string.PROTOCOL_TEST = /\w+:\/\//;

pie.string.capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};


pie.string.change = function() {
  var args = pie.array.from(arguments),
  str = args.shift();
  args.forEach(function(m) {
    str = pie.string[m](str);
  });

  return str;
};


// deserialize query string into object
pie.string.deserialize = (function(){

  function parseQueryValue(value) {
    if(value === 'undefined') return undefined;
    if(value === 'null') return null;
    if(value === 'true') return true;
    if(value === 'false') return false;
    if(/^-?\d*(\.\d+)?$/.test(value)) {
      var f = parseFloat(value, 10),
          i = parseInt(f, 10);
      if(!isNaN(f) && f % 1) return f;
      if(!isNaN(i)) return i;
    }
    return value;
  }

  // foo[][0][thing]=bar
  // => [{'0' : {thing: 'bar'}}]
  // foo[]=thing&foo[]=bar
  // => {foo: [thing, bar]}
  function applyValue(key, value, params) {
    var pieces = key.split('['),
    segmentRegex = /^\[(.+)?\]$/,
    match, piece, target;

    key = pieces.shift();
    pieces = pieces.map(function(p){ return '[' + p; });

    target = params;

    while(piece = pieces.shift()) {
      match = piece.match(segmentRegex);
      // obj
      if(match[1]) {
        target[key] = target[key] || {};
        target = target[key];
        key = match[1];
      // array
      } else {
        target[key] = target[key] || [];
        target = target[key];
        key = target.length;
      }
    }

    target[key] = value;

    return params;
  }

  return function(str, parse) {
    var params = {}, idx, pieces, segments, key, value;

    if(!str) return params;

    idx = str.indexOf('?');
    if(~idx) str = str.slice(idx+1);

    pieces = str.split('&');
    pieces.forEach(function(piece){
      segments = piece.split('=');
      key = decodeURIComponent(segments[0] || '');
      value = decodeURIComponent(segments[1] || '');

      if(parse) value = parseQueryValue(value);

      applyValue(key, value, params);
    });

    return params;
  };
})();

pie.string.downcase = function(str) {
  return str.toLowerCase();
};


pie.string.escapeRegex = function(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// Escapes a string for HTML interpolation
pie.string.escapeHtml = (function(){
  var encMap = {
    "<"   : "&lt;",
    ">"   : "&gt;",
    "&"   : "&amp;",
    "\""  : "&quot;",
    "'"   : "&#39;"
  };
  var encReg = new RegExp("[" + pie.string.escapeRegex(Object.keys(encMap).join('')) + "]", 'g');
  var replacer = function(c){
    return encMap[c] || "";
  };

  return function(str) {
    /* jslint eqnull: true */
    if(str == null) return str;
    return ("" + str).replace(encReg, replacer);
  };
})();

pie.string.endsWith = function(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

// designed to be used with the "%{expression}" placeholders
pie.string.expand = function(str, data, raiseOnMiss) {
  data = data || {};
  return str.replace(/\%\{(.+?)\}/g, function(match, key) {
    if(raiseOnMiss && !pie.object.has(data, key)) throw new Error("Missing interpolation argument `" + key + "` for '" + str + "'");
    return data[key];
  });
};


pie.string.humanize = function(str) {
  return str.replace(/_id$/, '').replace(/([a-z][A-Z]|[a-z]_[a-z])/g, function(match, a){ return a[0] + ' ' + a[a.length-1]; });
};


pie.string.lowerize = function(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
};


pie.string.modularize = function(str) {
  return str.replace(/([^_])_([^_])/g, function(match, a, b){ return a + b.toUpperCase(); });
};

pie.string.normalizeUrl =  function(path) {

  // ensure there's a leading slash
  if(!pie.string.PROTOCOL_TEST.test(path) && path.charAt(0) !== '/') {
    path = '/' + path;
  }

  // normalize the path portion of a url if a query is present
  if(path.indexOf('?') > 0) {
    var split = path.split('?');
    path = pie.string.normalizeUrl(split.shift());
    split.unshift(path);
    path = split.join('?');
  }

  // remove any double slashes
  path = path.replace(/(^|[^:])\/\//g, "$1/");

  // remove trailing hashtags
  if(path.charAt(path.length - 1) === '#') {
    path = path.substr(0, path.length - 1);
  }

  // remove trailing slashes
  if(path.length > 1 && path.charAt(path.length - 1) === '/') {
    path = path.substr(0, path.length - 1);
  }

  return path;
};

pie.string.pluralize = function(str, count) {
  if(count === 1) return str;
  if(/ss$/i.test(str)) return str + 'es';
  if(/s$/i.test(str)) return str;
  if(/[a-z]$/i.test(str)) return str + 's';
  return str;
};

// todo: i18n
pie.string.possessive = function(str) {
  if(/s$/i.test(str)) return str + "'";
  return str + "'s";
};


pie.string.setTemplateSettings = function(begin, end, escape, interp, evalr, splitter) {
  splitter = splitter || '~~pie-interp~~';
  escape = escape || '-';
  interp = interp || '=';
  evalr = evalr || '';

  var escapedBegin = pie.string.escapeRegex(begin),
  escapedEnd = pie.string.escapeRegex(end),
  escapedEndFirstChar = pie.string.escapeRegex(end[0]),
  escapedInterp = pie.string.escapeRegex(interp),
  escapedEscape = pie.string.escapeRegex(escape),
  escapedEvalr  = pie.string.escapeRegex(evalr),
  escapedSplitter = pie.string.escapeRegex(splitter);

  pie.string._templateSettings = {
    begin: begin,
    end: end,
    interp: interp,
    escape: escape,
    eval: evalr,
    splitter: splitter,
    interpRegex:      new RegExp(escapedBegin + '([' + pie.array.compact([escapedInterp, escapedEscape, escapedEvalr], true).join('') + ']?)(.+?)' + escapedEnd, 'g'),
    interpLookahead:  new RegExp("'(?=[^" + escapedEndFirstChar + "]*" + escapedEnd + ")", 'g'),
    splitterRegex:    new RegExp(escapedSplitter, 'g'),
  };
};

pie.string.setTemplateSettings('[%', '%]', '-', '=', '');

//**pie.string.template**
//
// Resig style microtemplating. Preserves whitespace, and only uses string manipulation.
// There is no array construction. Allows an optional variables string `varString` which enables
// custom variable definition inside of the templating function.
//
// ```
// var template = pie.string.template("Hi, [%= data.first_name %]. You have [%= data.count %] [%= pie.string.pluralize('messages', data.count) %]");
// template({first_name: 'John', count: 4});
// //=> "Hi, John. You have 4 messages."
// ```
pie.string.template = function(str, varString) {
  var conf = pie.string._templateSettings,
  strFunc = "var __p='', __s = function(v, e){ return v == null ? '' : (e ? pie.string.escapeHtml(v) : v); };\n" ;
  if(varString) strFunc += varString + ";\n";
  strFunc += "__p += '";

  /**** preserve format by allowing multiline strings. ****/
  strFunc += str.replace(/\n/g, "\\\n")
  /**** EX: "... __p += '[% data.foo = 1 %]text's content[%- data.foo %]more text[%= data['foo'] + 1 %]" ****/

  /**** replace all interpolation single quotes with a unique identifier. ****/
  .replace(conf.interpLookahead, conf.splitter)
  /**** EX: "... __p += '[% data.foo = 1 %]text's content[%- data.foo %]more text[%= data[~~pie-interp~~foo~~pie-interp~~] + 1 %]" ****/

  /**** now replace all quotes with an escaped quote. ****/
  .replace(/'/g, "\\'")
  /**** EX: "... __p += '[% data.foo = 1 %]text\'s content[%- data.foo %]more text[%= data[~~pie-interp~~foo~~pie-interp~~] + 1 %]" ****/

  /**** and reapply the single quotes in the interpolated content. ****/
  .replace(conf.splitterRegex, "'")
  /**** EX: "... __p += '[% data.foo = 1 %]text\'s content[%- data.foo %]more text[%= data['foo'] + 1 %]" ****/

  /**** escape, interpolate, and evaluate ****/
  .replace(conf.interpRegex, function(match, action, content) {
    action = action || '';
    if(action === conf.escape) {
      return "' + __s(" + content + ", true) + '";
    } else if (action === conf.interp) {
      return "' + __s(" + content + ", false) + '";
    } else if (action === conf.eval) {
      return "'; " + content + "; __p+='";
    }
  });
  /**** EX: "... __p += ''; data.foo = 1; __p+='text\'s content' + __s(data.foo, true) + 'more text' + __s(data['foo'] + 1) + '" ****/

  /**** terminate the string ****/
  strFunc += "';";
  /**** EX: "... __p +=''; data.foo = 1; __p+='text\'s content' + __s(data.foo, true) + 'more text' + __s(data['foo'] + 1) + '';" ****/

  /**** final result. ****/
  strFunc += "return __p;";

  return new Function("data", strFunc);
};

pie.string.titleize = function(str) {
  return str.replace(/(^| )([a-z])/g, function(match, a, b){ return a + b.toUpperCase(); });
};

pie.string.pathSteps = function(path) {
  var split = path.split('.'),
  steps = [];

  while(split.length) {
    steps.push(split.join('.'));
    split.pop();
  }

  return steps;
};

pie.string.underscore = function(str) {
  return str.replace(/([a-z])([A-Z])/g, function(match, a, b){ return a + '_' + b.toLowerCase(); }).toLowerCase();
};

pie.string.upcase = function(str) {
  return str.toUpperCase();
};


pie.string.urlConcat = function() {
  var args = pie.array.compact(pie.array.from(arguments), true),
  base = args.shift(),
  query = args.join('&');

  if(!query.length) return base;

  // we always throw a question mark on the end of base
  if(base.indexOf('?') < 0) base += '?';

  // we replace all question marks in the query with &
  if(query.indexOf('?') === 0) query = query.replace('?', '&');
  else if(query.indexOf('&') !== 0) query = '&' + query;

  base += query;
  base = base.replace('?&', '?').replace('&&', '&').replace('??', '?');
  if(base.indexOf('?') === base.length - 1) base = base.substr(0, base.length - 1);
  return base;
};
pie.mixins.activeView = {

  setup: function() {

    if(this.options.autoRender && this.model) {
      var field = pie.object.isString(this.options.autoRender) ? this.options.autoRender : '_version';
      this.onChange(this.model, this.render.bind(this), field);
    }

    if(this.options.renderOnSetup) {
      this.emitter.once('setup', this.render.bind(this));
    }

    this.emitter.on('render', this._renderTemplateToEl.bind(this));

    this._super();
  },

  _renderTemplateToEl: function() {
    var templateName = this.templateName();

    if(templateName) {
      this.app.templates.renderAsync(templateName, this.renderData(), function(content){
        this.el.innerHTML = content;
        this.emitter.fire('afterRender');
      }.bind(this));
    } else {
      this.emitter.fire('afterRender');
    }
  },

  renderData: function() {
    if(this.model) {
      return this.model.data;
    }

    return {};
  },

  render: function() {
    this.emitter.fire('beforeRender');
    this.emitter.fireAround('aroundRender', function(){
      // afterRender should be fired by the render implementation.
      // There's the possibility that a template needs to be fetched from a remote source.
      this.emitter.fire('render');
    }.bind(this));
  },

  templateName: function() {
    return this.options.template;
  }

};
// # Bindings Mixin
// A mixin to provide two way data binding between a model and dom elements.
// This mixin should be used with a pie view.
pie.mixins.bindings = (function(){


  var integrations = {};


  // Bind to an element's attribute.
  integrations.attribute = (function(){

    // extract the attribute name from the binding configuration.
    var attributeName = function(binding){
      return binding.options.attribute || ('data-' + binding.attr);
    };

    return {

      getValue: function(el, binding) {
        return el.getAttribute(attributeName(binding));
      },

      setValue: function(el, binding) {
        var value = binding.model.get(binding.attr);
        return el.setAttribute(attributeName(binding), value);
      }

    };
  })();

  integrations['class'] = (function(){

    /* will handle strings and arrays of strings */
    var getClassNames = function(string) {
      if(!string) return [];
      string = String(string);
      return pie.array.compact(pie.array.map(string.split(/[\,\s]/), 'trim', true), true);
    };

    return {
      getValue: function(/* el, binding */) {
        throw new Error("class bindings can only be from the model to the view. Please declare toModel: false");
      },

      setValue: function(el, binding) {
        var className = binding.options.className;

        if(className === '_value_') {
          var change = binding.lastChange;
          if(change) {
            if(change.oldValue) {
              getClassNames(change.oldValue).forEach(function(c) {
                el.classList.remove(c);
              });
            }

            if(change.value) {
              getClassNames(change.value).forEach(function(c) {
                el.classList.add(c);
              });
              return change.value;
            }
          }
        } else {
          var value = binding.model.get(binding.attr);
          className = className || binding.attr;

          getClassNames(className).forEach(function(c){
            el.classList[!!value ? 'add' : 'remove'](c);
          });

          return className;
        }
      }
    };
  })();

  integrations.value = {

    // Simple value extraction
    getValue: function(el /*, binding */) {
      return el.value;
    },

    // Apply the model's value to the element's value.
    setValue: function(el, binding) {
      var value = binding.model.get(binding.attr);
      /* jslint eqnull:true */
      if(value == null) value = '';
      return el.value = value;
    }

  };

  integrations.check = (function(){

    // String based index.
    var index = function(arr, value) {
      if(!arr) return -1;
      value = String(value);
      return pie.array.indexOf(arr, function(e){ return String(e) === value; });
    };

    return {

      getValue: function(el, binding) {

        // If we have an array, manage the values.
        if(binding.dataType === 'array') {

          var existing = pie.array.from(binding.model.get(binding.attr)), i;

          i = index(existing, el.value);

          // If we are checked and we don't already have it, add it.
          if(el.checked && i < 0) {
            existing = pie.array.dup(existing);
            existing.push(el.value);
          // If we are not checked but we do have it, then we add it.
          } else if(!el.checked && i >= 0) {
            existing = pie.array.dup(existing);
            existing.splice(i, 1);
          }

          return existing;
        } else if(binding.dataType === 'boolean'){
          return el.checked;
        } else {
          // Otherwise, we return the el's value if it's checked.
          return el.checked ? el.value : null;
        }
      },

      // If the model's value contains the checkbox, check it.
      setValue: function(el, binding) {
        var value = binding.model.get(binding.attr),
        elValue = el.value;

        // In the case of an array, we check for inclusion.
        if(binding.dataType === 'array') {
          var i = index(value, elValue);
          return el.checked = !!~i;
        } else {
          var caster = typeCaster(binding.dataType);

          // Otherwise we check for equality
          return el.checked = caster(elValue) === caster(value);
        }
      }
    };

  })();


  integrations.radio = {

    // If a radio input is checked, return it's value.
    // Otherwise, return the existing value.
    getValue: function(el, binding) {
      var existing = binding.model.get(binding.attr);
      if(el.checked) return el.value;
      return existing;
    },

    // Check a radio button if the value matches.
    setValue: function(el, binding) {
      var value = binding.model.get(binding.attr),
      elValue = el.value,
      caster = typeCaster(binding.dataType);

      /* jslint eqeq:true */
      return el.checked = caster(elValue) === caster(value);
    }

  };

  // Set the innerTEXT of an element based on the model's value.
  integrations.text = {

    getValue: function(el /*, binding */) {
      return el.textContent;
    },

    setValue: function(el, binding) {
      var value = binding.model.get(binding.attr);

      /* jslint eqnull:true */
      if(value == null) value = '';
      return el.textContent = value;
    }

  };

  // Set the innerHTML of an element based on the model's value.
  integrations.html = {

    getValue: function(el /*, binding */) {
      return el.innerHTML;
    },

    setValue: function(el, binding) {
      var value = binding.model.get(binding.attr);
      /* jslint eqnull:true */
      if(value == null) value = '';
      return el.innerHTML = value;
    }

  };

  // If type=auto, this does it's best to determine the appropriate integration.
  var determineIntegrationForBinding = function(el, binding) {
      var mod;
      if(el.hasAttribute && el.hasAttribute('data-' + binding.attr)) mod = 'attribute';
      else if(el.nodeName === 'INPUT' && el.getAttribute('type') === 'checkbox') mod = 'check';
      else if(el.nodeName === 'INPUT' && el.getAttribute('type') === 'radio') mod = 'radio';
      else if(el.nodeName === 'INPUT' || el.nodeName === 'SELECT' || el.nodeName === 'TEXTAREA') mod = 'value';
      else mod = 'text';

      return integrations[mod];
    };

  // Provide a way to retrieve values out of the dom & apply values to the dom.
  var integration = function(el, binding) {
    if(binding.type === 'auto') return determineIntegrationForBinding(el, binding);
    return integrations[binding.type] || integrations.value;
  };



  // A set of methods to cast raw values into a specific type.
  var typeCasters = {

    // Note that `undefined` and `null` will result in `[]`.
    array: function(raw) {
      return pie.array.from(raw);
    },

    boolean: (function(){

      // Match different strings representing truthy values.
      var reg = /^(1|true|yes|t|ok|on)$/;

      return function(raw) {
        if(raw == null) return raw;
        return !!(raw && reg.test(String(raw)));
      };

    })(),

    // Attempt to parse as a float, if `NaN` return `null`.
    number: function(raw) {
      var val = parseFloat(raw, 10);
      if(isNaN(val)) return null;
      return val;
    },

    // Attempt to parse as an integer, if `NaN` return `null`.
    integer: function(raw) {
      var val = parseInt(raw, 10);
      if(isNaN(val)) return null;
      return val;
    },

    // `null` or `undefined` are passed through, otherwise cast as a String.
    string: function(raw) {
      return raw == null ? raw : String(raw);
    },

    "default" : function(raw) {
      return raw;
    }

  };

  // The type caster based on the `dataType`.
  var typeCaster = function(dataType) {
    return typeCasters[dataType] || typeCasters['default'];
  };


  // Take horrible user provided options and turn it into magical pie options.
  var normalizeBindingOptions = function(given) {

    if(!given.attr) throw new Error("An attr must be provided for data binding. " + JSON.stringify(given));

    var out         = {};
    /* the model attribute to be observed / updated. */
    out.attr        = given.attr;
    /* the model to apply changes to. */
    out.model       = given.model       || this.model;
    /* the selector to observe */
    out.sel         = given.sel         || '[name="' + given.attr + '"]';
    /* the way in which the binding should extract the value from the dom. */
    out.type        = given.type        || 'auto';
    /* the desired type the dom value's should be cast to. */
    out.dataType    = given.dataType    || 'default';
    /* if `dataType` is "array", they type which should be applied to each. */
    out.eachType    = given.eachType    || undefined;
    /* when an input changes or has a keyup event, the model will update. */
    out.trigger     = given.trigger     || 'change keyup';
    /* just in case the dom events should be based on a different field than that provided by `sel` */
    out.triggerSel  = given.triggerSel  || out.sel;
    /* if toModel is not provided, it's presumed to be desired. */
    out.toModel     = given.toModel     || (given.toModel === undefined && out.type !== 'class');
    /* if toView is not provided, it's presumed to be desired. */
    out.toView      = given.toView      || given.toView === undefined;
    /* no debounce by default. */
    out.debounce    = given.debounce    || false;
    /* secondary options. */
    out.options     = given.options     || {};

    /* A `true` value will results in a default debounce duration of 250ms. */
    if(out.debounce === true) out.debounce = 250;

    return out;
  };

  // Apply a value to the model, ensuring the model-to-view triggers do not take place.
  var applyValueToModel = function(value, binding, opts) {
    try{
      binding.ignore = true;
      binding.model.set(binding.attr, value, opts);

    // Even if we error, we should reset the ignore.
    } finally {
      binding.ignore = false;
    }
  };

  // Take a model's value, and apply it to all relevant elements within `parentEl`.
  var applyValueToElements = function(parentEl, binding) {
    if(binding.ignore) return;

    var els = parentEl.querySelectorAll(binding.sel);

    // For each matching element, set the value based on the binding.
    for(var i = 0; i < els.length; i++) {
      integration(els[i], binding).setValue(els[i], binding);
    }
  };

  // Extract a value out of an element based on a binding configuration.
  var getValueFromElement = function(el, binding) {
    // Get the basic value out of the element.
    var val = integration(el, binding).getValue(el, binding),
    // Get the type casting function it based on the configuration.
    fn = typeCaster(binding.dataType);
    // Type cast the value.
    val = fn(val);

    // If we're configured to have an array and have defined an `eachType`
    // use it to typecast each value.
    if(binding.dataType === 'array' && binding.eachType) {
      var eachFn = typeCaster(binding.eachType);
      val = val.map(eachFn);
    }

    return val;
  };

  // ### Binding Initializations
  // With a binding configuration ready, let's wire up the callbacks.
  var initCallbacks = function(binding) {
    initModelCallbacks.call(this, binding);
    initViewCallbacks.call(this, binding);

    return binding;
  };

  // Wiring of the view-to-model callbacks. These will observe dom events
  // and translate them to model values.
  var initViewCallbacks = function(binding) {

    // If no view-to-model binding is desired, escape.
    if(!binding.toModel) return;

    // If a function is provided, use that as the base implementation.
    if(pie.object.isFunction(binding.toModel)) {
      binding._toModel = binding.toModel;
    } else {
      // Otherwise, we provide a default implementation.
      binding._toModel = function(el, opts) {
        var value = getValueFromElement(el, binding);
        applyValueToModel(value, binding, opts);
      };
    }

    // We wrap our base implementation with a function that handles event arguments
    binding.toModel = function(e) {
      var el = e.delegateTarget;
      binding._toModel(el);
    };

    // If a debounce is requested, we apply the debounce to the wrapped function,
    // Leaving the base function untouched.
    if(binding.debounce) binding.toModel = pie.fn.debounce(binding.toModel, binding.debounce);

    // Multiple events could be supplied, separated by a space.
    var events = binding.trigger.split(' ');
    events.forEach(function(event){
      // Use the view's event management to register the callback.
      this.on(event, binding.triggerSel, binding.toModel);
    }.bind(this));
  };

  // Initialization of model-to-view callbacks. These will observe relevant model
  // changes and update the dom.
  var initModelCallbacks = function(binding) {
    // If no model-to-view binding is desired, escape.
    if(!binding.toView) return;

    // If a toView function is not provided, apply the default implementation.
    if(!pie.object.isFunction(binding.toView)) {
      binding.toView = function(changes) {
        binding.lastChange = changes && changes.get(binding.attr);
        applyValueToElements(this.el, binding);
      }.bind(this);
    }

    // Register a change observer with the new.
    this.onChange(binding.model, binding.toView, binding.attr);
  };


  // ## Bindings Mixin
  return {

    // The registration & configuration of bindings is kept in this._bindings.
    init: function() {
      this._bindings = [];
      if(this._super) this._super.apply(this, arguments);
    },

    // If we have an emitter, tap into the afterRender event and initialize the dom
    // with our model values.
    setup: function() {
      if(this.emitter) this.emitter.prepend('afterRender', this.initBoundFields.bind(this));
      if(this._super) this._super.apply(this, arguments);
    },

    // Register 1+ bindings within the view.
    //
    // ```
    // this.bind({ attr: 'first_name' }, { attr: 'last_name' })
    // ```;
    bind: function() {
      var wanted = pie.array.from(arguments);
      wanted = wanted.map(function(opts) {
        opts = normalizeBindingOptions.call(this, opts);
        return initCallbacks.call(this, opts);
      }.bind(this));

      this._bindings = this._bindings.concat(wanted);
    },

    // Iterate each binding and propagate the model value to the dom.
    initBoundFields: function() {
      this._bindings.forEach(function(b){
        if(b.toView) b.toView();
      });
    },


    /* Iterate each binding and propagate the dom value to the model. */
    /* A single set of change records will be produced (`_version` will only increment by 1). */
    readBoundFields: function() {
      var models = {}, skip = {skipObservers: true}, els, i;

      this._bindings.forEach(function(b) {
        if(!b.toModel) return;

        models[b.model.pieId] = b.model;
        els = this.qsa(b.sel);

        for(i = 0; i < els.length; i++) {
          b._toModel(els[i], skip);
        }
      }.bind(this));

      pie.object.forEach(models, function(id, m) {
        m.deliverChangeRecords();
      });

    }
  };

})();
pie.mixins.changeSet = {

  get: function(name) {
    return this.query({name: name});
  },

  has: function(name) {
    return pie.array.areAny(this, function(change) {
      return change.name === name;
    });
  },

  hasAny: function() {
    for(var i = 0; i < arguments.length; i++) {
      if(this.has(arguments[i])) return true;
    }
    return false;
  },

  hasAll: function() {
    for(var i = 0; i < arguments.length; i++) {
      if(!this.has(arguments[i])) return false;
    }
    return true;
  },

  query: function(options) {
    return this._query('detectLast', options);
  },

  queryAll: function(options) {
    return this._query('filter', options);
  },

  _query: function(arrayFn, options) {
    var names = pie.array.from(options.names || options.name),
    types = pie.array.from(options.types || options.type);

    return pie.array[arrayFn](this, function(change) {
      return (!names.length || ~names.indexOf(change.name)) &&
             (!types.length || ~types.indexOf(change.type));
    });
  }

};
pie.mixins.container = {

  init: function() {
    this.children = [];
    this.childNames = {};
    if(this._super) this._super.apply(this, arguments);
  },

  addChild: function(name, child) {
    var idx;

    this.children.push(child);
    idx = this.children.length - 1;

    this.childNames[name] = idx;
    child._indexWithinParent = idx;
    child._nameWithinParent = name;
    child.parent = this;

    if(pie.object.has(child, 'addedToParent', true)) child.addedToParent.call(child);

    return this;
  },

  addChildren: function(obj) {
    pie.object.forEach(obj, function(name, child) {
      this.addChild(name, child);
    }.bind(this));
  },

  getChild: function(obj, recurse) {
    /* jslint eqeq:true */
    if(obj == null) return;
    if(obj._nameWithinParent) return obj;

    var idx = this.childNames[obj];
    if(idx == null) idx = obj;

    if(recurse === undefined) recurse = true;

    // It's a path.
    if(recurse && String(idx).match(/\./)) {
      var steps = idx.split('.'),
      child = this, step;
      while(step = steps.shift()) {
        child = child.getChild(step);
        if(!child) return undefined;
        /* dig as far as we can go, if we have non-container child we're done */
        if(steps.length && !child.getChild) return undefined;
      }

      return child;
    }

    return ~idx && this.children[idx] || undefined;
  },

  bubble: function() {
    var args = pie.array.from(arguments),
    fname = args.shift(),
    obj = this.parent;

    while(obj && !(fname in obj)) {
      obj = obj.parent;
    }

    if(obj) return obj[fname].apply(obj, args);
  },

  sendToChildren: function(/* fnName, arg1, arg2 */) {
    var allArgs = pie.array.change(arguments, 'from'),
    fnName = allArgs[0],
    args = allArgs.slice(1);

    this.children.forEach(function(child){
      if(pie.object.has(child, fnName, true)) child[fnName].apply(child, args);
      if(pie.object.has(child, 'sendToChildren', true)) child.sendToChildren.apply(child, allArgs);
    }.bind(this));
  },

  removeChild: function(obj) {
    var child = this.getChild(obj), i;

    if(child) {
      i = child._indexWithinParent;
      this.children.splice(i, 1);

      for(;i < this.children.length;i++) {
        this.children[i]._indexWithinParent = i;
        this.childNames[this.children[i]._nameWithinParent] = i;
      }

      // clean up
      delete this.childNames[child._nameWithinParent];
      delete child._indexWithinParent;
      delete child._nameWithinParent;
      delete child.parent;

      if(pie.object.has(child, 'removedFromParent', true)) child.removedFromParent.call(child, this);
    }

    return this;
  },

  removeChildren: function() {
    var child;

    while(child = this.children[this.children.length-1]) {
      this.removeChild(child);
    }

    return this;
  },

  sortChildren: function(fn) {
    this.children.sort(fn);
    this.children.forEach(function(c, i) {
      c._indexWithinParent = i;
      this.childNames[c._nameWithinParent] = i;
    }.bind(this));
  },

  __tree: function(indent) {
    indent = indent || 0;
    var pad = function(s, i){
      if(!i) return s;
      while(i-- > 0) s = " " + s;
      return s;
    };
    var str = "\n", nextIndent = indent + (indent ? 4 : 1);
    str += pad((indent ? '|- ' : '') + (this._nameWithinParent || this._indexWithinParent || this.className) + ' (' + (this.className || this.pieId) + ')', indent);

    this.children.forEach(function(child) {
      str += "\n" + pad('|', nextIndent);
      str += child.__tree(nextIndent);
    });

    if(!indent) str += "\n";

    return str;
  }
};
// # Pie FormView
// A view designed to ease form modeling & interactions.
// FormViews make use of bindings & validations to simplify the input, validation, and submission of forms.
// FormViews expect the activeView and bindings mixins to be included.
// ```
// myForm = new pie.formView({
//   fields: [
//     {
//       name: 'full_name'
//       validates: {
//         presence: true
//       }
//     },
//     ...
//     {
//       name: 'terms_of_service',
//       binding: {
//         type: 'check',
//         dataType: 'boolean'
//       },
//       validates: {
//         chosen: true
//       }
//     }
//   ]
// })
// ```
// Valid options are as follows:
//   * **fields** - a list of fields to bind to, validate, and submit. Each field can have the following:
//     * **name** - the name of the field to bind to. Should be the same as the name attribute of the field & the attribute you'd like to submit as.
//     * **binding** - options for the binding. All options present in `pie.mixins.bindings#normalizeBindingOptions` are available.
//     * **validation** - options for the validation. All options present in `pie.mixins.validatable` are available.
//   * **ajax** - (optional) an object of ajax options to use as part of the submission. By default it will infer the url & verb from the `<form>` this view contains.
//   * **formSel** - (optional) defaulted to "form", this is the selector which will be observed for submission.
//   * **model** - (optional) a model to be bound to. By default it will create a new model automatically. Keep in mind if you supply a model, the model will have validations applied to it.
//   * **validationStrategy** - (optional) a validation strategy to be applied to the model. See `pie.mixins.validatable` for more info on that.
//
// Upon submission a few things happen. If the ajax call is a success, the view's `onSuccess` function is invoked. The emitter also fires an `onSuccess` event.
// Similarly, upon failure, `onFailure` is invoked & emitted. If you override `ajax.extraError` or `ajax.success` in the options, the associated function & event will not be triggered.
// If you're overriding formView behavior, here's the general process which is taken:
//   1. Upon setup, fields are bound & initialized
//   2. Upon submission, fields are read one final time
//   3. A `submit` event is triggered on our emitter.
//   4. The model is validated.
//   5. If invalid, an `onInvalid` event is fired and the `onInvalid` function is invoked.
//   6. If invalid, an `onValid` event is fired and the `onValid` function is invoked.
//   7. By default, the `onValid` function invokes `prepareSubmissionData` with a callback.
//   8. `prepareSubmissionData` reads the fields out of the model. This is the point when ajax could take place if, say, a token needed to be generated by an external service (I'm talking to you, Stripe).
//   9. When the data is prepared, the callback is invoked.
//   10. The ajax request is made to the form target.
//   11. If unsuccessful, an `onFailure` event & function are triggered.
//   12. If successful, an `onSuccess` event & function are triggered.
pie.mixins.formView = {

  init: function() {
    this._super.apply(this, arguments);
    this._ensureModel();
    this._normalizeFormOptions();
  },

  setup: function() {
    this._setupFormBindings();

    this.on('submit', this.options.formSel, this.validateAndSubmitForm.bind(this));

    this._super.apply(this, arguments);
  },

  /* we build a model if one isn't present already */
  /* if the model doesn't know how to perform validations, we extend it with the functionality */
  _ensureModel: function() {
    this.model = this.model || this.options.model || new pie.model({});

    if(!this.model.validates) this.model.reopen(pie.mixins.validatable);
  },


  _normalizeFormOptions: function() {
    this.options.formSel  = this.options.formSel || 'form';
    this.options.fields   = this.options.fields || [];
    this.options.fields   = this.options.fields.map(function(field) {

      if(!field || !field.name) throw new Error("A `name` property must be provided for all fields.");

      field.binding = field.binding || {};
      field.binding.attr = field.binding.attr || field.name;

      return field;
    });
  },

  /* These `_on*` methods are provided to enable event observation. */
  /* Implementers of formView should override `on*` methods. */
  _onInvalid: function() {
    this.emitter.fire('onInvalid');
    this.onInvalid.apply(this, arguments);
  },

  _onFailure: function() {
    this.emitter.fire('onFailure');
    this.onFailure.apply(this, arguments);
  },

  _onSuccess: function() {
    this.emitter.fire('onSuccess');
    this.onSuccess.apply(this, arguments);
  },

  _onValid: function() {
    this.emitter.fire('onValid');
    this.onValid.apply(this, arguments);
  },

  _setupFormBindings: function() {
    var validation;

    this.options.fields.forEach(function(field) {

      this.bind(field.binding);

      validation = field.validation;

      if(validation) {
        validation = {};
        validation[field.name] = field.validation;
        this.model.validates(validation, this.options.validationStrategy);
      }
    }.bind(this));
  },

  /* The ajax options to be applied before submission */
  ajaxOptions: function() {
    return this.options.ajax;
  },

  /* the process of applying form data to the model. */
  applyFieldsToModel: function(/* form */) {
    this.readBoundFields();
  },

  // ** pie.formView.onInvalid **
  //
  // For the inheriting class to override.
  onInvalid: function(/* form */) {},


  // ** pie.formView.onValid **
  //
  // What happens when the model validations pass.
  // By default, the data is prepared for submission via `prepareSubmissionData`
  // and sent to `performSubmit`.
  onValid: function(form) {
    this.prepareSubmissionData(function(data) {

      this.performSubmit(form, data, function(bool, data) {

        if(bool) {
          this._onSuccess(data);
        } else {
          this._onFailure(data);
        }
      }.bind(this));

    }.bind(this));

  },

  // ** pie.formView.performSubmit **
  //
  // By default it builds an ajax request based on `this.options.ajax`
  // and / or the <form> tag identified by `form`.
  // Upon success or failure of the request, the `cb` is invoked with
  // a signature of `cb(success?, responseData)`
  // ```
  // formView.performSubmit(<form>, {foo: 'bar'}, function(isSuccess, data){ console.log(isSuccess, data); });
  // ```
  performSubmit: function(form, data, cb) {
    var request = app.ajax.ajax(pie.object.merge({
      url: form.getAttribute('action'),
      verb: form.getAttribute('method') || 'post',
      data: data
    }, this.ajaxOptions()));

    request.dataSuccess(function(d){
      cb(true, d);
    });

    request.extraError(function(xhr) {
      cb(false, xhr.data);
    });
  },

  /* for the inheriting class to override. */
  onFailure: function(/* response, xhr */) {},

  /* for the inheriting class to override. */
  onSuccess: function(/* response, xhr */) {},

  // ** pie.formView.prepareSubmissionData **
  //
  // The data to be sent to the server.
  // By default these are the defined fields extracted out of the model.
  prepareSubmissionData: function(cb) {
    var fieldNames = pie.array.map(this.options.fields, 'name'),
    data = this.model.gets(fieldNames);

    if(cb) cb(data);
    return data;
  },

  // ** pie.formView.validateModel **
  //
  // Perform validations on the model & invoke `cb` when complete.
  // By default, `model.validateAll` will be invoked but this can be overridden
  // to talk to external services, etc.
  validateModel: function(cb) {
    this.model.validateAll(cb);
  },

  // ** pie.formView.validateAndSubmitForm **
  //
  // Start the submission process. We apply our form fields to the model
  // via `applyFieldsToModel`, fire a submit event via our emitter, then
  // begin the validation process via `validateModel`. If the model validates,
  // we invoke our `onValid` function, otherwise the `onInvalid` function.
  validateAndSubmitForm: function(e) {
    this.consumeEvent(e);

    var form = e && e.delegateTarget;

    this.applyFieldsToModel(form);

    this.emitter.fire('submit');

    this.validateModel(function(bool) {
      if(bool) {
        this._onValid(form);
      } else {
        this._onInvalid(form);
      }
    }.bind(this));
  }

};
// # Pie ListView
//
// A view mixin for easily managing a series of items. It assumes the activeView mixin has already been applied to your view.
// ```
// UserList = pie.view.extend(pie.mixins.activeView, pie.mixins.listView);
// list = new UserList({
//   template: 'userList',
//   list: {
//     containerSel: 'ul.js-user-list'
//   },
//   item: {
//     templateName: 'userItem'
//   }
// });
// ```
pie.mixins.listView = (function(){

  var _listItemClass;
  var listItemClass = function(){
    return _listItemClass = _listItemClass || pie.view.extend('defaultListItemView', pie.mixins.activeView);
  };
  return {

    init: function() {

      this._super.apply(this, arguments);

      this.options = pie.object.deepMerge({
        listOptions: {
          containerSel: 'ul, ol, .js-items-container',
          loadingClass: 'is-loading',
          modelAttribute: 'items'
        },
        itemOptions: {
          viewClass: null,
          template: null
        }
      }, this.options);

      if(!this.options.itemOptions.viewClass && !this.options.itemOptions.template) {
        throw new Error("No viewClass or template provided for the itemOptions");
      }

      this.list = this.list || new pie.list([]);
    },

    setup: function() {
      this.onChange(this.list, this.renderItems.bind(this), this.options.listOptions.modelAttribute);
      this.emitter.on('afterRender', this.renderItems.bind(this));

      this._super.apply(this, arguments);
    },

    addItems: function() {
      var container = this.qs(this.options.listOptions.containerSel),
        opts = pie.object.dup(this.options.itemOptions),
        klass = opts.viewClass || listItemClass(),
        afterRenders = [],
        child;

      delete opts.viewClass;

      this.listData().forEach(function(data, i) {
        child = new klass(opts, data);

        // we subscribe to each child's after render to understand when our "loading" style can be removed.
        afterRenders.push(function(cb) {
          child.emitter.once('afterRender', cb, {immediate: true});
        });

        this.addChild('list-item-' + i, child);

        // we append to the dom before setup to preserve ordering.
        child.appendToDom(container);
        child.setup();

      }.bind(this));

      pie.fn.async(afterRenders, this.setListLoadingStyle.bind(this));
    },

    removeItems: function() {
      var regex = /^list\-item\-/, child;

      pie.array.grep(Object.keys(this.childNames), regex).forEach(function(name) {
        child = this.getChild(name);
        this.removeChild(child);
        child.teardown();
      }.bind(this));
    },

    renderItems: function(templateName) {
      this.setListLoadingStyle(true);
      this.removeItems();
      this.addItems();
    },

    setListLoadingStyle: function(bool) {
      var className = this.options.listOptions.loadingClass;
      if(!className) return;

      var container = this.qs(this.options.listOptions.containerSel);
      container.classList[bool ? 'add' : 'remove'](className);
    },

    listData: function() {
      return this.list.get(this.options.listOptions.modelAttribute) || [];
    }

  };
})();
pie.mixins.validatable = {

  init: function() {
    this.validations = [];
    this.validationStrategy = 'dirty';

    if(this._super) this._super.apply(this, arguments);

    if(!this.data.validationErrors) this.data.validationErrors = {};

    this.compute('isValid', 'validationErrors');
  },

  isValid: function() {
    return Object.keys(this.get('validationErrors')).length === 0;
  },

  // default to a model implementation
  reportValidationError: (function(){
    var opts = {noDeleteRecursive: true};

    return function(key, errors) {
      errors = errors && errors.length ? errors : undefined;
      this.set('validationErrors.' + key, errors, opts);
    };
  })(),

  // validates({name: 'presence'});
  // validates({name: {presence: true}});
  // validates({name: ['presence', {format: /[a]/}]})
  validates: function(obj, validationStrategy) {
    var configs, resultConfigs;

    this.validations = this.validations || {};

    Object.keys(obj).forEach(function(k) {
      // always convert to an array
      configs = pie.array.from(obj[k]);
      resultConfigs = [];

      configs.forEach(function(conf) {

        // if it's a string or a function, throw it in directly, with no options
        if(pie.object.isString(conf)) {
          resultConfigs.push({type: conf, options: {}});
        // if it's a function, make it a type function, then provide the function as an option
        } else if(pie.object.isFunction(conf)){
          resultConfigs.push({type: 'fn', options: {fn: conf}});
        // otherwise, we have an object
        } else {

          // iterate the keys, adding a validation for each
          Object.keys(conf).forEach(function(confKey){
            if (pie.object.isObject(conf[confKey])) {
              resultConfigs.push({type: confKey, options: conf[confKey]});

            // in this case, we convert the value to an option
            // {presence: true} -> {type: 'presence', {presence: true}}
            // {format: /.+/} -> {type: 'format', {format: /.+/}}
            } else {
              resultConfigs.push({
                type: confKey,
                options: pie.object.merge({}, conf)
              });
            }
          });
        }

      });

      // append the validations to the existing ones
      this.validations[k] = this.validations[k] || [];
      this.validations[k] = this.validations[k].concat(resultConfigs);

      this.observe(function(changes){
        var change = changes.get(k);
        return this.validationChangeObserver(change);
      }.bind(this), k);

    }.bind(this));

    if(validationStrategy !== undefined) this.validationStrategy = validationStrategy;
  },

  // Invoke validateAll with a set of optional callbacks for the success case and the failure case.
  // this.validateAll(function(){ alert('Success!'); }, function(){ alert('Errors!'); });
  // validateAll will perform all registered validations, asynchronously. When all validations have completed, the callbacks
  // will be invoked.
  validateAll: function(cb) {
    var ok = true,
    keys = Object.keys(this.validations),
    fns,
    whenComplete = function() {
      if(cb) cb(ok);
      return void(0);
    },
    counterObserver = function(bool) {
      ok = !!(ok && bool);
    };

    if(!keys.length) {
      return whenComplete();
    } else {

      fns = keys.map(function(k){
        return function(cb) {
          return this.validate(k, cb);
        }.bind(this);
      }.bind(this));

      // start all the validations
      pie.fn.async(fns, whenComplete, counterObserver);

      return void(0); // return undefined to ensure we make our point about asynchronous validation.
    }
  },


  validationChangeObserver: function(change) {
    if(this.validationStrategy === 'validate') {
      this.validate(change.name);
    } else if(this.validationStrategy === 'dirty') {
      // for speed.
      if(this.data.validationErrors[change.name] && this.data.validationErrors[change.name].length) {
        this.reportValidationError(change.name, undefined);
      }
    }
  },

  // validate a specific key and optionally invoke a callback.
  validate: function(k, cb) {
    var validators = this.app.validator,
    validations = pie.array.from(this.validations[k]),
    value = this.get(k),
    valid = true,
    fns,
    messages,

    // The callback invoked after each individual validation is run.
    // It updates our validity boolean
    counterObserver = function(validation, bool) {
      valid = !!(valid && bool);
      if(!bool) {
        messages = messages || [],
        messages.push(validators.errorMessage(validation.type, validation.options));
      }
    },

    // When all validations for the key have run, we report any errors and let the callback know
    // of the result;
    whenComplete = function() {
      this.reportValidationError(k, messages);
      if(cb) cb(valid);
      return void(0);
    }.bind(this);

    if(!validations.length) {
      return whenComplete();
    } else {

      // grab the validator for each validation then invoke it.
      // if true or false is returned immediately, we invoke the callback otherwise we assume
      // the validation is running asynchronously and it will invoke the callback with the result.
      fns = validations.map(function(validation) {

        return function(callback) {
          var validator = validators[validation.type],
          innerCB = function(result) { callback(validation, result); },
          result = validator.call(validators, value, validation.options, innerCB);

          if(result === true || result === false) {
            callback(validation, result);
          } // if anything else, then the validation assumes responsibility for invoking the callback.
        };
      });

      pie.fn.async(fns, whenComplete, counterObserver);

      return void(0);
    }
  }
};
pie.base = function() {
  pie.setUid(this);
  this.init.apply(this, arguments);
  if(!this.app) {
    if(this.options && this.options.app) this.app = this.options.app;
    else this.app = pie.appInstance;
  }
};
pie.base.prototype.init = function(){};

pie.base.prototype.reopen = function() {
  var extensions = pie.array.change(arguments, 'from', 'flatten'),
  extender = function(k,fn) {
    this[k] = pie.base._wrap(fn, this[k]);
  }.bind(this);

  extensions.forEach(function(e) {
    pie.object.forEach(e, extender);
    if(e.init) e.init.call(this);
  }.bind(this));

  return this;
};

pie.base.subClasses = [];

pie.base.extend = function() {
  return pie.base._extend(pie.base, arguments);
};

pie.base.reopen = function() {
  return pie.base._reopen(pie.base, arguments);
};

pie.base._extend = function(parentClass, extensions) {
  extensions = pie.array.change(extensions, 'from', 'flatten');

  var oldLength = extensions.length;
  extensions = pie.array.compact(extensions);

  if(extensions.length !== oldLength) throw new Error("Null values not allowed");

  var name = "", child;

  if(pie.object.isString(extensions[0])) {
    name = extensions.shift();
  }

  if(pie.object.isFunction(extensions[0])) {
    extensions.unshift({init: extensions.shift()});
  }

  if(!name) {
    name = pie.object.getPath(extensions[0], 'init.name') || '';
  }

  child = new Function(
    "var f = function " + name + "(){\n" +
    "  var myProto = Object.getPrototypeOf(this);\n" +
    "  var parentProto = Object.getPrototypeOf(myProto);\n" +
    "  parentProto.constructor.apply(this, arguments);\n" +
    "};\n" +
    // ensures the function name is released. Certain browsers (take a guess)
    // have an issue with conflicting function names.
    (name ? "var " + name + " = null;\n" : "") +
    "return f;"
  )();



  child.className  = name;

  // We don't set the constructor of the prototype since it would cause
  // an infinite loop upon instantiation of our object. (due to the constructor.apply(this) & multiple levels of inheritance.)
  child.prototype = Object.create(parentClass.prototype);
  child.prototype.className = name;

  child.extend = function() {
    return pie.base._extend(child, arguments);
  };

  child.reopen = function() {
    return pie.base._reopen(child, arguments);
  };

  if(extensions.length) child.reopen(extensions);

  return child;
};

pie.base._reopen = function(klass, extensions) {
  extensions = pie.array.change(extensions, 'from', 'flatten', 'compact');
  extensions.forEach(function(ext) {
    pie.object.forEach(ext, function(k,v) {
      klass.prototype[k] = pie.base._wrap(v, klass.prototype[k]);
    });
  });
};

pie.base._wrap = (function() {

  var fnTest = /xyz/.test(function(){ "xyz"; });
  fnTest = fnTest ? /\b_super\b/ : /.*/;

  return function(newF, oldF) {
    /* jslint eqnull:true */

    // if we're not defining anything new, return the old definition.
    if(newF == null) return oldF;
    // if there is no old definition
    if(oldF == null) return newF;
    // if we're not overriding with a function
    if(!pie.object.isFunction(newF)) return newF;
    // if we're not overriding a function
    if(!pie.object.isFunction(oldF)) return newF;
    // if it doesn't call _super, don't bother wrapping.
    if(!fnTest.test(newF)) return newF;

    return function superWrapper() {
      var ret, sup = this._super;
      this._super = oldF;
      ret = newF.apply(this, arguments);
      if(!sup) delete this._super;
      else this._super = sup;
      return ret;
    };
  };
})();
// # Pie App
//
// The app class is the entry point of your application. It acts as the container in charge of managing the page's context.
// It provides access to application utilities, routing, templates, i18n, etc.
// It observes browser and link navigation and changes the page's context automatically.
pie.app = pie.base.extend('app', {
  init: function(options) {


    /* `pie.base.prototype.constructor` handles the setting of an app, */
    /* but we don't want a reference to another app within this app. */
    delete this.app;

    /* Set a global instance which can be used as a backup within the pie library. */
    pie.appInstance = pie.appInstance || this;

    /* Register with pie to allow for nifty global lookups. */
    pie.apps[this.pieId] = this;

    /* Default application options. */
    this.options = pie.object.deepMerge({
      uiTarget: 'body',
      unsupportedPath: '/browser/unsupported',
      notificationStorageKey: 'js-alerts',
      verifySupport: true
    }, options);

    if(this.options.verifySupport && !this.verifySupport()) {
      window.location.href = this.options.unsupportedPath;
      return;
    }

    // `classOption` allows class configurations to be provided in the following formats:
    // ```
    // new pie.app({
    //   i18n: myCustomI18nClass,
    //   i18nOptions: {foo: 'bar'}
    // });
    // ```
    // which will result in `this.i18n = new myCustomI18nClass(this, {foo: 'bar'});`
    //
    // Alternatively you can provide instances as the option.
    // ```
    // var instance = new myCustomI18nClass();
    // new pie.app({
    //   i18n: instance,
    // });
    // ```
    // which will result in `this.i18n = instance; this.i18n.app = this;`
    var classOption = function(key, _default){
      var k = this.options[key] || _default,
      opt = this.options[key + 'Options'] || {};

      if(pie.object.isFunction(k)) {
        return new k(this, opt);
      } else {
        k.app = this;
        return k;
      }
    }.bind(this);


    // `app.config` is a model used to manage configuration objects.
    this.config = classOption('config', pie.config);

    // `app.cache` is a centralized cache store to be used by anyone.
    this.cache = classOption('cache', pie.cache);

    // `app.emitter` is an interface for subscribing and observing app events
    this.emitter = classOption('emitter', pie.emitter);

    // `app.i18n` is the translation functionality
    this.i18n = classOption('i18n', pie.i18n);

    // `app.ajax` is ajax interface + app specific functionality.
    this.ajax = classOption('ajax', pie.ajax);

    // `app.notifier` is the object responsible for showing page-level notifications, alerts, etc.
    this.notifier = classOption('notifier', pie.notifier);

    // `app.errorHandler` is the object responsible for
    this.errorHandler = classOption('errorHandler', pie.errorHandler);

    // After a navigation change, app.parsedUrl is the new parsed route
    this.parsedUrl = new pie.model({});

    // `app.router` is used to determine which view should be rendered based on the url
    this.router = classOption('router', pie.router);

    // `app.routeHandler` extracts information from the current route and determines what to do with it.
    this.routeHandler = classOption('routeHandler', pie.routeHandler);

    // `app.resources` is used for managing the loading of external resources.
    this.resources = classOption('resources', pie.resources);

    // Template helper methods are evaluated to the local variable `h` in templates.
    // Any methods registered with this helpers module will be available in templates
    // rendered by this app's `templates` object.
    this.helpers = classOption('helpers', pie.helpers);

    // `app.templates` is used to manage and render application templates.
    this.templates = classOption('templates', pie.templates);

    // `app.navigator` is the only navigator which should exist and be used within this app.
    // Multiple apps and navigators can exist but one must take the lead for actually changing
    // browser state. See more in the pie.navigator class.
    this.navigator = classOption('navigator', pie.navigator);

    // `app.validator` a validator intance to be used in conjunction with this app's model activity.
    this.validator = classOption('validator', pie.validator);

    // We observe the navigator and tell the router to parse the new url
    this.navigator.observe(this.parseUrl.bind(this));

    // Watch for changes to the parsedUrl
    this.parsedUrl.observe(this.parsedUrlChanged.bind(this));


    // Before we get going, observe link navigation & show any notifications stored
    // in localStorage.
    this.emitter.once('beforeStart', this.setupSinglePageLinks.bind(this));
    this.emitter.once('afterStart', this.showStoredNotifications.bind(this));

    if(!this.options.noAutoStart) {
      // Once the dom is loaded, start the app.
      document.addEventListener('DOMContentLoaded', this.start.bind(this));
    }
  },

  // Just in case the client wants to override the standard confirmation dialog.
  // Eventually this could create a confirmation view and provide options to it.
  // The view could have more options but would always end up invoking onConfirm or onDeny.
  confirm: function(options) {
    if(window.confirm(options.text)) {
      if(options.onConfirm) options.onConfirm();
    } else {
      if(options.onDeny) options.onDeny();
    }
  },

  debug: function() {
    if(window.console && window.console.log) {
      window.console.log.apply(window.console, arguments);
    }
  },
  // Use this to navigate. This allows us to apply app-specific navigation logic
  // without altering the underling navigator.
  // This can be called with just a path, a path with a query object, or with notification arguments.
  // app.go('/test-url')
  // app.go('/test-url', true) // replaces state rather than adding
  // app.go(['/test-url', {foo: 'bar'}]) // navigates to /test-url?foo=bar
  // app.go('/test-url', true, 'Thanks for your interest') // replaces state with /test-url and shows the provided notification
  // app.go('/test-url', 'Thanks for your interest') // navigates to /test-url and shows the provided notification
  go: function(){
    var args = pie.array.from(arguments), path, notificationArgs, replaceState;

    /* Path is always first. */
    path = args.shift();


    /* Next we check for a query object */
    if(pie.object.isPlainObject(args[0])) {
      path = this.router.path(path, args.shift());

    /* If there is no query object we treat the first arg as an array and apply to router.path */
    /* This enables the user to pass anything to the router.path function by providing an array as the first arg */
    } else {
      path = this.router.path.apply(this.router, pie.array.from(path));
    }

    if(path === this.parsedUrl.get('fullPath')) return;

    /* If the next argument is a boolean, we care about replaceState */
    if(pie.object.isBoolean(args[0])) {
      replaceState = args.shift();
    } else {
      replaceState = false;
    }

    /* Anything left is considered arguments for the notifier. */
    notificationArgs = args;

    if(notificationArgs.length) {
      /* The first argument is the message content, we make sure it's evaluated in our current context */
      /* since we could lose the translation when we move. */
      notificationArgs[0] = this.i18n.attempt(notificationArgs[0]);
    }

    var parsed = this.router.parseUrl(path);
    if(parsed.route && (parsed.view || parsed.redirect)) {

      this.navigator.go(path, {}, replaceState);

      if(notificationArgs.length) {
        this.notifier.notify.apply(this.notifier, notificationArgs);
      }

    } else {

      if(notificationArgs.length) {
        this.store(this.options.notificationStorageKey, notificationArgs);
      }

      this.hardGo(path);
    }
  },

  // Extracted so we can effectively test the logic within `go()` without redirection.
  hardGo: function(path) {
    window.location.href = path;
  },

  // Go back one page.
  goBack: function() {
    window.history.back();
  },

  // Callback for when a link is clicked in our app
  handleSinglePageLinkClick: function(e){

    // If the link is targeting something else, let the browser take over
    if(e.delegateTarget.getAttribute('target')) return;

    // If the user is trying to do something beyond simple navigation, let the browser take over
    if(e.ctrlKey || e.metaKey) return;

    // Extract the location from the link.
    var href = e.delegateTarget.getAttribute('href');

    // If we're going nowhere, somewhere else, or to an anchor on the page, let the browser take over
    if(!href || /^(#|[a-z]+:\/\/)/.test(href)) return;

    // Ensure that relative links are evaluated as relative
    if(href.charAt(0) === '?') href = window.location.pathname + href;

    // Great, we can handle it. let the app decide whether to use pushstate or not
    e.preventDefault();
    this.go(href);
  },

  parseUrl: function() {
    var fromRouter = this.router.parseUrl(this.navigator.get('fullPath'));

    this.parsedUrl.setData(fromRouter);
  },


  parsedUrlChanged: function(changeSet) {
    if(changeSet.has('fullPath')) {
      this.emitter.fire('urlChanged');
    }

    this.routeHandler.handle(changeSet);
  },


  // Reload the page without reloading the browser.
  // Alters the current view's _pieName to appear as invalid for the route.
  refresh: function() {
    var current = this.getChild('currentView');
    current._pieName = '__remove__';
    this.navigationChanged();
  },

  // Safely access localStorage, passing along any errors for reporting.
  retrieve: function(key, clear) {
    var encoded, decoded;

    try {
      if(!window.localStorage) return undefined;

      encoded = window.localStorage.getItem(key);
      decoded = encoded ? JSON.parse(encoded) : undefined;
    } catch(err) {
      this.errorHandler.reportError(err, {
        handledBy: "pie.app#retrieve/getItem",
        key: key
      });
    }

    try {
      if(clear || clear === undefined){
        window.localStorage.removeItem(key);
      }
    } catch(err) {
      this.errorHandler.reportError(err, {
        handledBy: "pie.app#retrieve/removeItem",
        key: key,
        clear: clear
      });
    }

    return decoded;
  },

  // When a link is clicked, go there without a refresh if we recognize the route.
  setupSinglePageLinks: function() {
    var target = pie.qs(this.options.navigationContainer || this.options.uiTarget);
    pie.dom.on(target, 'click', this.handleSinglePageLinkClick.bind(this), 'a[href]');
  },

  // Show any notification which have been preserved via local storage.
  showStoredNotifications: function() {
    var messages = this.retrieve(this.options.notificationStorageKey);

    if(messages && messages.length) {
      this.notifier.notify.apply(this.notifier, messages);
    }
  },

  // Start the app by starting the navigator (which we have observed).
  start: function() {
    this.emitter.fireSequence('start', this.navigator.start.bind(this.navigator));
  },

  // Safely access localStorage, passing along any errors for reporting.
  store: function(key, data) {

    var str;
    try {
      if(!window.localStorage) return false;

      str = JSON.stringify(data);
      window.localStorage.setItem(key, str);
      return true;
    } catch(err) {
      this.errorHandler.reportError(err, {
        handledBy: "pie.app#store",
        key: key,
        data: str
      });
    }
  },

  verifySupport: function() {
    var el = document.createElement('_');

    return !!(el.classList &&
      window.history.pushState &&
      Date.prototype.toISOString &&
      Array.isArray &&
      Array.prototype.forEach &&
      Object.keys &&
      Number.prototype.toFixed);
  }
}, pie.mixins.container);
// # Pie Model
// ### Setters and Getters
// pie.model provides a basic interface for object management and observation.
//
// *example:*
//
// ```
// var user = new pie.model();
// user.set('first_name', 'Doug');
// user.get('first_name') //=> 'Doug'
// user.sets({
//   first_name: 'Douglas',
//   last_name: 'Wilson'
// });
// user.get('last_name') //= 'Wilson'
//
// user.set('location.city', 'Miami')
// user.get('location.city') //=> 'Miami'
// user.get('location') //=> {city: 'Miami'}
// ```
//
// ### Observers
//
// Observers can be added by invoking the model's `observe()` function.
// `pie.model.observe()` optionally accepts 2+ arguments which are used as filters for the observer.
//
// *example:*
//
// ```
// var o = function(changes){ console.log(changes); };
// var user = new pie.model();
// user.observe(o, 'first_name');
// user.sets({first_name: 'first', last_name: 'last'});
// // => o is called and the following is logged:
// [{...}, {
//   name: 'first_name',
//   type: 'new',
//   oldValue:
//   undefined,
//   value: 'first',
//   object: {...}
// }]
// ```
//
// Note that the changes are extended with the `pie.mixin.changeSet` functionality, so check that out too.
//
// ### Computed Properties
//
// `pie.models` can observe themselves and compute properties. The computed properties can be observed
// just like any other property.
//
// *example:*
//
// ```
// var fullName = function(){ return this.get('first_name') + ' ' + this.get('last_name'); };
// var user = new pie.model({first_name: 'Doug', last_name: 'Wilson'});
// user.compute('full_name', fullName, 'first_name', 'last_name');
// user.get('full_name') //=> 'Doug Wilson'
// user.observe(function(changes){ console.log(changes); }, 'full_name');
// user.set('first_name', 'Douglas');
// // => the observer is invoked and console.log provides:
// [{..}, {
//   name: 'full_name',
//   oldValue: 'Doug Wilson',
//   value: 'Douglas Wilson',
//   type: 'update',
//   object: {...}
// }]
// ```
//
// If a function is not provided as the definition of the computed property, it will look
// for a matching function name within the model.


pie.model = pie.base.extend('model', {

  init: function(d, options) {
    this.data = pie.object.merge({_version: 1}, d);
    this.options = options || {};
    this.app = this.app || this.options.app || pie.appInstance;
    this.observations = {};
    this.changeRecords = [];
    this.deliveringRecords = 0;
  },

  // ** pie.model.compute **
  //
  // Register a computed property which is accessible via `name` and defined by `fn`.
  // Provide all properties which invalidate the definition.
  // If the definition of the property is defined by a function of the same name, the function can be ommitted.
  // ```
  // Model.prototype.fullName = function(){ /*...*/ }
  // model.compute('fullName', 'first_name', 'last_name');
  // model.compute('displayName', function(){}, 'fullName');
  // ```
  compute: function(/* name, fn?[, prop1, prop2 ] */) {
    var props = pie.array.from(arguments),
    name = props.shift(),
    fn = props.shift(),
    wrap;

    props = pie.array.flatten(props);

    if(!pie.object.isFunction(fn)) {
      props.unshift(fn);
      fn = this[name].bind(this);
    }

    wrap = function(/* changes */){
      this.set(name, fn.call(this), {skipObservers: true});
    }.bind(this);

    this.observe(wrap, props);
    this.observations[wrap.pieId].computed = true;

    /* Initialize the computed properties value immediately. */
    this.set(name, fn.call(this));
  },

  // ** pie.model.compute **
  //
  // After updates have been made we deliver our change records to our observers
  deliverChangeRecords: function(options) {
    if(!this.changeRecords.length) return this;
    if(this.deliveringRecords) return this;

    /* This is where the version tracking is incremented. */
    if(!options || !options.skipVersionTracking) this.trackVersion();


    var changeSet = this.changeRecords,
    observers = pie.object.values(this.observations),
    invoker = function(obj) {
      if(changeSet.hasAny.apply(changeSet, obj.keys)) {
        obj.fn.call(null, changeSet);
      }
    },
    o, idx;

    /* We modify the `changeSet` array with the `pie.mixins.changeSet`. */
    pie.object.merge(changeSet, pie.mixins.changeSet);


    /* Deliver change records to all computed properties first. */
    /* This will ensure that the change records include the computed property changes */
    /* along with the original property changes. */
    while(~(idx = pie.array.indexOf(observers, 'computed'))) {
      o = observers[idx];
      observers.splice(idx, 1);
      invoker(o);
    }

    /* Now we reset the changeRecords on this model. */
    this.changeRecords = [];

    /* We increment our deliveringRecords flag to ensure records are delivered in the correct order */
    this.deliveringRecords++;

    /* And deliver the changeSet to each observer. */
    observers.forEach(invoker);

    /* Now we can decrement our deliveringRecords flag and attempt to deliver any leftover records */
    this.deliveringRecords--;
    this.deliverChangeRecords(options);

    return this;

  },

  // ** pie.model.get **
  //
  // Access the value stored at data[key]
  // Key can be multiple levels deep by providing a dot separated key.
  // ```
  // model.get('foo')
  // //=> 'bar'
  // model.get('bar.baz')
  // //=> undefined
  // ```
  get: function(key) {
    return pie.object.getPath(this.data, key);
  },

  // ** pie.model.getOrSet **
  //
  // Retrieve or set a key within the model.
  // The `defaultValue` will only be used if the value at `key` is `== null`.
  // ```
  // model.getOrSet('foo', 'theFirstValue');
  // //=> 'theFirstValue'
  // model.getOrSet('foo', 'theSecondValue');
  // //=> 'theFirstValue'
  // ```
  getOrSet: function(key, defaultValue) {
    var val = this.get(key);
    if(val != null) return val;

    this.set(key, defaultValue);
    return this.get(key);
  },

  // ** pie.model.gets **
  //
  // Retrieve multiple values at once.
  // Returns an object of names & values.
  // Path keys will be transformed into objects.
  // ```
  // model.gets('foo.baz', 'bar');
  // //=> {foo: {baz: 'fooBazValue'}, bar: 'barValue'}
  // ```
  gets: function() {
    var args = pie.array.change(arguments, 'from', 'flatten', 'compact'),
    o = {};

    args.forEach(function(arg){
      if(this.has(arg)) {
        pie.object.setPath(o, arg, this.get(arg));
      }
    }.bind(this));

    return o;
  },

  // ** pie.model.has **
  //
  // Determines whether a path exists in our data.
  // ```
  // model.has('foo.bar')
  // //=> true | false
  // ```
  has: function(path) {
    return !!pie.object.hasPath(this.data, path);
  },

  // ** pie.model.is **
  //
  // Boolean check the value at `path`.
  // ```
  // model.is('foo.bar')
  // //=> true | false
  // ```
  is: function(path) {
    return !!this.get(path);
  },

  // ** pie.model.merge **
  //
  // Set keys, but do so by merging with the current values
  // ```
  // model.set('location.city', "San Francisco")
  // model.set('location.lat', 0);
  // model.set('location.lng', 0);
  // model.merge({location: {lat: 37.77, lng: -122.44}})
  // model.get('location')
  // //=> {city: "San Francico", lat: 37.77, lng: -122.44}
  merge: function(/* objs */) {
    var obj = arguments.length > 1 ? pie.object.deepMerge.apply(null, arguments) : arguments[0]
    obj = pie.object.flatten(obj);
    this.sets(obj);
  },

  // ** pie.model.observe **
  //
  // Register an observer and optionally filter by key.
  // If no keys are provided, any change will result in the observer being triggered.
  // ```
  // model.observe(function(changeSet){
  //   console.log(changeSet);
  // });
  // ```
  // ```
  // model.observe(function(changeSet){
  //   console.log(changeSet);
  // }, 'fullName');
  // ```
  observe: function(/* fn1[, fn2, fn3[, key1, key2, key3]] */) {
    var args = pie.array.change(arguments, 'from', 'flatten'),
    part = pie.array.partition(args, pie.object.isFunction),
    fns = part[0],
    keys = part[1];

    if(!keys.length) keys = ['_version'];

    fns.forEach(function(fn){

      /* Setting the uid is needed because we'll want to manage unobservation effectively. */
      pie.setUid(fn);

      this.observations[fn.pieId] = {
        fn: fn,
        keys: keys
      };

    }.bind(this));

    return this;
  },

  // ** pie.model.reset **
  //
  // Reset a model to it's empty state, without affecting the `_version` attribute.
  // Optionally, you can pass any options which are valid to `sets`.
  // ```
  // model.reset({skipObservers: true});
  // ```
  reset: function(options) {
    var keys = Object.keys(this.data), o = {};

    keys.forEach(function(k){
      if(k === '_version') return;
      o[k] = undefined;
    });

    return this.sets(o, options);
  },

  // ** pie.model.set **
  //
  // Set a `value` on the model at the specified `key`.
  // Valid options are:
  // * skipObservers - when true, observers will not be triggered.
  // * noRecursive   - when true, subpath change records will not be sent.
  // * noDeleteRecursive - when true, a subpath will not be deleted if the new value is `undefined`.
  //
  // *Note: skipping observation does not stop `changeRecords` from accruing.*
  // ```
  // model.set('foo', 'bar');
  // model.set('foo.baz', 'bar');
  // model.set('foo', 'bar', {skipObservers: true});
  // ```
  set: function(key, value, options) {
    var recursive = (!options || !options.noRecursive),
    deleteRecursive = (!options || !options.noDeleteRecursive),
    steps = ~key.indexOf('.') && recursive ? pie.string.pathSteps(key) : null,
    o, oldKeys, type, change;

    change = { name: key, object: this.data };

    if(this.has(key)) {
      change.type = 'update';
      change.oldValue = pie.object.getPath(this.data, key);

      /* If we haven't actually changed, don't bother doing anything. */
      if((!options || !options.force) && value === change.oldValue) return this;
    }

    if(steps) {
      steps.shift();
      steps = steps.map(function(step) {
        o = this.get(step);
        return [step, o && Object.keys(o)];
      }.bind(this));
    }

    change.value = value;

    /* If we are "unsetting" the value, delete the path from `this.data`. */
    if(value === undefined) {
      pie.object.deletePath(this.data, key, deleteRecursive);
      change.type = 'delete';

    /* Otherwise, we set the value within `this.data`. */
    } else {
      pie.object.setPath(this.data, key, value);
      change.type = change.type || 'add';
    }

    /* Add the change to the `changeRecords`. */
    this.changeRecords.push(change);

    /* Compile subpath change records. */
    /* Subpath change records have the same structure but for performance reasons the */
    /* oldValue & value are the sets of the keys rather than the object itself. */
    if(steps) {
      steps.forEach(function(step) {
        oldKeys = step[1];
        step = step[0];

        o = this.get(step);

        /* If we deleted the end of the branch, */
        /* we may have deleted the object itself. */
        if(change.type === 'delete') {
          type = o ? 'update' : 'delete';
        /* If there are no old keys, we are new. */
        } else if(!oldKeys) {
          type = 'add';
        /* Otherwise, we just updated. */
        } else {
          type = 'update';
        }

        // Create the change record with the old & new keys.
        this.changeRecords.push({
          type: type,
          oldValue: oldKeys,
          value: o ? Object.keys(o) : undefined,
          name: step,
          object: this.data
        });
      }.bind(this));
    }

    if(options && options.skipObservers) return this;
    return this.deliverChangeRecords(options);
  },

  // ** pie.model.setData **
  //
  // Update data to contain only the keys defined by obj.
  // Results in the same data value as a `reset` + `sets` BUT change records will reflect
  // the updates, not the removal + the additions.
  //
  // ```
  // model.setData({foo: 'bar', bar: 'baz'})
  // model.setData({bar: 'foo'})
  // //=> change records will include a deleted foo, and an updated bar.
  // model.data
  // //=> {_version: 3, bar: 'foo'}
  // ```
  setData: function(obj, options) {
    var existing = Object.keys(pie.object.flatten(this.data)),
    given = Object.keys(pie.object.flatten(obj)),
    removed = pie.array.subtract(existing, given),
    rmOptions = pie.object.merge({}, options, {skipObservers: true});

    removed = pie.array.remove(removed, '_version');

    removed.forEach(function(rm){
      this.set(rm, undefined, rmOptions);
    }.bind(this));

    return this.sets(obj, options);
  },

  // ** pie.model.sets **
  //
  // Set a bunch of stuff at once.
  // Change records will not be delivered until all keys have been set.
  // ```
  // model.sets({foo: 'bar', baz: 'qux'}, {skipObservers: treu});
  // ```
  sets: function(obj, options) {
    pie.object.forEach(obj, function(k,v) {
      this.set(k, v, {skipObservers: true});
    }.bind(this));

    if(options && options.skipObservers) return this;
    return this.deliverChangeRecords(options);
  },

  // ** pie.model.test **
  //
  // Test a `value` against the value at `path`.
  // If `value` is a regular expression it will stringify the path's value and test against the regex.
  // ```
  // model.test('foo', 'bar');
  // model.test('firstName', 'Douglas');
  // model.test('firstName', /doug/i);
  // ```
  test: function(path, value) {
    var owned = this.get(path);
    if(owned === value) return true;
    else if(owned == null) return false;
    else if (pie.object.isRegExp(value)) return value.test(String(owned));
    else return false;
  },

  // ** pie.model.touch **
  //
  // Bumps the _version by 1 and delivers change records to observers of _version
  // ```
  // model.touch();
  // ```
  touch: function() {
    this.trackVersion();
    this.deliverChangeRecords({skipVersionTracking: true});
  },

  // ** pie.model.trackVersion **
  //
  // Increment the `_version` of this model.
  // Observers are skipped since this is invoked while change records are delivered.
  trackVersion: function() {
    this.set('_version', this.get('_version') + 1, {skipObservers: true});
  },

  // ** pie.model.unobserve **
  //
  // Unregister an observer. Optionally for specific keys.
  // If a subset of the original keys are provided it will only unregister
  // for those provided.
  unobserve: function(/* fn1[, fn2, fn3[, key1, key2, key3]] */) {
    var args = pie.array.change(arguments, 'from', 'flatten'),
    part = pie.array.partition(args, pie.object.isFunction),
    fns = part[0],
    keys = part[1],
    observation;

    fns.forEach(function(fn){
      pie.setUid(fn);

      observation = this.observations[fn.pieId];
      if(!observation) return;

      if(!keys.length) {
        delete this.observations[fn.pieId];
        return;
      }

      observation.keys = pie.array.subtract(observation.keys, keys);

      if(!observation.keys.length) {
        delete this.observations[fn.pieId];
        return;
      }
    }.bind(this));

    return this;
  }
});
// # Pie Config
// A place to store app configuration information.
// It allows for dynamic subconfigs to be defined as well.
//
// ```
// app.config.set('googleMapsKey', 'xyz');
// app.config.dynamic('env', {
//   "defaults" : {
//     analyticsEnabled: false
//   },
//   "production" : {
//     analyticsEnabled: true
//   }
// });
//
// app.config.get('googleMapsKey')
// //=> 'xyz'
//
// app.config.get('analyticsEnabled');
// //=> false
//
// app.config.set('env', 'production');
// app.config.get('analyticsEnabled');
// //=> true
// ```
pie.config = pie.model.extend('config', {

  init: function(app, options) {
    options = options || {};
    options.app = app;

    this._super({}, options);
    this.dynamicKeys = {};
  },

  _onDynamicChange: function(dynamic) {
    var val = this.get(dynamic),
    defaults, conf;

    defaults = this.get(dynamic + 'Config.defaults');
    conf = val && this.get(dynamic + 'Config.' + val);

    this.sets(pie.object.deepMerge({}, defaults, conf));
  },

  dynamic: function(dynamic, obj) {
    var current = this.get(dynamic + 'Config') || {};
    this.set(dynamic + 'Config', pie.object.deepMerge(current, obj));

    if(!this.dynamicKeys[dynamic]) {
      this.dynamicKeys[dynamic] = true;
      this.observe(function(){
        this._onDynamicChange(dynamic);
      }.bind(this), dynamic);
    }

    this._onDynamicChange(dynamic);
  }

});
// # Pie View
//
// Views are objects which wrap and interact with DOM. They hold reference to a single element via `this.el`. All
// event obsrevation, delegation, and querying is conducted within the scope of the view's `el`.
//
// Views are equipped with an emitter. The emitter can be utilized for observing any type of lifecycle activity.
// View lifecycle:
//   * init - the constructor
//   * setup - if `setup: true` is provided to the constructor this will happen immediately after instantiation, otherwise this needs to be invoked.
//   * attach - the stage in which the view's el is added to the DOM.
//   * user interaction
//   * teardown - removes any added events from the dom elements, removes any model observations, removes the el from the dom, etc.
//   * detach - when the view's el is removed from the DOM.
pie.view = pie.base.extend('view');

/* true constructor overriden to invoke setup after init() is finished if `setup:true` was provided as an option */
pie.view.prototype.constructor = function view() {
  pie.base.prototype.constructor.apply(this, arguments);
  if(this.options.setup) this.setup();
};

pie.view.reopen({

  // **pie.view.init
  // Options:
  //   * el - (optional) the root element of the views control. if not provided, a new <div> will be created.
  //   * app - (optional) the app this view is associated with.
  //   * uiTarget - (optional) element to attach to. if provided, after this view is set up it will automatically attach this element.
  //   * setup - (option) if truthy, this view's setup function will be called directly after initialization.
  init: function(options) {
    this.options = options || {},
    this.app = this.options.app || pie.appInstance;
    this.el = this.options.el || pie.dom.createElement('<div></div>');
    this.eventedEls = [];
    this.changeCallbacks = [];

    this.emitter = new pie.emitter();

    if(this.options.uiTarget) {
      this.emitter.once('afterSetup', this.appendToDom.bind(this));
    }
  },

  // **pie.view.addedToParent**
  //
  // Accommodates the `addedToParent` hook event in pie.container.
  // Emits the event via the emitter, meaning this can be subscribed to in the init or setup process.
  addedToParent: function() {
    this.emitter.fire('addedToParent');
  },

  // **pie.view.appendToDom**
  //
  // A function which appends the view's el to the DOM within target (or this.options.uiTarget).
  // An "attach" sequence is fired so views can control how they enter the DOM.
  appendToDom: function(target) {
    target = target || this.options.uiTarget;
    if(target !== this.el.parentNode) {
      this.emitter.fireSequence('attach', function(){
        target.appendChild(this.el);
      }.bind(this));
    }
  },

  // **pie.view.consumeEvent**
  //
  // A utility method for consuming an event, and optionally immediately stopping propagation.
  // ```
  // clickCallback: function(e) {
  //   this.consumeEvent(e);
  //   console.log(e.delegateTarget.href);
  // }
  // ```
  consumeEvent: function(e, immediate) {
    if(e) {
      e.preventDefault();
      e.stopPropagation();
      if(immediate) e.stopImmediatePropagation();
    }
  },

  // **pie.view.eventNamespace**
  //
  // The namespace used for this view's events. All views have a separate namespace to ensure
  // event triggers are propagated efficiently.
  eventNamespace: function() {
    return 'view'+ this.pieId;
  },


  // **pie.view.navigationUpdated**
  //
  // When navigation changes but this view is still deemed relevant by the routeHandler, `navigationUpdated` will be invoked.
  // A `navigationUpdated` event is emmitted, then all children are checked for a navigationUpdated function which, if found, is invoked.
  navigationUpdated: function(changeSet) {
    this.emitter.fire('navigationUpdated', changeSet);
    this.children.forEach(function(c){
      if(pie.object.has(c, 'navigationUpdated', true)) c.navigationUpdated(changeSet);
    });
  },


  // **pie.view.on**
  //
  // Observe a dom event and invoke the provided functions.
  // By default all events are delegated to this.el, but if you pass in an element as the last argument
  // that will be used. If the functions are provided as strings, they will be looked up on `this`.
  //
  // ```
  // view.on('click', 'a', this.handleClick.bind(this), this.trackClickEvent.bind(this));
  // view.on('submit', 'form', 'handleSubmit');
  // view.on('resize', null, 'onResize', window);
  // ```
  on: function(/* e, sel, f1, f2, f3, el */) {
    var fns = pie.array.from(arguments),
        events = fns.shift(),
        sel = fns.shift(),
        ns = this.eventNamespace(),
        f2, el;

    if(!pie.object.isFunction(pie.array.get(fns, -1))) el = fns.pop();
    el = el || this.el;

    if(!~this.eventedEls.indexOf(el)) this.eventedEls.push(el);

    events = events.split(' ');

    fns.forEach(function(fn) {
      fn = pie.object.isString(fn) ? this[fn].bind(this) : fn;

      f2 = function(e){
        if(e.namespace === ns) {
          return fn.apply(this, arguments);
        }
      };

      events.forEach(function(ev) {
        ev += "." + ns;
        pie.dom.on(el, ev, f2, sel);
      }.bind(this));

    }.bind(this));

    return this;
  },

  // **pie.view.onChange**
  //
  // Observe changes of an model, unobserving them when the view is removed.
  // If the object is not observable, an error will be thrown.
  // The first argument must be the observable model, the remaining arguments must match
  // the expected arguments of model.observe.
  // ```
  // view.onChange(user, this.onNameChange.bind(this), 'firstName', 'lastName');
  // view.onChange(context, this.onContextChange.bind(this));
  // ```
  onChange: function() {

    var parts = pie.array.partitionAt(arguments, pie.object.isFunction),
    observables = parts[0],
    args = parts[1];

    observables.forEach(function(observable){
      if(!pie.object.has(observable, 'observe', true)) throw new Error("Observable does not respond to observe");

      this.changeCallbacks.push({
        observable: observable,
        args: args
      });

      observable.observe.apply(observable, args);
    }.bind(this));


  },


  // **pie.view.qs**
  //
  // Shortcut for this.el.querySelector
  qs: function(selector) {
    return this.el.querySelector(selector);
  },


  // **pie.view.qsa**
  //
  // shortcut for this.el.querySelectorAll
  qsa: function(selector) {
    return this.el.querySelectorAll(selector);
  },

  // **pie.view.removeFromDom**
  //
  // Assuming the view's el is in the DOM, a detach sequence will be invoked, resulting in the el being removed.
  // Note we don't use pie.dom.remove since we know we're cleaning up our events. Multiple views could be associated
  // with the same el.
  removeFromDom: function() {
    if(this.el.parentNode) {
      this.emitter.fireSequence('detach', function() {
        this.el.parentNode.removeChild(this.el);
      }.bind(this));
    }
  },

  // **pie.view.removedFromParent**
  //
  // Accommodates the `removedFromParent` hook event in pie.container.
  // It emits a `removedFromParent` event which can be observed in the setup process.
  removedFromParent: function() {
    this.emitter.fire('removedFromParent');
  },

  // **pie.view.setup**
  //
  // Placeholder for default functionality.
  // By default, the setup event is triggered on the emitter.
  setup: function(){
    this.emitter.fireSequence('setup');
    return this;
  },


  // **pie.view.teardown**
  //
  // This function should be invoked when it's ready to dismiss the view.
  // Upon invocation, a `teardown` sequence is emitted.
  // When teardown runs, the view's `el` is removed from the dom, all observations are removed,
  // and all children have teardown invoked.
  teardown: function() {

    this.emitter.fireSequence('teardown', function() {

      this.removeFromDom();

      this._unobserveEvents();
      this._unobserveChangeCallbacks();

      this.teardownChildren();
      /* views remove their children upon removal to ensure all irrelevant observations are cleaned up. */
      this.removeChildren();

    }.bind(this));

    return this;
  },

  // **pie.view.teardownChildren**
  //
  // Invokes teardown on each child that responds to it.
  teardownChildren: function() {
    this.children.forEach(function(child) {
      if(pie.object.has(child, 'teardown', true)) child.teardown();
    });
  },

  /* release all observed events. */
  _unobserveEvents: function() {
    var key = '*.' + this.eventNamespace();
    this.eventedEls.forEach(function(el) {
      pie.dom.off(el, key);
    });
  },


  /* release all change callbacks. */
  _unobserveChangeCallbacks: function() {
    var a;
    while(this.changeCallbacks.length) {
      a = this.changeCallbacks.pop();
      a.observable.unobserve.apply(a.observable, a.args);
    }
  }

}, pie.mixins.container);
// activeView has moved to a mixin, you should use the mixin rather than this class.
// This class is being preserved for the sake of backwards compatability.
pie.activeView = pie.view.extend('activeView', pie.mixins.activeView);
pie.ajaxRequest = pie.model.extend('ajaxRequest', {

  init: function(data, options) {
    this._super(data, options);

    this.getOrSet('headers', {});

    this.xhr = null;
    this.emitter = new pie.emitter();

    this.validates({
      url: { presence: true },
      verb: { inclusion: { in: pie.object.values(this.VERBS) }}
    }, null);
  },

  VERBS: {
    del: 'DELETE',
    get: 'GET',
    patch: 'PATCH',
    post: 'POST',
    put: 'PUT'
  },

  _append: function(name, fns, immediate) {
    fns = pie.array.change(fns, 'from', 'flatten');
    fns.forEach(function(fn){
      this.emitter.on(name, fn, {immediate: immediate});
    }.bind(this));
  },

  _onDataSuccess: function(data) {
    this.emitter.fire('dataSuccess', data);
  },

  _onSetModel: function(data) {
    this.emitter.fire('setModel', data);
  },

  _onSuccess: function(data, xhr) {
    this.emitter.fire('success', data, xhr);
  },

  _onComplete: function(xhr) {
    this.emitter.fire('complete', xhr);
  },

  _onError: function(xhr) {
    this.emitter.fire('error', xhr);
    this.emitter.fire('extraError', xhr);
  },

  _onProgress: function(event) {
    this.emitter.fire('progress', event);
  },

  _onUploadProgress: function(event) {
    this.emitter.fire('uploadProgress', event);
  },

  _parseOptions: function(options) {
    if(!options) return;

    options = pie.object.merge({}, options);

    ['setup', 'complete', 'dataSuccess', 'error', 'extraError', 'progress', 'success', 'uploadProgress', 'setModel'].forEach(function(n){
      if(options[n]) {

        pie.array.from(options[n]).forEach(function(fn){
          this[n](fn);
        }.bind(this));

        delete options[n];
      }
    }.bind(this));

    this.sets(options);
  },

  _validateOptions: function(cb) {
    // upcase before we validate inclusion.
    if(this.get('verb')) this.set('verb', this.get('verb').toUpperCase());

    this.validateAll(function(bool){
      if(!bool) throw new Error(JSON.stringify(this.get('validationErrors')));
      cb();
    }.bind(this));
  },

  _applyHeaders: function(xhr) {

    var accept = this.get('accept'),
    contentType = this.get('contentType'),
    headers = this.get('headers'),
    data = this.get('data');

    this._applyCsrfToken(xhr);

    if(accept) {
      headers['Accept'] = accept;
    }

    if(contentType !== false) {

      if(contentType) {
        headers['Content-Type'] = contentType;
      }

      if(!headers['Content-Type']) {
        if(pie.object.isString(data) || window.FormData && data instanceof window.FormData) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        // if we aren't already sending a string, we will encode to json.
        } else {
          headers['Content-Type'] = 'application/json';
        }
      }

    }

    pie.object.forEach(headers, function(k,v) {
      xhr.setRequestHeader(k, v);
    });

  },

  _applyCsrfToken: function(xhr) {

    var token = pie.fn.valueFrom(this.get('csrfToken'));

    token = token || this.app.cache.getOrSet('csrfToken', function() {
      var el = pie.qs('meta[name="csrf-token"]');
      return el ? el.getAttribute('content') : null;
    });

    if(token) {
      xhr.setRequestHeader('X-CSRF-Token', token);
    }
  },

  _parseResponse: function(xhr) {
    var accept = this.get('accept'),
    parser = accept && this.responseParsers[accept] || this.responseParsers.default;
    xhr.data = this.response = parser.call(this, xhr);
  },

  responseParsers: {

    "application/json" : function(xhr) {
      try{
        return xhr.responseText.trim().length ? JSON.parse(xhr.responseText) : {};
      } catch(err) {
        this.app.debug.apply(this.app, pie._debugArgs("could not parse JSON response: " + err));
        return {};
      }
    },

    "default" : function(xhr) {
      return xhr.responseText;
    }
  },

  _buildXhr: function() {
    var xhr = new XMLHttpRequest(),
    url = this.get('url'),
    verb = this.get('verb'),
    data = this.get('data'),
    tracker = this.get('tracker'),
    self = this;

    if(verb === this.VERBS.get && data) {
      url = pie.string.urlConcat(url, pie.object.serialize(data));
    }

    url = pie.string.normalizeUrl(url);

    if(this.hasCallback('progress')) {
      xhr.addEventListener('progress', this._onProgress.bind(this), false);
    }

    if(this.hasCallback('uploadProgress')) {
      xhr.upload.addEventListener('progress', this._onUploadProgress.bind(this), false);
    }

    xhr.open(verb, url, true);

    this._applyHeaders(xhr);
    this.emitter.fire('setup', xhr, this);

    xhr.onload = function() {
      if(tracker) tracker(xhr, self);

      self._parseResponse(xhr);

      if(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        self._onDataSuccess(self.response);
        self._onSetModel(self.response);
        self._onSuccess(self.response, xhr);
      } else {
        self._onError(xhr);
      }

      self._onComplete(xhr);
    };

    this.xhr = xhr;

    this.emitter.fire('xhrBuilt');

    return xhr;
  },

  // Validate the options and build the xhr object.
  // By default, it immediately sends the request.
  // By passing `skipSend = false` you can manage the `send()` invocation manually.
  build: function(options, skipSend) {
    this._parseOptions(options);
    this._validateOptions(function(){
      this._buildXhr();
      if(!skipSend) this.send();
    }.bind(this));

    return this;
  },

  // Send the xhr. Assumes build() has been called.
  send: function() {
    var data = this.get('data'), d;

    if(this.get('verb') !== this.VERBS.get) {

      if(pie.object.isString(data) || window.FormData && data instanceof window.FormData) {
        d = data;
      } else {
        d = JSON.stringify(pie.object.compact(data));
      }
    }

    this.xhr.send(d);
    return this;
  },

  // Check if a callback is registered for a specific event.
  hasCallback: function(eventName) {
    return this.emitter.hasCallback(eventName);
  },

  // Register callbacks to be invoked as part of the setup process.
  // Callbacks are provided with the xhr & the request object (this).
  setup: function() {
    this._append('setup', arguments, false);
    return this;
  },

  // Utility method for clearing previous / default events out
  // request.clear('error').error(myErrorHandler);
  clear: function(eventName) {
    this.emitter.clear(eventName);
    return this;
  },

  // Register a callback for when the request is complete.
  complete: function() {
    this._append('complete', arguments, true);
    return this;
  },

  // Register a callback which will only receive the parsed data.
  dataSuccess: function() {
    this._append('dataSuccess', arguments, true);
    return this;
  },

  // Register a callback when the request is unsuccessful.
  // `app.ajax` will provide a default error callback as long as the `error` callbacks are empty.
  // If you would like the default & your error callback, use extraError.
  error: function() {
    this._append('error', arguments, true);
    return this;
  },

  // Register a callback when the request is unsuccessful.
  extraError: function() {
    this._append('extraError', arguments, true);
    return this;
  },

  setModel: function() {
    var fns = pie.array.from(arguments).map(function(m){ return m.sets.bind(m); });
    this._append('setModel', fns, true);
  },

  // Register a callback when the request succeeds.
  // Callbacks are invoked with the parsed response & the xhr object.
  success: function() {
    this._append('success', arguments, true);
    return this;
  },

  // Register a callback to be invoked when progress events are triggered from the request.
  progress: function() {
    this._append('progress', arguments, false);
    return this;
  },

  // Register a callback to be invoked when upload progress events are triggered from the request.
  uploadProgress: function() {
    this._append('uploadProgress', arguments, false);
    return this;
  },

}, pie.mixins.validatable);
pie.ajax = pie.base.extend('ajax', {

  init: function(app){
    this.app = app;
  },

  defaultAjaxOptions: {
    verb: 'GET',
    accept: 'application/json',
    headers: {}
  },

  _normalizeOptions: function(options) {
    if(pie.object.isString(options)) options = {url: options};
    return options;
  },

  // Interface for conducting ajax requests.
  // Returns a pie.ajaxRequest object
  ajax: function(options, skipSend) {
    options = pie.object.deepMerge({}, this.defaultAjaxOptions, this._normalizeOptions(options));

    var request = new pie.ajaxRequest({}, { app: this.app });
    request.build(options, skipSend);

    /* add a default error handler if the user hasn't provided one. */
    if(!request.emitter.hasCallback('error')) {
      request.error(this.app.errorHandler.handleXhrError.bind(this.app.errorHandler));
    }

    return request;
  },


  del: function(options, skipSend) {
    options = pie.object.merge({verb: 'DELETE'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  },

  get: function(options, skipSend) {
    options = pie.object.merge({verb: 'GET'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  },

  patch: function(options, skipSend) {
    options = pie.object.merge({verb: 'PATCH'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  },

  post: function(options, skipSend) {
    options = pie.object.merge({verb: 'POST'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  },

  put: function(options, skipSend) {
    options = pie.object.merge({verb: 'PUT'}, this._normalizeOptions(options));
    return this.ajax(options, skipSend);
  }

});
pie.cache = pie.model.extend('cache', {

  init: function(data, options) {
    this._super(data, options);
  },

  clear: function() {
    this.reset();
  },

  del: function(path) {
    this.set(path, undefined);
  },

  expire: function(path, ttl) {
    var value = this.get(path);

    if(value === undefined) return false;

    this.set(path, value, {ttl: ttl});
    return true;
  },

  get: function(path) {
    var wrap = pie.model.prototype.get.call(this, path);
    if(!wrap) return undefined;
    if(wrap.expiresAt && wrap.expiresAt <= this.currentTime()) {
      this.set(path, undefined);
      return undefined;
    }

    return wrap.data;
  },

  getOrSet: function(path, value, options) {
    var result = this.get(path);
    if(result !== undefined) return result;
    value = pie.fn.valueFrom(value);
    this.set(path, value, options);
    return value;
  },

  set: function(path, value, options) {
    if(value === undefined) {
      pie.model.prototype.set.call(this, path, undefined, options);
    } else {
      var wrap = this.wrap(value, options);
      pie.model.prototype.set.call(this, path, wrap, options);
    }
  },

  wrap: function(obj, options) {
    options = options || {};
    // it could come in on a couple different keys.
    var expiresAt = options.expiresAt || options.expiresIn || options.ttl;

    if(expiresAt) {
      // make sure we don't have a date.
      if(expiresAt instanceof Date) expiresAt = expiresAt.getTime();
      // or a string
      if(pie.object.isString(expiresAt)) {
        // check for a numeric
        if(/^\d+$/.test(expiresAt)) expiresAt = parseInt(expiresAt, 10);
        // otherwise assume ISO
        else expiresAt = pie.date.timeFromISO(expiresAt).getTime();
      }

      // we're dealing with something smaller than a current milli epoch, assume we're dealing with a ttl.
      if(String(expiresAt).length < 13) expiresAt = this.currentTime() + expiresAt;
    }

    return {
      data: obj,
      expiresAt: expiresAt
    };
  },

  currentTime: function() {
    return pie.date.now();
  }
});
// # Pie Emitter
//
// An emitter is an event subscriber & notifier. It's similar to a pubsub implementation but
// allows for blocking of an event via `around` callbacks. It's similar to a promise implementation,
// but doesn't worry itself with the result of the underlying functions.
// ```
// var emitter = new pie.emitter();
//
// emitter.on('foo', function(){} );
// emitter.prepend('foo', function(){} );
//
// emitter.once('afterBar', function(){} );
// emitter.prependOnce('beforeBar', function(){} );
// emitter.once('aroundBar', function(cb){} );
//
// emitter.fire('foo');
// emitter.fireSequence('bar');
// ```
pie.emitter = pie.model.extend('emitter', {

  init: function() {
    this._super({
      triggeredEvents: {},
      eventCallbacks: {}
    });
  },

  // ** pie.emitter.clear **
  //
  // Remove any events registered under `eventName`.
  clear: function(eventName) {
    this.set('eventCallbacks.' + eventName, undefined);
  },

  // ** pie.emitter.hasEvent **
  //
  // Has the event `eventName` been triggered by this emitter yet?
  hasEvent: function(eventName) {
    return !!this.firedCount(eventName);
  },

  // ** pie.emitter.hasCallback **
  //
  // Is there a callback for the event `eventName`.
  hasCallback: function(eventName) {
    var cbs = this.get('eventCallbacks.' + eventName);
    return !!(cbs && cbs.length);
  },

  // ** pie.emitter.firedCount **
  //
  // Count the number of times an event has been triggered
  firedCount: function(eventName) {
    return this.get('triggeredEvents.' + eventName + '.count') || 0;
  },

  lastInvocation: function(eventName) {
    return this.get('triggeredEvents.' + eventName + '.lastArgs') || [];
  },

  // ** pie.emitter.waitUntil **
  //
  // Wait until all `eventNames` have been fired before invoking `fn`.
  // ```
  // emitter.waitUntil('afterSetup', 'afterRender', this.highlightNav.bind(this));
  // ```
  waitUntil: (function(){

    var invalidEventNameRegex = /^around/;

    return function(/* eventNames, fn */) {
      var eventNames = pie.array.from(arguments),
      fn = eventNames.pop(),
      observers;

      observers = eventNames.map(function(event){
        if(invalidEventNameRegex.test(event)) throw new Error(event + " is not supported by waitUntil.");
        return function(cb) {
          this.once(event, cb, {immediate: true});
        }.bind(this);
      }.bind(this));

      pie.fn.async(observers, fn);
    };
  })(),

  // #### Event Observation

  // ** pie.emitter._on **
  //
  // Append or prepend a function `fn` via `meth` to the callbacks registered under `event`.
  // Options are as follows:
  //
  // * **immediate** - trigger the `fn` immediately if the `event` has been fired in the past.
  // * **onceOnly** - trigger the `fn` a single time then remove the observer.
  //
  // _Note that if `immediate` and `onceOnly` are provided as options and the event has been previously
  // triggered, the function will be invoked and nothing will be added to the callbacks._
  _on: function(event, fn, options, meth) {
    options = options || {};
    var lastArgs = this.lastInvocation(event);

    if(options.now || (options.immediate && this.hasEvent(event))) {
      fn.apply(null, lastArgs);
      if(options.onceOnly) return;
    }

    this.getOrSet('eventCallbacks.' + event, [])[meth](pie.object.merge({fn: fn}, options));
  },

  // Same method signature of `_on`, but handles the inclusion of the `onceOnly` option.
  _once: function(event, fn, options, meth) {
    options = pie.object.merge({onceOnly: true}, options);
    this._on(event, fn, options, meth);
  },

  // ** pie.emitter.on **
  //
  // Public interface for invoking `_on` & pushing an event to the end of the callback chain.
  // ```
  // emitter.on('foo', function(){});
  // emitter.on('afterFoo', function(){});
  // ```
  on: function(event, fn, options) {
    this._on(event, fn, options, 'push');
  },

  // ** pie.emitter.prepend **
  //
  // Public interface for invoking `_on` & prepending an event to the beginning of the callback chain.
  // ```
  // emitter.prepend('foo', function(){});
  // ```
  prepend: function(event, fn, options) {
    this._on(event, fn, options, 'unshift');
  },

  // ** pie.emitter.once **
  //
  // Public interface for invoking `_once` & pushing an event to the end of the callback chain.
  // ```
  // emitter.once('foo', function(){}, {immediate: true});
  // ```
  once: function(event, fn, options) {
    this._once(event, fn, options, 'push');
  },

  // ** pie.emitter.prependOnce **
  //
  // Public interface for invoking `_once` & prepending an event to the beginning of the callback chain.
  // ```
  // emitter.prependOnce('foo', function(){});
  // ```
  prependOnce: function(event, fn, options) {
    this._once(event, fn, options, 'unshift');
  },

  // #### Event Triggering

  // ** pie.emitter._reportTrigger **
  //
  // Increment our `triggeredEvents` counter.
  _reportTrigger: function(event, args) {
    var triggered = this.get('triggeredEvents');
    if(!triggered[event]) triggered[event] = {count: 0};
    triggered[event].lastArgs = args;
    triggered[event].count = triggered[event].count + 1;
  },

  // ** pie.emitter.fire **
  //
  // Trigger an `event` causing any registered callbacks to be fired.
  // Any callbacks associated with that event will be invoked with the arguments supplied by positions 1-N.
  // ```
  // emitter.fire('userSignedUp', 'Doug Wilson');
  // //=> invokes all registered callbacks of the `userSignedUp` event with a single argument, "Doug Wilson".
  // ```
  fire: function(/* event, arg1, arg2, */) {

    var args = pie.array.from(arguments),
    event = args.shift(),
    callbacks = this.get('eventCallbacks.' + event),
    compactNeeded = false;

    /* increment our trigger counters */
    this._reportTrigger(event, args);

    if(callbacks) {
      callbacks.forEach(function(cb, i) {
        /* invoke the function for the callback */
        cb.fn.apply(null, args);
        /* if the function is `onceOnly`, clear it out */
        if(cb.onceOnly) {
          compactNeeded = true;
          callbacks[i] = undefined;
        }
      });
    }

    /* if we removed callbacks, clean up */
    if(compactNeeded) this.set('eventCallbacks.' + event, pie.array.compact(callbacks));
  },

  // ** pie.emitter.fireSequence **
  //
  // Fire a sequence of events based on base event name of `event`.
  // Optionally, provide a function `fn` which will be invoked before the base event is fired.
  //
  // ```
  // emitter.fireSequence('foo', barFn);
  // //=> invokes the following sequence:
  // // fires "beforeFoo", fires "aroundFoo", invokes barFn, fires "foo", fires "afterFoo"
  // ```
  fireSequence: function(event, fn) {
    var before = pie.string.modularize("before_" + event),
        after  = pie.string.modularize("after_" + event),
        around = pie.string.modularize('around_' + event);

    this.fire(before);
    this.fireAround(around, function() {
      if(fn) fn();
      this.fire(event);
      this.fire(after);
    }.bind(this));
  },

  // ** pie.emitter.fireAround **
  //
  // Invokes `event` callbacks and expects each callback to invoke a provided callback when complete.
  // After all callbacks have reported that they're finished, `onComplete` will be invoked.
  // ```
  // cb1 = function(cb){ console.log('cb1!'); cb(); };
  // cb2 = function(cb){ console.log('cb2!'); cb(); };
  // emitter.on('aroundFoo', cb1);
  // emitter.on('aroundFoo', cb2);
  // emitter.fireAround('aroundFoo', function(){ console.log('done!'); });
  // //=> console would log "cb1!", "cb2!", "done!"
  // ```
  fireAround: function(event, onComplete) {
    var callbacks = this.get('eventCallbacks.' + event),
    compactNeeded = false,
    fns;

    this._reportTrigger(event);

    if(callbacks) {
      fns = callbacks.map(function(cb, i) {
        if(cb.onceOnly) {
          compactNeeded = true;
          callbacks[i] = undefined;
        }
        return cb.fn;
      });

      if(compactNeeded) this.set('eventCallbacks.' + event, pie.array.compact(callbacks));

      pie.fn.async(fns, onComplete);
    } else {
      onComplete();
    }
  }

});
// # Pie Error Handler
// A class which knows how to handle errors in the app.
// By default, it focuses mostly on xhr issues.
pie.errorHandler = pie.model.extend('errorHandler', {

  init: function(app) {
    this._super({
      responseCodeHandlers: {}
    }, {
      app: app
    });
  },


  /* extract the "data" object out of an xhr */
  xhrData: function(xhr) {
    return xhr.data = xhr.data || (xhr.status ? JSON.parse(xhr.response) : {});
  },


  // ** pie.errorHandler.errorMessagesFromRequest **
  //
  // Extract error messages from a response. Try to extract the messages from
  // the xhr data diretly, or allow overriding by response code.
  // It will look for an "error", "errors", or "errors.message" response format.
  // ```
  // {
  //   errors: [
  //     {
  //       key: 'invalid_email',
  //       message: "Email is invalid"
  //     }
  //   ]
  // }
  // ```
  errorMessagesFromRequest: function(xhr) {
    var d = this.xhrData(xhr),
    errors = pie.array.from(d.error || d.message || d.errors || []),
    clean;

    errors = errors.map(function(e){ return pie.object.isString(e) ? e : e.message; });

    errors = pie.array.compact(errors, true);
    clean   = this.app.i18n.t('app.errors.' + xhr.status, {default: errors});

    this.app.debug.apply(this.app, pie._debugArgs(errors));

    return pie.array.from(clean);
  },

  getResponseCodeHandler: function(status) {
    return this.get('responseCodeHandlers.' + status);
  },

  // ** pie.errorHandler.handleXhrError **
  //
  // Find a handler for the xhr via response code or the app default.
  handleXhrError: function(xhr) {

    var handler = this.getResponseCodeHandler(xhr.status.toString());

    if(handler) {
      handler.call(xhr, xhr);
    } else {
      this.notifyErrors(xhr);
    }

  },

  handleI18nError: function(error, info) {
    this.reportError(error, info);
  },

  // ** pie.errorHandler.notifyErrors **
  //
  // Build errors and send them to the notifier.
  notifyErrors: function(xhr){
    var n = this.app.notifier, errors = this.errorMessagesFromRequest(xhr);

    if(errors.length) {
      /* clear all previous errors when an error occurs. */
      n.clear('error');

      /* delay so UI will visibly change when the same content is shown. */
      setTimeout(function(){
        n.notify(errors, 'error', 10000);
      }, 100);
    }
  },

  // ** pie.errorHandler.registerHandler **
  //
  // Register a response code handler
  // ```
  // handler.registerHandler('401', myRedirectCallback);
  // handler.registerHandler('404', myFourOhFourCallback);
  // ```
  registerHandler: function(responseCode, handler) {
    this.set('responseCodeHandlers.' + responseCode.toString(), handler);
  },


  // ** pie.errorHandler.reportError **
  //
  // Provide an interface for sending errors to a bug reporting service.
  reportError: function(err, options) {
    options = options || {};

    this._reportError(err, options);
  },

  // ** pie.errorHandler._reportError **
  //
  // Hook in your own error reporting service. bugsnag, airbrake, etc.
  _reportError: function(err, options) {
    this.app.debug.apply(this.app, pie._debugArgs(String(err) + " | " + JSON.stringify(options)));
  }
});
// formView has moved to a mixin, you should use the mixin rather than this class.
// This class is being preserved for the sake of backwards compatability.
pie.formView = pie.view.extend('formView', pie.mixins.activeView, pie.mixins.bindings, pie.mixins.formView);
// # Pie Helpers
// A registry for template helpers.
// Any helper function register here will be available in the
// templates rendered by the associated app's `templates` object.
// ```
// helpers.register('upcase', pie.string.upcase);
// helpers.register('reverse', function(str){
//   return str.split('').reverse().join('');
// });
// ```
// Now, in your templates you'll be able to use these helpers:
// ```
// <h1>[%= h.upcase(data.fullName) %]</h1>
// <p>[%= h.reverse(data.jibberish) %]</p>
// ```
// Note: these do not become global functions but rather are local to each template.
pie.helpers = pie.model.extend('helpers', {

  init: function(app, options) {
    this._super({
      fns: {}
    }, {
      app: app,
      variableName: 'h'
    });

    var i18n = this.app.i18n;

    this.register('t', i18n.t.bind(i18n));
    this.register('l', i18n.l.bind(i18n));
    this.register('timeago', i18n.timeago.bind(i18n));
    this.register('path', this.app.router.path.bind(this.app.router));
    this.register('get', pie.object.getPath);
  },

  /* Register a function to be available in templates. */
  register: function(name, fn) {
    return this.set('fns.' + name, fn);
  },

  /* Fetch a helper function */
  fetch: function(name) {
    return this.get('fns.' + name);
  },

  /* Call a helper function */
  call: function(/* name, ..args */) {
    var args = pie.array.from(arguments),
    name = args.shift();

    return this.fetch(name).apply(null, args);
  },

  /* Provide the functions which should be available in templates. */
  functions: function() {
    return this.get('fns');
  },

  provideVariables: function() {
    return "var " + this.options.variableName + " = pie.apps[" + this.app.pieId + "].helpers.functions();";

  }

});
// # Pie i18n
// The i18n class is in charge of the defining and lookup of translations, the
// defining and lookup of date formats, and the standardization of "word" things.
// The standard i18n lookup usage is as follows:
//
// ```
// i18n.load({
//   hi: "Hi %{firstName}",
//   followers: {
//     zero: "${hi}, you don't have any followers :(",
//     one: "${hi}, you have a follower!",
//     other: ${hi}, you have %{count} followers!"
// });
//
// i18n.t("hi");
// //=> "Hi undefined"
// i18n.t("hi", {firstName: 'Doug'});
// //=> "Hi Doug"
// i18n.t("hi", {firstName: 'Doug'}, 'upcase');
// //=> "HI DOUG"
// i18n.t("followers", {firstName: 'Doug', count: 5});
// //=> "Hi Doug, you have 5 followers!"
// i18n.t("followers", {firstName: 'Doug', count: 0});
// //=> "Hi Doug, you don't have any followers :("
// ```
// Note that recursive interpolation is allowed via the `${}` identifier. Direct interpolation is
// handled by `%{}`. There is no loop detection so use this wisely.
//
// And date/time usage is as follows:
//
// ```
// i18n.l(date, '%Y-%m');
// //=> "2015-01"
// i18n.l(date, 'isoTime');
// //=> "2015-01-14T09:42:26.069-05:00"
// ```

// _**Todo:** allow a default scope (eg, en, en-GB, etc). Currently the assumption is that only the relevant translations are loaded._
pie.i18n = pie.model.extend('i18n', {

  init: function(app, options) {
    var data = pie.object.merge({}, pie.i18n.defaultTranslations);
    options = pie.object.deepMerge({
      settings: {
        interpolationStart: '%{',
        interpolationEnd: '}',
        nestedStart: '${',
        nestedEnd: '}'
      }
    }, options || {}, {app: app});


    var escapedInterpEnd = pie.string.escapeRegex(options.settings.interpolationEnd),
    escapedNestedEnd = pie.string.escapeRegex(options.settings.nestedEnd);

    options.settings.interpolationRegex = new RegExp(pie.string.escapeRegex(options.settings.interpolationStart) + '([^' + escapedNestedEnd + ']+)' + escapedInterpEnd, 'g');
    options.settings.nestedRegex = new RegExp(pie.string.escapeRegex(options.settings.nestedStart) + '([^' + escapedNestedEnd + ']+)' + escapedNestedEnd, 'g');

    this._super(data, options);
  },

  _ampm: function(num) {
    return this.t('app.time.meridiems.' + (num >= 12 ? 'pm' : 'am'));
  },


  _countAlias: {
    '0' : 'zero',
    '1' : 'one',
    '-1' : 'negone'
  },


  _dayName: function(d) {
    return this.t('app.time.day_names.' + d);
  },


  _hour: function(h) {
    if(h > 12) h -= 12;
    if(!h) h += 12;
    return h;
  },


  _monthName: function(m) {
    return this.t('app.time.month_names.' + m);
  },


  _nestedTranslate: function(t, data) {
    return this._expand(t, this.options.settings.nestedRegex, function(match, path) {
      return this.translate(path, data);
    }.bind(this));
  },

  _interpolateTranslation: function(t, data) {
    return this._expand(t, this.options.settings.interpolationRegex, function(match, key) {
      return pie.object.getPath(data, key);
    });
  },

  _expand: function(t, regex, fn) {
    try{
      var val;
      return t.replace(regex, function(match, key) {
        val = fn(match, key);
        if(val === undefined) throw new Error("Missing interpolation argument `" + key + "` for '" + t + "'");
        return val;
      });
    } catch(e) {
      this.app.errorHandler.handleI18nError(e, {
        handledBy: "pie.i18n#_expand",
        expandString: t,
        regex: regex
      });
      return "";
    }
  },


  /* assumes that dates either come in as dates, iso strings, or epoch timestamps */
  _normalizedDate: function(d) {
    if(String(d).match(/^\d+$/)) {
      d = parseInt(d, 10);
      if(String(d).length < 13) d *= 1000;
      d = new Date(d);
    } else if(pie.object.isString(d)) {
      d = pie.date.timeFromISO(d);
    } else {
      /* let the system parse */
      d = new Date(d);
    }
    return d;
  },


  _shortDayName: function(d) {
    return this.t('app.time.short_day_names.' + d) || this._dayName(d).slice(0, 3);
  },


  _shortMonthName: function(m) {
    return this.t('app.time.short_month_names.' + m) || this._monthName(m).slice(0, 3);
  },


  _pad: function(num, cnt, pad, prefix) {
    var s = '',
        p = cnt - num.toString().length;
    if(pad === undefined) pad = ' ';
    while(p>0){
      s += prefix ? pad + s : s + pad;
      p -= 1;
    }
    return s + num.toString();
  },

  _ordinal: function(number) {
    var unit = number % 100;

    if(unit >= 11 && unit <= 13) unit = 0;
    else unit = number % 10;

    return this.t('app.time.ordinals.o' + unit);
  },

  _timezoneAbbr: function(date) {
    var str = date && date.toString();
    return str && str.split(/\((.*)\)/)[1];
  },


  _utc: function(t) {
    var t2 = new Date(t.getTime());
    t2.setMinutes(t2.getMinutes() + t2.getTimezoneOffset());
    return t2;
  },

  keyCheck: /^\.(.+)$/,

  // ** pie.i18n.attempt **
  //
  // If the provided `key` looks like a translation key, prepended with a ".",
  // try to look it up. If it does not or the provided key does not exist, return
  // the provided key.
  // ```
  // i18n.attempt('.foo.bar.baz')
  // ```
  attempt: function(/* args */) {
    var args = pie.array.from(arguments),
    key = args[0],
    m = key && key.match(this.keyCheck);

    if(!m) return key;

    args[0] = m[1]; /* swap out the formatted key for the real one */
    return this.translate.apply(this, args);
  },

  // ** pie.i18n.load **
  //
  // Load translations into this instance.
  // By default, a deep merge will occur, provide `false` for `shallow`
  // if you would like a shallow merge to occur.
  // ```
  // i18n.load({foo: 'Bar %{baz}'});
  // ```
  load: function(data, shallow) {
    var f = shallow ? pie.object.merge : pie.object.deepMerge;
    f.call(null, this.data, data);
  },

  // ** pie.i18n.translate (pie.i18n.t) **
  //
  // Given a `path`, look up a translation.
  // If the second argument `data` is provided, the `data` will be
  // interpolated into the translation before returning.
  // Arguments 3+ are string modification methods as defined by `pie.string`.
  // `translate` is aliased as `t`.
  // ```
  // //=> Assuming 'foo.path' is defined as "This is %{name}"
  // i18n.t('foo.path', {name: 'Bar'}, 'pluralize', 'upcase')
  // //=> "THIS IS BAR'S"
  // ```
  translate: function(/* path, data, stringChange1, stringChange2 */) {
    var changes = pie.array.from(arguments),
    path = changes.shift(),
    data = pie.object.isObject(changes[0]) ? changes.shift() : undefined,
    translation = this.get(path),
    count;

    if (pie.object.has(data, 'count') && pie.object.isObject(translation)) {
      count = (data.count || 0).toString();
      count = this._countAlias[count] || (count > 0 ? 'other' : 'negother');
      translation = translation[count] === undefined ? translation.other : translation[count];
    }

    if(!translation) {

      if(pie.object.has(data, 'default')) {
        var def = pie.fn.valueFrom(data.default);
        if(pie.object.isString(def)) {
          translation = this.attempt(def);
        } else {
          translation = def;
        }
      } else {
        this.app.errorHandler.handleI18nError(new Error("Translation not found: " + path), {
          handledBy: "pie.i18n#translate",
          translationPath: path
        });
        return "";
      }
    }


    if(pie.object.isString(translation)) {
      translation = translation.indexOf(this.options.settings.nestedStart) === -1 ? translation : this._nestedTranslate(translation, data);
      translation = translation.indexOf(this.options.settings.interpolationStart) === -1 ? translation : this._interpolateTranslation(translation, data);
    }

    if(changes.length) {
      changes.unshift(translation);
      translation = pie.string.change.apply(null, changes);
    }

    return translation;
  },

  // ** pie.i18n.timeago **
  //
  // Return a human representation of the time since the provided time `t`.
  // You can also pass an alternate "relative to" time as the second argument.
  // ```
  // d.setDate(d.getDate() - 4);
  // i18n.timeago(d)
  // //=> "4 days ago"
  //
  // d.setDate(d.getDate() - 7);
  // i18n.timeago(d)
  // //=> "1 week ago"
  //
  // d.setDate(d.getDate() - 90);
  // d2.setDate(d.getDate() + 2);
  // i18n.timeago(d, d2)
  // //=> "2 days ago"
  // ```
  timeago: function(t, now, scope) {
    var tD = t,
    nowD = now,
    diff, c;

    t = this._normalizedDate(t).getTime()  / 1000;
    now = this._normalizedDate(now || new Date()).getTime() / 1000;

    diff = now - t;

    scope = scope || 'app';

    if(diff < 60) { // less than a minute
      return this.t(scope + '.timeago.now', {count: diff});
    } else if (diff < 3600) { // less than an hour
      c = Math.floor(diff / 60);
      return this.t(scope + '.timeago.minutes', {count: c});
    } else if (diff < 86400) { // less than a day
      c = Math.floor(diff / 3600);
      return this.t(scope + '.timeago.hours', {count: c});
    } else if (diff < 86400 * 7) { // less than a week
      c = Math.floor(diff / 86400);
      return this.t(scope + '.timeago.days', {count: c});
    } else if (diff < 86400 * 30) { // less than 30 days
      c = Math.floor(diff / (86400 * 7));
      return this.t(scope + '.timeago.weeks', {count: c});
    } else if (diff < 86500 * 365) { // less than 365 days
      c = (nowD.getFullYear() - tD.getFullYear()) * 12;
      c -= tD.getMonth();
      c += nowD.getMonth();
      return this.t(scope + '.timeago.months', {count: c});
    } else {
      c = Math.floor(diff / (86400 * 365));
      return this.t(scope + '.timeago.years', {count: c});
    }
  },

  // ** pie.i18n.strftime (pie.i18n.l) **
  //
  // Given a `date`, format it based on the format `f`.
  // The format can be:
  //   * A named format, existing at app.time.formats.X
  //   * A custom format following the guidelines of ruby's strftime
  //
  // *Ruby's strftime: http://ruby-doc.org/core-2.2.0/Time.html#method-i-strftime*
  //
  // ```
  // i18n.l(date, 'shortDate');
  // i18n.l(date, '%Y-%m');
  // ```
  strftime: function(date, f) {
    date = this._normalizedDate(date);

    /* named format from translations.time. */
    if(!~f.indexOf('%')) f = this.t('app.time.formats.' + f, {"default" : f});

    var weekDay           = date.getDay(),
        day               = date.getDate(),
        year              = date.getFullYear(),
        month             = date.getMonth() + 1,
        hour              = date.getHours(),
        hour12            = this._hour(hour),
        meridiem          = this._ampm(hour),
        secs              = date.getSeconds(),
        mins              = date.getMinutes(),
        mills             = date.getMilliseconds(),
        offset            = date.getTimezoneOffset(),
        absOffsetHours    = Math.floor(Math.abs(offset / 60)),
        absOffsetMinutes  = Math.abs(offset) - (absOffsetHours * 60),
        timezoneoffset    = (offset > 0 ? "-" : "+") + this._pad(absOffsetHours, 2, '0') + this._pad(absOffsetMinutes, 2, '0');

    f = f.replace("%a", this._shortDayName(weekDay))
        .replace("%A",  this._dayName(weekDay))
        .replace("%B",  this._monthName(month - 1))
        .replace("%b",  this._shortMonthName(month - 1))
        .replace("%d",  this._pad(day, 2, '0'))
        .replace("%e",  this._pad(day, 2, ' '))
        .replace("%-do", day + this._ordinal(day))
        .replace("%-d", day)
        .replace("%H",  this._pad(hour, 2, '0'))
        .replace("%k",  this._pad(hour, 2, ' '))
        .replace('%-H', hour)
        .replace('%-k', hour)
        .replace("%I",  this._pad(hour12, 2, '0'))
        .replace("%l",  hour12)
        .replace("%m",  this._pad(month, 2, '0'))
        .replace("%-m", month)
        .replace("%M",  this._pad(mins, 2, '0'))
        .replace("%p",  meridiem.toUpperCase())
        .replace("%P",  meridiem)
        .replace("%S",  this._pad(secs, 2, '0'))
        .replace("%-S", secs)
        .replace('%L',  this._pad(mills, 3, '0'))
        .replace('%-L', mills)
        .replace("%w",  weekDay)
        .replace("%y",  this._pad(year % 100))
        .replace("%Y",  year)
        .replace("%z",  timezoneoffset)
        .replace("%:z", timezoneoffset.slice(0,3) + ':' + timezoneoffset.slice(3))
        .replace("%Z",  this._timezoneAbbr(date));

    return f;
  },
});

/* Aliases */
pie.i18n.prototype.t = pie.i18n.prototype.translate;
pie.i18n.prototype.l = pie.i18n.prototype.strftime;

pie.i18n.defaultTranslations = {
  app: {
    sentence: {
      conjunction: ' and ',
      delimeter: ', '
    },

    timeago: {
      now: "just now",
      minutes: {
        one:    "%{count} minute ago",
        other:  "%{count} minutes ago"
      },
      hours: {
        one:    "%{count} hour ago",
        other:  "%{count} hours ago"
      },
      days: {
        one:    "%{count} day ago",
        other:  "%{count} days ago"
      },
      weeks: {
        one:    "%{count} week ago",
        other:  "%{count} weeks ago"
      },
      months: {
        one:    "%{count} month ago",
        other:  "%{count} months ago"
      },
      years: {
        one:    "%{count} year ago",
        other:  "%{count} years ago"
      }
    },
    time: {
      formats: {
        isoDate:    '%Y-%m-%d',
        isoTime:    '%Y-%m-%dT%H:%M:%S.%L%:z',
        shortDate:  '%m/%d/%Y',
        longDate:   '%B %-do, %Y'
      },
      meridiems: {
        am: 'am',
        pm: 'pm'
      },
      ordinals: {
        o0: "th",
        o1: "st",
        o2: "nd",
        o3: "rd",
        o4: "th",
        o5: "th",
        o6: "th",
        o7: "th",
        o8: "th",
        o9: "th"
      },
      day_names: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      short_day_names: [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat'
      ],
      month_names: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      short_month_names: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'June',
        'July',
        'Aug',
        'Sept',
        'Oct',
        'Nov',
        'Dec'
      ]
    },

    validations: {

      ccNumber:           "does not look like a credit card number",
      ccSecurity:         "is not a valid security code",
      ccExpirationMonth:  "is not a valid expiration month",
      ccExpirationYear:   "is not a valid expiration year",
      chosen:             "must be chosen",
      date:               "is not a valid date",
      email:              "must be a valid email",
      format:             "is invalid",
      inclusion:          "is not a valid value",
      integer:            "must be an integer",
      length:             "length must be",
      number:             "must be a number",
      phone:              "is not a valid phone number",
      presence:           "can't be blank",
      uniqueness:         "is not unique",
      url:                "must be a valid url",

      range_messages: {
        eq:  "equal to %{count}",
        lt:  "less than %{count}",
        gt:  "greater than %{count}",
        lte: "less than or equal to %{count}",
        gte: "greater than or equal to %{count}"
      }
    }
  }
};
// # Pie List
// A model representing a list. Essentially an array wrapper.
// List models provide observation for:
//   * The entire list
//   * Specific indexes
//   * Length of the list
//   * Any other key not related to the list.
// Optionally, a list can provide a `cast` option which it will use
// to cast plain object index values into. `castOptions` can also be supplied
// which will be provided as the second argument to the cast' constructor.
pie.list = pie.model.extend('list', {

  init: function(array, options) {
    array = array || [];
    this._super({}, options);
    this.data.items = array.map(this._cast.bind(this));
  },

  // ** pie.list._cast **
  //
  // Casts a `value` to the option-provided `cast`.
  // The first argument provided to the cast is the object itself, the
  // second is the options-provided castOptions.
  _cast: function(value) {
    var klass = this.options.cast;
    if(klass === true) klass = pie.model;

    if(klass && pie.object.isPlainObject(value)) {
      value = new klass(value, this.options.castOptions);
    }

    return value;
  },

  // ** pie.list._normalizeIndex **
  //
  // Converts a potential index into the numeric form.
  // If the index is negative, it should represent the index from the end of the current list.
  // ```
  // // assuming a list length of 3
  // list._normalizeIndex('foo') //=> 'foo'
  // list._normalizeIndex('4') //=> 4
  // list._normalizeIndex(-1) //=> 2
  // ```
  _normalizedIndex: function(wanted) {
    wanted = parseInt(wanted, 10);
    if(!isNaN(wanted) && wanted < 0) wanted += this.data.items.length;
    return wanted;
  },

  // ** pie.list._trackMutations **
  //
  // Track changes to the array which occur during `fn`'s execution.
  _trackMutations: function(options, fn) {

    var oldLength = this.data.items.length,
    changes = pie.array.from(fn.call()),
    newLength = this.data.items.length;

    if(!options || !options.skipTrackMutations) {
      if(oldLength !== newLength) {
        changes.push({
          name: 'length',
          type: 'update',
          object: this.data.items,
          oldValue: oldLength,
          value: newLength
        });
      }

      changes.push({
        name: 'items',
        type: 'update',
        object: this.data.items,
        oldValue: this.data.items,
        value: this.data.items
      });
    }

    this.changeRecords = this.changeRecords.concat(changes);

    if(options && options.skipObservers) return this;
    return this.deliverChangeRecords();
  },


  // ** pie.list.forEach **
  //
  // Iterate the list, calling `f` with each item.
  forEach: function(f) {
    return this.get('items').forEach(f);
  },

  // ** pie.list.get **
  //
  // Get an item at a specific index.
  // `key` can be any valid input to `_normalizeIndex`.
  get: function(key) {
    var idx = this._normalizedIndex(key), path;

    if(isNaN(idx)) path = key;
    else path = 'items.' + idx;

    return pie.model.prototype.get.call(this, path);
  },

  // ** pie.list.indexOf **
  //
  // Find the index of a specific value.
  // Uses the standard array equality check for indexOf.
  indexOf: function(value) {
    return this.get('items').indexOf(value);
  },

  // ** pie.list.insert **
  //
  // Insert `value` at the index specified by `key`.
  // Returns the list.
  insert: function(key, value, options) {
    return this._trackMutations(options, function(){

      value = this._cast(value);

      var idx = this._normalizedIndex(key),
      change = {
        name: String(idx),
        object: this.data.items,
        type: 'add',
        oldValue: this.data.items[idx],
        value: value
      };

      this.data.items.splice(idx, 0, value);

      return change;
    }.bind(this));
  },

  // ** pie.list.length **
  //
  // The length of the list.
  length: function() {
    return this.get('items.length');
  },

  // ** pie.list.pop **
  //
  // Pop an item off the end of the list.
  // Returns the item.
  pop: function(options) {
    var l = this.length(), value;

    if(!l) return;

    this._trackMutations(options, function() {
      var change = {
        name: String(l - 1),
        object: this.data.items,
        type: 'delete',
        value: undefined,
      };

      change.oldValue = value = this.data.items.pop();

      return change;
    }.bind(this));

    return value;
  },

  // ** pie.list.push **
  //
  // Add an item to the end of the list.
  // Returns the list.
  push: function(value, options) {
    return this._trackMutations(options, function(){

      value = this._cast(value);

      var change = {
        name: String(this.data.items.length),
        object: this.data.items,
        type: 'add',
        value: value,
        oldValue: undefined
      };

      this.data.items.push(value);

      return change;
    }.bind(this));
  },

  // ** pie.list.remove **
  //
  // Remove a specific index from the list.
  // Returns the removed item.
  remove: function(key, options) {

    var value;

    this._trackMutations(options, function(){
      var idx = this._normalizedIndex(key),
      change = {
        name: String(idx),
        object: this.data.items,
        type: 'delete'
      };

      change.oldValue = value = this.data.items[idx];
      this.data.items.splice(idx, 1);
      change.value = this.data.items[idx];

      return change;
    }.bind(this));

    return value;
  },

  // ** pie.list.set **
  //
  // Set an attribute or an index based on `key` to `value`.
  set: function(key, value, options) {
    if(key === 'items') return this.setItems(value, options);

    var idx = this._normalizedIndex(key);

    if(isNaN(idx)) {
      return this._super(key, value, options);
    }

    return this._trackMutations(options, function(){
      var change = {
        name: String(idx),
        object: this.data.items,
        type: 'update',
        oldValue: this.data.items[idx]
      };

      value = this._cast(value);

      this.data.items[idx] = change.value = value;

      return change;
    }.bind(this));
  },

  setItems: function(arr, options) {
    var innerOptions = pie.object.merge({}, options, {
      skipTrackMutations: true,
      skipObservers: true
    });

    return this._trackMutations(options, function(){

      var currentLength = this.data.items.length,
      newLength = arr.length,
      i;

      /* if the old list is longer than the new, we create change records from the end to the beginning */
      if(currentLength > newLength) {
        i = currentLength;

        while(i > newLength) {
          this.pop(innerOptions);
          i--;
        }

        for(i = newLength - 1; i >= 0; i--) {
          this.set(i, arr[i], innerOptions);
        }

      /* otherwise, we create change records from the beginning to the end */
      } else {

        for(i = 0; i < currentLength; i++) {
          this.set(i, arr[i], innerOptions);
        }

        i = currentLength;
        while(i < newLength) {
          this.push(arr[i], innerOptions);
          i++;
        }
      }

    }.bind(this));
  },

  // ** pie.list.shift **
  //
  // Shift an item off the front of the list.
  // Returns the removed item.
  shift: function(options) {
    return this.remove(0, options);
  },

  // ** pie.list.unshift **
  //
  // Insert an item at the beginning of the list.
  unshift: function(value, options) {
    return this.insert(0, value, options);
  }
});
// listView has moved to a mixin, you should use the mixin rather than this class.
// This class is being preserved for the sake of backwards compatability.
pie.listView = pie.view.extend('listView', pie.mixins.activeView, pie.mixins.listView);
// # Pie Navigator
// The navigator is in charge of observing browser navigation and updating it's data.
// It's also the place to conduct push/replaceState history changes.
// The navigator is simply a model, enabling observation, computed values, etc.
pie.navigator = pie.model.extend('navigator', {

  init: function(app) {
    this.app = app;
    this._super({});
  },

  // ** pie.navigator.go **
  //
  // Go to `path`, appending `params`.
  // If `replace` is true replaceState will be used in favor of pushState.
  // If no changes are made, nothing will happen.
  // ```
  // navigator.go('/foo/bar', {page: 2});
  // //=> pushState: '/foo/bar?page=2'
  // ```
  go: function(path, params, replace) {
    var split = path.split('?'), query, url, state;
    path = split[0];
    query = split[1];

    params = pie.object.deepMerge(query ? pie.string.deserialize(query) : {}, params);

    if(this.test('path', path) && this.test('query', params)) {
      return this;
    }

    url = path;

    if(pie.object.hasAny(params)) {
      url = pie.string.urlConcat(url, pie.object.serialize(params));
    }

    state = this.stateObject(path, params, replace);
    window.history[replace ? 'replaceState' : 'pushState'](state, document.title, url);
    window.historyObserver();
  },

  // ** pie.navigator.setDataFromLocation **
  //
  // Look at `window.location` and transform it into stuff we care about.
  // Set the data on this navigator object.
  setDataFromLocation: function() {
    var stringQuery = window.location.search.slice(1),
    query = pie.string.deserialize(stringQuery);

    this.sets({
      url: window.location.href,
      path: window.location.pathname,
      anchor: window.location.hash.slice(1),
      fullPath: pie.array.compact([window.location.pathname, stringQuery], true).join('?'),
      query: query
    });
  },

  // ** pie.navigator.start **
  //
  // Setup the navigator and initialize the data.
  start: function() {
    /* we can only have one per browser. Multiple apps should observe pieHistoryChang on the body */
    if(!window.historyObserver) {
      window.historyObserver = function() {
        pie.dom.trigger(document.body, 'pieHistoryChange');
      };
    }
    /* observe popstate and invoke our single history observer */
    pie.dom.on(window, 'popstate', function() {
      window.historyObserver();
    });

    /* subscribe this navigator to the global history event */
    pie.dom.on(document.body, 'pieHistoryChange.nav-' + this.pieId, this.setDataFromLocation.bind(this));

    return this.setDataFromLocation();
  },

  stateObject: function(newPath, newQuery, replace) {
    var state = {
      navigator: {
        path: newPath,
        query: newQuery
      }
    };

    if(replace) {
      pie.object.deepMerge(state, window.history.state);
    } else {
      state.navigator.referringPath = this.get('path');
      state.navigator.referringQuery = this.get('query');
    }

    return state;
  }
});
// # Pie Notifier
// A class which provides an interface for rendering page-level notifications.
// This does only structures and manages the data to be used by a view. This does not impelement
// UI notifications.
pie.notifier = pie.base.extend('notifier', {

  init: function(app, options) {
    this.options = options || {};
    this.app = app || this.options.app || pie.appInstance;
    this.notifications = new pie.list([]);
  },

  // remove all alerts, potentially filtering by the type of alert.
  clear: function(type) {
    if(type) {
      this.notifications.forEach(function(n) {
        this.remove(n.id);
      }.bind(this));
    } else {
      while(this.notifications.length()) {
        this.remove(this.notifications.get(0).id);
      }
    }
  },

  // ** pie.notifier.notify **
  //
  // Show a notification or notifications.
  // Messages can be a string or an array of messages.
  // You can choose to close a notification automatically by providing `true` as the third arg.
  // You can provide a number in milliseconds as the autoClose value as well.
  notify: function(messages, type, autoRemove) {
    type = type || 'message';
    autoRemove = this.getAutoRemoveTimeout(autoRemove);

    messages = pie.array.from(messages);
    messages = messages.map(function(m){ return this.app.i18n.attempt(m); }.bind(this));

    var msg = {
      id: pie.unique(),
      messages: messages,
      type: type
    };

    this.notifications.push(msg);

    if(autoRemove) {
      setTimeout(function(){
        this.remove(msg.id);
      }.bind(this), autoRemove);
    }

  },

  getAutoRemoveTimeout: function(timeout) {
    if(timeout === undefined) timeout = true;
    if(timeout && !pie.object.isNumber(timeout)) timeout = 7000;
    return timeout;
  },

  remove: function(msgId) {
    var msgIdx = pie.array.indexOf(this.notifications.get('items'), function(m) {
      return m.id === msgId;
    });

    if(~msgIdx) {
      this.notifications.remove(msgIdx);
    }
  }
});
// # Pie Resources
//
// An external resource loader. It specializes in retrieving scripts, stylesheets, and generic ajax content.
// Upon load of the external resource a callback can be fired. Resources can be registered beforehand to make
// development a bit easier and more standardized.
// ```
// resources.define('googleMaps', '//maps.google.com/.../js');
// resources.define('templates', {src: '/my-templates.html', dataSuccess: parseTemplates});
//
// resources.load('googleMaps', 'templates', 'customI18n', function(){
//   google.Maps.doStuff();
// });
// ```
pie.resources = pie.model.extend('resources', {

  // ** pie.resources.init **
  //
  // Provide an app and a source map (shortcut all the `resources.define()` calls).
  // ```
  // new pie.resources(app, {googleMaps: '//maps.google.com/.../js'});
  // ```
  init: function(app, srcMap) {
    this._super({
      srcMap: srcMap || {},
      loaded: {}
    }, {
      app: app
    });

    pie.object.forEach(function(k,v) {
      this.define(k, v);
    }.bind(this));
  },

  _appendNode: function(node) {
    var target = pie.qs('head');
    target = target || document.body;
    target.appendChild(node);
  },

  _inferredResourceType: function(src) {
    if((/(\.|\/)js(\?|$)/).test(src)) return 'script';
    if((/(\.|\/)css(\?|$)/).test(src)) return 'link';
    if((/\.(png|jpeg|jpg|gif|svg|tiff|tif)(\?|$)/).test(src)) return 'image';
    return 'ajax';
  },

  _normalizeSrc: function(srcOrOptions) {
    var options = typeof srcOrOptions === 'string' ? {src: srcOrOptions} : pie.object.merge({}, srcOrOptions);
    return options;
  },

  // **pie.resources.\_loadajax**
  //
  // Conduct an ajax request and invoke the `resourceOnload` function when complete
  //
  // Options:
  // * **src** - the url of the request
  // * ** * ** - any valid ajax options
  _loadajax: function(options, resourceOnload) {
    var ajaxOptions = pie.object.merge({
      verb: 'GET',
      url: options.src
    }, options);

    var request = this.app.ajax.ajax(ajaxOptions);
    request.success(resourceOnload);
  },

  // **pie.resources.\_loadimage**
  //
  // Load an image and invoke `resourceOnload` when complete.
  // Options:
  // * **src** - the url of the image.
  _loadimage: function(options, resourceOnload) {
    var img = new Image();
    img.onload = function(){
      resourceOnload(pie.object.merge({
        img: img
      }, options));
    };
    img.src = options.src;
  },

  // **pie.resources.\_loadlink**
  //
  // Adds a `<link>` tag to the dom if the "type" of the resource is "link".
  //
  // Options:
  // * **src** - the url of the resource
  // * **media** - _(optional)_ defaulting to `screen`, it's the media attribute of the `<link>`
  // * **rel** - _(optional)_ defaulting to `stylesheet`, it's the rel attribute of the `<link>`
  // * **contentType** - _(optional)_ defaulting to `text/css`, it's the type attribute of the `<link>`
  //
  // _Note that since `<link>` tags don't provide a callback, the onload happens immediately._
  _loadlink: function(options, resourceOnload) {
    var link = document.createElement('link');

    link.href = options.src;
    link.media = options.media || 'screen';
    link.rel = options.rel || 'stylesheet';
    link.type = options.contentType || 'text/css';

    this._appendNode(link);

    /* Need to record that we added this thing. */
    /* The resource may not actually be present yet. */
    resourceOnload();
  },

  // **pie.resources.\_loadscript**
  //
  // Adds a `<script>` tag to the dom if the "type" is "script"
  //
  // Options:
  // * **src** - the url of the script.
  // * **callbackName** - _(optional)_ the global callback name the loading library will invoke
  // * **noAsync** - _(optional)_ if true, the script will be loaded synchronously.
  _loadscript: function(options, resourceOnload) {

    var script = document.createElement('script');

    if(options.noAsync) script.async = false;

    /* If options.callbackName is present, the invoking method self-references itself so it can clean itself up. */
    /* Because of this, we don't need to invoke the onload */
    if(!options.callbackName) {
      script.onload = resourceOnload;
    }

    this._appendNode(script);
    script.src = options.src;
  },

  // ** pie.resources.define **
  //
  // Define a resource by human readable `name`. `srcOrOptions` is a url or
  // an options hash as described by the relevant `_load` function.
  // ```
  // resources.define('googleMaps', '//maps.google.com/.../js');
  // ```
  define: function(name, srcOrOptions) {
    var options = this._normalizeSrc(srcOrOptions);
    this.set('srcMap.' + name, options);
  },

  // ** pie.resources.load **
  //
  // Load resources defined by each argument.
  // If the last argument is a function it will be invoked after all resources have loaded.
  // ```
  // resources.load('foo', 'bar', function callback(){});
  // resources.load(['foo', 'bar'], function(){});
  // resources.load('//maps.google.com/.../js');
  // resources.load({src: '/templates.html', dataSuccess: parseTemplates}, function callback(){});
  // ```
  load: function(/* src1, src2, src3, onload */) {
    var sources = pie.array.change(arguments, 'from', 'flatten', 'compact'),
    onload = pie.object.isFunction(pie.array.last(sources)) ? sources.pop() : function(){},
    fns;

    sources = sources.map(this._normalizeSrc.bind(this));

    /* we generate a series of functions to be invoked by pie.fn.async */
    /* each function's responsibility is to invoke the provided callback when the resource is loaded */
    fns = sources.map(function(options){

      /* we could be dealing with an alias, so make sure to grab the real source */
      options = this.get('srcMap.' + options.src) || options;

      /* we cache the status of the resource in our `loaded` object. */
      var src = options.src,
      loadedKey = 'loaded.' + src;

      /* the pie.fn.async function */
      return function(cb) {
        var loadedVal = this.get(loadedKey);

        /* if the loadedKey's value is true, we've already loaded this resource */
        if(loadedVal === true) {
          cb();
          return true;
        }

        /* otherwise, if it's present, it's an array of callbacks to be invoked when the resource is loaded (fifo) */
        if(loadedVal) {
          loadedVal.push(cb);
          return false;
        }

        /* holy balls, this is the first time. set the array up */
        this.set(loadedKey, [cb]);

        /* determine the type of resource to be loaded */
        var type = options.type || this._inferredResourceType(options.src),

        /* upon load, we invoke all the registered callbacks for the resource */
        resourceOnload = function() {

          this.get(loadedKey).forEach(function(fn) { if(fn) fn(); });

          /* make sure we set the loadedKey to true so we know we don't have to do this again */
          this.set(loadedKey, true);

          /* if we set up a global callbackName we make sure it's removed */
          if(options.callbackName) delete window[options.callbackName];
        }.bind(this);

        /* if a global callback name is desired, set it to our onload handler */
        if(options.callbackName) {
          window[options.callbackName] = resourceOnload;
        }

        /* start the resource */
        this['_load' + type](options, resourceOnload);

        return false;
      }.bind(this);
    }.bind(this));

    /* now start loading all the resources */
    pie.fn.async(fns, onload);
  }
});
// # Pie Route
//
// Represents a route used by the router.
// Routes understand if they match string paths, they know how to extract interpolations from a path,
// and know how to generate a path given some data.
// ```
// r = new pie.route('/foo/:id');
//
// r.isDirectMatch('/foo/bar')
// //=> false
// r.isMatch('/foo/bar')
// //=> true
//
// r.interpolations('/foo/bar')
// //=> {id: 'bar'}
//
// r.path({id: 'baz', page: 2})
// //=> '/foo/baz?page=2'
// ```
pie.route = pie.model.extend('route', {

  init: function(path, options) {
    this._super({
      pathTemplate: pie.string.normalizeUrl(path)
    }, options);

    this.name = this.options.name || ("route-" + this.pieId);

    this.compute('segments',            'pathTemplate');
    this.compute('pathRegex',           'pathTemplate');
    this.compute('weight',              'segments');
  },

  // **pie.route.segments**
  //
  // The pathTemplate split into segments.
  // Since this is a computed property, we only ever have to do this once.
  segments: function() {
    return this.get('pathTemplate').split('/');
  },

  // **pie.route.pathRegex**
  //
  // A RegExp representing the path.
  // Since this is a computed property, we only ever have to do this once.
  pathRegex: function() {
    var t = this.get('pathTemplate');
    t = t.replace(/(:[^\/]+)/g,'([^\\/]+)');
    t = t.replace(/(\*[^\/]+)/g, '(.+)');
    return new RegExp('^' + t + '$');
  },

  // **pie.route.weight**
  //
  // A weight representing the specificity of the route. It compiles a number as a string
  // based on the type of segment then casts the number as an integer as part of the return statement.
  // Specificity is determined by:
  //   -
  // Since this is a computed property, we only ever have to do this once.
  weight: function() {
    var tmpls = this.get('segments'),
    w = '';

    tmpls.forEach(function(segment){
      if(segment.match(/^:([^\/]+)$/))
        w += '3';
      else if(segment.match(/^\*([^\/]+)$/))
        w += '2';
      else if(segment === '')
        w += '1';
      else
        w += '4';
    });

    return +w;
  },

  // **pie.route.interpolations**
  //
  // Under the assumption that the path is already normalized and we've "matched" it,
  // extract the interpolations from `path`. If `parseValues` is true, the values will
  // be parsed based on `pie.string.deserialize`'s implementation.
  // ```
  // r = new pie.route('/foo/:id');
  // r.interolations('/foo/bar');
  // //=> {id: 'bar'}
  // ```
  interpolations: function(path, parseValues) {
    var splitPaths = path.split('/'),
    tmpls = this.get('segments'),
    interpolations = {},
    splitPath, tmpl;

    for(var i = 0; i < splitPaths.length; i++){
      tmpl = tmpls[i];
      splitPath = splitPaths[i];
      if(splitPath !== tmpl) {
        if(tmpl.charAt(0) === ':') {
          interpolations[tmpl.substr(1)] = splitPath;
        } else if(tmpl.charAt(0) === '*') {
          interpolations[tmpl.substr(1)] = pie.array.get(splitPaths, i, -1).join('/');
          break;
        }
      }
    }

    if(parseValues) interpolations = pie.string.deserialize(pie.object.serialize(interpolations), true);

    return interpolations;
  },

  // **pie.route.isDirectMatch**
  //
  // Is the provided `path` a direct match to our definition?
  isDirectMatch: function(path) {
    return path === this.get('pathTemplate');
  },

  // **pie.route.isMatch**
  //
  // is the provided `path` a match based on our `pathRegex`.
  isMatch: function(path) {
    return this.get('pathRegex').test(path);
  },

  // **pie.route.path**
  //
  // Generate a path based on our template & the provided `data`. If `interpolateOnly` is true,
  // a query string will not be appended, even if there are extra items provided by `data`.
  // ```
  // r = new pie.route('/foo/:id');
  // r.path({id: 'bar'})
  // //=> '/foo/bar'
  // r.path({id: 'baz', page: 2});
  // //=> '/foo/baz?page=2'
  // r.path({id: 'qux', page: 2}, true);
  // //=> '/foo/qux'
  // ```
  path: function(data, interpolateOnly) {
    var usedKeys = [],
    s = this.get('pathTemplate'),
    params,
    unusedData;

    data = data || {};

    s = s.replace(/[:\*]([a-zA-Z0-9_]+)/g, function(match, key){
      usedKeys.push(key);
      if(data[key] === undefined || data[key] === null || data[key].toString().length === 0) {
        throw new Error("[PIE] missing route interpolation: " + match);
      }
      return data[key];
    });

    s = pie.string.normalizeUrl(s);

    unusedData = pie.object.except(data, usedKeys);
    params = pie.object.serialize(pie.object.compact(unusedData, true));

    if(!interpolateOnly && params.length) {
      s = pie.string.urlConcat(s, params);
    }

    return s;
  }

});
// # Pie Router
//
// An interface for declaring, processing, and determing a collection of routes.
pie.router = pie.model.extend('router', {

  // **pie.router.init**
  //
  // Initialize a new router given an `app` and a set of options.
  // Options:
  // * **root** - the root to be prepended to all constructed routes. Defaults to `'/'`.
  init: function(app, options) {
    this._super({
      root: options && options.root || '/'
    }, pie.object.merge({
      app: app
    }, options));

    this.cache = new pie.cache();
    this.compute('rootRegex', 'root');
  },

  // **pie.router.rootRegex**
  //
  // A regex for testing whether a path starts with the declared root
  rootRegex: function() {
    return new RegExp('^' + this.get('root'));
  },

  // **pie.router.changedUrl**
  //
  // Get a url based on the app's current one but with the changes provided.
  // This will even catch interpolated values.
  // ```
  // // Given a route of `/things/page/:page.json`
  // // and the current path == `/things/page/1.json?q=test`
  // app.router.changedUrl({page: 3, q: 'newQuery'});
  // //=> /things/page/3.json?q=newQuery
  // ```
  changedUrl: function(changes) {
    var current = this.app.parsedUrl;
    return this.path(current.get('route.name') || current.get('path'), pie.object.merge({}, current.get('data'), changes));
  },

  // **pie.router.findRoute**
  //
  // Find the most relevant route based on `nameOrPath`.
  // Direct matches match first, then the most relevant pattern match comes next.
  findRoute: function(nameOrPath) {
    var route = this.getChild(nameOrPath, false);
    /* if a direct match is present, we return that */
    route = route || this.findDirectMatch(nameOrPath);
    /* otherwise, we look for a pattern match */
    route = route || this.findPatternMatch(nameOrPath);
    return route;
  },

  findDirectMatch: function(nameOrPath) {
    return pie.array.detect(this.children, function(r){ return r.isDirectMatch(nameOrPath); });
  },

  findPatternMatch: function(nameOrPath) {
    return pie.array.detect(this.children, function(r){ return r.isMatch(nameOrPath); });
  },


  // **pie.router.map**
  //
  // Add routes to this router.
  // Routes objects which contain a "name" key will be added as a name lookup.
  // You can pass a set of defaults which will be extended into each route object.
  // ```
  // router.map({
  //
  //   '/foo/:id' : {subView: 'foo',  name: 'foo'},
  //   '/bars'    : {subView: 'bars', name: 'bars'},
  //
  //   'api.whatever' : '/api/whatever.json'
  // }, {
  //   view: 'sublayout'
  // });
  // ```
  map: function(routes, defaults){
    defaults = defaults || {};

    var path, config, route, existing;

    pie.object.forEach(routes, function(k,r) {

      if(pie.object.isObject(r)) {
        path = k;
        config = r;
        if(defaults) config = pie.object.merge({}, defaults, config);
      } else {
        path = r;
        config = {name: k};
      }

      existing = this.findDirectMatch(path) || (config.name || this.findRoute(config.name));
      this.removeChild(existing);

      route = new pie.route(path, config);

      this.addChild(route.name, route);
    }.bind(this));

    this.sortRoutes();
    this.cache.clear();
  },

  // **pie.router.onMiss**
  //
  // The config to return when a route is parsed but not recognized.
  onMiss: function(config) {
    this.missedConfig = config;
  },

  // **pie.router.path**
  //
  // Will return the named path. If there is no path with that name it will return itself.
  // You can optionally pass a data hash and it will build the path with query params or
  // with path interpolation.
  // ```
  // router.path("/foo/bar/:id", {id: '44', q: 'search'})
  // //=> "/foo/bar/44?q=search"
  // ```
  path: function(nameOrPath, data, interpolateOnly) {
    var r = this.findRoute(nameOrPath) || new pie.route(nameOrPath),
    path;

    data = pie.object.merge(r.interpolations(nameOrPath), data);
    path = r.path(data, interpolateOnly);

    // apply the root.
    if(!pie.string.PROTOCOL_TEST.test(path) && !this.get('rootRegex').test(path)) {
      path = this.get('root') + path;
      path = pie.string.normalizeUrl(path);
    }

    return path;
  },

  // **pie.router.sortRoutes**
  //
  // Sorts the routes to be the most exact to the most generic.
  // * prefers fewer interpolations to more
  // * prefers more segments to less
  // * prefers more characters to less
  sortRoutes: function() {
    var c;

    this.sortChildren(function(a,b) {
      c = b.get('weight') - a.get('weight');
      c = c || b.get('pathTemplate').length - a.get('pathTemplate').length;
      c = c || a.get('pathTemplate').localeCompare(b.get('pathTemplate'));
      return c;
    });
  },

  // **pie.router.parseUrl**
  //
  // Given a `path`, generate an object representing the matching route.
  // The result will  have the following attributes:
  // * **path** - a normalized version of the matching path.
  // * **fullPath** - the normalized path including the query string.
  // * **interpolations** - an object representing the interpolations within the path.
  // * **query** - an object representing the query string.
  // * **data** - an object combining the interpolations and the query
  // * **route** - the matching route object.
  // * ** * ** - all the information passed into the router for the matching route.
  parseUrl: function(path, parseQuery) {
    return this.cache.getOrSet(path, function(){

      var result, pieces, query, match, fullPath, pathWithRoot, interpolations;

      pieces = path.split('?');

      path = pieces.shift();
      path = path.replace(this.get('rootRegex'), '');
      path = pie.string.normalizeUrl(path);

      query = pieces.join('&') || '';

      match = this.findRoute(path);

      query = pie.string.deserialize(query, parseQuery);
      fullPath = pie.array.compact([path, pie.object.serialize(query)], true).join('?');
      pathWithRoot = pie.string.normalizeUrl(this.get('root') + path);
      interpolations = match && match.interpolations(path, parseQuery);

      result = pie.object.merge({
        path: path,
        fullPath: fullPath,
        pathWithRoot: pathWithRoot,
        interpolations: interpolations || {},
        query: query,
        data: pie.object.merge({}, interpolations, query),
        route: match
      }, match && match.options || this.missedConfig);

      return result;
    }.bind(this));
  }
}, pie.mixins.container);
pie.routeHandler = pie.base.extend('routeHandler', {

  init: function(app, options) {
    this.app = app;
    this.options = pie.object.merge({
      viewNamespace: 'lib.views',
      uiTarget: 'body',
      viewKey: 'view',
      viewTransitionClass: pie.simpleViewTransition,
      viewTransitionOptions: {}
    }, options);

    this._super();

    this.urlModel = this.app.parsedUrl;
    this.emitter  = this.app.emitter;
  },

  currentView: function() {
    return app.getChild("currentView");
  },

  handle: function(changeSet) {
    return this.handleRedirect(changeSet) || this.handleView(changeSet);
  },

  handleRedirect: function(/* changeSet */) {
    var redirectTo = this.urlModel.get('redirect');
    if(redirectTo) {
      this.app.go(redirectTo);
      return true;
    } else {
      return false;
    }
  },

  handleView: function(changeSet) {
    var current = this.currentView();

    // if the view that's in there is already loaded, don't remove / add again.
    if(current && current._pieName === this.urlModel.get(this.options.viewKey)) {
      this.emitter.fire('navigationUpdated', changeSet);
      if(pie.object.has(current, 'navigationUpdated', true)) current.navigationUpdated(changeSet);
      return true;
    }

    if(!this.urlModel.get(this.options.viewKey)) return false;

    this.transitionToNewView(changeSet);
    return true;
  },

  // The process for transitioning to a new view.
  // Both the current view and the next view are optional.
  transitionToNewView: function(changeSet) {
    var current = this.currentView(),
        target, viewClass, child, transition;

    target = pie.qs(this.options.uiTarget);

    // Provide some events that can be observed around the transition process.
    this.emitter.fire('beforeViewChanged', changeSet);
    this.emitter.fireAround('aroundViewChanged', function() {

      this.emitter.fire('viewChanged', changeSet);

      // Use the view key of the urlModel to find the viewClass.
      // At this point we've already verified the view option exists, so we don't have to check it.
      viewClass = pie.object.getPath(window, this.options.viewNamespace + '.' + this.urlModel.get(this.options.viewKey));

      // The instance to be added. If the class is not defined, this could and should blow up.
      child = new viewClass({ app: this.app });

      // Cache an identifier on the view so we can invoke navigationUpdated instead of reloading
      // if the url changes but the view does not
      child._pieName = this.urlModel.get(this.options.viewKey);

      // Instantiate a transition object based on the app configuration.
      transition = new this.options.viewTransitionClass(this.app, pie.object.merge({
        oldChild: current,
        newChild: child,
        childName: "currentView",
        targetEl: target
      }, this.options.viewTransitionOptions));

      // Provide a couple common events out of the app.
      transition.emitter.on('afterRemoveOldChild', function() {
        this.emitter.fire('oldViewRemoved', current);
      }.bind(this));

      transition.emitter.on('afterTransition', function() {
        this.emitter.fire('newViewLoaded', child);
      }.bind(this));

      transition.transition(function(){
        // The instance is now our 'currentView'
        this.emitter.fire('afterViewChanged', changeSet);
      }.bind(this));

    }.bind(this));
  },
});
// # Pie Templates
// A container for a collection of templates. It knows how to read, compile, and invoke template functions.
// ```
// templates.registerTemplate('plainOld', "Just plain old string content: [%= data.id %]");
// templates.render('plainOld', {id: 'fooBar'});
// //=> "Just plain old string content: fooBar"
// ```
//
// Templates can be declared in two ways:
// 1. **script tag content** - tags matching the `templateSelector` class option can be given an id attribute which maps to the templates name.
// If a template by that name is requested and has not yet been compiled, the tag's content will be parsed and a template function will be generated.
// 2. **script tag data-src** - The same process as `1.` is followed but if a `data-src` attribute is present a `text/html` ajax request will take place to fetch the template content.
// After fetch, the content will be parsed and a template will be generated. This method is inherently async and is only checked if `templates#renderAsync` is used.
pie.templates = pie.model.extend('templates', {

  init: function(app, options) {
    this._super({}, pie.object.merge({
      app: app,
      templateSelector: 'script[type="text/pie-template"]'
    }, options));
  },

  _node: function(name) {
    return pie.qs(this.options.templateSelector + '[id="' + name + '"]');
  },

  ensureTemplate: function(name, cb) {
    var node, content, src;

    if(this.get(name)) {
      cb(name);
      return;
    }

    node = this._node(name);
    content = node && (node.content || node.textContent);
    src = node && node.getAttribute('data-src');

    if (content) {
      this.registerTemplate(name, content);
      cb(name);
      return
    } else if(src) {
      this.load(name, {url: src}, function(){
        this.ensureTemplate(name, cb);
      }.bind(this));
    } else {
      throw new Error("[PIE] Template fetch error: " + name);
    }

  },

  // **pie.templates.registerTemplate**
  //
  // Register a template containing the `content` by the `name`.
  // The resulting function will be one produced by `pie.string.template` but will
  // have any registered helpers available via the `pie.helpers` `variableName` option.
  //
  // So the following template would function fine, given the default helper methods as defined by `pie.helpers`
  // ```
  // <h1>[%= h.t("account.hello") %], [%= h.get(data, "firstName") %]</h1>
  // ```
  registerTemplate: function(name, content) {
    var args = pie._debugArgs('Compiling template: %c' + name);
    args.push("color: #aaa;");

    this.app.debug.apply(this.app, args);

    this.set(name, pie.string.template(content, this.app.helpers.provideVariables()));
  },

  // **pie.templates.load**
  //
  // Load a template from an external source, register it, then invoke the callback.
  // ```
  // templates.load('fooBar', {url: '/foo-bar.html'}, function(){
  //   template.render('fooBar', {});
  // });
  // ```
  load: function(name, ajaxOptions, cb) {
    ajaxOptions = pie.object.merge({
      verb: 'get',
      accept: 'text/html'
    }, ajaxOptions);

    var req = this.app.ajax.ajax(ajaxOptions);

    req.dataSuccess(function(content) {
      this.registerTemplate(name, content);
    }.bind(this)).error(function(){
      throw new Error("[PIE] Template fetch error: " + name);
    }).complete(function() {
      cb();
    });

  },

  // **pie.templates.render**
  //
  // Synchronously render a template named `name` with `data`.
  // This will compile and register a template if it's never been seen before.
  // ```
  // <script id="fooBar" type="text/pie-template">
  //   Hi, [%= data.name %]
  // </script>
  // <script>
  //   templates.render('fooBar', {name: 'Doug'});
  //   //=> "Hi, Doug"
  // </script>
  // ```
  render: function(name, data) {
    if(!this.get(name)) {

      var node = this._node(name);

      if(node) {
        this.registerTemplate(name, node.content || node.textContent);
      } else {
        throw new Error("[PIE] Unknown template error: " + name);
      }
    }

    return this.get(name)(data || {});
  },

  // **pie.templates.renderAsync**
  //
  // Render a template asynchronously. That is, attempt to extract the content from the associated `<script>` but
  // if it declares a `data-src` attribute, fetch the content from there instead. When the template is available
  // and rendered, invoke the callback `cb` with the content.
  // ```
  // <script id="fooBar" type="text/pie-template" data-src="/foo-bar.html"></script>
  // <script>
  //   templates.renderAsync('fooBar', {name: 'Doug'}, function(content){
  //     //=> "Hi, Doug"
  //   });
  // </script>
  // ```
  renderAsync: function(name, data, cb) {
    this.ensureTemplate(name, function() {
      content = this.render(name, data);
      cb(content);
    }.bind(this));
  }
});
// # Pie Validator
// A collection of validators commonly used in web forms.
// ```
// validator = new pie.validator();
// validator.email("foo@djalfdsaf");
// //=> false
// validator.email("foo@bar.com");
// //=> true
// validator.email("", {allowBlank: true});
// //=> true
// ```
// Messages can be generated based on a validation type and the set of provided options. The messages are formed
// via the associated app's `i18n` object.
// ```
// validator.errorMessage('length', {gte: 4})
// //=> "must be greater than or equal to 4"
// ```
// Default validation messages are configured in i18n.js.
pie.validator = pie.base.extend('validator', {

  init: function(app, options) {
    this.app = app || pie.appInstance;
    this.i18n = app.i18n;
    this.options = pie.object.deepMerge({
      formats: {
        isoDate: /^\d{4}\-\d{2}\-\d{2}$/,
        isoTime: /^\d{4}\-\d{2}\-\d{2}T\d{2}-\d{2}-\d{3}/,
        epochs: /^\d{10}$/,
        epochms: /^\d{13}$/
      }
    }, options);

    this._super();
  },

  // **pie.validator.errorMessage**
  //
  // Generate a validation message based on the given `validationType` and `validationOptions`.
  // Note there is no value given so the message will always be the full set of expectations, not
  // necessarily the parts that failed.
  // ```
  // validator.errorMessage("length", {gte: 4})
  // //=> "must be greater than or equal to 4"
  // ```
  errorMessage: function(validationType, validationOptions) {

    if(validationOptions.message) return this.app.i18n.attempt(validationOptions.message);

    var key = validationOptions.messageKey || validationType,
        base = this.i18n.t('app.validations.' + key),
        rangeOptions = new pie.validator.rangeOptions(this.app, validationOptions),
        range = rangeOptions.message();

    if(!range && key === 'length') {
      rangeOptions = new pie.validator.rangeOptions(this.app, {gt: 0});
      range = rangeOptions.message();
    }

    return (base + ' ' + range).trim();
  },


  // **pie.validator.withStandardChecks**
  //
  // A series of common checks to make based on options passed to validators.
  // It handles `allowBlank`, `if`, and `unless` checks. Assuming all of these conditions
  withStandardChecks: function(value, options, f){
    options = options || {};

    if(options.allowBlank && !this.presence(value)) return true;
    if(options.unless && options.unless.call()) return true;
    if(options['if'] && !options['if'].call()) return true;

    return f.call();
  },

  // **pie.validator.ccNumber**
  //
  // Determine whether the provided value looks like a credit card number.
  // It ensures a number, that it has an appropriate length,
  // and that it passes the luhn check.
  //
  // ```
  // validator.ccNumber("4242 4242 4242 4242")
  // //=> true
  // validator.ccNumber("4242 4242")
  // //=> false
  // validator.ccNumber("4242 4244 4442 4242")
  // //=> false
  // ```
  ccNumber: (function(){
    /* http://rosettacode.org/wiki/Luhn_test_of_credit_card_numbers#JavaScript */
    /* for checking credit card validity */
    var luhnCheck = function(a) {
      var b,c,d,e;
      for(d = +a[b = a.length-1], e=0; b--;)
        c = +a[b], d += ++e % 2 ? 2 * c % 10 + (c > 4) : c;
      return !(d%10);
    };

    return function(value, options){
      return this.withStandardChecks(value, options, function(){

        // don't get rid of letters because we don't want a mix of letters and numbers passing through
        var sanitized = String(value).replace(/[^a-zA-Z0-9]/g, '');
        return this.number(sanitized) &&
               this.length(sanitized, {gte: 10, lte: 16}) &&
               luhnCheck(sanitized);
      }.bind(this));
    };
  })(),

  // **pie.validator.ccExpirationMonth**
  //
  // Ensures the provided value is a valid month (1-12).
  ccExpirationMonth: function(value, options) {
    return this.withStandardChecks(value, options, function() {
      return this.integer(value, {gte: 1, lte: 12});
    }.bind(this));
  },


  // **pie.validator.ccExpirationYear**
  //
  // Ensures the provided value is a valid credit card year.
  // It assumes the minimum is this year, and the maximum is 20 years from now.
  ccExpirationYear: function(value, options) {
    return this.withStandardChecks(value, options, function() {
      var now = new Date();
      return this.integer(value, {gte: now.getFullYear(), lte: now.getFullYear() + 20});
    }.bind(this));
  },


  // **pie.validator.ccSecurity**
  //
  // Ensures a well-formed cvv value.
  // It must be a number between 3 and 4 characters long.
  ccSecurity: function(value, options) {
    return this.withStandardChecks(value, options, function() {
      return this.number(value) &&
              this.length(value, {gte: 3, lte: 4});
    }.bind(this));
  },


  // **pie.validator.chosen**
  //
  // Ensures the provided value is present. To be used for select boxes,
  // radios, and checkboxes.
  // If the value is an array, it will check to see if there is at least one
  // value in the array.
  // ```
  // validator.chosen("")
  // //=> false
  // validator.chosen("foo")
  // //=> true
  // validator.chosen([])
  // //=> false
  // validator.chosen(["foo"])
  // //=> true
  // validator.chosen([""])
  // //=> false
  // ```
  chosen: (function(){

    var valueCheck = function(value){
      return value != null && value !== '';
    };

    return function(value, options){
      return this.withStandardChecks(value, options, function(){
        if(Array.isArray(value)) {
          return !!value.filter(valueCheck).length;
        }
        return valueCheck(value);
      });
    };
  })(),


  // **pie.validator.date**
  //
  // Determines if the provided value is a date (in the form of an iso8601 timestamp or iso8601 date - "yyyy-mm-dd").
  // Optionally, you may pass any range options for comparison.
  // ```
  // validator.date("2015-04-01")
  // //=> true
  // validator.date("2012-00-00")
  // //=> false
  // validator.date("2015-13-01")
  // //=> false
  // d.setDate("2022-10-10", {gte: new Date()});
  // //=> true
  // ```
  date: function(value, options) {
    options = options || {};
    return this.withStandardChecks(value, options, function() {
      var split = value.split('-'), y = split[0], m = split[1], d = split[2], iso, date;

      if(!y || !m || !d) return false;
      if(!this.length(y, {eq: 4}) || !this.length(m, {eq: 2}) || !this.length(d, {eq: 2})) return false;
      if(!this.number(y) || !this.number(m, {gte: 1, lte: 12}) || !this.number(d, {gte: 1, lte: 31})) return false;

      date = new Date(y, m-1, d);

      /* ensure the date is actually in the defined month */
      if(date.getDate() !== parseInt(d, 10)) return false;

      if(!options.sanitized) {
        Object.keys(options).forEach(function(k){
          iso = options[k];
          iso = this.app.i18n.l(iso, 'isoDate');
          options[k] = iso;
        });
        options.sanitized = true;
      }

      var ro = new pie.validator.rangeOptions(this.app, options);
      return ro.matches(value);

    }.bind(this));
  },


  // **pie.validator.email**
  //
  // Loosely checks the validity of an email address.
  // It simply looks for something in the form of [a]@[b].[c]
  // ```
  // validator.email("foo@bar.com")
  // //=> true
  // validator.email("foo@bar")
  // //=> false
  // validator.email("foo@bar.baz.com")
  // //=> true
  // ```
  email: function(value, options) {
    options = pie.object.merge({allowBlank: false}, options || {});
    return this.withStandardChecks(value, options, function(){
      return (/^.+@.+\..+$/).test(value);
    });
  },

  // **pie.validator.fn**
  //
  // A generic function interface. This enables a function to be passed,
  // along with all the normal options.
  // ```
  // var opts = {fn: function(v){ return v.length === 3; }};
  // validator.fn("foo", opts);
  // //=> true
  // validator.fn("foos", opts);
  // //=> false
  // ```
  fn: function(value, options, cb) {
    return this.withStandardChecks(value, options, function(){
      return options.fn.call(null, value, options, cb);
    });
  },


  // **pie.validator.format**
  //
  // Determine if a value matches a given format. The format, provided via the `format` option, can be a regular expression
  // or a named format as defined by the validator instance's `formats` option.
  // By default, named formats include `isoDate`, `isoTime`, `epochs` (epoch seconds), and `epochms` (epoch milliseconds).
  // ```
  // validator.format("foo", {format: /oo/});
  // //=> true
  // validator.format("bar", {format: /oo/});
  // //=> false
  // validator.format("2015-04-20", {format: 'isoDate'});
  // //=> true
  // validator.format("2015-04-20", {format: 'isoTime'});
  // //=> false
  // ```
  format: function(value, options) {
    options = options || {};
    return this.withStandardChecks(value, options, function() {
      var fmt = options.format || options['with'];
      fmt = this.options.formats[fmt] || fmt;
      return !!fmt.test(String(value));
    }.bind(this));
  },


  // **pie.validator.inclusion**
  //
  // Is the value part of the expected list?
  // The list is defined via the `in` option and can either be an array, object, or function.
  // In the case of a function, it is evaluated and the result is used as the list.
  // In the case of an array, the array is checked for `value`'s inclusion.
  // In the case of an object, the `value` is checked for equality.
  // ```
  // validator.inclusion("foo", {in: "foo"});
  // //=> true
  // validator.inclusion("foo", {in: "food"});
  // //=> false
  // validator.inclusion("foo", {in: ["foo"]});
  // //=> true
  // validator.inclusion("foo", {in: []});
  // //=> true, because the "in" option is considered blank.
  // validator.inclusion("foo", {in: function(){ return ["bar"] }});
  // //=> false
  // validator.inclusion("foo", {in: function(){ return ["bar", "foo"] }});
  // //=> true
  // ```
  inclusion: function(value, options) {
    options = options || {};
    return this.withStandardChecks(value, options, function() {
      var inVal = pie.fn.valueFrom(options['in']);
      if(Array.isArray(inVal)) return !inVal.length || !!~inVal.indexOf(value);
      return inVal == null || inVal === value;
    });
  },

  // **pie.validator.integer**
  //
  // Check if a value is an integer, not based on precision but based on value.
  // ```
  // validator.integer(4)
  // //=> true
  // validator.integer(4.4)
  // //=> false
  // validator.integer(4.0)
  // //=> true
  // validator.integer("4.0")
  // //=> true
  // validator.integer(3, {gt: 1, lte: 10})
  // //=> true
  // validator.integer(3.5, {gt: 1, lte: 10})
  // //=> false
  // ```
  integer: function(value, options){
    return  this.withStandardChecks(value, options, function(){
      return  this.number(value, options) &&
              parseInt(value, 10) === parseFloat(value, 10);
    }.bind(this));
  },


  // **pie.validator.length**
  //
  // Is the length of `value` within the desired range?
  // If the value is an array it will use the array's length, otherwise, it will use the length of the String cast version of the value.
  // If no ranges are given, it checks for a length of greater than 0
  // ```
  // validator.length("foo")
  // //=> true
  // validator.length("")
  // //=> false
  // validator.length("foo", {gte: 2, lte: 3})
  // //=> true
  // validator.length(["foo"], {gte: 2, lte: 3})
  // //=> false
  // validator.length([""])
  // //=> true
  // ```
  length: function(value, options){
    options = pie.object.merge({allowBlank: false}, options);

    /* preparation to use the number validator */
    if(!pie.object.hasAny(options, 'gt', 'gte', 'lt', 'lte', 'eq')){
      options.gt = 0;
    }

    return this.withStandardChecks(value, options, function(){
      var length = Array.isArray(value) ? value.length : String(value).trim().length;
      return this.number(length, options);
    }.bind(this));
  },


  // **pie.validator.number**
  //
  // Must be a number and in the given range.
  // ```
  // validator.number(4)
  // //=> true
  // validator.number(4.4)
  // //=> false
  // validator.number("alpha")
  // //=> false
  // validator.number("4.0")
  // //=> true
  // validator.number(3, {gt: 1, lte: 10})
  // //=> true
  // validator.number(20, {gt: 1, lte: 10})
  // //=> false
  // ```
  number: function(value, options){
    options = options || {};

    return this.withStandardChecks(value, options, function(){

      /* not using parseFloat because it accepts multiple decimals */
      /* ip addresses would be considered numbers if parseFloat was used */
      if(!/^([\-])?([\d]+)?\.?[\d]+$/.test(String(value))) return false;

      var number = parseFloat(value),
      ro = new pie.validator.rangeOptions(this.app, options);

      return ro.matches(number);
    });
  },

  // **pie.validator.phone**
  //
  // Remove whitespace and unecessary characters and ensure we have a 10 digit number.
  // clean out all things that are not numbers and + and get a minimum of 10 digits.
  // If you want a locale based phone validation, use the format validator.
  // ```
  // validator.phone("555-555-5555")
  // //=> true
  // validator.phone("555-5555")
  // //=> false
  // validator.phone("(555) 555-5555")
  // //=> true
  // validator.phone("+15555555555")
  // //=> true
  // validator.phone("555-555-5555 on weekdays")
  // //=> true
  // ```
  phone: function(value, options) {
    options = pie.object.merge({allowBlank: false}, options || {});

    return this.withStandardChecks(value, options, function(){
      var clean = String(value).replace(/[^\+\d]+/g, '');
      return this.length(clean, {gte: 10});
    }.bind(this));
  },


  // **pie.validator.presence**
  //
  // Check if a value is truthy and has any non-whitespace characters.
  // ```
  // validator.presence(null)
  // //=> false
  // validator.presence("")
  // //=> false
  // validator.presence("   ")
  // //=> false
  // validator.presence(false)
  // //=> false
  // validator.presence(true)
  // //=> true
  // validator.presence("foo")
  // //=> true
  // ```
  presence: function(value, options){
    return this.withStandardChecks(value, pie.object.merge({}, options, {allowBlank: false}), function(){
      return !!(value && (/[^ ]/).test(String(value)));
    });
  },

  // **pie.validator.uniqueness**
  //
  // Determine whether the given value is unique within the array defined by the `within` option.
  // The `within` option can be an array or a function which returns an array.
  // ```
  // validator.uniqueness("foo", {within: ["foo", "bar"]})
  // //=> true
  // validator.uniqueness("foo", {within: ["foo", "bar", "foo"]})
  // //=> false
  // validator.uniqueness("foo", {within: function(){ return ["foo", "bar"]; }});
  // //=> true
  // ```
  uniqueness: function(value, options) {
    return this.withStandardChecks(value, options, function() {

      if(!options.within) return true;
      var within = pie.fn.valueFrom(options.within), i = 0, cnt = 0;
      for(; i < within.length; i++) {
        if(within[i] === value) cnt++;
        if(cnt > 1) return false;
      }

      return true;
    });
  },

  // **pie.validator.url**
  //
  // Determine whether `value` loosely looks like a url.
  // For a more complicated url check, use the format validator.
  // ```
  // validator.url("http://www.google.com")
  // //=> true
  // validator.url("https://www.google.com")
  // //=> true
  // validator.url("www.google.com")
  // //=> false
  // ```
  url: function(value, options) {
    options = pie.object.merge({}, options, {format: /^https?\:\/\/.+\..+$/});
    return this.format(value, options);
  }

});



// ## Pie Range Options
//
// A small utilitly class which matches range options to comparators.
// ```
// range = new pie.validator.rangeOptions(app, {gte: 3, lt: 8});
// range.matches(3)
// //=> true
// range.matches(10)
// //=> false
// ```
pie.validator.rangeOptions = pie.base.extend('rangeOptions', {

  init: function(app, hash) {
    this.i18n = app.i18n;
    this.rangedata = hash || {};
    /* for double casting situations */
    if(pie.object.has(this.rangedata, 'rangedata')) this.rangedata = this.rangedata.rangedata;
  },

  get: function(key) {
    return pie.fn.valueFrom(this.rangedata[key]);
  },

  has: function(key) {
    return pie.object.has(this.rangedata, key);
  },

  t: function(key, options) {
    return this.i18n.t('app.validations.range_messages.' + key, options);
  },

  matches: function(value) {
    var valid = true;
    valid = valid && (!this.has('gt') || value > this.get('gt'));
    valid = valid && (!this.has('lt') || value < this.get('lt'));
    valid = valid && (!this.has('gte') || value >= this.get('gte'));
    valid = valid && (!this.has('lte') || value <= this.get('lte'));
    valid = valid && (!this.has('eq') || value === this.get('eq'));
    return valid;
  },

  message: function() {
    if(this.has('eq')) {
      return this.t('eq', {count: this.get('eq')});
    } else {
      var s = ['',''];

      if(this.has('gt')) s[0] += this.t('gt', {count: this.get('gt')});
      else if(this.has('gte')) s[0] += this.t('gte', {count: this.get('gte')});

      if(this.has('lt')) s[1] += this.t('lt', {count: this.get('lt')});
      else if(this.has('lte')) s[1] += this.t('lte', {count: this.get('lte')});

      return pie.array.toSentence(pie.array.compact(s, true), this.i18n).trim();
    }
  }
});
// general framework for transitioning between views.
pie.abstractViewTransition = pie.base.extend('abstractViewTransition', {

  init: function(parent, options) {
    options = options || {};

    this.emitter    = new pie.emitter();
    this.parent     = parent;
    this.oldChild   = options.oldChild;
    this.newChild   = options.newChild;
    this.childName  = options.childName || this.oldChild && this.oldChild._nameWithinParent;
    this.targetEl   = options.targetEl  || this.oldChild && this.oldChild.el.parentNode;

    if(!this.childName) throw new Error("No child name provided for view transition");
    if(!this.targetEl)  throw new Error("No target element provided for view transition");

    this.options = options;

    this.emitter.on('beforeTransition', this.manageChildren.bind(this));
  },

  // fire a sequence which looks like
  // ```
  // | beforeTransition
  // | transition
  // |--| beforeRemoveOldChild
  // |  | removeOldChild
  // |  | afterRemoveOldChild
  // |  |--| beforeAddNewChild
  // |     | addNewChild
  // |     | afterAddNewChild
  // | afterTransition
  // ```
  transition: function(cb) {
    var em = this.emitter;

    em.on('afterAddNewChild', function() {
      em.fire('afterTransition');
      if(cb) cb();
    });

    em.on('afterRemoveOldChild', function() {
      em.fire('beforeAddNewChild');
      em.fireAround('aroundAddNewChlid', function() {
        em.fire('addNewChild');
      });
    });

    em.on('transition', function() {
      em.fire('beforeRemoveOldChild');
      em.fireAround('aroundRemoveOldChild', function() {
        em.fire('removeOldChild');
      });
    });

    em.fire('beforeTransition');
    em.fireAround('aroundTransition', function() {
      em.fire('transition');
    });
  },

  // to be called at the beginning of each transition.
  // this removes the old child from it's parent and adds the new one
  // it also begins the setup process for the new child.
  manageChildren: function() {
    if(this.oldChild) this.parent.removeChild(this.oldChild);
    if(this.newChild) {
      this.parent.addChild(this.childName, this.newChild);
      if(!this.newChild.emitter.hasEvent('beforeSetup')) this.newChild.setup();
    }
  },

});


// Simple view transition: remove the old child from the view and dom, add the new child immediately after.
// Uses the default sequence of events.
pie.simpleViewTransition = pie.abstractViewTransition.extend('simpleViewTransition', {

  init: function() {
    this._super.apply(this, arguments);

    this.emitter.on('removeOldChild', this.removeOldChild.bind(this));
    this.emitter.on('addNewChild',    this.addNewChild.bind(this));
  },

  addNewChild: function() {
    if(this.newChild) {
      this.newChild.emitter.once('afterSetup', function(){
        this.newChild.appendToDom(this.targetEl);
        this.emitter.fire('afterAddNewChild');
      }.bind(this), {immediate: true});
    } else {
      this.emitter.fire('afterAddNewChild');
    }
  },

  removeOldChild: function() {
    if(this.oldChild) {
      this.oldChild.teardown();
    }
    this.emitter.fire('afterRemoveOldChild');
  }

});

pie.loadingViewTransition = pie.simpleViewTransition.extend('loadingViewTransition', {

  init: function() {
    this._super.apply(this, arguments);

    this.options.loadingClass = this.options.loadingClass || 'is-loading';
  },

  setLoading: function(bool) {
    this.targetEl.classList[bool ? 'add' : 'remove'](this.options.loadingClass);
  },

  addNewChild: function() {
    if(!this.newChild) {
      this.emitter.fire('afterAddNewChild');
      return;
    }

    this.begin = pie.date.now();

    this.setLoading(true);

    if(this.options.minDelay) {
      setTimeout(this.attemptToAddChild.bind(this), this.options.minDelay);
    }

    this.newChild.emitter.once('afterSetup', function() {
      this.attemptToAddChild(true);
    }.bind(this), {immediate: true});
  },

  attemptToAddChild: function(partOfAfterSetup) {
    var now = pie.date.now();
    if(partOfAfterSetup || this.newChild.emitter.hasEvent('afterSetup')) {
      if(!this.options.minDelay || now >= (this.begin + this.options.minDelay)) {
        if(!this.newChild.emitter.hasEvent('removedFromParent')) {
          this.setLoading(false);
          this.newChild.appendToDom(this.targetEl);
          this.emitter.fire('afterAddNewChild');
        }
      }
    }
  }
});

// A transition which applies an "out" class to the old view, removes it after it transitions out, then adds
// the new view to the dom and applies an "in" class.
// Preparation of the new view is done as soon as the transition is started, enabling the shortest possible
// amount of delay before the next view is added to the dom.
pie.inOutViewTransition = pie.abstractViewTransition.extend('inOutViewTransition', {

  init: function() {
    this._super.apply(this, arguments);

    this.options = pie.object.merge({
      // the new view will gain this class
      inClass: 'view-in',
      // the old view will gain this class
      outClass: 'view-out',
      // if the browser doesn't support onTransitionEnd, here's the backup transition duration
      backupDuration: 250,
      // async=true means the new view doesn't wait for the old one to leave.
      // async=false means the new view won't be added to the dom until the previous is removed.
      async: false
    }, this.options);

    this.setupObservations();
  },

  setupObservations: function() {
    var em = this.emitter;

    if(this.oldChild) {
      em.on('transitionOldChild',       this.cancelWrap('transitionOldChild'));
      em.on('afterTransitionOldChild',  this.cancelWrap('teardownOldChild'));
    } else {
      em.on('transitionOldChild', function() {
        em.fire('afterTransitionOldChild');
      });
    }

    if(this.newChild) {
      em.on('addNewChild',              this.cancelWrap('addNewChild'));
      em.on('aroundTransitionNewChild', this.cancelWrap('ensureNewChildPrepared'));
      em.on('transitionNewChild',       this.cancelWrap('refresh'));
      em.on('transitionNewChild',       this.cancelWrap('transitionNewChild'));

      this.newChild.emitter.once('removedFromParent', this.cancel.bind(this));
    } else {
      em.on('transitionNewChild', function() {
        em.fire('afterTransitionNewChild');
      });
    }
  },

  cancelWrap: function(fnName) {
    return function(){
      if(!this.emitter.hasEvent('cancel')) {
        this[fnName].apply(this, arguments);
      }
    }.bind(this);
  },

  // apply the relevant class(es) to the element.
  applyClass: function(el, isIn) {
    var add = isIn ? this.options.inClass : this.options.outClass,
        remove = isIn ? this.options.outClass : this.options.inClass;

    if(add) el.classList.add(add);
    if(remove) el.classList.remove(remove);
  },

  // WHEN options.async !== true
  // fire a sequence which looks like
  // ```
  // | beforeTransition
  // | transition
  // |  |--| beforeRemoveOldChild
  // |     |--| beforeTransitionOldChild
  // |        | transitionOldChild
  // |        |--| afterTransitionOldChild
  // |           |--| removeOldChild
  // |           |  |--| afterRemoveOldChild
  // |           |
  // |           |--| beforeAddNewChild
  // |              | addNewChild
  // |              |--| afterAddNewChild
  // |                 |--| beforeTransitionNewChild
  // |                    | transitionNewChild
  // |                    |--| afterTransitionNewChild
  // |                       |--| afterTransition
  // ```
  //
  // WHEN options.async === true
  // fire a sequence which looks like
  // ```
  // | beforeTransition
  // | transition
  // |  |--| beforeRemoveOldChild
  // |  |  |--| beforeTransitionOldChild
  // |  |     | transitionOldChild
  // |  |     |--| afterTransitionOldChild
  // |  |        |--| removeOldChild
  // |  |           |--| afterRemoveOldChild
  // |  |
  // |  |--| beforeAddNewChild
  // |     | addNewChild
  // |     |--| afterAddNewChild
  // |        |--| beforeTransitionNewChild
  // |           | transitionNewChild
  // |           |--| afterTransitionNewChild
  // |              |--| afterTransition
  // ```

  transition: function(cb) {
    var em = this.emitter;

    em.on('afterTransitionNewChild', function() {
      em.fire('afterTransition');
      if(cb) cb();
    });

    if(this.options.async) {
      em.on('transition', function() {
        em.fireSequence('addNewChild');
      });
    } else {
      em.on('afterRemoveOldChild', function() {
        em.fireSequence('addNewChild');
      });
    }

    em.on('afterAddNewChild', function() {
      em.fire('beforeTransitionNewChild');
      em.fireAround('aroundTransitionNewChild', function() {
        em.fire('transitionNewChild');
      });
    });

    em.on('afterTransitionOldChild', function() {
      em.fireSequence('removeOldChild');
    });

    em.on('transition', function() {
      em.fire('beforeTransitionOldChild');
      em.fireAround('aroundTransitionOldChild', function() {
        em.fire('transitionOldChild');
      });
    });

    em.fire('beforeTransition');
    em.fireAround('aroundTransition', function() {
      em.fire('transition');
    });

  },

  cancel: function() {
    if(!this.emitter.hasEvent('afterTransitionNewChild')) {

      // the goal of a transition is to get the old child out and the new child in,
      // we make sure we've done that.
      if(this.oldChild) {
        this.teardownOldChild();
      }

      if(this.newChild) {
        this.applyClass(this.newChild.el, true);
        this.newChild.appendToDom(this.targetEl);
      }

      // then we let everyone else know.
      this.emitter.fire('cancel');
    }
  },

  // teardown() the child if it hasn't already.
  teardownOldChild: function() {
    if(!this.oldChild.emitter.hasEvent('beforeTeardown')) {
      this.oldChild.teardown();
    }
  },

  // give the new child the "out" classes, then add it to the dom.
  addNewChild: function() {
    // this.applyClass(this.newChild.el, false);
    this.newChild.appendToDom(this.targetEl);
  },

  ensureNewChildPrepared: function(cb) {
    this.newChild.emitter.once('afterRender', cb, {immediate: true});
  },

  // make sure we're rendered, then begin the ui transition in.
  // when complete, invoke the callback.
  transitionNewChild: function() {
    this.observeTransitionEnd(this.newChild.el, true, 'afterTransitionNewChild');
  },

  // start the transition out. when complete, invoke the callback.
  transitionOldChild: function() {
    if(!this.oldChild.el.parentNode) this.emitter.fire('afterTransitionOldChild');
    else this.observeTransitionEnd(this.oldChild.el, false, 'afterTransitionOldChild');
  },

  // ensure the browser has redrawn and locations are up to date.
  refresh: function(cb) {
    if(this.oldChild) this.oldChild.el.getBoundingClientRect();
    if(this.newChild) this.newChild.el.getBoundingClientRect();
    if(cb) cb();
  },

  // build a transition callback, and apply the appropriate class.
  // when the transition is complete, invoke the callback.
  observeTransitionEnd: function(el, isIn, fire) {
    var transitionEvent = this.transitionEvent(el),
    trans = transitionEvent.event,
    dur = transitionEvent.duration,
    called = false,
    onTransitionEnd = function() {
      if(called) return;
      called = true;
      if(trans) pie.dom.off(el, trans, onTransitionEnd);
      this.emitter.fire(fire);
    }.bind(this);

    this.emitter.once('cancel', onTransitionEnd);

    if(trans) {
      pie.dom.on(el, trans, onTransitionEnd);
    }

    this.applyClass(el, isIn);

    if(trans) {
      if(!isNaN(dur)) {
        setTimeout(onTransitionEnd, dur * 1.1);
      }
    } else {
      setTimeout(onTransitionEnd, this.options.backupDuration);
    }
  },

  // which transition event should we use?
  transitionEndEvent: function(base){
    var cap = pie.string.capitalize(base);

    if(this._transitionEndEvent === undefined) {
      if(pie.object.has(window, 'on' + base + 'end', true)) {
        this._transitionEndEvent = base + 'end';
      } else if(pie.object.has(window, 'onwebkit' + base + 'end', true)) {
        this._transitionEndEvent = 'webkit' + cap + 'End';
      } else if(pie.object.has(window, 'ms' + cap + 'End', true)) {
        this._transitionEndEvent = 'ms' + cap + 'End';
      } else if(pie.object.has(document.body, 'ono' + base + 'end', true) || navigator.appName === 'Opera') {
        this._transitionEndEvent = 'o' + cap + 'End';
      } else {
        this._transitionEndEvent = false;
      }
    }

    return this._transitionEndEvent;
  },

  // get a transition or animation property based on the browser's compatability.
  subProperty: function(endEvent, prop) {
    return endEvent.replace(/end/i, pie.string.capitalize(prop));
  },

  transitionEvent: function(el) {
    var endA = this.transitionEndEvent('transition'),
        endB = this.transitionEndEvent('animation'),
        objA = this._transitionEvent(endA, el),
        objB = this._transitionEvent(endB, el);


    return objA.duration > objB.duration ? objA : objB;
  },

  _transitionEvent: function(endEvent, el) {
    if(!endEvent) {
      return {
        duration: 0
      };
    }

    var durProp = this.subProperty(endEvent, 'duration'),
        delayProp = this.subProperty(endEvent, 'delay'),
        style = window.getComputedStyle(el),
        durs = durProp && style[durProp] && style[durProp].split(',') || ['0'],
        delays = delayProp && style[delayProp] && style[delayProp].split(',') || ['0'],
        dur, delay;

    durs = durs.map(function(d){ return parseFloat(d.toLowerCase(), 10); });
    delays = delays.map(function(d){ return parseFloat(d.toLowerCase(), 10); });

    dur = Math.max.apply(null, durs);
    delay = Math.max.apply(null, delays);

    if(durProp && durProp.indexOf('ms') < 0) {
      dur *= 1000;
    }

    if(delayProp && delayProp.indexOf('ms') < 0) {
      delay *= 1000;
    }

    return {
      event: endEvent,
      duration: parseInt(dur + delay, 10)
    };
  }

});
  pie.VERSION = "0.0.20150405.1";
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(function () {
      return pie;
    });
  } else {
    window.pie = pie;
  }
})(this);
