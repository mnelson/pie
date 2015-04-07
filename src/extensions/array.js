var Obj = require('object');

// # Pie Array Utilities
// A series of helpful methods for working with arrays.
var Arr = {
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
  areAll: function(a, f) {
    a = Arr.from(a);
    var i = 0;
    for(;i < a.length; i++) {
      if(!Obj.getValue(a[i], f)) return false;
    }
    return true;
  },

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
  areAny: function(a, f) {
    a = Arr.from(a);
    var i = 0;
    for(;i < a.length; i++) {
      if(Obj.getValue(a[i], f)) return true;
    }
    return false;
  },

  // ** pie.array.avg **
  //
  // Find the average of a series of numbers.
  // ```
  // pie.array.avg([1,2,3,4,5,8])
  // //=> 3.8333
  // ```
  avg: function(a) {
    a = Arr.from(a);
    var s = Arr.sum(a), l = a.length;
    return l ? (s / l) : 0;
  },

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
  change: function() {
    var args = Arr.from(arguments),
    arr = args.shift();
    args.forEach(function(m) {
      arr = Arr[m](arr);
    });

    return arr;
  },

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
  compact: function(a, removeAllFalsy){
    a = Arr.from(a);
    return a.filter(function(i){
      /* jslint eqeq:true */
      return removeAllFalsy ? !!i : (i != null);
    });
  },

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
  count: function(a, f) {
    var cnt = 0;
    Arr.from(a).forEach(function(i){
      if(Obj.getValue(i, f)) cnt++;
    });
    return cnt;
  },

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
  detect: function(a, f) {
    a = Arr.from(a);
    var i = 0, l = a.length;
    for(;i<l;i++) {
      if(Obj.getValue(a[i], f)) {
        return a[i];
      }
    }
  },

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
  detectLast: function(a, f) {
    a = Arr.from(a);
    var i = a.length-1, l = 0;
    for(;i>=l;i--) {
      if(Obj.getValue(a[i], f)) {
        return a[i];
      }
    }
  },

  // ** pie.array.dup **
  //
  // Return a new array containing the same values of the provided array `a`.
  dup: function(a) {
    return Arr.from(a).slice(0);
  },

  // ** pie.array.filter **
  //
  // Return the elements of the array that match `fn`.
  // The `fn` can be a function or attribut of the elements.
  // ```
  // var arr = ['', ' ', 'foo'];
  // pie.array.filter(arr, 'length');
  // //=> [' ', 'foo']
  // ```
  filter: function(arr, fn) {
    return Arr.from(arr).filter(function(i){
      return Obj.getValue(i, fn);
    });
  },


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
  flatten: function(a, depth, into) {
    into = into || [];

    if(Array.isArray(a) && depth !== -1) {

      if(depth != null) depth--;

      a.forEach(function(e){
        Arr.flatten(e, depth, into);
      });

    } else {
      into.push(a);
    }

    return into;
  },

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
  from: function(value) {
    if(Array.isArray(value)) return value;
    if(Obj.isArguments(value) || value instanceof global.NodeList || value instanceof global.HTMLCollection) return Array.prototype.slice.call(value, 0);
    return Arr.compact([value], false);
  },

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
  get: function(arr, startIdx, endIdx) {
    arr = Arr.from(arr);
    if(startIdx < 0) startIdx += arr.length;

    if(endIdx !== undefined) {
      if(endIdx < 0) endIdx += arr.length;
      return arr.slice(startIdx, endIdx + 1);
    }

    return arr[startIdx];
  },

  // ** pie.array.grep **
  //
  // Return string based matches of `regex` from the provided array `arr`.
  // ```
  // arr = ['foo', 'too', 'bar', 'baz', 'too']
  // pie.array.grep(arr, /oo/)
  // //=> ['foo', 'too', 'too']
  // ```
  grep: function(arr, regex) {
    return Arr.from(arr).filter(function(a){ return regex.test(String(a)); });
  },


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
  groupBy: function(arr, groupingF) {
    var h = {}, g;
    Arr.from(arr).forEach(function(a){

      g = Obj.getValue(a, groupingF);

      /* jslint eqeq:true */
      if(g != null) {
        h[g] = h[g] || [];
        h[g].push(a);
      }
    });

    return h;
  },

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
  hasAny: function(/* a, *values */) {
    var a = Arr.from(arguments[0]),
    values = Arr.get(arguments, 1, -1), i;
    values = Arr.flatten(values);
    for(i=0;i<values.length;i++) {
      if(~a.indexOf(values[i])) return true;
    }
    return false;
  },

  // ** pie.array.indexOf **
  //
  // Find the first index of the item that matches `f`.
  // The function `f` can be a function or an attribute.
  // ```
  // arr = [{foo: true}, {bar: true}, {bar: true, foo: true}]
  // pie.array.indexOf(arr, 'foo')
  // //=> 0
  indexOf: function(a, f) {
    a = Arr.from(a);
    var i = 0, l = a.length;
    for(;i<l;i++) {
      if(Obj.getValue(a[i], f)) {
        return i;
      }
    }

    return -1;
  },

  // ** pie.array.intersect **
  //
  // Retrieve the intersection of two arrays `a` and `b`.
  // ```
  // a = [0, 1, 2, 3, 4]
  // b = [0, 2, 4, 6, 8]
  // pie.array.intersect(a, b)
  // //=> [0, 2, 4]
  // ```
  intersect: function(a, b) {
    return Arr.from(a).filter(function(i) { return ~b.indexOf(i); });
  },


  // ** pie.array.last **
  //
  // Retrieve the last item of the array.
  last: function(arr) {
    arr = arr && Arr.from(arr);
    if(arr && arr.length) return arr[arr.length - 1];
  },


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
  map: function(a, f, callInternalFunction){
    var callingF;

    if(!Obj.isFunction(f)) {
      callingF = function(e){
        var ef = e[f];

        if(callInternalFunction && Obj.isFunction(ef))
          return ef.apply(e);
        else
          return ef;
      },
    } else {
      callingF = f;
    }

    return Arr.from(a).map(function(e){ return callingF(e); });
  },

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
  partition: function(/* a, fn1, fn2 */) {
    var out = [],
    fns = Arr.from(arguments),
    arr = Arr.from(fns.shift());

    fns.forEach(function(fn, j){
      out[j] = [];
      out[j+1] = out[j+1] || [];
      arr.forEach(function(e){
        if(!!Obj.getValue(e, fn)) out[j].push(e);
        else out[j+1].push(e);
      });

      arr = Arr.dup(out[j+1]);
    });

    return out;
  },

  // **pie.array.partitionAt**
  //
  // Split an array up at the first occurrence where fn evaluates to true.
  // ```
  // arr = [a(), b(), "string", "string", c()]
  // pie.array.partitionAt(arr, pie.object.isNotFunction)
  // //=> [ [a(), b()], ["string", "string", c()] ]
  // ```
  partitionAt: function(arr, fn) {
    var a = [], b = [], stillA = true;

    Arr.from(arr).forEach(function(i){
      if(stillA && !!Obj.getValue(i, fn)) stillA = false;
      (stillA ? a : b).push(i);
    });

    return [a, b];
  },


  // ** pie.array.remove **
  //
  // Remove all occurences of object `o` from array `a`.
  // ```
  // a = [0, 1, 3, 5, 0, 2, 4, 0]
  // pie.array.remove(a, 0)
  // //=> [1, 3, 5, 2, 4]
  remove: function(a, o) {
    a = Arr.from(a);
    var idx;
    while(~(idx = a.indexOf(o))) {
      a.splice(idx, 1);
    }
    return a;
  },


  // ** pie.array.subtract **
  //
  // Return an array that consists of any `a` elements that `b` does not contain.
  // ```
  // a = [0, 1, 2, 3, 4]
  // b = [0, 2, 4, 6, 8]
  // pie.array.subtract(a, b)
  // //=> [1, 3]
  subtract: function(a, b) {
    return Arr.from(a).filter(function(i) { return !~b.indexOf(i); });
  },

  // ** pie.array.sum **
  //
  // Sum the values of `a` and return a float.
  // ```
  // arr = [1, 2, 5]
  // pie.array.sum(arr)
  // //=> 8.0
  // ```
  sum: function(a) {
    return Arr.from(a).reduce(function(a,b){ return a + parseFloat(b); }, 0);
  },

  // ** pie.array.sortBy **
  //
  // Sort the array based on the value dictated by the function `sortF`.
  // The function can also be an attribute of the array's items.
  // ```
  // arr = [{name: 'Doug'}, {name: 'Alex'}, {name: 'Bill'}]
  // pie.array.sortBy(arr, 'name')
  // //=> [{name: 'Alex'}, {name: 'Bill'}, {name: 'Doug'}]
  // ```
  sortBy: function(arr, sortF){
    var aVal, bVal;
    return Arr.from(arr).sort(function(a, b) {
      aVal = Obj.getValue(a, sortF);
      bVal = Obj.getValue(b, sortF);
      if(aVal === bVal) return 0;
      if(aVal < bVal) return -1;
      return 1;
    });
  },


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
  toSentence: function(arr, options) {
    arr = Arr.from(arr);
    if(!arr.length) return '';

    options = Obj.merge({
      i18n: Obj.getPath(pie, 'appInstance.i18n')
    }, options);

    options.delimeter = options.delimeter || options.i18n && options.i18n.t('app.sentence.delimeter', {default: ', '});
    options.conjunction = options.conjunction || options.i18n && options.i18n.t('app.sentence.conjunction', {default: ' and '});
    options.punctuate = options.punctuate === true ? '.' : options.punctuate;

    if(arr.length > 2) arr = [arr.slice(0,arr.length-1).join(options.delimeter), arr.slice(arr.length-1)];

    var sentence = arr.join(options.conjunction);
    if(options.punctuate && !pie.string.endsWith(sentence, options.punctuate)) sentence += options.punctuate;

    return sentence;
  },


  // ** pie.array.union **
  //
  // Return the union of N provided arrays.
  // a = [1, 2]
  // b = [2, 3, 4]
  // c = [3, 4, 5]
  // pie.array.union(a, b, c)
  // //=> [1, 2, 3, 4, 5]
  union: function() {
    var arrs = Arr.from(arguments);
    arrs = Arr.compact(arrs, true);
    arrs = Arr.flatten(arrs);
    arrs = Arr.unique(arrs);
    return arrs;
  },


  // ** pie.array.unique **
  //
  // Remove any duplicate values from the provided array `arr`.
  // ```
  // arr = [0, 1, 3, 2, 1, 0, 4]
  // pie.array.unique(arr)
  // [0, 1, 3, 2, 4]
  // ```
  unique: function(arr) {
    return Arr.from(arr).filter(function(e, i){ return arr.indexOf(e) === i; });
  }
};


module.exports = Arr;
