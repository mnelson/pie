/* jshint indent:false */
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

  __pieId: 1,


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

  // ** pie.uid **
  //
  // Set the `__pieId` of `obj` if it isn't already present.
  uid: function(obj) {
    return obj.__pieId = obj.__pieId || pie.unique();
  },

  // ** pie.unique **
  //
  // Provide a unique integer not yet used by pie.
  // This is good for unique local ids.
  unique: function() {
    return String(this.__pieId++);
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
    o.setUid  = pie.uid;
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

// ** pie.array.each **
//
// Invoke `f` on each item of a.
// `f` can be a function or the name of a function to invoke.
// ```
// pie.array.each(arr, 'send');
// ```
pie.array.each = function(a, f) {
  return pie.array._each(a, f, true, 'forEach');
};

pie.array._each = function(a, f, callInternalFunction, via) {
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

  return pie.array.from(a)[via](function(e){ return callingF(e); });
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
  if(pie.object.isArguments(value) || pie.object.instanceOf(value, 'NodeList') || pie.object.instanceOf(value, 'HTMLCollection')) return Array.prototype.slice.call(value, 0);
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

// ** pie.array.hasAll **
//
// Determine if the given array `a` has all of the provided values.
// ```
// arr = ["foo", "bar", "baz"]
// pie.array.hasAll(arr, "foo")
// //=> true
// pie.array.hasAll(arr, "foo", "bar")
// //=> true
// pie.array.hasAll(arr, ["food", "bar"])
// //=> false
// pie.array.hasAll(arr, "qux")
// //=> false
pie.array.hasAll = function(/* a, *values */) {
  var a = pie.array.from(arguments[0]),
  values = pie.array.get(arguments, 1, -1), i;
  values = pie.array.flatten(values);
  for(i=0;i<values.length;i++) {
    if(!~a.indexOf(values[i])) return false;
  }
  return true;
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
  return !values.length;
};

// ** pie.array.indexOf **
//
// Find the first index of the item that matches `f`.
// The function `f` can be a function or an attribute.
// ```
// arr = [{foo: true}, {bar: true}, {bar: true, foo: true}]
// pie.array.indexOf(arr, 'foo')
// //=> 0
// ```
pie.array.indexOf = function(a, f, startIdx) {
  a = pie.array.from(a);
  for(var i = (startIdx || 0); i < a.length; i++) {
    if(pie.object.getValue(a[i], f)) {
      return i;
    }
  }

  return -1;
};

// ** pie.array.lastIndexOf **
//
// Find the last index of the item that matches `f`.
// The function `f` can be a function or an attribute.
// ```
// arr = [{foo: true}, {bar: true}, {bar: true, foo: true}]
// pie.array.lastIndexOf(arr, 'foo')
// //=> 2
// ```
pie.array.lastIndexOf = function(a, f, startIdx) {
  a = pie.array.from(a);
  for(var i = (startIdx === undefined ? a.length - 1 : startIdx); i >= 0; i--) {
    if(pie.object.getValue(a[i], f)) {
      return i;
    }
  }
}

// ** pie.array.inGroupsOf **
//
// Break the array into groups of the desired count.
// If the length is not divisible by the desired count,
// the last group will be shorter.
// ```
// var a = [0,1,2,3,4,5,6,7];
// pie.array.inGroupsOf(a, 3);
// //=> [[0,1,2], [3,4,5], [6,7]];
// ```
pie.array.inGroupsOf = function(a, count) {
  a = pie.array.from(a);
  var out = [], sub;
  for(var i = 0; i < a.length; i++) {

    if(i % count === 0) {
      if(sub) out.push(sub);
      sub = [];
    }

    sub.push(a[i]);
  }

  if(sub.length) out.push(sub);

  return out;
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
  b = pie.array.from(b);
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
  return pie.array._each(a, f, callInternalFunction, 'map');
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

  match = /(ipad|ipod|iphone)/.exec( ua );

  if (match && match[1]) {
    b.iDevice = match[1];
    b[b.iDevice] = true;
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
    pie.object.instanceOf(document, 'DocumentTouch') ||
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
  options = pie.object.merge({path: '/'}, options);

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


(function(){
  var mod = function(method, originalArgs) {
    var args = pie.array.from(originalArgs);
    var el = args.shift();
    var classes = pie.array.flatten(args).join(' ').split(/[\s,]+/);
    classes = pie.array.map(classes, 'trim', true);
    classes = pie.array.compact(classes, true);
    classes.forEach(function(c){ el.classList[method](c); });
  };

  pie.dom.addClass = function(/* el, class1, class2 */) {
    mod('add', arguments);
  };

  pie.dom.removeClass = function(/* el, class1, class2 */) {
    mod('remove', arguments);
  };
})();


pie.dom.attrs = function(el, setters, prefix) {
  prefix = prefix || '';

  if(setters) {
    pie.object.forEach(setters, function(k,v) {
      if(v == null) {
        el.removeAttribute(prefix + k);
      } else {
        el.setAttribute(prefix + k);
      }
    });
  }

  var out = {};

  pie.object.forEach(el.attributes, function(k,v) {
    if(!prefix || k.indexOf(prefix) === 0) {
      out[k.substr(prefix.length)] = v;
    }
  });

  return out;
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
  pie.elementCache = pie.elementCache || pie.cache.create();
  return pie.elementCache;
};

pie.dom.data = function(el, setters) {
  return pie.dom.attrs(el, setters, 'data-');

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
  if(pie.object.isDom(sel)) return el === sel;

  var fn = pie.dom.prefixed(el, 'matches');
  if(fn) return fn(sel);

  fn = pie.dom.prefixed(el, 'matchesSelector');
  if(fn) return fn(sel);

  var parent = el.parentNode || el.document;
  if(!parent || !parent.querySelector) return false;

  pie.uid(el);
  el.setAttribute('data-pie-id', pie.uid(el));

  sel += '[data-pie-id="' + pie.uid(el) + '"]';
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

  pie.uid(el);
  event = eventSplit.shift();
  namespace = eventSplit.join('.');
  all = event === '*';

  events = pie.dom.cache().getOrSet('element-' + pie.uid(el) + '.dom-events', {});

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
  pie.uid(el);

  // we force capture so that delegation works.
  if(!capture && (event === 'focus' || event === 'blur') && selector) capture = true;

  events = pie.dom.cache().getOrSet('element-' + pie.uid(el)  + '.dom-events', {});
  events[event] = events[event] || [];

  cb = function(e) {
    var targ, qel;

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
  pie.uid(el);
  pie.dom.cache().set('element-' + pie.uid(el), undefined);
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
// If `sel` is a string it will find the first occurrence via a querySelector within the provided container.
// If `sel` is a dom node, the nodes position will be used.
// If `sel` is a number, it will scroll to that position.
// Available options:
//  * container - the container to scroll, defaults to document.body
//  * cb - the callback to invoke when scrolling is finished.
//  * onlyUp - only scrolls if the element is above the current position.
//  * onlyDown - only scrolls if the element is below the current position.
//  * gravity - where the element should appear in the viewport,
//  * * - any option available in pie.fn.ease
//
// ```
// pie.dom.scrollTo('header', {onlyUp: true, cb: fn, name: 'easeInQuart'});
pie.dom.scrollTo = function(sel, options) {
  var position = 0,
  container = options && options.container || pie.dom.rootScrollElement(),
  cb = options && options.cb,
  gravity = options && options.gravity || 'top',
  quit = false;

  if(pie.object.isNumber(sel)) {
    position = sel;
  } else if(pie.object.isString(sel)) {
    sel = container.querySelector(sel);
  }

  if(sel) {
    // ep is the elements position on the page.
    var ep = pie.dom.position(sel, container),
    // cp is the containers position on the page.
    cp = pie.dom.position(container);

    if(gravity === 'center') {
      position = (ep.top + (ep.height / 2)) - (cp.height / 2);
    } else if(gravity === 'bottom') {
      position = (ep.bottom - cp.height);
    } else { // top
      position = ep.top;
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
    duration: 250,
    animation: true
  }, options);

  delete options.cb;
  delete options.container;
  delete options.onlyUp;
  delete options.onlyDown;
  delete options.gravity;

  pie.fn.ease(function(p){
    container.scrollTop = p;
  }, options, cb);

};

// **pie.dom.rootScrollElement**
//
// Returns either the html or body element depending on which one
// is in charge of scrolling the page. If no determination can be
// made the html element is returned since that's what the spec
// states is correct.
//
// This is why you'll often see $('body, html').animate() in jquery apps.
pie.dom.rootScrollElement = function() {
  var body = document.body,
  html = document.documentElement;

  if(body.scrollTop) return body;
  if(html.scrollTop) return html;

  var correct;
  // both are zero, so try to change it by 1
  body.scrollTop = html.scrollTop = 1;
  if(body.scrollTop) correct = body;
  else correct = html;

  body.scrollTop = html.scrollTop = 1;
  return correct;
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
  returnVal = function(val, el, standard){
    pie.dom.cache().set('browserPrefix.' + standard, val);
    return pie.object.isFunction(val) ? val.bind(el) : val;
  };

  return function(el, standardName) {

    var cacheHit = pie.dom.cache().get('browserPrefix.' + standardName);
    if(cacheHit) return returnVal(cacheHit, el, standardName);

    var prefix, i = 0,
    capd = pie.string.capitalize(standardName);

    for(; i < prefixes.length; i++) {
      prefix = prefixes[i];

      if(el[prefix + standardName]) return returnVal(el[prefix + standardName], el, standardName);
      if(el['-' + prefix + '-' + standardName]) return returnVal(el['-' + prefix + '-' + standardName], el, standardName);
      if(el[prefix + capd]) return returnVal(el[prefix + capd], el, standardName);
    }
  };
})();

pie.dom.viewportPosition = function() {
  var windowW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
  windowH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  return {
    top: window.scrollY,
    bottom: window.scrollY + windowH,
    height: windowH,
    left: window.scrollX,
    right: window.scrollX + windowW,
    width: windowW
  };
};

pie.dom.position = function(el, container) {

  if(pie.dom.isWindow(el)) return pie.dom.viewportPosition(el);

  var   top = 0,
  left = 0,
  w = el.offsetWidth,
  h = el.offsetHeight;

  container = container || document.body;

  while(el && el !== container) {
    top += (el.offsetTop - el.scrollTop);
    left += (el.offsetLeft - el.scrollLeft);
    el = el.offsetParent;
  }

  return {
    width: w,
    height: h,
    top: top,
    left: left,
    right: left + w,
    bottom: top + h
  };
};

pie.dom.inViewport = function(el, threshold, vLoc) {
  var viewportLoc = vLoc || pie.dom.viewportPosition(),
  t = threshold || 0,
  elLoc = pie.dom.position(el);

  return  elLoc.bottom >= viewportLoc.top - t &&
          elLoc.top <= viewportLoc.bottom + t &&
          elLoc.right >= viewportLoc.left - t &&
          elLoc.left <= viewportLoc.right + t;
};
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
  counter = function fnAsyncCounter() {
    if(counterObserver) counterObserver.apply(null, arguments);
    if(++completed === completeCount) {
      if(cb) cb();
    }
  };

  fns.forEach(function fnAsyncIterator(fn) { fn(counter); });
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

// **pie.fn.delay**
//
// Delay an invocation until some time has passed. Once that time has passed, any invocation will occur immediately.
// Invocations 2-N that occur before the delay period are ignored.
// ```
// fn = pie.fn.delay(fn, 250)
// fn(); // doesn't happen but is scheduled for 250ms from now.
// // 249ms passes
// fn(); // doesn't happen, not scheduled either.
// // 1ms passes
// // one invocation is triggered.
// // N ms passes
// fn(); // happens immediately
// ```
pie.fn.delay = function(fn, delay) {
  if(!delay) return fn;

  var threshold = pie.date.now() + delay;
  var scheduled = false;

  return function() {
    var now = pie.date.now();
    if(now < threshold) {
      if(!scheduled) {
        scheduled = true;
        setTimeout(fn, threshold - now);
      }
    } else {
      fn();
    }
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
    to: 1,
    delay: 0,
    animation: false
  }, o);

  if(o.name === 'none') {
    each(o.to, 1);
    if(complete) complete();
    return;
  }

  var via = o.animation ? pie.fn._easeAnimation : pie.fn._easeInterval,
  start = function(){ via(each, o, complete); };

  if(o.delay) start = pie.fn.delay(start, o.delay);

  start();
};

/* ease using an interval (non-ui stuff) */
pie.fn._easeInterval = function(each, o, complete) {
  o.steps = o.steps || Math.max(o.duration / 16, 12);

  /* the easing function */
  var fn = pie.math.easing[o.name],
  /* the current "time" 0 to 1. */
  t = 0,
  delta = (o.to - o.from),
  dt = (1 / o.steps),
  dy,
  y,
  pid,
  runner = function easeIntervalRunner(){
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

/* ease using the animation frame (ui stuff) */
pie.fn._easeAnimation = function(each, o, complete) {

  var animate = pie.dom.prefixed(window, 'requestAnimationFrame');

  // just in case the browser doesn't support the animation frame.
  if(!animate) return pie.fn._easeInterval(each, o, complete);

  /* the easing function */
  var fn = pie.math.easing[o.name],
  // the current "time" 0 to 1.
  x = 0,
  startT,
  endT,
  delta = (o.to - o.from),
  dy,
  y,
  runner = function easeAnimationRunner(bigT){

    if(!startT) {
      startT = bigT;
      endT = startT + o.duration;
    }

    x = (bigT - startT) / (endT - startT);
    dy = fn(x);
    y = o.from + (dy * delta);
    each(y, x);

    if(bigT >= endT) {
      if(y !== o.to) each(o.to, 1);
      if(complete) complete();
    } else {
      animate(runner);
    }
  };

  animate(runner);
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

pie.fn.noop = function(){};

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

pie.fn.from = function(fn, obj) {
  if(pie.object.isString(fn) && obj) return obj[fn].bind(obj);
  return fn;
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
  easeInOutQuad: function (t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t; },
  // accelerating from zero velocity
  easeInCubic: function (t) { return t*t*t; },
  // decelerating to zero velocity
  easeOutCubic: function (t) { return (--t)*t*t+1; },
  // acceleration until halfway, then deceleration
  easeInOutCubic: function (t) { return t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },
  // accelerating from zero velocity
  easeInQuart: function (t) { return t*t*t*t; },
  // decelerating to zero velocity
  easeOutQuart: function (t) { return 1-(--t)*t*t*t; },
  // acceleration until halfway, then deceleration
  easeInOutQuart: function (t) { return t<0.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },
  // accelerating from zero velocity
  easeInQuint: function (t) { return t*t*t*t*t; },
  // decelerating to zero velocity
  easeOutQuint: function (t) { return 1+(--t)*t*t*t*t; },
  // acceleration until halfway, then deceleration
  easeInOutQuint: function (t) { return t<0.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; }
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
    if(!propagate || !pie.object.isEmpty(subObj)) return;
  }

};

pie.object.dup = function(obj, deep) {
  return pie.object[deep ? 'deepMerge' : 'merge']({}, obj);
};

pie.object.eq = function(a, b, strict) {
  var i;

  /* jslint eqeq:true */
  if(Array.isArray(a) && Array.isArray(b)) {
    if(a.length !== b.length) return false;
    for(i = 0; i < a.length; i++) {
      if(!pie.object.eq(a[i], b[i], strict)) return false;
    }
    return true;
  }

  if(pie.object.isObject(a) && pie.object.isObject(b)) {
    var aKeys = Object.keys(a).sort(), bKeys = Object.keys(b).sort();

    if(!pie.object.eq(aKeys, bKeys, strict)) return false;
    for(i = 0; i < aKeys.length; i++) {
      if(!pie.object.eq(a[aKeys[i]], b[aKeys[i]], strict)) return false;
    }

    return true;
  }

  return strict ? a === b : a == b;
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

pie.object.expand = function(o) {
  var out = {};
  pie.object.forEach(o, function(k, v){
    pie.object.setPath(out, k, v);
  });
  return out;
};

pie.object.flatten = function(a, prefix, object) {
  var b = object || {};
  prefix = prefix || '';

  pie.object.forEach(a, function(k,v) {
    if(pie.object.isPlainObject(v) && !pie.object.isEmpty(v)) {
      pie.object.flatten(v, prefix + k + '.', b);
    } else {
      b[prefix + k] = v;
    }
  });

  return b;
};

pie.object.prefix = function(a, prefix) {
  var b = {};
  pie.object.forEach(a, function(k,v) {
    b[prefix + k] = v;
  });
  return b;
};

pie.object.isWindow = function(obj) {
  return obj && typeof obj === "object" && "setInterval" in obj;
};

pie.object.isEmpty = function(obj) {
  if(!obj) return true;
  var k;
  /* jshint forin:false */
  for(k in obj) { return false; }
  return true;
};


/* From jQuery */
pie.object.isPlainObject = function(obj) {

  if ( !obj || !pie.object.isObject(obj) || obj.nodeType || pie.object.isWindow(obj) || obj.__notPlain || obj.__pieRole ) {
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

['Object', 'Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Boolean'].forEach(function(name) {
  pie.object['is' + name] = function(obj) {
    return Object.prototype.toString.call(obj) === '[object ' + name + ']';
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

pie.object.isNode = function(obj) {
  return obj instanceof Node;
};

pie.object.isDom = function(obj) {
  return pie.object.isNode(obj) || pie.object.isWindow(obj);
};

pie.object.isModel = function(obj) {
  return obj && obj.__pieRole === 'model';
};

pie.object.isView = function(obj) {
  return obj && obj.__pieRole === 'view';
};

pie.object.isPromise = function(obj) {
  return obj && obj.__pieRole === 'promise';
};

pie.object.isApp = function(obj) {
  return obj && obj.__pieRole === 'app';
};

(function() {
  var regex = /^is(.+)/;

  Object.keys(pie.object).forEach(function(k) {
    var match = k.match(regex);
    if(match) {
      pie.object['isNot' + match[1]] = function() {
        return !pie.object['is' + match[1]];
      };
    }
  });

})();

// shallow merge
pie.object.merge = function() {
  var args = pie.array.from(arguments),
      targ = args.shift() || {},
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
  var obj = arguments[0], checks;
  if(!obj) return false;

  if(arguments.length === 1) return !pie.object.isEmpty(obj);

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

pie.object.instanceOf = function(instance, nameOfClass) {
  var klass = pie.object.getPath(window, nameOfClass);
  return klass && instance instanceof klass;
};

pie.object.reopen = (function(){

  var fnTest = /xyz/.test(function(){ "xyz"; });
  fnTest = fnTest ? /\b_super\b/ : /.*/;

  var wrap = function (newF, oldF) {
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

    if(oldF === newF) return newF;

    return function superWrapper() {
      var ret, sup = this._super;
      this._super = oldF;
      ret = newF.apply(this, arguments);
      if(!sup) delete this._super;
      else this._super = sup;
      return ret;
    };
  };

  return function(/* target, *extensions */) {
    var extensions = pie.array.change(arguments, 'from', 'flatten', 'compact', 'unique'),
    target = extensions.shift(),
    extender = function(k,fn) {
      target[k] = wrap(fn, target[k]);
    }.bind(this);

    extensions.forEach(function(e) {
      pie.object.forEach(e, extender);
    }.bind(this));

    return target;
  };
})();

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
      value = decodeURIComponent((segments[1] || '').replace(/\+/g, '%20'));

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

pie.string.startsWith = function(str, prefix) {
  return str.indexOf(prefix) === 0;
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

pie.string.matches = function(str, regex) {
  var flags = "g";
  if(regex.ignoreCase) flags += "i";
  if(regex.multiline) flags += "m";

  regex = new RegExp(regex.source, flags);

  var matches = [], match = regex.exec(str);
  while (match != null) {
    matches.push(match[1]);
    match = regex.exec(str);
  }
  return matches;
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

  // remove trailing question marks
  if(path.charAt(path.length - 1) === '?') {
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
  strFunc += str.replace(/\n/g, "\\n\\\n")
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
// # Bindings Mixin
// A mixin to provide two way data binding between a model and dom elements.
// This mixin should be used with a pie view.
pie.mixins.bindings = {

  // The registration & configuration of bindings is kept in this._bindings.
  init: function() {
    this._bindings = [];
    if(this._super) this._super.apply(this, arguments);
    this.options.bindingAttribute = this.options.bindingAttribute || 'data-bind';
  },

  // If we have an emitter, tap into the render:after event and initialize the dom
  // with our model values.
  setup: function() {
    this.eon('render:after', 'initBindings');

    this._super.apply(this);
  },

  // Register 1+ bindings within the view.
  //
  // ```
  // this.bind({ attr: 'first_name' }, { attr: 'last_name' })
  // ```;
  bind: function() {
    var opts;
    for(var i = 0; i < arguments.length; i++) {
      opts = arguments[i];
      if(!opts.model) opts.model = this.model;
      if(pie.object.isString(opts.model)) opts.model = this[opts.model];
      if(pie.object.isString(opts.decorator)) opts.decorator = this[opts.decorator] || this.app.helpers.fetch(opts.decorator);
      this._bindings.push(pie.binding.create(this, opts.model, opts));
    }
  },

  setupDomBindings: function() {
    if(!this.options.bindingAttribute) return;

    this.removeUnattachedBindings();

    var nodes = this.qsa('[' + this.options.bindingAttribute + ']'), stringOpts, node, opts;

    var binder = function(str) {
      if(str.indexOf('=') === -1) opts = {attr: str};
      else opts = this.parseStringBinding(str);
      opts.sel = node;
      this.bind(opts);
    }.bind(this);

    for(var i = 0; i < nodes.length; i++) {
      node = nodes[i];
      stringOpts = node.getAttribute(this.options.bindingAttribute);
      stringOpts.split(';').forEach(binder);
    }
  },

  removeUnattachedBindings: function() {
    var compactNeeded = false, b;
    for(var i = 0; i < this._bindings.length; i++) {
      b = this._bindings[i];
      if(pie.object.isNode(b.sel) && !document.contains(b.sel)) {
        this._bindings[i] = undefined;
        b.teardown();
        compactNeeded = true;
      }
    }

    if(compactNeeded) this._bindings = pie.array.compact(this._bindings);
  },

  parseStringBinding: function(inputString) {
    var opts = pie.object.expand(pie.string.deserialize(inputString));
    return opts;
  },

  initBindings: function() {
    // look for dom-defined bindings and add them to our _bindings list.
    this.setupDomBindings();

    // Iterate each binding and propagate the model value to the dom.
    pie.array.each(this._bindings, 'toView', true);
  },


  /* Iterate each binding and propagate the dom value to the model. */
  /* A single set of change records will be produced (`__version` will only increment by 1). */
  readBoundFields: function() {
    var opts = {skipObservers: true}, models;
    this._bindings.forEach(function(binding) { binding.readFields(opts); });
    models = pie.array.unique(pie.array.map(this._bindings, 'model'));
    pie.array.each(models, 'deliverChangeRecords', true);
  }
};
pie.mixins.changeSet = {

  get: function(name) {
    return this.query({name: name});
  },

  has: function(name) {
    var glob = pie.string.endsWith(name, '.*') ? name.replace('.*', '') : undefined;
    
    return pie.array.areAny(this, function(change) {
      return glob ? pie.string.startsWith(change.name, glob + '.') : change.name === name;
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

  addChild: function(name, child, idx) {
    var append = idx == null;
    idx = append ? this.children.length : idx;
    this.children.splice(idx, 0, child);

    this.childNames[name] = idx;
    child._indexWithinParent = idx;
    child._nameWithinParent = name;
    child.parent = this;

    if(!append) this.sortChildren();

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
    if(recurse && String(idx).indexOf('.') > 0) {
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

    return ~idx && pie.object.isNumber(idx) && this.children[idx] || undefined;
  },

  isInApp: function() {
    if(pie.object.isApp(this)) return true;
    else if(this.parent) {
      return this.parent.isInApp()
    } else {
      return false;
    }
  },

  bubble: function() {
    var args = pie.array.from(arguments),
    fname = args.shift(),
    obj = this.parent;

    while(obj && !pie.object.has(obj, fname, true)) {
      obj = obj.parent;
    }

    if(obj) return obj[fname].apply(obj, args);
  },

  sendToChildren: function(/* fnName, arg1, arg2 */) {
    var allArgs = pie.array.from(arguments),
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

      // clean up
      delete this.childNames[child._nameWithinParent];
      delete child._indexWithinParent;
      delete child._nameWithinParent;
      delete child.parent;

      this.sortChildren();

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
    if(fn) this.children.sort(fn);
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
    str += pad((indent ? '|- ' : '') + (this._nameWithinParent || this._indexWithinParent || this.__className) + ' (' + (this.__className || pie.uid(this)) + ')', indent);

    this.children.slice(0, 10).forEach(function(child) {
      str += "\n" + pad('|', nextIndent);
      str += child.__tree(nextIndent);
    });

    if(!indent) str += "\n";

    return str;
  }
};
pie.mixins.validatable = {

  init: function() {
    this.validations = [];
    this.validationStrategy = 'dirty';

    if(this._super) this._super.apply(this, arguments);

    this.compute('isValid', 'validationErrors');
  },

  isValid: function() {
    return pie.object.isEmpty(this.data.validationErrors);
  },

  // default to a model implementation
  reportValidationError: function(key, errors) {
    errors = errors && errors.length ? errors : undefined;
    this.set('validationErrors.' + key, errors);
  },

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
        } else if(conf) {

          // iterate the keys, adding a validation for each
          Object.keys(conf).forEach(function(confKey){
            if (pie.object.isObject(conf[confKey])) {
              resultConfigs.push({type: confKey, options: conf[confKey]});

            // in this case, we convert the value to an option
            // {presence: true} -> {type: 'presence', {presence: true}}
            // {format: /.+/} -> {type: 'format', {format: /.+/}}
            } else if(conf[confKey]) {
              resultConfigs.push({
                type: confKey,
                options: pie.object.merge({}, conf)
              });
            }
          });
        }

      });


      if(resultConfigs.length) {

        // append the validations to the existing ones
        this.validations[k] = this.validations[k] || [];
        this.validations[k] = this.validations[k].concat(resultConfigs);

        this.observe(function(changes){
          var change = changes.get(k);
          return this.validationChangeObserver(change);
        }.bind(this), k);
      }

    }.bind(this));

    if(validationStrategy !== undefined) this.validationStrategy = validationStrategy;
  },

  // Invoke validateAll and receive a promise in return.
  // this.validateAll().then(function(){ alert('Success!'); }, function(){ alert('Errors!'); });
  // validateAll will perform all registered validations, asynchronously. When all validations have completed, the promise
  // will be resolved.
  validateAll: function() {
    var promises = Object.keys(this.validations).map(this.validate.bind(this));
    return pie.promise.all(promises);
  },


  validationChangeObserver: function(change) {
    if(this.validationStrategy === 'validate') {
      this.validate(change.name);
    } else if(this.validationStrategy === 'dirty') {
      // for speed.
      if(this.get('validationErrors.' + change.name + '.length')) {
        this.reportValidationError(change.name, undefined);
      }
    }
  },

  // validate a specific key and optionally invoke a callback.
  validate: function(k) {
    var validators = this.app.validator,
    validations = pie.array.from(this.validations[k]),
    value = this.get(k),

    promises = validations.map(function(validation) {
      return pie.promise.create(function(resolve, reject) {

        var validator = validators[validation.type];
        // reject the promise with the error message.
        var wrappedReject = function() {
          reject(validators.errorMessage(validation.type, validation.options));
        };

        var response = validator.call(validators, value, validation.options);

        // validators should return true, false, or a promise.
        if(response === true) resolve();
        else if (response === false) wrappedReject();
        else response.then(resolve, wrappedReject);
      });
    });

    var promise = pie.promise.all(promises);

    promise.then(function(){
      this.reportValidationError(k, undefined);
    }.bind(this), function(errorMessages){
      this.reportValidationError(k, errorMessages);
    }.bind(this));

    return promise;
  }
};
pie.base = {

  __schema: [{

    init: function(){
      pie.uid(this);
    },

    __pieRole: 'object',

    reopen: function(){
      var extensions = pie.array.change(arguments, 'from', 'flatten', 'compact');
      pie.object.reopen(this, extensions);
      extensions.forEach(function(ext) {
        if(ext.init) ext.init.call(this);
      }.bind(this));
      return this;
    }

  }],

  __pieRole: 'class',

  create: function() {
    return pie.base._create(this, arguments);
  },

  extend: function() {
    var that = this,
    extensions = pie.array.change(arguments, 'from', 'flatten', 'compact'),
    name = pie.object.isString(extensions[0]) ? extensions.shift() : null;

    extensions = pie.array.flatten(extensions.map(function(e){
      if(e.__pieRole === 'class') return e.__schema;
      return e;
    }));

    var schema = pie.array.unique([this.__schema, extensions, {__className: name}]);

    var o = {
      __className: name
    };

    o.__schema = schema;
    o.__pieRole = 'class';

    o.extend = function(){ return that.extend.apply(this, arguments); };
    o.create = function(){ return that.create.apply(this, arguments); };
    o.reopen = function(){ return that.reopen.apply(this, arguments); };

    return o;
  },

  reopen: function() {
    var extensions = pie.array.change(arguments, 'from', 'flatten', 'compact');
    extensions.forEach(function(e){
      this.__schema.push(e);
    }.bind(this));
  },

  _create: function(clazz, args) {
    var schema = clazz.__schema;

    var o = {};
    pie.uid(o);

    pie.object.reopen(o, schema);

    o.init.apply(o, args);
    o.__class = clazz;

    if(!o.app) {
      if(o.options && o.options.app) o.app = o.options.app;
      else o.app = pie.appInstance;
    }

    // This enables objects to be assigned to a global variable to assist with debugging
    // Any pie object can define a debugName attribute or function and the value will be the name of the global
    // variable to which this object is assigned.
    if(o.debugName) {
      window.pieDebug = window.pieDebug || {};
      window.pieDebug[pie.fn.valueFrom(o.debugName)] = o;
    }

    return o;
  }
};
pie.promise = pie.base.extend({

  __pieRole: 'promise',

  init: function(resolver) {

    this.resolves = [];
    this.rejects  = [];

    this.result   = undefined;
    this.state    = 'UNFULFILLED';
    this.ctxt     = undefined;

    if(resolver) {
      setTimeout(function promiseResolverWrapper(){
        try {
          resolver(this.resolve.bind(this), this.reject.bind(this));
        } catch(ex) {
          this.reject(ex);
        }
      }.bind(this), 0);
    }
  },

  bind: function(binding) {
    this.ctxt = binding;
    return this;
  },

  then: function(onResolve, onReject) {
    var child = this.__class.create();
    child.bind(this.ctxt);

    this.resolves.push([onResolve, child]);
    this.rejects.push([onReject, child]);

    if(this.state !== 'UNFULFILLED') {
      setTimeout(this._flush.bind(this), 0);
    }

    return child;
  },

  catch: function(reject) {
    return this.then(undefined, reject);
  },

  reject: function(value) {
    this._transition('FAILED', value);
  },

  resolve: function(value) {
    this._transition('FULFILLED', value);
  },

  _transition: function(state, value) {
    if(this.state === 'UNFULFILLED') {
      this.state = state;
      this.result = value;
      this._flush();
    }
  },

  _flush: function() {
    var list = this.state === 'FULFILLED' ? this.resolves : this.rejects;
    var tuple, callback, promise, result;

    while(list.length) {
      tuple = list.pop();
      callback = tuple[0];
      promise = tuple[1];
      result = this.result;

      if(promise.ctxt) {
        if(pie.object.isString(callback)) {
          callback = promise.ctxt[callback].bind(promise.ctxt);
        } else if (pie.object.isFunction(callback)) {
          callback = callback.bind(promise.ctxt);
        }
      }

      if(pie.object.isFunction(callback)) {
        try {
          result = callback(this.result);
        } catch(e) {
          promise.reject(e);
          continue;
        }

        if(result === promise) {
          promise.reject(new TypeError("The result of a promise's callback cannot be the promise. [2.3.1]"));
          continue;
        }

      }

      if(pie.object.isPromise(result)) {
        result.then(promise.resolve.bind(promise), promise.reject.bind(promise));
      } else if(this.state === 'FULFILLED') {
        promise.resolve(result);
      } else {
        promise.reject(result);
      }
    }
  }
});

pie.promise.from = function(thing) {
  if(pie.object.isPromise(thing)) return thing;
  if(pie.object.isFunction(thing)) return pie.promise.create(thing);
  return pie.promise.resolve(thing);
};

pie.promise.all = function(iteratable) {
  var instance = pie.promise.create(),
  promises = [],
  values = [],
  cnt = 0,
  total;

  for(var k in iteratable) {
    if(iteratable.hasOwnProperty(k)) {
      promises.push(pie.promise.from(iteratable[k]));
    }
  }

  total = promises.length;

  if(total) {
    promises.forEach(function allPromiseIterator(p, i) {
      p.then(function allPromiseCallback(val) {
        values[i] = val;
        cnt++;
        if(cnt === total) instance.resolve(values);
      }, instance.reject.bind(instance));
    });
  } else {
    instance.resolve(values);
  }

  return instance;
};

pie.promise.race = function(iteratable) {
  var instance = pie.promise.create();

  for(var k in iteratable) {
    if(iteratable.hasOwnProperty(k)) {
      pie.promise.from(iteratable[k]).then(instance.resolve.bind(this), instance.reject.bind(this));
    }
  }
  return instance;
};

pie.promise.resolve = function(val) {
  var p = pie.promise.create();
  p.state = 'FULFILLED';
  p.result = val;
  return p;
};

pie.promise.reject = function(val) {
  var p = pie.promise.create();
  p.state = 'FAILED';
  p.result = val;
  return p;
};
pie.pathHelper = pie.base.extend('pathHelper', {

  hostRegex: /^(https?:\/\/)([^\/]+)(.+)/,

  currentHost: function() {
    return window.location.host;
  },

  isCurrentHost: function(incoming) {
    return this.currentHost() === incoming;
  },

  stripHost: function(incoming, options) {
    var m = incoming.match(this.hostRegex);
    if(!m) return incoming;
    if(options && options.onlyCurrent && this.isCurrentHost(m[1])) return m[3];
    if(options && options.onlyOther && !this.isCurrentHost(m[1])) return m[3];
    return m[3];
  },

  hasHost: function(incoming) {
    return this.hostRegex.test(incoming);
  },

  pathAndQuery: function(path, query) {
    var o = {
      path: path,
      query: query
    };

    if(path && path.indexOf('?') >= 0) {
      var split = path.split('?');
      o.query = pie.object.merge(pie.string.deserialize(split[1]), query);
      o.path = split[0];
    }

    return o;
  }

});
// # Pie App
//
// The app class is the entry point of your application. It acts as the container in charge of managing the page's context.
// It provides access to application utilities, routing, templates, i18n, etc.
// It observes browser and link navigation and changes the page's context automatically.
pie.app = pie.base.extend('app', {

  __pieRole: 'app',

  init: function(options) {

    /* `pie.base.create` handles the setting of an app, */
    /* but we don't want a reference to another app within this app. */
    delete this.app;

    /* Set a global instance which can be used as a backup within the pie library. */
    pie.appInstance = pie.appInstance || this;

    /* Register with pie to allow for nifty global lookups. */
    pie.apps[pie.uid(this)] = this;

    /* Default application options. */
    this.options = pie.object.deepMerge({
      uiTarget: 'body',
      unsupportedPath: '/browser/unsupported',
      verifySupport: true
    }, options);

    if(this.options.verifySupport && !this.verifySupport()) {
      window.location.href = this.options.unsupportedPath;
      return;
    }

    // `classOption` allows class configurations to be provided in the following formats:
    // ```
    // pie.app.create({
    //   i18n: myCustomI18nClass,
    //   i18nOptions: {foo: 'bar'}
    // });
    // ```
    // which will result in `this.i18n = myCustomI18nClass.create(this, {foo: 'bar'});`
    //
    // Alternatively you can provide instances as the option.
    // ```
    // var instance = myCustomI18nClass.create();
    // pie.app.create({
    //   i18n: instance,
    // });
    // ```
    // which will result in `this.i18n = instance; this.i18n.app = this;`
    var classOption = function(key, _default){
      var k = this.options[key],
      opt = this.options[key + 'Options'] || {};

      if(k === false) return;

      k = k || _default;

      if(k.__pieRole === 'class') {
        return k.create(this, opt);
      } else if (pie.object.isFunction(k)) {
        return k(this, opt);
      } else {
        k.app = this;
        return k;
      }
    }.bind(this);


    // The model that represents the current state of the app.
    this.state = pie.appState.create();

    // `app.config` is a model used to manage configuration objects.
    this.config = classOption('config', pie.config);

    // `app.cache` is a centralized cache store to be used by anyone.
    this.cache = classOption('cache', function(){
      return pie.cache.create({}, {app: this});
    }.bind(this));

    // `app.storage` is used for local, session, cache, etc storage
    this.storage = classOption('storage', pie.dataStore);

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

    // `app.router` is used to determine which view should be rendered based on the url
    this.router = classOption('router', pie.router);

    // `app.routeHandler` extracts information from the current route and determines what to do with it.
    this.routeHandler = classOption('routeHandler', pie.routeHandler);

    // `app.navigator` observes app.state and updates the browser.
    // it is imperative that the router is created before the navigator since
    // the navigator observes both state.id and state.route;
    this.navigator = classOption('navigator', pie.navigator);

    // `app.resources` is used for managing the loading of external resources.
    this.resources = classOption('resources', pie.resources);

    // Template helper methods are evaluated to the local variable `h` in templates.
    // Any methods registered with this helpers module will be available in templates
    // rendered by this app's `templates` object.
    this.helpers = classOption('helpers', pie.helpers);

    // `app.templates` is used to manage and render application templates.
    this.templates = classOption('templates', pie.templates);

    // `app.validator` a validator intance to be used in conjunction with this app's model activity.
    this.validator = classOption('validator', pie.validator);

    this.pathHelper = classOption('pathHelper', pie.pathHelper);


    // Before we get going, observe link navigation & show any notifications stored
    // in app.storage.
    // Wrapped in a function for testing purposes.
    this.emitter.once('start:before', function(){ this.setupSinglePageLinks(); }.bind(this));

    if(!this.options.noAutoStart) {
      // Once the dom is loaded, start the app.
      document.addEventListener('DOMContentLoaded', this.start.bind(this));
    }

    this._super();
  },

  // Just in case the client wants to override the standard confirmation dialog.
  // Eventually this could create a confirmation view and provide options to it.
  // The dialog should return a promise which is resolved if the dialog is confirmed
  // and rejected if the dialog is denied.
  confirm: function(text) {
    return pie.promise.create(function(resolve, reject){
      if(window.confirm(text)) resolve();
      else reject();
    });
  },

  debug: function() {
    if(window.console && window.console.log) {
      window.console.log.apply(window.console, arguments);
    }
  },

  // Use this to build paths.
  path: function(path, query) {

    if(pie.object.isObject(path)) {
      query = path;
      path = undefined;
    }

    if(!pie.object.isObject(query)) query = undefined;

    var pq = this.pathHelper.pathAndQuery(path, query);

    // if we don't know our path but have been given a query, try to build a path based on the existing route
    if(pq.path == null && pq.query) {
      var currentRoute = this.state.get('__route');

      if(currentRoute) {
        pq.path = currentRoute.get('pathTemplate');
        pq.query = pie.object.merge({}, this.state.get('__query'), this.state.get('__interpolations'), pq.query);
      }
    }

    pq.path = pq.path || '/';
    pq.path = this.pathHelper.stripHost(pq.path, {onlyCurrent: true});

    // if a router is present and we're dealing with a relative path we can allow the passing of named routes.
    if(!this.pathHelper.hasHost(pq.path) && this.router) pq.path = this.router.path(pq.path, pq.query);
    else if(!pie.object.isEmpty(pq.query)) pq.path = pie.string.urlConcat(pq.path, pie.object.serialize(pq.query));

    return pq.path;
  },

  // Use this to navigate around the app.
  // ```
  // app.go('/test-url');
  // app.go('namedUrl');
  // app.go({foo: 'bar'});
  // app.go('/things/:id', {id: 4});
  // ```
  //
  go: function(/* path?, query?, skipHistory? */){
    var id = this.path.apply(this, arguments);

    var skipHistory = pie.array.last(arguments);
    if(!pie.object.isBoolean(skipHistory)) skipHistory = false;

    this.state.transition(id, skipHistory);
  },

  // Callback for when a link is clicked in our app
  handleSinglePageLinkClick: function(e){

    // If the link is targeting something else, let the browser take over
    if(e.delegateTarget.getAttribute('target')) return;

    // If the user is trying to do something beyond simple navigation, let the browser take over
    if(e.ctrlKey || e.metaKey || e.button > 0) return;

    // Extract the location from the link.
    var href = e.delegateTarget.getAttribute('href');

    // If we're going nowhere, somewhere else, or to an anchor on the page, let the browser take over
    if(!href || /^(#|[a-z]+:\/\/)/.test(href)) return;

    if(this.router && !this.router.hasRoot(href)) return;

    e.preventDefault();
    this.go(href, !!e.delegateTarget.getAttribute('data-replace-state'));
  },

  // When a link is clicked, go there without a refresh if we recognize the route.
  setupSinglePageLinks: function() {
    var target = pie.qs(this.routeHandler.options.uiTarget);
    pie.dom.on(target, 'click', this.handleSinglePageLinkClick.bind(this), 'a[href]');
  },

  // Start the app by starting the navigator (which we have observed).
  start: function() {
    this.emitter.fireSequence('start');
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
  },


}, pie.mixins.container);
// # Pie Model
// ### Setters and Getters
// pie.model provides a basic interface for object management and observation.
//
// *example:*
//
// ```
// var user = pie.model.create();
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
// var user = pie.model.create();
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
// var user = pie.model.create({first_name: 'Doug', last_name: 'Wilson'});
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

  __pieRole: 'model',

  init: function(d, options) {

    if(d && d.__pieRole === 'model') d = d.data;

    this.data = pie.object.deepMerge({__version: 1}, d);
    this.options = options || {};
    this.app = this.app || this.options.app || pie.appInstance;
    this.observations = {};
    this.observedKeyCounts = {};
    this.changeRecords = [];
    this.deliveringRecords = 0;

    this._super();
  },

  // ** pie.model.compute **
  //
  // Register a computed property which is accessible via `name` and defined by `fn`.
  // Provide all properties which invalidate the definition.
  // If the definition of the property is defined by a function of the same name, the function can be ommitted.
  // ```
  // Model.reopen({fullName: function(){ /*...*/ }});
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
    this.observations[pie.uid(wrap)].computed = true;

    /* Initialize the computed properties value immediately. */
    this.set(name, fn.call(this));
  },

  // **pie.model.addChangeRecord**
  //
  // Add a change record to this model. If a change record of the same name already exists,
  // update the existing value.
  addChangeRecord: function(name, type, oldValue, value, extras) {

    this.isDirty = true;

    if(!this.shouldAddChangeRecordForAttribute(name)) return;

    var existing = !/\*$/.test(name) && pie.array.detect(this.changeRecords, function(r){ return r && r.name === name; });

    if(existing) {
      var remove = false;
      existing.value = value;

      // if we previously deleted this value but it's been added back in, just report an update.
      if(existing.type === 'delete' && type === 'add') existing.type = 'update';
      else if(existing.type === 'add' && type === 'delete') remove = true;
      // if we previously delete this value but have now added an object, report a path update.
      else if(existing.type === 'delete' && type === 'pathUpdate') existing.type = 'pathUpdate';
      // if we previously deleted this value but have now changed it, inherit the new type.
      else if(type === 'delete') existing.type = type;

      // if the result is an update but the values are identical, remove the change record.
      if(existing.type === 'update' && existing.oldValue === existing.value) remove = true;

      if(remove) {
        this.changeRecords = pie.array.remove(this.changeRecords, existing);
      }

      if(extras) pie.object.merge(existing, extras);

      return;
    }

    var change = {
      name: name,
      type: type,
      value: value,
      object: this
    };

    if(oldValue != null) change.oldValue = oldValue;
    if(extras) pie.object.merge(change, extras);

    this.changeRecords.push(change);
  },

  // ** pie.model.deliverChangeRecords **
  //
  // After updates have been made we deliver our change records to our observers
  deliverChangeRecords: function(options) {
    if(!this.isDirty) return this;
    if(this.deliveringRecords) return this;

    /* This is where the version tracking is incremented. */
    if(!options || !options.skipVersionTracking) this.trackVersion();


    var changeSet = this.changeRecords,
    emptyChangeSet = this.observedKeyCounts['~'] ? pie.object.merge([], pie.mixins.changeSet) : undefined,
    observers = pie.object.values(this.observations),
    invoker = function changeRecordDelivery(obj) {
      if(~obj.keys.indexOf('*')) obj.fn.call(null, changeSet);
      else if(changeSet.hasAny.apply(changeSet, obj.keys)) obj.fn.call(null, changeSet);
      else if(~obj.keys.indexOf('~')) obj.fn.call(null, emptyChangeSet);
    }.bind(this),
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
    if(this.changeRecords.length) this.deliverChangeRecords(options);

    this.isDirty = false;

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

    args.forEach(function getsIterator(arg){
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

  // ** pie.model.hasAll **
  //
  // Determines whether all paths exist in our data.
  // ```
  // model.hasAll('foo', 'bar')
  // //=> true | false
  // ```
  hasAll: function() {
    var args = pie.array.change(arguments, 'from', 'flatten'), i;

    for(i = 0; i < args.length; i++) {
      if(!this.has(args[i])) return false;
    }
    return true;
  },

  // ** pie.model.hasAny **
  //
  // Determines whether any key given exists
  // ```
  // model.hasAny('foo', 'bar')
  // //=> true | false
  // ```
  hasAny: function() {
    var args = pie.array.change(arguments, 'from', 'flatten'), i;

    for(i = 0; i < args.length; i++) {
      if(this.has(args[i])) return true;
    }
    return !args.length;
  },

  shouldAddChangeRecordForAttribute: function(key) {
    if(!!this.observedKeyCounts['*']) return true;
    if(!!this.observedKeyCounts[key]) return true;

    if(~key.indexOf('.')) {
      var paths = pie.string.pathSteps(key).slice(1);
      if(pie.array.areAny(paths, function changeRecordApplicabilityChecker(p){ return !!this.observedKeyCounts[p + '.*']; }.bind(this))) return true;
    }

    return false;
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
    var obj = arguments.length > 1 ? pie.object.deepMerge.apply(null, arguments) : arguments[0];
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
    keys = part[1],
    cnt;

    if(!keys.length) keys = ['~'];

    keys.forEach(function observedKeyCountIncrementer(k) {
      cnt = this.observedKeyCounts[k];
      this.observedKeyCounts[k] = (cnt || 0) + 1;
    }.bind(this));

    fns.forEach(function observerStorer(fn){

      /* Setting the uid is needed because we'll want to manage unobservation effectively. */
      pie.uid(fn);

      this.observations[pie.uid(fn)] = {
        fn: fn,
        keys: keys
      };

    }.bind(this));

    return this;
  },

  // ** pie.model.reset **
  //
  // Reset a model to it's empty state, without affecting the `__version` attribute.
  // Optionally, you can pass any options which are valid to `sets`.
  // ```
  // model.reset({skipObservers: true});
  // ```
  reset: function(options) {
    var keys = Object.keys(this.data), o = {};

    keys.forEach(function resetIterator(k){
      if(k === '__version') return;
      o[k] = undefined;
    });

    return this.sets(o, options);
  },

  // ** pie.model.set **
  //
  // Set a `value` on the model at the specified `key`.
  // Valid options are:
  // * skipObservers - when true, observers will not be triggered.
  // * skipParents   - when true, parent change records will not be sent.
  // * skipChildren  - when true, child change records will not be sent.
  //
  // *Note: skipping observation does not stop `changeRecords` from accruing.*
  // ```
  // model.set('foo', 'bar');
  // model.set('foo.baz', 'bar');
  // model.set('foo', 'bar', {skipObservers: true});
  // ```
  set: function(key, value, options) {

    if(pie.object.isPlainObject(value) && !pie.object.isEmpty(value)) {
      // since we're overriding an object we need to unset it.
      // we add change records for the children, but don't worry about the parents
      // since the sets() will take care of that.
      this.set(key, undefined, pie.object.merge({}, options, {
        skipObservers: true,
        skipParents: true
      }));

      value = pie.object.flatten(value, key + '.');
      this.sets(value, options);
      return;
    }

    var changeName = key,
    changeType, changeOldValue, changeValue;

    changeOldValue = pie.object.getPath(this.data, key);

    /* If we haven't actually changed, don't bother doing anything. */
    if((!options || !options.force) && value === changeOldValue) return this;

    if(changeOldValue !== undefined) {
      changeType = 'update';
    }

    var parentKeys = (!options || !options.skipParents) && ~key.indexOf('.') ? pie.string.pathSteps(key).slice(1) : null,
    childKeys, nestedOpts, i;


    if((!options || !options.skipChildren) && pie.object.isPlainObject(changeOldValue)) {
      childKeys = Object.keys(pie.object.flatten(changeOldValue, key + '.'));
    }

    nestedOpts = childKeys || parentKeys ? pie.object.merge({}, options, {skipChildren: true, skipParents: true}) : null;

    if(childKeys && childKeys.length) {
      // add change records for the deleted children.
      for(i = 0; i < childKeys.length; i++) {
        this.set(childKeys[i], undefined, nestedOpts);
      }
    }

    changeValue = value;

    /* If we are "unsetting" the value, delete the path from `this.data`. */
    if(value === undefined) {
      changeType = 'delete';
      pie.object.deletePath(this.data, key);

    /* Otherwise, we set the value within `this.data`. */
    } else {
      pie.object.setPath(this.data, key, value);
      changeType = changeType || 'add';
    }

    if(parentKeys && parentKeys.length) {
      var parentVal;

      for(i = 0; i < parentKeys.length; i++) {

        parentVal = this.get(parentKeys[i]);

        if(changeType === 'delete' && pie.object.isObject(parentVal) && pie.object.isEmpty(parentVal)) {
          this.set(parentKeys[i], undefined, nestedOpts);
        } else {
          this.addChangeRecord(parentKeys[i], 'pathUpdate', undefined, undefined);
        }
      }
    }

    /* Add the change to the `changeRecords`. */
    this.addChangeRecord(changeName, changeType, changeOldValue, changeValue);


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
  // //=> {__version: 3, bar: 'foo'}
  // ```
  setData: function(obj, options) {
    var existing = Object.keys(pie.object.flatten(this.data)),
    given = Object.keys(pie.object.flatten(obj)),
    removed = pie.array.subtract(existing, given),
    rmOptions = pie.object.merge({}, options, {skipObservers: true});

    removed = pie.array.remove(removed, '__version');

    removed.forEach(function setDataRemover(rm){
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
    var innerOpts = pie.object.merge({}, options, {skipObservers: true});
    pie.object.forEach(obj, function setsIterator(k,v) {
      this.set(k, v, innerOpts);
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

  tests: function(obj) {
    for(var k in obj) {
      if(!this.test(k, obj[k])) return false;
    }
    return true;
  },

  // ** pie.model.touch **
  //
  // Bumps the __version by 1 and delivers change records to observers of __version
  // ```
  // model.touch();
  // ```
  touch: function() {
    this.trackVersion();
    this.deliverChangeRecords({skipVersionTracking: true});
  },

  // ** pie.model.trackVersion **
  //
  // Increment the `__version` of this model.
  // Observers are skipped since this is invoked while change records are delivered.
  trackVersion: function() {
    var oldVal = this.data.__version,
    newVal = oldVal + 1;
    this.data.__version = newVal;
    this.addChangeRecord('__version', 'update', oldVal, newVal);
    return this;
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
    observation,
    cnt;

    keys.forEach(function observedKeyCountDecrementer(k) {
      cnt = this.observedKeyCounts[k];
      if(cnt) this.observedKeyCounts[k] = cnt - 1;
    }.bind(this));

    fns.forEach(function observerRemoverer(fn){
      pie.uid(fn);

      observation = this.observations[pie.uid(fn)];
      if(!observation) return;

      if(!keys.length) {
        delete this.observations[pie.uid(fn)];
        return;
      }

      observation.keys = pie.array.subtract(observation.keys, keys);

      if(!observation.keys.length) {
        delete this.observations[pie.uid(fn)];
        return;
      }
    }.bind(this));

    return this;
  },
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
pie.cache = pie.model.extend('cache', {

  fetch: function(path, fn) {
    var value = this.get(path);
    if(value !== undefined) return value;
    value = pie.fn.valueFrom(fn);
    this.set(path, value);
    return value;
  }

});
pie.dataStore = pie.base.extend('dataStore', {

  init: function(app, options) {
    this.app = app;
    this.options = pie.object.merge({
      primary: 'sessionStorage',
      backup: 'backup'
    }, options);

    this._super();

    this.backupModel = pie.model.create({});
  },

  primary: function() {
    return this._store(this.options.primary);
  },

  backup: function() {
    return this._store(this.options.backup);
  },

  _store: function(name) {
    if(pie.object.isString(name)) return pie.dataStore.adapters[name];
    else return name;
  },


  clear: function(key) {
    this.primary().clear(key, this);
    this.primary().clear(key, this);
  },

  get: function(key, options) {
    var result = this.primary().get(key, this);
    if(result === pie.dataStore.ACCESS_ERROR) result = this.backup().get(key, this);

    if(!options || (options.clear === undefined || options.clear)) {
      this.clear(key);
    }

    return result;
  },

  set: function(key, value) {
    // clear from all stores so we don't get out of sync.
    this.clear(key);

    var result = this.primary().set(key, value, this);
    if(result === pie.dataStore.ACCESS_ERROR) result = this.backup().set(key, value, this);

    return result;
  }

});

pie.dataStore.ACCESS_ERROR = new Error("~~PIE_ACCESS_ERROR~~");
pie.dataStore.adapters = (function(){

  var storageGet = function(storeName, key) {

    try {
      if(!window[storeName]) return pie.dataStore.ACCESS_ERROR;

      var encoded = window[storeName].getItem(key);
      return encoded != null ? JSON.parse(encoded) : encoded;
    } catch(err) {
      this.app.errorHandler.reportError(err, {
        handledBy: "pie.dataStore." + storeName + "#get",
        key: key
      });

      return pie.dataStore.ACCESS_ERROR;
    }
  };

  var storageSet = function(storeName, key, value) {

    var str;

    try {
      if(!window[storeName]) return pie.dataStore.ACCESS_ERROR;

      str = JSON.stringify(value);
      window[storeName].setItem(key, str);

      return true;
    } catch(err) {
      this.app.errorHandler.reportError(err, {
        handledBy: "pie.dataStore." + storeName + "#get",
        key: key,
        data: str
      });

      return pie.dataStore.ACCESS_ERROR;
    }
  };

  var storageClear = function(storeName, key) {
    try {
      if(!window[storeName]) return pie.dataStore.ACCESS_ERROR;
      window[storeName].removeItem(key);
    } catch(err) {
      this.app.errorHandler.reportError(err, {
        handledBy: "pie.dataStore." + storeName + "#clear",
        key: key
      });

      return pie.dataStore.ACCESS_ERROR;
    }
  };

  return {

    sessionStorage: {

      clear: function(key, parentStore) {
        return storageClear.call(parentStore, 'sessionStorage', key);
      },

      get: function(key, parentStore) {
        return storageGet.call(parentStore, 'sessionStorage', key);
      },
      set: function(key, value, parentStore) {
        return storageSet.call(parentStore, 'sessionStorage', key, value);
      }
    },

    localStorage: {

      clear: function(key, parentStore) {
        return storageClear.call(parentStore, 'localStorage', key);
      },

      get: function(key, parentStore) {
        return storageGet.call(parentStore, 'localStorage', key);
      },
      set: function(key, value, parentStore) {
        return storageSet.call(parentStore, 'localStorage', key, value);
      }

    },

    cookie: {

      clear: function(key) {
        try {
          return pie.browser.setCookie(key, null);
        } catch(e) {
          return pie.dataStore.ACCESS_ERROR;
        }
      },

      get: function(key) {
        try {
          var json = pie.browser.getCookie(key);
          return json != null ? JSON.parse(json) : json;
        } catch(e) {
          return pie.dataStore.ACCESS_ERROR;
        }
      },

      set: function(key, value) {
        try{
          var json = JSON.stringify(value);
          pie.browser.setCookie(key, json);
        } catch(e) {
          return pie.dataStore.ACCESS_ERROR;
        }
      }

    },

    backup: {

      clear: function(key, parentStore) {
        parentStore.backupModel.set(key, undefined);
      },

      get: function(key, parentStore) {
        parentStore.backupModel.get(key);
      },

      set: function(key, value, parentStore) {
        parentStore.backupModel.set(key, value);
      }

    }
  };
})();
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
pie.view = pie.base.extend('view', {

  __pieRole: 'view',

  // **pie.view.init**
  //
  // Options:
  //   * el - (optional) the root element of the views control. if not provided, a new <div> will be created. `el` can be provided as an object. The tagName attribute will be use
  //   * app - (optional) the app this view is associated with.
  //   * uiTarget - (optional) element to attach to. if provided, after this view is set up it will automatically attach this element.
  //   * setup - (option) if truthy, this view's setup function will be called directly after initialization.
  init: function(options) {
    this.options = options || {},
    this.app = this.options.app || pie.appInstance;

    if(pie.object.isPlainObject(this.options.el)) {
      this.el = document.createElement(this.options.el.tagName || 'div');
      for(var key in this.options.el) {
        if(key !== 'tagName') {
          if(key === 'classes') {
            pie.dom.addClass(this.el, this.options.el[key]);
          } else this.el.setAttribute(key, this.options.el[key]);
        }
      }
    } else {
      this.el = this.options.el || document.createElement('div');
    }

    this.eventedEls = [];
    this.changeCallbacks = {};

    this.emitter = pie.emitter.create();

    if(this.options.uiTarget) {
      this.eonce('setup:after', this.addToDom.bind(this));
    }

    this._super();
  },

  // **pie.view.addedToParent**
  //
  // Accommodates the `addedToParent` hook event in pie.container.
  // Emits the event via the emitter, meaning this can be subscribed to in the init or setup process.
  addedToParent: function() {
    this.emitter.fire('addedToParent');
  },

  // **pie.view.addToDom**
  //
  // A function which adds the view's el to the DOM within target (or this.options.uiTarget).
  // An "attach" sequence is fired so views can control how they enter the DOM.
  // By default the element will be appended, if `prependInstead` is true the element will be
  // prepended. If preprendInstead is an element, the child will be prepended before target.
  addToDom: function(target, prependInstead) {
    target = target || this.options.uiTarget;
    if(target !== this.el.parentNode) {
      this.emitter.fireSequence('attach', function viewAttach(){
        if(prependInstead === true && target.firstChild) target.insertBefore(this.el, target.firstChild);
        else if(prependInstead && prependInstead !== true) target.insertBefore(this.el, prependInstead);
        else target.appendChild(this.el);
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

  // **pie.view.eon**
  //
  // Register an event with the emitter.
  eon: function() {
    var args = this._normalizedEmitterArgs(arguments, 1);
    return this.emitter.on.apply(this.emitter, args);
  },

  // **pie.view.eoff**
  //
  // Unregister an event from the emitter.
  eoff: function(uid) {
    return this.emitter.off(uid);
  },

  // **pie.view.eonce**
  //
  // Register an event once with the emitter.
  eonce: function() {
    var args = this._normalizedEmitterArgs(arguments, 1);
    this.emitter.once.apply(this.emitter, args);
  },

  ewait: function() {
    var args = this._normalizedEmitterArgs(arguments, arguments.length-1);
    this.emitter.waitUntil.apply(this.emitter, args);
  },

  eprepend: function() {
    var args = this._normalizedEmitterArgs(arguments, 1);
    this.emitter.prepend.apply(this.emitter, args);
  },

  eprependonce: function() {
    var args = this._normalizedEmitterArgs(arguments, 1);
    this.emitter.prependOnce.apply(this.emitter, args);
  },

  _normalizedEmitterArgs: function(args, fnStartIdx) {
    return pie.array.from(args).map(function(arg, i) {
      if(pie.object.isString(arg) && i >= fnStartIdx) return this[arg].bind(this);
      return arg;
    }.bind(this));
  },

  // **pie.view.eventNamespace**
  //
  // The namespace used for this view's events. All views have a separate namespace to ensure
  // event triggers are propagated efficiently.
  eventNamespace: function() {
    return 'view'+ pie.uid(this);
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

    el = pie.object.isDom(pie.array.last(fns)) ? fns.pop() : this.el;

    if(!~this.eventedEls.indexOf(el)) this.eventedEls.push(el);

    events = events.split(' ');

    fns.forEach(function viewOnIterator(fn) {
      fn = pie.object.isString(fn) ? this[fn].bind(this) : fn;

      f2 = function viewEventNamespaceVerifier(e){
        if(e.namespace === ns) {
          return fn.apply(this, arguments);
        }
      };

      events.forEach(function viewOnSubscriber(ev) {
        ev += "." + ns;
        pie.dom.on(el, ev, f2, sel);
      }.bind(this));

    }.bind(this));

    return this;
  },


  // **pie.view.observe**
  //
  // Observe changes of a model, unobserving them when the view is removed.
  // If the object is not observable, an error will be thrown.
  // The first argument is the observable model OR the function to be executed.
  // If the first argument is not a model, the model will be assumed to be `this.model`.
  // The next arguments (first or second) should be a function name or a function.
  // The remaining arguments are optional filter keys.
  // ```
  // view.observe(user, this.onNameChange.bind(this), 'firstName', 'lastName');
  // view.observe(context, this.onContextChange.bind(this));
  // ```
  observe: function() {
    var args = pie.array.from(arguments),
    observable = pie.object.isModel(args[0]) ? args.shift() : this.model;

    if(!pie.object.has(observable, 'observe', true)) throw new Error("Observable does not respond to observe");

    if(pie.object.isString(args[0])) args[0] = this[args[0]].bind(this);

    var callback = {
      observable: observable,
      args: args
    };

    var uid = pie.uid(callback);

    this.changeCallbacks[uid] = callback;

    observable.observe.apply(observable, args);

    return uid;
  },

  unobserve: function(uid) {
    var a = this.changeCallbacks[uid];
    delete this.changeCallbacks[uid];
    a.observable.unobserve.apply(a.observable, a.args);
  },

  onChange: function() {
    this.app.debug.apply(this.app, pie._debugArgs("view#onChange is deprected. Please use view#observe instead."));
    this.observe.apply(this, arguments);
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
      this.emitter.fireSequence('detach', function viewDetach() {
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

  // **pie.view.cancelSetup**
  //
  // Sometimes when a view is being set up it determines that the app has to redirect and/or it's
  // no longer relevant to the page. If you do not conduct a full setup process this function will
  // short circuit the process.
  cancelSetup: function() {
    this.emitter.fire('setup:after');
    return this;
  },

  // **pie.view.teardown**
  //
  // This function should be invoked when it's ready to dismiss the view.
  // Upon invocation, a `teardown` sequence is emitted.
  // When teardown runs, the view's `el` is removed from the dom, all observations are removed,
  // and all children have teardown invoked.
  teardown: function() {

    this.emitter.fireSequence('teardown', function viewTeardown() {

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
    this.children.forEach(function viewChildrenTeardown(child) {
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
    Object.keys(this.changeCallbacks).forEach(this.unobserve.bind(this));
  }

}, pie.mixins.container);


/* true create function overriden to invoke setup after init() is finished if `setup:true` was provided as an option */
(function(){
  var existing = pie.view.create;
  pie.view.create = function() {
    var instance = existing.apply(this, arguments);
    if(instance.options.setup) instance.setup();
    return instance;
  };
})();
pie.activeView = pie.view.extend('activeView', {

  init: function(options) {
    if(pie.object.isString(options)) options = {template: options};
    this._super(options);
    if(!this.model && this.options.model) this.model = this.options.model;
    this.refs = {};
  },

  setup: function() {

    if(this.options.autoRender && this.model) {
      var args = pie.object.isBoolean(this.options.autoRender) ? ['~'] : pie.array.from(this.options.autoRender);
      args.unshift('render');
      args.unshift(this.model);
      this.observe.apply(this, args);
    }

    if(this.options.renderOnSetup || this.options.renderOnSetup === undefined) {
      this.eonce('setup', 'render');
    }

    if(this.options.refs) {
      this.setupRefs();
      this.eprepend('render:after', 'clearRefCache');
    }

    this.eon('render', '_renderTemplateToEl');

    this._super();
  },

  hasChild: function(options) {
    var f = function boundRenderChild(){ return this._renderChild(options); }.bind(this);

    var events = options.events;
    if(events === undefined) events = ['render:after'];

    pie.array.from(events).forEach(function(e){
      this.eon(e, f);
    }.bind(this));
    return f;
  },

  _renderChild: function(options) {

    if(!this.isInApp()) return;

    var factory = pie.fn.from(options.factory, this),
    transitionClass = options.viewTransitionClass || pie.simpleViewTransition,
    childName = options.name,
    current = this.getChild(childName),
    instance = current,
    target = options.sel,
    filter = pie.fn.from(options.filter, this),
    blocker = pie.fn.from(options.blocker, this),
    info = {
      childName: childName,
      current: this.getChild(childName),
    },
    trans;

    if(pie.object.isString(target)) target = this.qs(target);

    info.target = target;

    // if we have no place to put our view or we've been filtered, remove the current child
    if(!target || (filter && filter() === false)) {

      // if there is a current view, make sure we tear this dude down.
      if(current) {
        this.removeChild(current);
        current.teardown();
      }

      this.emitter.fire(childName + ':teardown', info);
      return;
    }

    this.emitter.fire(childName + ':manage:before', info);

    var aroundTrigger = function(){
      this.emitter.fireAround(childName + ':manage:around', function activeViewRenderChild() {

        instance = factory(current);

        if(!current && !instance) return;

        info.instance = instance;

        // if we are dealing with the same instance, make sure we don't remove it, only add it.
        if(current === instance) {
          // if we're still attached to the previous render, move us to the new one.
          if(!target.contains(current.el)) current.addToDom(target);
          this.emitter.fire(childName + ':manage', info);
          this.emitter.fire(childName + ':manage:after', info);
          return;
        }

        // there's a child and a target.
        trans = transitionClass.create(this, pie.object.merge(options.viewTransitionOptions, {
          targetEl: target,
          childName: childName,
          oldChild: current,
          newChild: instance
        }));


        info.transition = trans;
        this.emitter.fire(childName + ':manage', info);

        trans.transition(function(){
          this.emitter.fire(childName + ':manage:after', info);
        }.bind(this));

      }.bind(this));
    }.bind(this);

    if(blocker) blocker(aroundTrigger);
    else aroundTrigger();
  },

  _renderTemplateToEl: function() {
    var templateName = pie.fn.valueFrom(this.templateName, this);

    if(templateName) {
      this.app.templates.renderAsync(templateName, this.renderData(), function activeViewOnTemplateReady(content){
        this.el.innerHTML = content;
        this.emitter.fire('render:after');
      }.bind(this));
    } else {
      this.emitter.fire('render:after');
    }
  },

  renderData: function() {
    if(this.model) {
      return this.model.data;
    }

    return {};
  },

  render: function() {
    this.emitter.fire('render:before');
    this.emitter.fireAround('render:around', function activeViewRender(){
      // render:after should be fired by the render implementation.
      // There's the possibility that a template needs to be fetched from a remote source.
      this.emitter.fire('render');
    }.bind(this));
  },

  templateName: function() {
    return this.options.template;
  },

  setupRefs: function() {
    var refs = {};
    var self = this;

    Object.defineProperty(refs, '_cache', {
      iteratable: false,
      writable: true
    });

    refs.fetch = function(name){
      delete refs._cache[name];
      return refs[name];
    };

    refs._cache = {};

    pie.object.forEach(self.options.refs, function(k,v) {

      Object.defineProperty(refs, k, {
        iteratable: false,
        get: function() {
          if(pie.object.has(refs._cache, k)) return refs._cache[k];
          return refs._cache[k] = self.qs(v);
        }
      });

    });

    self[self.options.refsName || 'dom'] = refs;
  },

  clearRefCache: function() {
    this[this.options.refsName || 'dom']._cache = {};
  }

});
pie.ajaxRequest = pie.model.extend('ajaxRequest', {

  init: function(data, options) {
    this._super(data, options);

    this.getOrSet('headers', {});

    this.xhr = null;
    this.emitter = pie.emitter.create();

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

  _validateOptions: function() {
    // upcase before we validate inclusion.
    if(this.get('verb')) this.set('verb', this.get('verb').toUpperCase());

    return this.validateAll().catch(function(){
      throw new Error(JSON.stringify(this.get('validationErrors')));
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
        if(pie.object.isString(data) || pie.object.instanceOf(data, 'FormData')) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        // if we aren't already sending a string, we will encode to json.
        } else {
          headers['Content-Type'] = 'application/json';
        }
      }

    }

    if(!headers['X-Requested-With']) {
      headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    pie.object.forEach(headers, function(k,v) {
      xhr.setRequestHeader(k, v);
    });

  },

  _applyCsrfToken: function(xhr) {

    var token = pie.fn.valueFrom(this.get('csrfToken')) || this.app.cache.fetch('csrfToken', function(){
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
    timeout = this.get('timeout'),
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
    if(timeout) xhr.timeout = timeout;

    this.emitter.fire('setup', xhr, this);


    xhr.onload = function() {
      if(tracker) tracker(xhr, self);

      self._parseResponse(xhr);

      if(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        self._onSetModel(self.response);
        self._onDataSuccess(self.response);
        self._onSuccess(self.response, xhr);
      } else {
        self._onError(xhr);
      }

      self._onComplete(xhr);
    };

    xhr.onerror = xhr.ontimeout = function(){
      self._onError(xhr);
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
    this._validateOptions().then(function(){
      this._buildXhr();
      if(!skipSend) this.send();
    }.bind(this));

    return this;
  },

  // Send the xhr. Assumes build() has been called.
  send: function() {
    var data = this.get('data'), d;

    if(this.get('verb') !== this.VERBS.get) {

      if(pie.object.isString(data) || pie.object.instanceOf(data, 'FormData')) {
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
    return this;
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

  promise: function() {
    if(this._promise) return this._promise;
    this._promise = pie.promise.create(function(resolve, reject) {
      this.dataSuccess(resolve);
      this.error(reject);
    }.bind(this));
    return this._promise;
  }

}, pie.mixins.validatable);
pie.ajax = pie.base.extend('ajax', {

  init: function(app){
    this.app = app;
    this._super();
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

    var request = pie.ajaxRequest.create({}, { app: this.app });
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
pie.appState = pie.model.extend('appState', {

  infoIgnore: /^__/,

  parseInfo: function(d) {
    var out = {}, r = this.infoIgnore;
    pie.object.forEach(d, function(k,v) {
      if(!r.test(k)) out[k] = v;
    });
    return out;
  },

  thingsThatCareAboutStateChanges: function() {
    return [this.app.router];
  },

  transition: function(id, skipHistory) {

    // no change
    if(this.test('__fullId', id)) return;

    var pq = this.app.pathHelper.pathAndQuery(id);
    var changes = [{}, pq.query];

    this.thingsThatCareAboutStateChanges().forEach(function stateWillChangeIterator(thing) {
      changes.push(thing.stateWillChange(pq.path, pq.query));
    });


    changes = pie.object.merge.apply(null, changes);

    var info = this.parseInfo(changes);

    pie.object.merge(changes, {
      __id: pq.path,
      __query: pq.query || {},
      __fullId: id,
      __history: !skipHistory,
      __info: info
    });


    this.setData(changes);
  }

});
// # Pie Emitter
//
// An emitter is an event subscriber & notifier. It's similar to a pubsub implementation but
// allows for blocking of an event via `around` callbacks. It's similar to a promise implementation,
// but doesn't worry itself with the result of the underlying functions.
// ```
// var emitter = pie.emitter.create();
//
// emitter.on('foo', function(){} );
// emitter.prepend('foo', function(){} );
//
// emitter.once('bar:after', function(){} );
// emitter.prependOnce('bar:before', function(){} );
// emitter.once('bar:around', function(cb){} );
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
  // emitter.waitUntil('setup:after', 'render:after', this.highlightNav.bind(this));
  // ```
  waitUntil: (function(){

    var invalidEventNameRegex = /:around$/;

    return function(/* eventNames, fn */) {
      var eventNames = pie.array.change(arguments, 'from', 'flatten'),
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

    if(options.waitUntil) {

      var origFn = fn,
      waitUntil = pie.array.from(options.waitUntil),
      o = pie.object.except(options, 'waitUntil');
      o.immediate = true;

      fn = function() {
        this.waitUntil(waitUntil, function(){
          this._on(event, origFn, o, meth);
        }.bind(this));
      }.bind(this);

      fn.wrapper = true;
    }

    var lastArgs = this.lastInvocation(event);

    if(options.now || (options.immediate && this.hasEvent(event))) {
      fn.apply(null, lastArgs);
      if(options.onceOnly) return;
    }

    var storage = pie.object.merge({fn: fn, event: event}, options);
    var uid = pie.uid(storage);

    this.getOrSet('eventCallbacks.' + event, [])[meth](storage);
    this.get('eventCallbacks')[uid] = storage;

    return uid;
  },

  // Same method signature of `_on`, but handles the inclusion of the `onceOnly` option.
  _once: function(event, fn, options, meth) {
    options = pie.object.merge({onceOnly: true}, options);
    return this._on(event, fn, options, meth);
  },

  // ** pie.emitter.on **
  //
  // Public interface for invoking `_on` & pushing an event to the end of the callback chain.
  // ```
  // emitter.on('foo', function(){});
  // emitter.on('foo:after', function(){});
  // ```
  on: function(event, fn, options) {
    return this._on(event, fn, options, 'push');
  },

  off: function(uid) {
    var storage = this.get('eventCallbacks.' + uid);
    if(!storage) return;
    pie.array.remove(this.get('eventCallbacks.' + storage.event), storage);
    this.set('eventCallbacks.' + uid, undefined);
  },

  // ** pie.emitter.prepend **
  //
  // Public interface for invoking `_on` & prepending an event to the beginning of the callback chain.
  // ```
  // emitter.prepend('foo', function(){});
  // ```
  prepend: function(event, fn, options) {
    return this._on(event, fn, options, 'unshift');
  },

  // ** pie.emitter.once **
  //
  // Public interface for invoking `_once` & pushing an event to the end of the callback chain.
  // ```
  // emitter.once('foo', function(){}, {immediate: true});
  // ```
  once: function(event, fn, options) {
    return this._once(event, fn, options, 'push');
  },

  // ** pie.emitter.prependOnce **
  //
  // Public interface for invoking `_once` & prepending an event to the beginning of the callback chain.
  // ```
  // emitter.prependOnce('foo', function(){});
  // ```
  prependOnce: function(event, fn, options) {
    return this._once(event, fn, options, 'unshift');
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
      callbacks.forEach(function emitterFireCallback(cb, i) {
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
  // // fires "foo", fires "foo:around", invokes barFn, fires "foo", fires "foo:after"
  // ```
  fireSequence: function(event, fn) {
    var before = event + ':before',
        after  = event + ':after',
        around = event + ':around';

    this.fire(before);
    this.fireAround(around, function emitterFireAroundCallback() {
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
  // emitter.on('foo:around', cb1);
  // emitter.on('foo:around', cb2);
  // emitter.fireAround('foo:around', function(){ console.log('done!'); });
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
// # Pie FormView
//
// A view designed to ease form modeling & interactions.
// FormViews make use of bindings & validations to simplify the input, validation, and submission of forms.
// FormViews expect the activeView and bindings mixins to be included.
// ```
// myForm = pie.formView.create({
//   fields: [
//     {
//       name: 'full_name'
//       validation: {
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
//       validation: {
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
pie.formView = pie.activeView.extend('formView', pie.mixins.bindings, {

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
    this.model = this.model || this.options.model || pie.model.create({});

    if(!this.model.validates) this.model.reopen(pie.mixins.validatable);
  },


  _normalizeFormOptions: function() {
    this.options.formSel  = this.options.formSel || 'form';
    this.options.fields   = this.options.fields || [];
    this.options.fields   = this.options.fields.map(function(field) {

      if(pie.object.isString(field)) field = {name: field};

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

      validation = field.validation || field.validations;

      if(validation) {
        validation = {};
        validation[field.name] = field.validation || field.validations;
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
  onInvalid: function() {},


  // ** pie.formView.onValid **
  //
  // What happens when the model validations pass.
  // By default, the data is prepared for submission via `prepareSubmissionData`
  // and sent to `performSubmit`.
  onValid: function() {
    this.prepareSubmissionData().then(function onValidDataCallback(data) {

      this.performSubmit(data).then(
        this._onSuccess.bind(this),
        this._onFailure.bind(this)
      );

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
  performSubmit: function(data) {
    var request = app.ajax.ajax(pie.object.merge({
      verb: 'post',
      data: data
    }, this.ajaxOptions()));

    return request.promise();
  },

  /* for the inheriting class to override. */
  onFailure: function(/* response, xhr */) {},

  /* for the inheriting class to override. */
  onSuccess: function(/* response, xhr */) {},

  // ** pie.formView.prepareSubmissionData **
  //
  // The data to be sent to the server.
  // By default these are the defined fields extracted out of the model.
  prepareSubmissionData: function() {
    var fieldNames = pie.array.map(this.options.fields, 'name'),
    data = this.model.gets(fieldNames);

    return pie.promise.resolve(data);
  },

  // ** pie.formView.validateModel **
  //
  // Perform validations on the model & invoke `cb` when complete.
  // By default, `model.validateAll` will be invoked but this can be overridden
  // to talk to external services, etc.
  validateModel: function() {
    return this.model.validateAll();
  },

  // ** pie.formView.validateAndSubmitForm **
  //
  // Start the submission process. We apply our form fields to the model
  // via `applyFieldsToModel`, fire a submit event via our emitter, then
  // begin the validation process via `validateModel`. If the model validates,
  // we invoke our `onValid` function, otherwise the `onInvalid` function.
  validateAndSubmitForm: function(e) {
    this.consumeEvent(e);

    this.applyFieldsToModel();

    this.emitter.fire('submit');

    this.validateModel().then(this._onValid.bind(this), this._onInvalid.bind(this));
  }

});
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
    }, pie.object.merge({
      app: app,
      variableName: 'h'
    }, options));

    var i18n = this.app.i18n;

    this.register('t', i18n.t.bind(i18n));
    this.register('l', i18n.l.bind(i18n));
    this.register('state', this.app.state);
    this.register('timeago', i18n.timeago.bind(i18n));
    this.register('path', this.app.path.bind(this.app));
    this.register('get', pie.object.getPath);
    this.register('render', this.renderPartials.bind(this));
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

  /* enables render to be called from templates. data can be an object or an array */
  renderPartials: function(templateName, data) {
    return pie.array.map(data, function(d){
      return this.app.templates.render(templateName, d);
    }.bind(this)).join("\n");
  },

  /* Provide the functions which should be available in templates. */
  functions: function() {
    return this.get('fns');
  },

  provideVariables: function() {
    return "var app = pie.apps[" + pie.uid(this.app) + "]; var " + this.options.variableName + " = app.helpers.functions();";

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
pie.i18n = pie.model.extend('i18n', (function(){

  var extension = {

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

      pie.object.forEach(this.strftimeMods, function(k,v){
        this.strftimeMods[k] = v.bind(this);
      }.bind(this));

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
      return this.t('app.time.short_day_names.' + d, {'default' : ''}) || this._dayName(d).slice(0, 3);
    },

    _formattedDayName: function(d) {
      if(this._isToday(d)) return this.t('app.time.today');
      if(this._isTomorrow(d)) return this.t('app.time.tomorrow');
      return this._dayName(d.getDay());
    },

    _formattedShortDayName: function(d) {
      if(this._isToday(d)) return this.t('app.time.today');
      return this._shortDayName(d.getDay());
    },

    _isToday: function(date) {
      var now = new Date();
      return now.getFullYear() === date.getFullYear() &&
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate();
    },

    _isTomorrow: function(date) {
      var tom = new Date();
      tom.setDate(tom.getDate() + 1);
      return tom.getFullYear() === date.getFullYear() &&
        tom.getMonth() === date.getMonth() &&
        tom.getDate() === date.getDate();
    },


    _shortMonthName: function(m) {
      return this.t('app.time.short_month_names.' + m, {'default' : ''}) || this._monthName(m).slice(0, 3);
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
      var changes = pie.array.change(arguments, 'from', 'compact'),
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
        } else if(translation == null) {
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
      this._date = this._normalizedDate(date);

      /* named format from translations.time. */
      if(!~f.indexOf('%')) f = this.t('app.time.formats.' + f, {"default" : f});

      pie.object.forEach(this.strftimeMods, function(pattern, fn) {
        f = f.replace(pattern, fn);
      });

      delete this._date;
      return f;
    },

    strftimeMods: {
      '%a'   : function(){  return this._shortDayName(this._date.getDay()); },
      '%-a'  : function() { return this._formattedShortDayName(this._date, this._date.getDay()); },
      '%A'   : function() { return this._dayName(this._date.getDay()); },
      '%-A'  : function() { return this._formattedDayName(this._date, this._date.getDay()); },
      '%B'   : function() { return this._monthName(this._date.getMonth()); },
      '%b'   : function() { return this._shortMonthName(this._date.getMonth()); },
      '%d'   : function() { return this._pad(this._date.getDate(), 2, '0'); },
      '%-d'  : function() { return this._date.getDate(); },
      '%+d'  : function() { return this._date.getDate() + this._ordinal(this._date.getDate()); },
      '%e'   : function() { return this._pad(this._date.getDate(), 2, ' '); },
      '%H'   : function() { return this._pad(this._date.getHours(), 2, '0'); },
      '%-H'  : function() { return this._date.getHours(); },
      '%k'   : function() { return this._pad(this._date.getHours(), 2, ' '); },
      '%-k'  : function() { return this._date.getHours(); },
      '%I'   : function() { return this._pad(this._hour(this._date.getHours()), 2, '0'); },
      '%l'   : function() { return this._hour(this._date.getHours()); },
      '%m'   : function() { return this._pad(this._date.getMonth() + 1, 2, '0'); },
      '%-m'  : function() { return this._date.getMonth() + 1; },
      '%M'   : function() { return this._pad(this._date.getMinutes(), 2, '0'); },
      '%p'   : function() { return this._ampm(this._date.getHours()).toUpperCase(); },
      '%P'   : function() { return this._ampm(this._date.getHours()); },
      '%S'   : function() { return this._pad(this._date.getSeconds(), 2, '0'); },
      '%-S'  : function() { return this._date.getSeconds(); },
      '%L'   : function() { return this._pad(this._date.getMilliseconds(), 3, '0'); },
      '%-L'  : function() { return this._date.getMilliseconds(); },
      '%w'   : function() { return this._date.getDay(); },
      '%y'   : function() { return this._pad(this._date.getFullYear() % 100, 2, '0'); },
      '%Y'   : function() { return this._date.getFullYear(); },
      '%Z'   : function() { return this._timezoneAbbr(this._date); },
      '%z'   : function() {
        var offset = this._date.getTimezoneOffset();
        var absOffsetHours    = Math.floor(Math.abs(offset / 60));
        var absOffsetMinutes  = Math.abs(offset) - (absOffsetHours * 60);
        return (offset > 0 ? "-" : "+") + this._pad(absOffsetHours, 2, '0') + this._pad(absOffsetMinutes, 2, '0');
      },
      '%:z' : function() {
        var tzOffset = this.strftimeMods['%z']();
        return tzOffset.slice(0,3) + ':' + tzOffset.slice(3);
      }
    }
  };

  extension.t = extension.translate;
  extension.l = extension.strftime;

  return extension;
})());

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
      today: "Today",
      tomorrow: "Tomorrow",
      formats: {
        isoDate:    '%Y-%m-%d',
        isoTime:    '%Y-%m-%dT%H:%M:%S.%L%:z',
        shortDate:  '%m/%d/%Y',
        longDate:   '%B %+d, %Y'
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
        'Jun',
        'Jul',
        'Aug',
        'Sep',
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
      ccExpirationDate:   "is not a valid expiration date",
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

  init: function(arrayOrData, options) {
    if(Array.isArray(arrayOrData)) arrayOrData = {items: arrayOrData};
    this._super(arrayOrData, options);
    this.boundChangeObserver = this.onItemChange.bind(this);
    this.data.items = pie.array.from(this.data.items).map(this._cast.bind(this));
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
      value = klass.create(value, this.options.castOptions);
    }

    this._observeItem(value);

    return value;
  },

  _observeItem: function(child) {
    if(this.options.observeItems === false) return;
    if(!child.observe) return;

    child.observe(this.boundChangeObserver, '__version');
  },

  _unobserveItem: function(child) {
    if(this.options.observeItems === false) return;
    if(!child || !child.unobserve) return;
    child.unobserve(this.boundChangeObserver, '__version');
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
    newLength;

    fn.call();

    newLength = this.data.items.length;

    if(!options || !options.skipTrackMutations) {
      if(oldLength !== newLength) {
        this.addChangeRecord('length', 'update', oldLength, newLength)
      }

      this.addChangeRecord('items', 'update', this.data.items, this.data.items);
    }

    if(options && options.skipObservers) return this;
    return this.deliverChangeRecords();
  },

  onItemChange: function(changeSet) {
    var item = changeSet[0].object;
    if(!item) return;

    // todo, create a uid based index hash which would make this much faster.
    var idx = this.indexOf(item);
    this.addChangeRecord('items*', 'item:change', item, item, {changes: changeSet, index: idx});

    this.deliverChangeRecords();
  },

  // ** pie.list.forEach **
  //
  // Iterate the list, calling `f` with each item.
  forEach: function(f) {
    return this.get('items').forEach(f);
  },

  map: function(f) {
    return this.get('items').map(f);
  },

  filter: function(f) {
    return this.get('items').filter(f);
  },

  sort: function(f, options) {
    return this._trackMutations(options, function listSort(){

      var items = this.get('items');
      items.sort(f);

      this.addChangeRecord('items', 'reorder', items, items);

    }.bind(this));
  },

  detect: function(fn) {
    return pie.array.detect(this.get('items'), fn);
  },

  // ** pie.list.get **
  //
  // Get an item at a specific index.
  // `key` can be any valid input to `_normalizeIndex`.
  get: function(key) {
    var idx = this._normalizedIndex(key), path;

    if(isNaN(idx)) path = key;
    else path = 'items.' + idx;

    return this._super(path);
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
    return this._trackMutations(options, function listInsert(){

      value = this._cast(value);

      var idx = this._normalizedIndex(key);

      this.addChangeRecord('items*', 'item:add', this.data.items[idx], value, {index: idx});

      this.data.items.splice(idx, 0, value);

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

    this._trackMutations(options, function listPop() {

      value = this.data.items.pop();
      this.addChangeRecord('items*', 'item:delete', value, undefined, {index: this.data.items.length});

      this._unobserveItem(value);

    }.bind(this));

    return value;
  },

  // ** pie.list.push **
  //
  // Add an item to the end of the list.
  // Returns the list.
  push: function(value, options) {
    return this._trackMutations(options, function listPush(){

      value = this._cast(value);

      this.addChangeRecord('items*', 'item:add', undefined, value, {index: this.data.items.length});

      this.data.items.push(value);
    }.bind(this));
  },

  // ** pie.list.remove **
  //
  // Remove a specific index from the list.
  // Returns the removed item.
  remove: function(key, options) {

    var value;

    this._trackMutations(options, function listRemove(){
      var idx = this._normalizedIndex(key);

      value = this.data.items[idx];
      this.data.items.splice(idx, 1);

      this._unobserveItem(value);

      this.addChangeRecord('items*', 'item:delete', value, this.data.items[idx], {index: idx});
    }.bind(this));

    return value;
  },

  removeAll: function(fn) {
    if(!fn) {
      this.setItems([]);
      return this;
    }

    var items = this.get('items');
    for(var i = 0; i < items.length; i++) {
      if(fn(items[i])) {
        this.remove(i)
        i--;
      }
    }

    return this;
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

    var innerOptions = pie.object.merge({}, options, {skipTrackMutations: true, skipObservers: true});

    return this._trackMutations(options, function listSet(){

      this.remove(key, innerOptions);

      if(value === undefined) return;

      this.insert(key, value, innerOptions);

    }.bind(this));
  },

  setItems: function(arr, options) {
    arr = arr || [];

    var innerOptions = pie.object.merge({}, options, {
      skipTrackMutations: true,
      skipObservers: true
    });

    return this._trackMutations(options, function listSetItems(){

      while(this.length()) {
        this.pop(innerOptions);
      }

      for(var i = 0; i < arr.length; i++) {
        this.push(arr[i], innerOptions);
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
// # Pie ListView
//
// A view mixin for easily managing a series of items. It assumes the activeView mixin has already been applied to your view.
// ```
// list = new pie.listView({
//   template: 'userList',
//   itemOptions: {
//     template: 'userItem'
//   }
// });
// ```
//
// Available options:
// * listOptions
//   * **sel -** the selector within this view's template to append items to. Defaults to "ul, ol, .js-items-container". If no match is found the view's `el` is used.
//   * **loadingClass -** the loading class to be added to the list container while items are being removed, setup, and added. Defaults to "is-loading".
// * itemOptions
//   * **factory -** a function used to generate the item view(s). If none is supplied, an activeView will be constructed with the item data & the parent's renderData as the renderData.
//   * **template -** assuming a substitute factory is not provided, this is the template (name) to apply to the default activeView.
//   * **any option -** any set of option you'd like to pass to your view.
// * emptyOptions
//   * **any option -** these options are identical to the itemOptions.
//
pie.listView = pie.activeView.extend('listView', (function(){

  var viewFactory = function(options, itemData){
    options = pie.object.merge({ model: itemData }, options);
    return pie.activeView.create(options);
  };

  var listChildContainer = pie.base.extend('listChildContainer', pie.mixins.container);

  return {

    init: function() {

      this._super.apply(this, arguments);

      this.options = pie.object.deepMerge({
        listOptions: {
          loadingClass: 'is-loading'
        },
        itemOptions: {
          factory: viewFactory
        },
        emptyOptions: {
          factory: viewFactory
        }
      }, this.options);

      if(!this.options.itemOptions.factory) {
        throw new Error("No view factory provided");
      }

      this.list = this.list || pie.list.create([]);
      this.model = this.model || this.list;

      this.listItems = listChildContainer.create();

      // to ensure bubbling gets to us.
      this.addChild('listItems', this.listItems);
    },

    setup: function() {
      this.observe(this.list, 'manageListUpdates', 'items*', 'items');
      this.observe(this.list, 'manageEmptyItem', 'length');

      this.eon('render:after', 'bootstrapItems');

      this.eon('renderItems:before', function beforeRenderItems(){ this.setListLoadingStyle(true); }.bind(this));
      this.eon('renderItems:after', function afterRenderItems(){ this.setListLoadingStyle(false); }.bind(this));

      this._super.apply(this, arguments);
    },

    findChildByItem: function(item) {
      return this.listItems.getChild(this.childName(item));
    },

    childName: function(item) {
      return 'item-' + pie.uid(item);
    },

    bootstrapItems: function(containerEl) {
      this.emitter.fireSequence('renderItems', function listViewBootstrapItems() {
        var uid, child, containerEl;

        containerEl = containerEl || this.listContainer();

        this.list.forEach(function listViewBootstrapItem(item, i) {
          child = this.findChildByItem(item) || this.buildItemChild(item, i, containerEl);
          child.removeFromDom();
          child.addToDom(containerEl);
        }.bind(this));

        this.manageEmptyItem();
      }.bind(this));
    },

    addItem: function(item, idx, containerEl) {
      containerEl = containerEl || this.listContainer();

      var child = this.buildItemChild(item, idx, containerEl);
      var idx = child._indexWithinParent;
      var nextChild = this.listItems.getChild(idx + 1);

      child.addToDom(containerEl, nextChild && nextChild.el);
    },

    buildItemChild: function(item, idx, containerEl) {
      containerEl = containerEl || this.listContainer();

      var opts = pie.object.dup(this.options.itemOptions),
      factory = pie.fn.from(opts.factory, this),
      child;

      delete opts.factory;

      child = factory(opts, item);

      this.listItems.addChild(this.childName(item), child, idx);
      child.setup();

      return child;
    },

    removeItem: function(item) {
      var child = this.findChildByItem(item);
      if(child) {
        this.listItems.removeChild(child);
        child.teardown();
      }
    },

    manageListUpdates: function(changeSet) {
      this.emitter.fireSequence('renderItems', function listViewManageListUpdates() {

        var containerEl = this.listContainer();

        changeSet.forEach(function(change){
          this.manageListUpdate(change, containerEl);
        }.bind(this));

      }.bind(this));
    },

    manageListUpdate: function(change, containerEl) {
      if(change.type === 'item:add') {
        this.addItem(change.value, change.index, containerEl);
      } else if (change.type === 'item:delete') {
        this.removeItem(change.oldValue);
      } else if (change.type === 'reorder') {
        // blow away our indexes, but don't rebuild our children.
        this.listItems.sendToChildren('removeFromDom');
        // this will find our existing children and add them back into our dom
        this.bootstrapItems(containerEl);
      }
    },

    manageEmptyItem: function() {
      if(this.list.length()) {
        this.removeEmptyItem();
      } else {
        this.addEmptyItem();
      }
    },

    removeEmptyItem: function() {
      var empty = this.getChild("empty");
      if(empty) {
        this.removeChild(empty);
        empty.teardown();
      }
    },

    addEmptyItem: function() {
      var opts = pie.object.dup(this.options.emptyOptions),
      factory = pie.fn.from(opts.factory, this);

      delete opts.factory;

      if(!factory) return;

      var child = factory(opts, {});

      this.addChild('empty', child);
      child.addToDom(this.listContainer());
      child.setup();
    },

    setListLoadingStyle: function(bool) {
      var className = this.options.listOptions.loadingClass;
      if(!className) return;

      this.listContainer().classList[bool ? 'add' : 'remove'](className);
    },

    listContainer: function() {
      var option = this.options.listOptions.sel;
      if(pie.object.isString(option)) option = this.qs(option);
      if(!option) return this.el;
      return option;
    },

    teardownChildren: function() {
      this._super();
      this._super.call(this.listItems);
    }

  };
})());
// # Pie Navigator
// The navigator is in charge of observing browser navigation and updating it's data.
// It's also the place to conduct push/replaceState history changes.
pie.navigator = pie.base.extend('navigator', {

  init: function(app, options) {
    this._super();

    this.app = app;
    this.options = options;

    this.state = this.app.state;

    this.app.emitter.once('start', this.start.bind(this));
  },

  evaluateState: function() {

    if(this.state.test('__fullId', this.browserPath())) return;

    var route = this.state.get('__route');
    if(this.app.routeHandler.canRouteBeHandled(route)) this.softGo();
    else this.hardGo();
  },

  softGo: function() {
    var replace = !this.state.is('__history');
    window.history[replace ? 'replaceState' : 'pushState']({}, document.title, this.state.get('__fullId'));
  },

  hardGo: function() {
    window.location.href = this.state.get('__fullId');
  },

  browserPath: function() {
    return window.location.pathname + window.location.search;
  },

  navigateApp: function() {
    this.app.go(this.browserPath(), true);
  },

  // ** pie.navigator.start **
  //
  // Setup the pushstate observations and get our app's state bootstrapped.
  start: function() {
    // on popstate we trigger a pieHistoryChange event so any other navigator-enabled apps
    pie.dom.on(window, 'popstate', this.navigateApp.bind(this));

    this.state.observe(this.evaluateState.bind(this), '__fullId', '__route');
    this.navigateApp();
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
    this.notifications = pie.list.create([], {cast: true});

    this._super();
  },

  // remove all alerts, potentially filtering by the type of alert.
  clear: function(type) {
    var filter = type ? function(m){ return m.test('type', type); } : undefined;
    this.notifications.removeAll(filter);
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
    messages = messages.map(function notifyI18nAttempter(m){ return this.app.i18n.attempt(m); }.bind(this));

    var msg = {
      messages: messages,
      type: type
    };

    msg.id = pie.uid(msg);
    this.notifications.push(msg);

    if(autoRemove) {
      setTimeout(function autoRemoveCallback(){ this.remove(msg.id); }.bind(this), autoRemove);
    }

  },

  getAutoRemoveTimeout: function(timeout) {
    if(timeout === undefined) timeout = true;
    if(timeout && !pie.object.isNumber(timeout)) timeout = 7000;
    return timeout;
  },

  remove: function(msgId) {
    var idx = pie.array.indexOf(this.notifications.get('items'), function(n){ return n.get('id') == msgId; });
    if(~idx) this.notifications.remove(idx);
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
  // pie.resources.create(app, {googleMaps: '//maps.google.com/.../js'});
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
  _loadajax: function(options) {
    var ajaxOptions = pie.object.merge({
      verb: 'GET',
      url: options.src
    }, options);

    return this.app.ajax.ajax(ajaxOptions).promise();
  },

  // **pie.resources.\_loadimage**
  //
  // Load an image and invoke `resourceOnload` when complete.
  // Options:
  // * **src** - the url of the image.
  _loadimage: function(options, resourceOnload) {
    return pie.promise.create(function(resolve, reject){
      var img = new Image();
      img.onload = function(){ resolve(pie.object.merge({ img: img }, options)); };
      img.onerror = reject;
      img.src = options.src;
    });

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
  _loadlink: function(options) {
    var link = document.createElement('link');

    link.href = options.src;
    link.media = options.media || 'screen';
    link.rel = options.rel || 'stylesheet';
    link.type = options.contentType || 'text/css';

    this._appendNode(link);

    /* Need to record that we added this thing. */
    /* The resource may not actually be present yet. */
    return pie.promise.resolve();
  },

  // **pie.resources.\_loadscript**
  //
  // Adds a `<script>` tag to the dom if the "type" is "script"
  //
  // Options:
  // * **src** - the url of the script.
  // * **callbackName** - _(optional)_ the global callback name the loading library will invoke
  // * **noAsync** - _(optional)_ if true, the script will be loaded synchronously.
  _loadscript: function(options) {

    return pie.promise.create(function(resolve, reject) {
      var script = document.createElement('script');

      if(options.noAsync) script.async = false;

      /* If options.callbackName is present, the invoking method self-references itself so it can clean itself up. */
      /* Because of this, we don't need to invoke the onload */
      if(!options.callbackName) {
        var done = false;
        script.onload = script.onreadystatechange = function loadScriptCallback(){
          if(!done && (!this.readyState || this.readyState==='loaded' || this.readyState==='complete')) {
            done = true;
            resolve();
          }
        };

        script.onerror = reject;
      }

      this._appendNode(script);
      script.src = options.src;

    }.bind(this));
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
    promises;

    sources = sources.map(this._normalizeSrc.bind(this));

    /* we generate a series of functions to be invoked by pie.fn.async */
    /* each function's responsibility is to invoke the provided callback when the resource is loaded */
    promises = sources.map(function resourceLoadPromiseGenerator(options){

      /* we could be dealing with an alias, so make sure to grab the real source */
      options = this.get('srcMap.' + options.src) || options;

      /* we cache the loading promise on our promises object */
      var promise = this.get('promises.' + options.src);
      var type = options.type || this._inferredResourceType(options.src)

      if(!promise) {
        promise = this['_load' + type](options);

        /* if a global callback name is desired, set it up then tear it down when the promise resolves */
        if(options.callbackName) {
          window[options.callbackName] = promise.resolve.bind(promise);
          promise = promise.then(function(){ delete window[options.callbackName]; });
        }

        this.set('promises.' + options.src, promise);
      }

      return promise;
    }.bind(this));

    return pie.promise.all(promises);
  }
});
// # Pie Route
//
// Represents a route used by the router.
// Routes understand if they match string paths, they know how to extract interpolations from a path,
// and know how to generate a path given some data.
// ```
// r = pie.route.create('/foo/:id');
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

  init: function(path, config) {
    var uid = pie.uid(this);

    this._super({
      pathTemplate: pie.string.normalizeUrl(path),
      config: config,
      name: config && config.name || ("route-" + uid)
    });

    this.set('config.name', undefined);

    this.compute('segments',            'pathTemplate');
    this.compute('pathRegex',           'pathTemplate');
    this.compute('hasInterpolations',   'pathTemplate');
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
    t = pie.string.escapeRegex(t);
    t = t.replace(/(:[^\/\?]+)/g,'([^\\/\\?]+)');
    t = t.replace(/(\\\*[^\/]+)/g, '(.*)');
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

  hasInterpolations: function() {
    return /[:\*]/.test(this.get('pathTemplate'));
  },

  // **pie.route.interpolations**
  //
  // Under the assumption that the path is already normalized and we've "matched" it,
  // extract the interpolations from `path`. If `parseValues` is true, the values will
  // be parsed based on `pie.string.deserialize`'s implementation.
  // ```
  // r = pie.route.create('/foo/:id');
  // r.interolations('/foo/bar');
  // //=> {id: 'bar'}
  // ```
  interpolations: function(path) {
    var interpolations = {};

    if(!this.is('hasInterpolations')) return interpolations;

    var splitPaths = path.split('/'),
    tmpls = this.get('segments'),
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
  // r = pie.route.create('/foo/:id');
  // r.path({id: 'bar'})
  // //=> '/foo/bar'
  // r.path({id: 'baz', page: 2});
  // //=> '/foo/baz?page=2'
  // ```
  path: function(query) {
    var usedKeys = [], path = this.get('pathTemplate');

    path = path.replace(/([:\*])([a-zA-Z0-9_]+)/g, function routePathGenerator(match, indicator, key){
      usedKeys.push(key);

      if(indicator === '*') return query && pie.object.has(query, key) ? query[key] : '';

      if(!query || query[key] == null ||  !String(query[key]).length) {
        throw new Error("[PIE] missing route interpolation: " + match);
      }
      return query[key];
    });

    var unusedData = usedKeys.length ? pie.object.except(query, usedKeys) : query;

    if(!pie.object.isEmpty(unusedData)) {
      var params = pie.object.serialize(pie.object.compact(unusedData, true));
      if(params.length) path = pie.string.urlConcat(path, params);
    }

    return path;
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
    }, pie.object.merge({app: app}, options));

    this.cache = pie.cache.create();
    this.state = this.app.state;

    if(!pie.string.endsWith(this.get('root'), '/')) throw new Error("The root option must end in a /");

    this.compute('rootRegex', 'root');
  },


  // **pie.router.rootRegex**
  //
  // A regex for testing whether a path starts with the declared root
  rootRegex: function() {
    return new RegExp('^' + this.get('root') + '(.+)?');
  },


  stateWillChange: function(path, query) {
    return this.cache.fetch('states::' + path, function() {
      path = this.stripRoot(path);

      var route = this.findRoute(path);
      var changes = { __route: route };

      if(route) {
        var interpolations = route.interpolations(path);
        pie.object.merge(changes, {__interpolations: interpolations}, route.get('config.state'), interpolations);
      }

      return changes;
    }.bind(this));
  },


  // **pie.router.findRoute**
  //
  // Find the most relevant route based on `nameOrPath`.
  // Direct matches match first, then the most relevant pattern match comes next.
  findRoute: function(path) {
    return this.cache.fetch('routes::' + path, function(){
      /* if a direct match is present, we return that */
      return this.findDirectMatch(path) || this.findPatternMatch(path);
    }.bind(this));
  },

  findDirectMatch: function(path) {
    return pie.array.detect(this.children, function(r){ return r.isDirectMatch(path); });
  },

  findPatternMatch: function(path) {
    return pie.array.detect(this.children, function(r){ return r.isMatch(path); });
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

    pie.object.forEach(routes, function routerMapper(k,r) {

      if(pie.object.isObject(r)) {
        path = k;
        config = r;
        if(defaults) config = pie.object.merge({}, defaults, config);
      } else {
        path = r;
        config = {name: k};
      }

      existing = this.findDirectMatch(path) || config.name;
      this.removeChild(existing);

      route = pie.route.create(path, config);
      this.registerRoute(route);
    }.bind(this));

    this.sortRoutes();
    this.cache.reset();
  },

  registerRoute: function(route) {
    this.addChild(route.get('name'), route);
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
  // nameOrPath = 'viewB'
  // nameOrPath = '/examples/navigation/view-b'
  // nameOrPath = '/view-b'
  // nameOrPath = 'view-b'
  path: function(nameOrPath, query) {
    var route, path;

    if(nameOrPath.indexOf('/') === 0) {
      nameOrPath = this.stripRoot(nameOrPath);
      route = this.findRoute(nameOrPath);
    } else {
      route = this.getChild(nameOrPath, false)
    }

    if(!route) {
      route = pie.route.create(nameOrPath);
      this.registerRoute(route);
    // if we had a route, we might have interpolations
    } else {
      var interps = route.interpolations(nameOrPath);
      if(!pie.object.isEmpty(interps)) {
        query = pie.object.merge({}, query, interps);
      }
    }

    path = route.path(query);
    path = this.ensureRoot(path);

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

    this.sortChildren(function routerChildSorter(a,b) {
      c = b.get('weight') - a.get('weight');
      c = c || b.get('pathTemplate').length - a.get('pathTemplate').length;
      c = c || a.get('pathTemplate').localeCompare(b.get('pathTemplate'));
      return c;
    });
  },

  hasRoot: function(path) {
    return this.get('rootRegex').test(path);
  },

  stripRoot: function(path) {
    var match = path.match(this.get('rootRegex'));
    if(match) path = '/' + (match[1] || '');
    return path;
  },

  ensureRoot: function(path) {
    if(path.match(this.get('rootRegex'))) return path;

    var root = this.get('root');
    /* if path is representative of root, use our root. */
    if(path === '/' || path === '') return root;
    /* if the path is our root, but missing the trailing slash, use our root. */
    if(path === root.substr(0, root.length-1)) return root;
    return pie.string.normalizeUrl(root + path);
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

    this.state = this.app.state;
    this.emitter  = this.app.emitter;

    this.state.observe(this.onRouteChange.bind(this), '__route');
    this._super();
  },

  currentView: function() {
    return this.app.getChild("currentView");
  },

  canRouteBeHandled: function(route) {
    return this.canHandleRedirect(route) || this.canHandleView(route);
  },

  canHandleRedirect: function(route) {
    return route && route.is('config.redirect');
  },

  canHandleView: function(route) {
    return route && route.is('config.view');
  },

  onRouteChange: function() {
    var route = this.state.get('__route');
    if(this.canHandleRedirect(route)) return this.handleRedirect(route);
    this.handleView(route);
  },

  handleRedirect: function(route) {
    var redirectTo = route.get('config.redirect');
    this.app.go(redirectTo);
  },

  handleView: function(route) {

    if(route) {
      var current = this.currentView();
      // if the view that's in there is already loaded, don't remove / add again.
      if(current && current._pieName === route.get('config.' + this.options.viewKey)) return true;
      if(!route.get('config.' + this.options.viewKey)) return false;
    }

    this.transitionToNewView(route);
    return true;
  },

  // The process for transitioning to a new view.
  // Both the current view and the next view are optional.
  transitionToNewView: function(route) {
    var current = this.currentView(),
        target, viewClass, child, transition;

    target = pie.object.isString(this.options.uiTarget) ? pie.qs(this.options.uiTarget) : this.options.uiTarget;

    // Provide some events that can be observed around the transition process.
    this.emitter.fire('viewChanged:before');
    this.emitter.fireAround('viewChanged:around', function routeHandlerTransition() {

      this.emitter.fire('viewChanged');

      if(route) {
        // Use the view key of the route to find the viewClass.
        // At this point we've already verified the view option exists, so we don't have to check it.
        viewClass = pie.object.getPath(window, this.options.viewNamespace + '.' + route.get('config.' + this.options.viewKey));

        // The instance to be added. If the class is not defined, this could and should blow up.
        child = viewClass.create({ app: this.app });

        // Cache an identifier on the view so we can use the current view if there's sub-navigiation.
        // if the url changes but the view does not
        child._pieName = route.get('config.' + this.options.viewKey);
      }

      // Instantiate a transition object based on the app configuration.
      transition = this.options.viewTransitionClass.create(this.app, pie.object.merge({
        oldChild: current,
        newChild: child,
        childName: "currentView",
        targetEl: target
      }, this.options.viewTransitionOptions));

      // Provide a couple common events out of the app.
      transition.emitter.on('removeOldChild:after', function routeHandlerAfterRemoveOldChildCallback() {
        this.emitter.fire('oldViewRemoved', current);
      }.bind(this));

      transition.emitter.on('transition:after', function routeHandlerAfterTransitionCallback() {
        this.emitter.fire('newViewLoaded', child);
      }.bind(this));

      transition.transition(function routeHandlerAfterTransition(){
        // The instance is now our 'currentView'
        this.emitter.fire('viewChanged:after');
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
      return;
    } else if(src) {
      this.load(name, {url: src}, function ensureTemplateCallback(){
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

    req.dataSuccess(function templateLoadCallback(content) {
      this.registerTemplate(name, content);
    }.bind(this)).error(function tmeplateLoadError(){
      throw new Error("[PIE] Template fetch error: " + name);
    }).complete(function templateLoadComplete() {
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
    this.ensureTemplate(name, function renderAsyncCallback() {
      var content = this.render(name, data);
      cb(content);
    }.bind(this));
  }
});
// # Pie Validator
// A collection of validators commonly used in web forms.
// ```
// validator = pie.validator.create();
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
  // If validationOptions contains a `message` key, that will be used to produce the message.
  // The `message` key can be a string, i18n attempt path, or a function.
  // If the validationOPtions contains a `messageKey` key, that will be used as an i18n lookup
  // at `app.validations.${messageKey}`.
  errorMessage: function(validationType, validationOptions) {

    if(validationOptions.message) {
      var msg = validationOptions.message;
      if(pie.object.isFunction(msg)) msg = msg(validationType, validationOptions);
      return this.app.i18n.attempt(msg);
    }

    var key = validationOptions.messageKey || validationType,
        base = this.i18n.t('app.validations.' + key),
        rangeOptions = pie.validator.rangeOptions.create(this.app, validationOptions),
        range = rangeOptions.message();

    if(!range && key === 'length') {
      rangeOptions = pie.validator.rangeOptions.create(this.app, {gt: 0});
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
    function luhnCheck(a) {
      var b,c,d,e;
      for(d = +a[b = a.length-1], e=0; b--;)
        c = +a[b], d += ++e % 2 ? 2 * c % 10 + (c > 4) : c;
      return !(d%10);
    };

    return function(value, options){
      return this.withStandardChecks(value, options, function ccNumberValidationCallback(){

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
    return this.withStandardChecks(value, options, function ccExpirationMonthValidationCallback() {
      return this.integer(value, {gte: 1, lte: 12});
    }.bind(this));
  },


  // **pie.validator.ccExpirationYear**
  //
  // Ensures the provided value is a valid credit card year.
  // It assumes the minimum is this year, and the maximum is 20 years from now.
  ccExpirationYear: function(value, options) {
    return this.withStandardChecks(value, options, function ccExpirationYearValidationCallback() {
      var now = new Date();
      return this.integer(value, {gte: now.getFullYear(), lte: now.getFullYear() + 20});
    }.bind(this));
  },


  // **pie.validator.ccSecurity**
  //
  // Ensures a well-formed cvv value.
  // It must be a number between 3 and 4 characters long.
  ccSecurity: function(value, options) {
    return this.withStandardChecks(value, options, function ccSecurityValidationCallback() {
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

    function valueCheck(value){
      return value != null && value !== '';
    };

    return function chosen(value, options){
      return this.withStandardChecks(value, options, function chosenValidationCallback(){
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
    return this.withStandardChecks(value, options, function dateValidationCallback() {
      var split = value.split('-'), y = split[0], m = split[1], d = split[2], iso, date;

      if(!y || !m || !d) return false;
      if(!this.length(y, {eq: 4}) || !this.length(m, {eq: 2}) || !this.length(d, {eq: 2})) return false;
      if(!this.number(y) || !this.number(m, {gte: 1, lte: 12}) || !this.number(d, {gte: 1, lte: 31})) return false;

      date = new Date(y, m-1, d);

      /* ensure the date is actually in the defined month */
      if(date.getDate() !== parseInt(d, 10)) return false;

      if(!options.sanitized) {
        Object.keys(options).forEach(function dateValidatorSanitizer(k){
          iso = options[k];
          iso = this.app.i18n.l(iso, 'isoDate');
          options[k] = iso;
        });
        options.sanitized = true;
      }

      var ro = pie.validator.rangeOptions.create(this.app, options);
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
    return this.withStandardChecks(value, options, function emailValidationCallback() {
      return (/^.+@.+\..+$/).test(value);
    });
  },

  // **pie.validator.fn**
  //
  // A generic function interface. This enables a function to be passed,
  // along with all the normal options. The function must respond in true, false,
  // or a promise.
  // ```
  // var opts = {fn: function(v){ return v.length === 3; }};
  // validator.fn("foo", opts);
  // //=> true
  // validator.fn("foos", opts);
  // //=> false
  // ```
  fn: function(value, options) {
    return this.withStandardChecks(value, options, function fnValidationCallback(){
      return options.fn.call(null, value, options);
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
    return this.withStandardChecks(value, options, function formatValidationCallback() {
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
    return this.withStandardChecks(value, options, function inclusionValidationCallback() {
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
    return  this.withStandardChecks(value, options, function integerValidationCallback(){
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

    return this.withStandardChecks(value, options, function lengthValidationCallback(){
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

    return this.withStandardChecks(value, options, function numberValidationCallback(){

      value = String(value).trim();
      /* not using parseFloat because it accepts multiple decimals */
      /* ip addresses would be considered numbers if parseFloat was used */
      if(!/^([\-])?([\d]+)?\.?[\d]+$/.test(value)) return false;

      var number = parseFloat(value),
      ro = pie.validator.rangeOptions.create(this.app, options);

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

    return this.withStandardChecks(value, options, function phoneValidationCallback(){
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
    return this.withStandardChecks(value, options, function uniquenessValidationCallback() {

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
// range = pie.validator.rangeOptions.create(app, {gte: 3, lt: 8});
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

    this._super();
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

    this.emitter    = pie.emitter.create();
    this.parent     = parent;
    this.oldChild   = options.oldChild;
    this.newChild   = options.newChild;
    this.childName  = options.childName || this.oldChild && this.oldChild._nameWithinParent;
    this.targetEl   = options.targetEl  || this.oldChild && this.oldChild.el.parentNode;

    if(!this.childName) throw new Error("No child name provided for view transition");
    if(!this.targetEl)  throw new Error("No target element provided for view transition");

    this.options = options;

    this.emitter.on('transition:before', this.manageChildren.bind(this));
    this.propagateTransitionEvents();

    this._super();
  },

  // fire a sequence which looks like
  // ```
  // | transition:before
  // | transition
  // |--| removeOldChild:before
  // |  | removeOldChild
  // |  | removeOldChild:after
  // |  |--| addNewChild:before
  // |     | addNewChild
  // |     | addNewChild:after
  // | transition:after
  // ```
  transition: function(cb) {
    var em = this.emitter;

    em.on('addNewChild:after', function() {
      em.fire('transition:after');
      if(cb) cb();
    });

    em.on('removeOldChild:after', function() {
      em.fire('addNewChild:before');
      em.fireAround('addNewChild:around', function() {
        em.fire('addNewChild');
      });
    });

    em.on('transition', function() {
      em.fire('removeOldChild:before');
      em.fireAround('removeOldChild:around', function() {
        em.fire('removeOldChild');
      });
    });

    em.fire('transition:before');
    em.fireAround('transition:around', function() {
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
      if(!this.newChild.emitter.hasEvent('setup:before')) this.newChild.setup();
    }
  },

  propagateTransitionEvents: function() {
    var em = this.emitter,
    oldEm = this.oldChild && this.oldChild.emitter,
    newEm = this.newChild && this.newChild.emitter;

    if(oldEm) {
      em.on('removeOldChild:before', function() {
        oldEm.fire('transitionOut:before');
      });

      em.on('removeOldChild:after', function() {
        oldEm.fire('transitionOut:after');
      });
    }

    if(newEm) {
      em.on('addNewChild:before', function() {
        newEm.fire('transitionIn:before');
      });

      em.on('transition:after', function() {
        newEm.fire('transitionIn:after');
      });
    }
  }

});


// Simple view transition: remove the old child from the view and dom, add the new child immediately after.
// Uses the default sequence of events.
pie.simpleViewTransition = pie.abstractViewTransition.extend('simpleViewTransition', {

  init: function() {
    this._super.apply(this, arguments);

    this.emitter.on('removeOldChild', this.removeOldChild.bind(this));
    this.emitter.on('addNewChild',    this.addNewChild.bind(this));
  },

  setLoading: function(bool) {
    if(!this.options.loadingClass) return;
    this.targetEl.classList[bool ? 'add' : 'remove'](this.options.loadingClass);
  },

  addNewChild: function() {
    if(!this.newChild) {
      this.emitter.fire('addNewChild:after');
      return;
    }

    this.begin = pie.date.now();

    this.setLoading(true);

    if(this.options.minDelay) {
      setTimeout(this.attemptToAddChild.bind(this), this.options.minDelay);
    }

    this.newChild.emitter.once('setup:after', this.attemptToAddChild.bind(this), {immediate: true});
  },

  attemptToAddChild: function() {
    var now = pie.date.now();

    /* ensure our child has been setup */
    if(!this.newChild.emitter.hasEvent('setup:after')) return;

    /* ensure the minimum delay has been reached */
    if(this.options.minDelay && now < (this.begin + this.options.minDelay)) return;

    this.setLoading(false);

    /* ensure our view was not removed from our parent */
    if(this.newChild.parent !== this.parent) return;

    this.newChild.addToDom(this.targetEl);
    this.emitter.fire('addNewChild:after');
  },

  removeOldChild: function() {
    if(this.oldChild) this.oldChild.teardown();
    this.emitter.fire('removeOldChild:after');
  }

});

pie.loadingViewTransition = pie.simpleViewTransition.extend('loadingViewTransition', {
  init: function() {
    this._super.apply(this, arguments);
    this.options.loadingClass = this.options.loadingClass || 'is-loading';
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
      em.on('transitionOldChild:after',  this.cancelWrap('teardownOldChild'));
    } else {
      em.on('transitionOldChild', function() {
        em.fire('transitionOldChild:after');
      });
    }

    if(this.newChild) {
      em.on('addNewChild',              this.cancelWrap('addNewChild'));
      em.on('transitionNewChild:around', this.cancelWrap('ensureNewChildPrepared'));
      em.on('transitionNewChild',       this.cancelWrap('refresh'));
      em.on('transitionNewChild',       this.cancelWrap('transitionNewChild'));

      this.newChild.emitter.once('removedFromParent', this.cancel.bind(this));
    } else {
      em.on('transitionNewChild', function() {
        em.fire('transitionNewChild:after');
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

    if(add) pie.dom.addClass(el, add);
    if(remove) pie.dom.removeClass(el, remove);
  },

  // WHEN options.async !== true
  // fire a sequence which looks like
  // ```
  // | transition:before
  // | transition
  // |  |--| removeOldChild:before
  // |     |--| transitionOldChild:before
  // |        | transitionOldChild
  // |        |--| transitionOldChild:after
  // |           |--| removeOldChild
  // |           |  |--| removeOldChild:after
  // |           |
  // |           |--| addNewChild:before
  // |              | addNewChild
  // |              |--| addNewChild:after
  // |                 |--| transitionNewChild:before
  // |                    | transitionNewChild
  // |                    |--| transitionNewChild:after
  // |                       |--| transition:after
  // ```
  //
  // WHEN options.async === true
  // fire a sequence which looks like
  // ```
  // | transition:before
  // | transition
  // |  |--| removeOldChild:before
  // |  |  |--| transitionOldChild:before
  // |  |     | transitionOldChild
  // |  |     |--| transitionOldChild:after
  // |  |        |--| removeOldChild
  // |  |           |--| removeOldChild:after
  // |  |
  // |  |--| addNewChild:before
  // |     | addNewChild
  // |     |--| addNewChild:after
  // |        |--| transitionNewChild:before
  // |           | transitionNewChild
  // |           |--| transitionNewChild:after
  // |              |--| transition:after
  // ```

  transition: function(cb) {
    var em = this.emitter;

    em.on('transitionNewChild:after', function() {
      em.fire('transition:after');
      if(cb) cb();
    });

    if(this.options.async) {
      em.on('transition', function() {
        em.fireSequence('addNewChild');
      });
    } else {
      em.on('removeOldChild:after', function() {
        em.fireSequence('addNewChild');
      });
    }

    em.on('addNewChild:after', function() {
      em.fire('transitionNewChild:before');
      em.fireAround('transitionNewChild:around', function() {
        em.fire('transitionNewChild');
      });
    });

    em.on('transitionOldChild:after', function() {
      em.fireSequence('removeOldChild');
    });

    em.on('transition', function() {
      em.fire('transitionOldChild:before');
      em.fireAround('transitionOldChild:around', function() {
        em.fire('transitionOldChild');
      });
    });

    em.fire('transition:before');
    em.fireAround('transition:around', function() {
      em.fire('transition');
    });

  },

  cancel: function() {
    if(!this.emitter.hasEvent('transitionNewChild:after')) {

      // the goal of a transition is to get the old child out and the new child in,
      // we make sure we've done that.
      if(this.oldChild) {
        this.teardownOldChild();
      }

      if(this.newChild) {
        this.applyClass(this.newChild.el, true);
        this.newChild.addToDom(this.targetEl);
      }

      // then we let everyone else know.
      this.emitter.fire('cancel');
    }
  },

  // teardown() the child if it hasn't already.
  teardownOldChild: function() {
    if(!this.oldChild.emitter.hasEvent('teardown:before')) {
      this.oldChild.teardown();
    }
  },

  // Add the new child to the dom.
  addNewChild: function() {
    this.newChild.addToDom(this.targetEl);
  },

  ensureNewChildPrepared: function(cb) {
    this.newChild.emitter.once('render:after', cb, {immediate: true});
  },

  // make sure we're rendered, then begin the ui transition in.
  // when complete, invoke the callback.
  transitionNewChild: function() {
    this.observeTransitionEnd(this.newChild.el, true, 'transitionNewChild:after');
  },

  // start the transition out. when complete, invoke the callback.
  transitionOldChild: function() {
    if(!this.oldChild.el.parentNode) this.emitter.fire('transitionOldChild:after');
    else this.observeTransitionEnd(this.oldChild.el, false, 'transitionOldChild:after');
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
pie.binding = pie.base.extend('binding', {

  init: function(view, model, options) {
    this.view = view;
    this.model = model;
    this.options = options;
    this.emitterUids = [];

    this.normalizeOptions();
    this.setupViewCallbacks();
    this.setupModelCallbacks();
  },

  teardown: function() {
    var v = this.view;
    this.emitterUids.forEach(v.eoff.bind(v));

    if(this.modelObserverUid) {
      v.unobserve(this.modelObserverUid);
    }
  },

  normalizeOptions: function() {
    if(!this.options.attr) throw new Error("An attr must be provided for data binding. " + JSON.stringify(this.options));

    var given       = this.options || {};
    var out         = {};
    /* the model attribute to be observed / updated. */
    out.attr        = given.attr;
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

    this.options = out;
  },

  getModelValue: function() {
    var val = this.model.get(this.options.attr);
    if(this.options.decorator) val = this.options.decorator(val);
    return val;
  },

  // The type caster based on the `dataType`.
  getTypeCaster: function(dataType) {
    dataType = dataType || this.options.dataType;
    return pie.binding.typeCasters[dataType] || pie.binding.typeCasters['default'];
  },

  // Provide a way to retrieve values out of the dom & apply values to the dom.
  getIntegration: function(el) {
    if(this.options.type === 'auto') return this.determineIntegrationForElement(el);
    return pie.binding.integrations[this.options.type] || pie.binding.integrations.value;
  },

  // If type=auto, this does it's best to determine the appropriate integration.
  determineIntegrationForElement: function(el) {
    var mod;
    if(el.hasAttribute && el.hasAttribute('data-' + this.options.attr)) mod = 'attribute';
    else if(el.nodeName === 'INPUT' && String(el.getAttribute('type')).toUpperCase() === 'CHECKBOX') mod = 'check';
    else if(el.nodeName === 'INPUT' && String(el.getAttribute('type')).toUpperCase() === 'RADIO') mod = 'radio';
    else if(el.nodeName === 'INPUT' || el.nodeName === 'SELECT' || el.nodeName === 'TEXTAREA') mod = 'value';
    else mod = 'text';

    return pie.binding.integrations[mod];
  },

  // Wiring of the view-to-model callbacks. These will observe dom events
  // and translate them to model values.
  setupViewCallbacks: function() {
    var _toModel = this.options.toModel;
    var opts = this.options;

    if(!_toModel) return;


    // If a function is provided, use that as the base implementation.
    if(!pie.object.isFunction(_toModel)) {
      // Otherwise, we provide a default implementation.
      _toModel = function(el, opts) {
        var value = this.getValueFromElement(el);
        this.applyValueToModel(value, opts);
      }.bind(this);
    }

    var toModel = function(e) {
      var el = e.delegateTarget;
      _toModel(el);
    };


    // If a debounce is requested, we apply the debounce to the wrapped function,
    // Leaving the base function untouched.
    if(opts.debounce) toModel = pie.fn.debounce(toModel, opts.debounce);

    this.toModel = _toModel;

    // Multiple events could be supplied, separated by a space.
    opts.trigger.split(' ').forEach(function(event){
      // Use the view's event management to register the callback.
      this.emitterUids.push(this.view.on(event, opts.triggerSel, toModel));
    }.bind(this));
  },

  setupModelCallbacks: function() {
    var toView = this.options.toView;
    var opts = this.options;

    if(!toView) return;

    if(!pie.object.isFunction(toView)) {
      toView = function(changeSet) {
        this.lastChange = changeSet && changeSet.get(opts.attr);
        this.applyValueToElements();
      }.bind(this);
    }

    this.toView = toView;
    this.modelObserverUid = this.view.observe(this.model, toView, opts.attr);
  },

  applyValueToElements: function() {
    if(this.ignore) return;

    var els = this.els();
    for(var i = 0; i < els.length; i++) {
      this.getIntegration(els[i]).setValue(els[i], this);
    }
  },

  // Extract a value out of an element based on a binding configuration.
  getValueFromElement: function(el) {
    // Get the basic value out of the element.
    var val = this.getIntegration(el).getValue(el, this),
    // Get the type casting function it based on the configuration.
    fn = this.getTypeCaster();
    // Type cast the value.
    val = fn(val);

    // If we're configured to have an array and have defined an `eachType`
    // use it to typecast each value.
    if(this.options.dataType === 'array' && this.options.eachType) {
      var eachFn = this.getTypeCaster(this.options.eachType);
      val = val.map(eachFn);
    }

    return val;
  },


  // Apply a value to the model, ensuring the model-to-view triggers do not take place.
  applyValueToModel: function(value, opts) {
    try{
      this.ignore = true;
      this.model.set(this.options.attr, value, opts);

    // Even if we error, we should reset the ignore.
    } finally {
      this.ignore = false;
    }
  },

  readFields: function(opts) {
    if(!this.toModel) return;

    var els = this.els();

    for(var i = 0; i < els.length; i++) {
      this.toModel(els[i], opts);
    }
  },

  els: function() {
    return pie.object.isString(this.options.sel) ? this.view.qsa(this.options.sel) : pie.array.from(this.options.sel);
  }

});


// A set of methods to cast raw values into a specific type.
pie.binding.typeCasters = {
  array: function(raw) {
    return pie.array.from(raw);
  },

  boolean: (function(){

    // Match different strings representing truthy values.
    var reg = /^(1|true|yes|ok|on)$/;

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

// Bind to an element's attribute.
pie.ns('pie.binding.integrations').attribute = (function(){

  // extract the attribute name from the binding configuration.
  var attributeName = function(binding){
    return binding.options.options.attribute || ('data-' + binding.options.attr);
  };

  return {

    getValue: function(el, binding) {
      return el.getAttribute(attributeName(binding));
    },

    setValue: function(el, binding) {
      var value = binding.getModelValue();
      return el.setAttribute(attributeName(binding), value);
    }

  };
})();

pie.binding.integrations['class'] = {
  getValue: function(/* el, binding */) {
    throw new Error("class bindings can only be from the model to the view. Please declare toModel: false");
  },

  setValue: function(el, binding) {
    var className = binding.options.options.className;

    if(className === '_value_') {
      var change = binding.lastChange;
      if(change) {
        if(change.oldValue) {
          pie.dom.removeClass(el, change.oldValue);
        }

        if(change.value) {
          pie.dom.addClass(el, change.value);
          return change.value;
        }
      }
    } else {
      var value = binding.getModelValue();
      className = className || binding.options.attr;

      pie.dom[!!value ? 'addClass' : 'removeClass'](el, className);

      return className;
    }
  }
};

pie.binding.integrations.value = {

  // Simple value extraction
  getValue: function(el /*, binding */) {
    return el.value;
  },

  // Apply the model's value to the element's value.
  setValue: function(el, binding) {
    var value = binding.getModelValue();
    /* jslint eqnull:true */
    if(value == null) value = '';
    return el.value = value;
  }

};

pie.binding.integrations.check = (function(){

  // String based index.
  var index = function(arr, value) {
    if(!arr) return -1;
    value = String(value);
    return pie.array.indexOf(arr, function(e){ return String(e) === value; });
  };

  return {

    getValue: function(el, binding) {

      // If we have an array, manage the values.
      if(binding.options.dataType === 'array') {

        var existing = pie.array.from(binding.getModelValue()), i;

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
      } else if(binding.options.dataType === 'boolean'){
        return !!el.checked;
      } else {
        // Otherwise, we return the el's value if it's checked.
        return el.checked ? el.value : null;
      }
    },

    // If the model's value contains the checkbox, check it.
    setValue: function(el, binding) {
      var value = binding.getModelValue(),
      elValue = el.value;

      // In the case of an array, we check for inclusion.
      if(binding.options.dataType === 'array') {
        var i = index(value, elValue);
        return el.checked = !!~i;
      } else {
        var caster = binding.getTypeCaster(binding.options.dataType);

        // Otherwise we check for equality
        return el.checked = caster(elValue) === caster(value);
      }
    }
  };

})();


pie.binding.integrations.radio = {

  // If a radio input is checked, return it's value.
  // Otherwise, return the existing value.
  getValue: function(el, binding) {
    var existing = binding.getModelValue();
    if(el.checked) return el.value;
    return existing;
  },

  // Check a radio button if the value matches.
  setValue: function(el, binding) {
    var value = binding.getModelValue(),
    elValue = el.value,
    caster = binding.getTypeCaster();

    /* jslint eqeq:true */
    return el.checked = caster(elValue) === caster(value);
  }

};

// Set the innerTEXT of an element based on the model's value.
pie.binding.integrations.text = {

  getValue: function(el /*, binding */) {
    return el.textContent;
  },

  setValue: function(el, binding) {
    var value = binding.getModelValue();

    /* jslint eqnull:true */
    if(value == null) value = '';
    return el.textContent = value;
  }

};

// Set the innerHTML of an element based on the model's value.
pie.binding.integrations.html = {

  getValue: function(el /*, binding */) {
    return el.innerHTML;
  },

  setValue: function(el, binding) {
    var value = binding.getModelValue();
    /* jslint eqnull:true */
    if(value == null) value = '';
    return el.innerHTML = value;
  }

};

pie.binding.integrations.fn = {
  getValue: function(el) {
    throw new Error("fn integrations do not provide a dom-to-model integration. Please use the `toModel: false` option.");
  },

  setValue: function(el, binding) {
    var value = binding.getModelValue();
    return binding.options.options.fn(el, value, binding);
  }
}
  pie.VERSION = "0.1.20150831.1";
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(function () {
      return pie;
    });
  } else {
    window.pie = pie;
  }
})(this);
