(function(window) {
// pie namespace;
var pie = window.pie = {

  apps: {},

  // native extensions
  array: {},
  browser: {},
  date: {},
  dom: {},
  fn: {},
  math: {},
  object: {},
  string: {},

  // extensions to be used within pie apps.
  mixins: {},

  pieId: 1,


  ns: function(path) {
    return pie.object.getPath(window, path) || pie.object.setPath(window, path, {});
  },

  setUid: function(obj) {
    return obj.pieId = obj.pieId || pie.unique();
  },

  unique: function() {
    return String(pie.pieId++);
  },

  guid: function() {
    var r, v;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      r = Math.random()*16|0,
      v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  },

  // provide a util object for your app which utilizes pie's features.
  // window._ = pie.util();
  // _.a.detect(/* .. */);
  // _.o.merge(a, b);
  // _.unique(); //=> '95'
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

    o.unique  = pie.unique;
    o.setUid  = pie.setUid;

    return o;
  }

};
pie.array.areAll = function(a, f) {
  var i = 0;
  for(;i < a.length; i++) {
    if(!f.call(null, a[i])) return false;
  }
  return true;
};

pie.array.areAny = function(a, f) {
  var i = 0;
  for(;i < a.length; i++) {
    if(f.call(null, a[i])) return true;
  }
  return false;
};

pie.array.change = function() {
  var args = pie.array.from(arguments),
  arr = args.shift();
  args.forEach(function(m) {
    arr = pie.array[m](arr);
  });

  return arr;
};


pie.array.avg = function(a) {
  var s = pie.array.sum(a), l = a.length;
  return l ? (s / l) : 0;
};


// remove all null or undefined values
// does not remove all falsy values unless the second param is true
pie.array.compact = function(a, removeAllFalsy){
  return a.filter(function(i){
    /* jslint eqeq:true */
    return removeAllFalsy ? !!i : (i != null);
  });
};


// return the first item where the provided function evaluates to a truthy value.
// if a function is not provided, the second argument will be assumed to be an attribute check.
// pie.array.detect([1,3,4,5], function(e){ return e % 2 === 0; }) => 4
// pie.array.detect([{foo: 'bar'}, {baz: 'foo'}], 'baz') => {baz: 'foo'}
pie.array.detect = function(a, f) {
  var i = 0, l = a.length;
  for(;i<l;i++) {
    if(pie.object.getValue(a[i], f)) {
      return a[i];
    }
  }
};

pie.array.detectLast = function(a, f) {
  var i = a.length-1, l = 0;
  for(;i>=l;i--) {
    if(pie.object.getValue(a[i], f)) {
      return a[i];
    }
  }
};


pie.array.dup = function(a) {
  return a.slice(0);
};


// flattens an array of arrays or elements into a single depth array
// pie.array.flatten(['a', ['b', 'c']]) => ['a', 'b', 'c']
// you may also restrict the depth of the flattening:
// pie.array.flatten([['a'], ['b', ['c']]], 1) => ['a', 'b', ['c']]
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


// return an array from a value. if the value is an array it will be returned.
pie.array.from = function(value) {
  if(Array.isArray(value)) return value;
  if(pie.object.isArguments(value) || value instanceof NodeList || value instanceof HTMLCollection) return Array.prototype.slice.call(value, 0);
  return pie.array.compact([value], false);
};

pie.array.get = function(arr, startIdx, endIdx) {
  if(startIdx < 0) startIdx += arr.length;

  if(endIdx) {
    if(endIdx < 0) endIdx += arr.length;
    return arr.slice(startIdx, endIdx + 1);
  }

  return arr[startIdx];
};

pie.array.grep = function(arr, regex) {
  return arr.filter(function(a){ return regex.test(String(a)); });
};


pie.array.groupBy = function(arr, groupingF) {
  var h = {}, g;
  arr.forEach(function(a){

    g = pie.object.getValue(a, groupingF);

    /* jslint eqeq:true */
    if(g != null) {
      h[g] = h[g] || [];
      h[g].push(a);
    }
  });

  return h;
};

pie.array.indexOf = function(a, f) {
  var i = 0, l = a.length;
  for(;i<l;i++) {
    if(pie.object.getValue(a[i], f)) {
      return i;
    }
  }

  return -1;
};

pie.array.intersect = function(a, b) {
  return a.filter(function(i) { return ~b.indexOf(i); });
};


// get the last item
pie.array.last = function(arr) {
  if(arr && arr.length) return arr[arr.length - 1];
};


// return an array filled with the return values of f
// if f is not a function, it will be assumed to be a key of the item.
// if the resulting value is a function, it can be invoked by passing true as the second argument.
// pie.array.map(["a", "b", "c"], function(e){ return e.toUpperCase(); }) => ["A", "B", "C"]
// pie.array.map(["a", "b", "c"], 'length') => [1, 1, 1]
// pie.array.map([0,1,2], 'toFixed') => [toFixed(){}, toFixed(){}, toFixed(){}]
// pie.array.map([0,1,2], 'toFixed', true) => ["0", "1", "2"]
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

  return a.map(function(e){ return callingF(e); });
};


pie.array.remove = function(a, o) {
  var idx;
  while(~(idx = a.indexOf(o))) {
    a.splice(idx, 1);
  }
  return a;
};


// return an array that consists of any A elements that B does not contain
pie.array.subtract = function(a, b) {
  return a.filter(function(i) { return !~b.indexOf(i); });
};


pie.array.sum = function(a) {
  var s = 0;
  a.forEach(function(i){ s += parseFloat(i); });
  return s;
};


pie.array.sortBy = function(arr, sortF){
  var aVal, bVal;
  return arr.sort(function(a, b) {
    aVal = pie.object.getValue(a, sortF);
    bVal = pie.object.getValue(b, sortF);
    if(aVal === bVal) return 0;
    if(aVal < bVal) return -1;
    return 1;
  });
};


pie.array.toSentence = function(arr, options) {
  if(!arr.length) return '';

  options = pie.object.merge({
    i18n: pie.object.getPath(pie, 'appInstance.i18n')
  }, options);

  options.delimeter = options.delimeter || options.i18n && options.i18n.t('sentence.delimeter', {default: ', '});
  options.and = options.and || options.i18n && options.i18n.t('sentence.and', {default: ' and '});
  options.punctuate = options.punctuate === true ? '.' : options.punctuate;

  if(arr.length > 2) arr = [arr.slice(0,arr.length-1).join(options.delimeter), arr.slice(arr.length-1)];

  var sentence = arr.join(options.and);
  if(options.punctuate && !pie.string.endsWith(sentence, options.punctuate)) sentence += options.punctuate;

  return sentence;
};


pie.array.union = function() {
  var arrs = pie.array.from(arguments);
  arrs = pie.array.compact(arrs, true);
  arrs = pie.array.flatten(arrs);
  arrs = pie.array.unique(arrs);
  return arrs;
};


// return unique values
pie.array.unique = function(arr) {
  return arr.filter(function(e, i){ return arr.indexOf(e) === i; });
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
  return ('ontouchstart' in window) ||
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
pie.date.now = function() {
  return new Date().getTime();
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

// ###all
// Invokes the provided method or method chain with the provided arguments to all elements in the nodeList.
// Example usage:
// * pie.dom.all(nodeList, 'setAttribute', 'foo', 'bar');
// * pie.dom.all(nodeList, 'classList.add', 'active');
// * pie.dom.all(nodeList, 'clicked=', true);
//
// `nodeList` can either be a node, nodeList, or an array of nodes.
// `methodName` can be a string representing a method name, an attribute, or a property. Can be chained with periods. Can end in a `=` to invoke an assignment.
pie.dom.all = function(/* nodeList, methodName[, arg1, arg2, ...] */) {
  return pie.dom._all(arguments, false);
};

// Has the same method signature of `pie.dom.all` but returns the values of the result
// Example usage:
// * pie.dom.getAll(nodeList, 'clicked') //=> [true, true, false]
pie.dom.getAll = function() {
  return pie.dom._all(arguments, true);
};

// create an element based on the content provided.
pie.dom.createElement = function(str) {
  var wrap = document.createElement('div');
  wrap.innerHTML = str;
  return wrap.removeChild(wrap.firstElementChild);
};

pie.dom.cache = function() {
  pie.elementCache = pie.elementCache || new pie.cache();
  return pie.elementCache;
};

pie.dom.remove = function(el) {
  pie.setUid(el);
  pie.dom.cache().del('element-' + el.pieId);
  if(el.parentNode) el.parentNode.removeChild(el);
};


pie.dom.off = function(el, event, fn, selector, cap) {
  var eventSplit = event.split('.'),
    namespace, all, events;

  pie.setUid(el);
  event = eventSplit.shift();
  namespace = eventSplit.join('.');
  all = event === '*';

  events = pie.dom.cache().getOrSet('element-' + el.pieId + '.dom-events', {});

  (all ? Object.keys(events) : [event]).forEach(function(k) {
    pie.array.from(events[k]).forEach(function(obj, i, ary) {
      if(!cap && (k === 'focus' || k === 'blur') && obj.sel) cap = true;
      if((!namespace || namespace === obj.ns) && (!fn || fn === obj.fn) && (!selector || selector === obj.sel) && (cap === obj.cap)) {
        el.removeEventListener(k, obj.cb, obj.cap);
        delete ary[i];
      }

      events[k] = pie.array.compact(pie.array.from(events[k]));
    });
  });
};


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
    var targ, els;

    if(namespace) {
      e.namespace = namespace;
    }

    if(!selector) {
      fn.call(el, e);
    } else {
      els = pie.array.from(el.querySelectorAll(selector));

      targ = pie.array.detect(els, function(qel) {
        return qel === e.target || qel.contains(e.target);
      });

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


pie.dom.trigger = function(el, e, forceEvent) {

  if(!forceEvent && e === 'click') return el.click();

  var event = document.createEvent('Event');
  event.initEvent(e, true, true);
  return el.dispatchEvent(event);
};

pie.fn.async = function(fns, cb, counterObserver) {

  if(!fns.length) {
    cb();
    return;
  }

  var completeCount = fns.length,
  completed = 0,
  counter = function() {
    if(counterObserver) counterObserver.apply(null, arguments);
    if(++completed === completeCount) cb();
  };

  fns.forEach(function(fn) { fn(counter); });
};

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// Lifted from underscore.js
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

pie.fn.valueFrom = function(f, binding, args) {
  if(pie.object.isFunction(f)) return f.apply(binding, args) ;
  return f;
};
pie.math.precision = function(number, places) {
  return Math.round(number * Math.pow(10, places)) / Math.pow(10, places);
};
// deletes all undefined and null values.
// returns a new object less any empty key/values.
pie.object.compact = function(a, removeEmpty){
  var b = pie.object.merge({}, a);
  Object.keys(b).forEach(function(k) {
    if(b[k] === undefined || b[k] === null || (removeEmpty && b[k].toString().length === 0)) delete b[k];
  });
  return b;
};


// deep merge
pie.object.deepMerge = function() {
  var args = pie.array.from(arguments),
      targ = args.shift(),
      obj;

  function fn(k) {
    if(k in targ && pie.object.isObject(targ[k])) {
      targ[k] = pie.object.deepMerge(targ[k], obj[k]);
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

pie.object.flatten = function(a, object, prefix) {
  var b = object || {};
  prefix = prefix || '';

  pie.object.forEach(a, function(k,v) {
    if(pie.object.isObject(v)) {
      pie.object.flatten(v, b, k + '.');
    } else {
      b[prefix + k] = v;
    }
  });

  return b;
};

// thanks, underscore
['Object','Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Boolean'].forEach(function(name) {
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
  else if(pie.object.has(o, attribute))         return o[attribute];
  else                                          return void 0;
};

pie.object.has = function(obj, key) {
  return obj && obj.hasOwnProperty(key);
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
    } else if(pie.object.isObject(o)) {
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

// Escapes a string for HTML interpolation
pie.string.escape = (function(){
  var encReg = /[<>&"'\x00]/g;
  var encMap = {
    "<"   : "&lt;",
    ">"   : "&gt;",
    "&"   : "&amp;",
    "\""  : "&quot;",
    "'"   : "&#39;"
  };

  return function(str) {
    /* jslint eqnull: true */
    if(str == null) return str;
    return ("" + str).replace(encReg, function(c) { return encMap[c] || ""; });
  };
})();

pie.string.endsWith = function(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

// designed to be used with the "%{expression}" placeholders
pie.string.expand = function(str, data) {
  data = data || {};
  return str.replace(/\%\{(.+?)\}/g,
    function(match, key) {return data[key];});
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

  if(path.indexOf('?') > 0) {
    var split = path.split('?');
    path = pie.string.normalizeUrl(split.shift());
    split.unshift(path);
    path = split.join('?');
  }

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


// string templating via John Resig
pie.string.template = function(str, varString) {
  return new Function("data",
    "var p=[];" + (varString || "") + ";with(data){p.push('" +
    str.replace(/[\r\t\n]/g, " ")
       .replace(/'(?=[^%]*%\])/g,"\t")
       .split("'").join("\\'")
       .split("\t").join("'")
       .replace(/\[%=(.+?)%\]/g, "',$1,'")
       .replace(/\[%-(.+?)%\]/g, "',pie.string.escape($1),'")
       .split("[%").join("');")
       .split("%]").join("p.push('") +
       "');}return p.join('');"
  );
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
  else query = '&' + query;

  base += query;
  base = base.replace('?&', '?').replace('&&', '&').replace('??', '?');
  if(base.indexOf('?') === base.length - 1) base = base.substr(0, base.length - 1);
  return base;
};
// this.bind(model, {
//   model: model,
//   type: 'attribute',
//   sel: 'input[name="first_name"]'
//   attr: 'first_name',
//   trigger: 'change',
//   triggerSel: attr,
//   toModel: true,
//   toView: true,
//   debounce: 150,
// })


// A mixin to provide two way data binding between a model and dom elements.
// This mixin should be used with a pie view.
pie.mixins.bindings = (function(){

  var integrations = {

    attribute: (function(){

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
    })(),

    value: {

      getValue: function(el, binding) {
        return el.value;
      },

      setValue: function(el, binding) {
        var value = binding.model.get(binding.attr);
        /* jslint eqnull:true */
        if(value == null) value = '';
        return el.value = value;
      }

    },

    check: (function(){

      var index = function(arr, value) {
        value = String(value);
        return pie.array.indexOf(arr, function(e){ return String(e) === value; });
      };

      return {

        getValue: function(el, binding) {
          var existing = binding.model.get(binding.attr), i;

          if(Array.isArray(existing)) {
            existing = pie.array.dup(existing);
            i = index(existing, el.value);
            // if we are checked and we don't already have it, add it.
            if(el.checked && i < 0) {
              existing.push(el.value);
            // if we are not checked but we do have it, then we add it.
            } else if(!el.checked && i >= 0) {
              existing.splice(i, 1);
            } else {
              return undefined;
            }

            return existing;
          } else {
            return el.checked ? el.value : null;
          }
        },

        setValue: function(el, binding) {
          var value = binding.model.get(binding.attr),
          elValue = el.value;

          if(Array.isArray(value)) {
            var i = index(value, elValue);
            return el.checked = !!~i;
          } else {
            /* jslint eqeq:true */
            return el.checked = elValue == value;
          }
        }
      };

    })(),

    radio: {

      getValue: function(el, binding) {
        return el.checked ? el.value : null;
      },

      setValue: function(el, binding) {
        var value = binding.model.get(binding.attr),
        elValue = el.value;

        /* jslint eqeq:true */
        return el.checked = elValue == value;
      }

    },

    text: {

      getValue: function(el, binding) {
        return el.innerText;
      },

      setValue: function(el, binding) {
        var value = binding.model.get(binding.attr);

        /* jslint eqnull:true */
        if(value == null) value = '';
        return el.innerText = value;
      }

    },

    html: {

      getValue: function(el, binding) {
        return el.innerHTML;
      },

      setValue: function(el, binding) {
        var value = binding.model.get(binding.attr);
        /* jslint eqnull:true */
        if(value == null) value = '';
        return el.innerHTML = value;
      }

    }

  };

  var typeCasters = {

    array: function(raw) {
      return pie.array.from(raw);
    },

    boolean: function(raw) {
      return !!parseInt(raw, 10);
    },

    number: function(raw) {
      return parseFloat(raw, 10);
    },

    integer: function(raw) {
      return parseInt(raw, 10);
    },

    string: function(raw) {
      return String(raw);
    },

    "default" : function(raw) {
      return raw;
    }

  };

  var normalizeBindingOptions = function(given) {

    if(!given.attr) throw new Error("An attr must be provided for data binding. " + JSON.stringify(given));

    var out = {};
    out.attr = given.attr;
    out.model = given.model || this.model;
    out.sel = given.sel || '[name="' + given.attr + '"]';
    out.type = given.type || 'auto';
    out.dataType = given.dataType || 'default';
    out.eachType = given.eachType || undefined;
    out.trigger = given.trigger || 'change keyup';
    out.triggerSel = given.triggerSel || out.sel;
    out.toModel = given.toModel || given.toModel === undefined;
    out.toView = given.toView || given.toView === undefined;
    out.debounce = given.debounce || false;
    out.options = given.options || {};

    if(out.debounce === true) out.debounce = 150;

    return out;
  };

  var determineIntegrationForBinding = function(el, binding) {
    var mod;
    if(el.hasAttribute && el.hasAttribute('data-' + binding.attr)) mod = 'attribute';
    else if(el.nodeName === 'INPUT' && el.getAttribute('type') === 'checkbox') mod = 'check';
    else if(el.nodeName === 'INPUT' && el.getAttribute('type') === 'radio') mod = 'radio';
    else if(el.nodeName === 'INPUT' || el.nodeName === 'SELECT') mod = 'value';
    else mod = 'text';

    return integrations[mod];
  };

  var integrationForBinding = function(el, binding) {
    if(binding.type === 'auto') return determineIntegrationForBinding(el, binding);
    return integrations[binding.type];
  };

  var typeCasterForBinding = function(dataType) {
    return typeCasters[dataType] || typeCasters.default;
  };

  var applyValueToModel = function(value, binding) {
    if(value === undefined) return;

    binding.ignore = true;
    binding.model.set(binding.attr, value);
    binding.ignore = false;
  };

  var applyValueToElement = function(el, binding) {
    integrationForBinding(el, binding).setValue(el, binding);
  };

  var applyValueToElements = function(binding) {
    if(binding.ignore) return;

    var els = pie.array.from(this.qsa(binding.sel));
    els.forEach(function(el) {
      applyValueToElement(el, binding);
    });
  };

  var getValueFromElement = function(el, binding) {
    var val = integrationForBinding(el, binding).getValue(el, binding),
    fn = typeCasterForBinding(binding.dataType);
    val = fn(val);
    if(Array.isArray(val) && binding.eachType) {
      var eachFn = typeCasterForBinding(binding.eachType);
      val = val.map(eachFn);
    }
    return val;
  };

  var initCallbacks = function(binding) {

    if(binding.toModel) {
      binding.toModel = function(e) {
        var el = e.delegateTarget;
        var value = getValueFromElement(el, binding);
        applyValueToModel(value, binding);
      };

      if(binding.debounce) binding.toModel = pie.fn.debounce(binding.toModel, binding.debounce);

      initViewCallback.call(this, binding);
    }

    if(binding.toView) {
      binding.toView = function() {
        applyValueToElements.call(this, binding);
      }.bind(this);

      initModelCallback.call(this, binding);
    }

    return binding;
  };

  var initModelCallback = function(binding) {
    this.onChange(binding.model, binding.toView, binding.attr);
  };

  var initViewCallback = function(binding) {
    var events = binding.trigger.split(' ');
    events.forEach(function(event){
      this.on(event, binding.triggerSel, binding.toModel);
    }.bind(this));
  };


  return {

    init: function() {
      this._bindings = [];
      if(this._super) this._super.apply(this, arguments);
      if(this.emitter) {
        this.emitter.on('afterRender', this.initBoundFields.bind(this));
      }
    },

    bind: function() {
      var wanted = pie.array.from(arguments);
      wanted = wanted.map(normalizeBindingOptions.bind(this));
      wanted = wanted.map(initCallbacks.bind(this));
      this._bindings = this._bindings.concat(wanted);
    },

    initBoundFields: function() {
      this._bindings.forEach(function(b){
        b.toView();
      });
    }
  };

})();
pie.mixins.changeSet = {

  has: function(name) {
    return pie.array.areAny(this, function(change) {
      return change.name === name;
    });
  },

  get: function(name) {
    return pie.array.detectLast(this, function(change) {
      return change.name === name;
    });
  },

  hasAny: function() {
    var known = this.names(),
    wanted = pie.array.from(arguments);

    return pie.array.areAny(wanted, function(name) {
      return !!~known.indexOf(name);
    });
  },

  hasAll: function() {
    var known = this.names(),
    wanted = pie.array.from(arguments);
    return pie.array.areAll(wanted, function(name) {
      return !!~known.indexOf(name);
    });
  },

  last: function() {
    return pie.array.last(this);
  },

  names: function() {
    return pie.array.unique(pie.array.map(this, 'name'));
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

    if('addedToParent' in child) child.addedToParent.call(child);

    return this;
  },

  addChildren: function(obj) {
    pie.object.forEach(obj, function(name, child) {
      this.addChild(name, child);
    }.bind(this));
  },

  getChild: function(obj) {
    /* jslint eqeq:true */
    if(obj == null) return;
    if(obj._nameWithinParent) return obj;

    var idx = this.childNames[obj];
    if(idx == null) idx = obj;

    return ~idx && this.children[idx] || undefined;
  },

  bubble: function() {
    var args = pie.array.from(arguments),
    fname = args.shift(),
    obj = this.parent;

    while(obj && !(fname in obj)) {
      obj = obj.parent;
    }

    if(obj) obj[fname].apply(obj, args);
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

      if('removedFromParent' in child) child.removedFromParent.call(child, this);
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

  __tree: function(indent) {
    indent = indent || 0;
    var pad = function(s, i){
      if(!i) return s;
      while(i-- > 0) s = " " + s;
      return s;
    };
    var str = "\n", nextIndent = indent + (indent ? 4 : 1);
    str += pad((indent ? '|- ' : '') + this.className + ' (' + (this._nameWithinParent || this.pieId) + ')', indent);

    this.children.forEach(function(child) {
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

    if(!this.data.validationErrors) this.data.validationErrors = {};
  },

  // default to a model implementation
  reportValidationError: function(key, errors) {
    this.set('validationErrors.' + key, errors || []);
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

      this.observe(this.validationChangeObserver.bind(this), k);

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


  validationChangeObserver: function(changes) {
    var change = changes[0];
    if(this.validationStrategy === 'validate') {
      this.validate(change.name);
    } else if(this.validationStrategy === 'dirty') {
      // for speed.
      if(this.data.validationErrors[change.name] && this.data.validationErrors[change.name].length) {
        this.reportValidationError(change.name, false);
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
    messages = [],

    // The callback invoked after each individual validation is run.
    // It updates our validity boolean
    counterObserver = function(validation, bool) {
      valid = !!(valid && bool);
      if(!bool) messages.push(validators.errorMessage(validation.type, validation.options));
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
};
pie.base.prototype.init = function(){};

pie.base.prototype.reopen = function() {
  var extensions = pie.array.change(arguments, 'from', 'flatten');
  extensions.forEach(function(e) {
    pie.object.merge(this, pie.object.except(e, 'init'));
    if(e.init) e.init.call(this);
  }.bind(this));
  return this;
};


pie.base.extend = function() {
  return pie.base._extend(pie.base.prototype, arguments);
};

pie.base.reopen = function() {
  return pie.base._reopen(pie.base.prototype, arguments);
};

pie.base._extend = function(parentProto, extensions) {
  extensions = pie.array.change(extensions, 'from', 'flatten', 'compact');

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
    "return function " + name + "(){\n" +
    "  var myProto = Object.getPrototypeOf(this);\n" +
    "  var parentProto = Object.getPrototypeOf(myProto);\n" +
    "  parentProto.constructor.apply(this, arguments);\n" +
    "};"
  )();

  child.prototype = Object.create(parentProto);
  child.prototype.className = name;

  child.extend = function() {
    return pie.base._extend(child.prototype, arguments);
  };

  child.reopen = function() {
    return pie.base._reopen(child.prototype, arguments);
  };

  if(extensions.length) child.reopen(extensions);

  return child;
};

pie.base._reopen = function(proto, extensions) {
  extensions = pie.array.change(extensions, 'from', 'flatten', 'compact');
  extensions.forEach(function(ext) {
    pie.object.forEach(ext, function(k,v) {
      proto[k] = pie.base._wrap(v, proto[k]);
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

// operator of the site. contains a router, navigator, etc with the intention of holding page context.
pie.app = pie.base.extend('app', {
  init: function(options) {

    // general app options
    this.options = pie.object.deepMerge({
      uiTarget: 'body',
      viewNamespace: 'lib.views',
      templateSelector: 'script[type="text/pie-template"]',
      root: '/'
    }, options);

    var classOption = function(key, _default){
      var k = this.options[key] || _default;
      return new k(this);
    }.bind(this);

    // app.emitter is an interface for subscribing and observing app events
    this.emitter = classOption('emitter', pie.emitter);

    // app.i18n is the translation functionality
    this.i18n = classOption('i18n', pie.i18n);

    // app.ajax is ajax interface + app specific functionality.
    this.ajax = classOption('ajax', pie.ajax);

    // app.notifier is the object responsible for showing page-level notifications, alerts, etc.
    this.notifier = classOption('notifier', pie.notifier);

    // app.errorHandler is the object responsible for
    this.errorHandler = classOption('errorHandler', pie.errorHandler);

    // app.router is used to determine which view should be rendered based on the url
    this.router = classOption('router', pie.router);

    // app.resources is used for managing the loading of external resources.
    this.resources = classOption('resources', pie.resources);

    // template helper methods, they are evaluated to the local variable "h" in templates.
    this.helpers = classOption('helpers', pie.helpers);

    // app.templates is used to manage application templates.
    this.templates = classOption('templates', pie.templates);

    // the only navigator which should exist in this app.
    this.navigator = classOption('navigator', pie.navigator);

    // the validator which should be used in the context of the app
    this.validator = classOption('validator', pie.validator);

    this.viewTransitionClass = this.options.viewTransitionClass || pie.simpleViewTransition;

    // after a navigation change, app.parsedUrl is the new parsed route
    this.parsedUrl = {};

    // we observe the navigator and handle changing the context of the page
    this.navigator.observe(this.navigationChanged.bind(this), 'url');

    this.emitter.once('beforeStart', this.setupSinglePageLinks.bind(this));
    this.emitter.once('afterStart', this.showStoredNotifications.bind(this));

    // once the dom is loaded
    document.addEventListener('DOMContentLoaded', this.start.bind(this));

    // set a global instance which can be used as a backup within the pie library.
    pie.appInstance = pie.appInstance || this;
    pie.apps[this.pieId] = this;
  },

  // just in case the client wants to override the standard confirmation dialog.
  // eventually this could create a confirmation view and provide options to it.
  // the view could have more options but would always end up invoking onConfirm or onDeny.
  confirm: function(options) {
    if(window.confirm(options.text)) {
      if(options.onConfirm) options.onConfirm();
    } else {
      if(options.onDeny) options.onDeny();
    }
  },

  // print stuff if we're not in prod.
  debug: function(msg) {
    if(this.env === 'production') return;
    if(console && console.log) console.log('[PIE] ' + msg);
  },
  // use this to navigate. This allows us to apply app-specific navigation logic
  // without altering the underling navigator.
  // This can be called with just a path, a path with a query object, or with notification arguments.
  // app.go('/test-url')
  // app.go('/test-url', true) // replaces state rather than adding
  // app.go(['/test-url', {foo: 'bar'}]) // navigates to /test-url?foo=bar
  // app.go('/test-url', true, 'Thanks for your interest') // replaces state with /test-url and shows the provided notification
  // app.go('/test-url', 'Thanks for your interest') // navigates to /test-url and shows the provided notification
  go: function(){
    var args = pie.array.from(arguments), path, notificationArgs, replaceState, query;

    path = args.shift();


    // arguments => '/test-url', {query: 'object'}
    if(typeof args[0] === 'object') {
      path = this.router.path(path, args.shift());

    // arguments => '/test-url'
    // arguments => ['/test-url', {query: 'object'}]
    } else {
      path = this.router.path.apply(this.router, pie.array.from(path));
    }

    // if the next argument is a boolean, we care about replaceState
    if(pie.object.isBoolean(args[0])) {
      replaceState = args.shift();
    }

    // anything left is considered arguments for the notifier.
    notificationArgs = args;

    if(this.router.parseUrl(path).hasOwnProperty('view')) {
      this.navigator.go(path, replaceState);
      if(notificationArgs && notificationArgs.length) {
        this.emitter.once('viewChanged')
        this.notifier.notify.apply(this.notifier, notificationArgs);
      }
    } else {

      if(notificationArgs && notificationArgs.length) {
        this.store(this.notifier.storageKey, notificationArgs);
      }

      window.location.href = path;
    }
  },

  // go back one page.
  goBack: function() {
    window.history.back();
  },

  // callback for when a link is clicked in our app
  handleSinglePageLinkClick: function(e){
    // if the link is targeting something else, let the browser take over
    if(e.delegateTarget.getAttribute('target')) return;

    // if the user is trying to do something beyond navigate, let the browser take over
    if(e.ctrlKey || e.metaKey) return;


    var href = e.delegateTarget.getAttribute('href');
    // if we're going nowhere, somewhere else, or to an anchor on the page, let the browser take over
    if(!href || /^(#|[a-z]+:\/\/)/.test(href)) return;

    // ensure that relative links are evaluated as relative
    if(href.charAt(0) === '?') href = window.location.pathname + href;

    // great, we can handle it. let the app decide whether to use pushstate or not
    e.preventDefault();
    this.go(href);
  },

  // when we change urls
  // we always remove the current before instantiating the next. this ensures are views can prepare
  // context's in removedFromParent before the constructor of the next view is invoked.
  navigationChanged: function() {
    var current  = this.getChild('currentView'),
        transition;

    // let the router determine our new url
    this.previousUrl = this.parsedUrl;
    this.parsedUrl = this.router.parseUrl(this.navigator.get('fullPath'));

    if(this.previousUrl !== this.parsedUrl) {
      this.emitter.fire('urlChanged');
    }

    // Not necessary for a view to exist on each page.
    // Maybe the entry point is server generated.
    if(!this.parsedUrl.view) {

      if(!this.parsedUrl.redirect) return;

      var redirectTo = this.parsedUrl.redirect;
      redirectTo = app.router.path(redirectTo, this.parsedUrl.data);

      this.go(redirectTo);
      return;
    }

    // if the view that's in there is already loaded, don't remove / add again.
    if(current && current._pieName === this.parsedUrl.view) {
      if('navigationUpdated' in current) current.navigationUpdated();
      return;
    }

    this.transitionToNewView();

  },

  transitionToNewView: function() {
    var target = document.querySelector(this.options.uiTarget),
        current = this.getChild('currentView'),
        viewClass, child, transition;

    this.emitter.fire('beforeViewChanged');
    this.emitter.fireAround('aroundViewChanged', function() {

      this.emitter.fire('viewChanged');

      // use the view key of the parsedUrl to find the viewClass
      var viewClass = pie.object.getPath(window, this.options.viewNamespace + '.' + this.parsedUrl.view), child;
      // the instance to be added.
      child = new viewClass({ app: this });
      child._pieName = this.parsedUrl.view;

      transition = new this.viewTransitionClass(this, pie.object.merge({
        oldChild: current,
        newChild: child,
        childName: 'currentView',
        targetEl: target
      }, this.options.viewTransitionOptions));


      transition.emitter.on('afterRemoveOldChild', function() {
        this.emitter.fire('oldViewRemoved', current);
      }.bind(this));

      transition.emitter.on('afterTransition', function() {
        this.emitter.fire('newViewLoaded', child);
      }.bind(this));

      // add the instance as our 'currentView'
      transition.transition(function(){
        this.emitter.fire('afterViewChanged');
      }.bind(this));

    }.bind(this));
  },

  // reload the page without reloading the browser.
  // alters the current view's _pieName to appear as invalid for the route.
  refresh: function() {
    var current = this.getChild('currentView');
    current._pieName = '__remove__';
    this.navigationChanged();
  },

  // safely access localStorage, passing along any errors for reporting.
  retrieve: function(key, clear) {
    var encoded, decoded;

    try{
      encoded = window.localStorage.getItem(key);
      decoded = encoded ? JSON.parse(encoded) : undefined;
    }catch(err){
      this.errorHandler.reportError(err, {prefix: "[caught] app#retrieve/getItem:"});
    }

    try{
      if(clear || clear === undefined){
        window.localStorage.removeItem(key);
      }
    }catch(err){
      this.errorHandler.reportError(err, {prefix: "[caught] app#retrieve/removeItem:"});
    }

    return decoded;
  },

  // when a link is clicked, go there without a refresh if we recognize the route.
  setupSinglePageLinks: function() {
    pie.dom.on(document.body, 'click', this.handleSinglePageLinkClick.bind(this), 'a[href]');
  },

  // show any notification which have been preserved via local storage.
  showStoredNotifications: function() {
    var encoded = this.retrieve(this.notifier.storageKey), decoded;

    if(encoded) {
      decoded = JSON.parse(encoded);
      this.notifier.notify.apply(this.notifier, decoded);
    }
  },

  // start the app, apply fake navigation to the current url to get our navigation observation underway.
  start: function() {
    this.emitter.fireSequence('start', this.navigator.start.bind(this.navigator));
  },

  // safely access localStorage, passing along any errors for reporting.
  store: function(key, data) {
    try{
      window.localStorage.setItem(key, JSON.stringify(data));
    }catch(err){
      this.errorHandler.reportError(err, {prefix: "[caught] app#store:"});
    }
  }
}, pie.mixins.container, pie.mixins.events);

//    **Setters and Getters**
//    pie.model provides a basic interface for object management and observation.
//
//    *example:*
//
//    ```
//    var user = new pie.model();
//    user.set('first_name', 'Doug');
//    user.get('first_name') //=> 'Doug'
//    user.sets({
//      first_name: 'Douglas',
//      last_name: 'Wilson'
//    });
//    user.get('last_name') //= 'Wilson'
//
//    user.set('location.city', 'Miami')
//    user.get('location.city') //=> 'Miami'
//    user.get('location') //=> {city: 'Miami'}
//    ```
//    ** Observers **
//    Observers can be added by invoking the model's observe() method.
//    pie.model.observe() optionally accepts 2+ arguments which are used as filters for the observer.
//
//    *example:*
//
//    ```
//    var o = function(changes){ console.log(changes); };
//    var user = new pie.model();
//    user.observe(o, 'first_name');
//    user.sets({first_name: 'first', last_name: 'last'});
//    // => o is called and the following is logged:
//    [{
//      name: 'first_name',
//      type: 'new',
//      oldValue:
//      undefined,
//      value: 'first',
//      object: {...}
//    }]
//    ```
//
//    **Computed Properties**
//
//    pie.models can observe themselves and compute properties. The computed properties can be observed
//    just like any other property.
//
//    *example:*
//
//    ```
//    var fullName = function(){ return this.get('first_name') + ' ' + this.get('last_name'); };
//    var user = new pie.model({first_name: 'Doug', last_name: 'Wilson'});
//    user.compute('full_name', fullName, 'first_name', 'last_name');
//    user.get('full_name') //=> 'Doug Wilson'
//    user.observe(function(changes){ console.log(changes); }, 'full_name');
//    user.set('first_name', 'Douglas');
//    # => the observer is invoked and console.log provides:
//    [{
//      name: 'full_name',
//      oldValue: 'Doug Wilson',
//      value: 'Douglas Wilson',
//      type: 'update',
//      object: {...}
//    }]
//    ```


pie.model = pie.base.extend('model', {

  init: function(d, options) {
    this.data = pie.object.merge({_version: 1}, d);
    this.options = options || {};
    this.app = this.app || this.options.app || pie.appInstance;
    this.observations = {};
    this.changeRecords = [];
    pie.setUid(this);
  },


  trackVersion: function() {
    if(this.options.trackVersion !== false && this.changeRecords.length) {
      this.set('_version', this.get('_version') + 1, {skipObservers: true});
    }
  },


  // After updates have been made we deliver our change records to our observers.
  deliverChangeRecords: function() {
    if(!this.changeRecords.length) return this;

    var observers = {}, os, o, change, changeSet;

    this.trackVersion();

    // grab each change record
    while(change = this.changeRecords.shift()) {

      // grab all the observers for the attribute specified by change.name
      os = pie.array.union(this.observations[change.name], this.observations.__all__);

      // then for each observer, build or concatenate to the array of changes.
      while(o = os.shift()) {

        if(!observers[o.pieId]) {
          changeSet = [];
          pie.object.merge(changeSet, pie.mixins.changeSet);
          observers[o.pieId] = {fn: o, changes: changeSet};
        }

        observers[o.pieId].changes.push(change);
      }
    }

    // Iterate each observer, calling it with the changes which it was subscribed for.
    pie.object.forEach(observers, function(uid, obj) {
      obj.fn.call(null, obj.changes);
    });

    return this;
  },

  // Access the value stored at data[key]
  // Key can be multiple levels deep by providing a dot separated key.
  get: function(key) {
    return pie.object.getPath(this.data, key);
  },

  getOrSet: function(key, defaultValue) {
    var val = this.get(key);
    if(val != null) return val;

    this.set(key, defaultValue);
    return this.get(key);
  },

  // Retrieve multiple values at once.
  gets: function() {
    var args = pie.array.from(arguments), o = {};
    args = pie.array.flatten(args);
    args = pie.array.compact(args);

    args.forEach(function(arg){
      o[arg] = pie.object.getPath(this.data, arg);
    }.bind(this));

    return pie.object.compact(o);
  },

  has: function(path) {
    return !!pie.object.hasPath(this.data, path);
  },

  // Register an observer and optionally filter by key.
  observe: function(/* fn[, key1, key2, key3] */) {
    var keys = pie.array.from(arguments),
    fn = keys.shift();

    // uid is needed later for ensuring unique change record delivery.
    pie.setUid(fn);

    keys = pie.array.flatten(keys);

    if(!keys.length) keys.push('__all__');

    keys.forEach(function(k) {
      this.observations[k] = this.observations[k] || [];
      if(this.observations[k].indexOf(fn) < 0) this.observations[k].push(fn);
    }.bind(this));

    return this;
  },

  reset: function(options) {
    var keys = Object.keys(this.data), o = {};

    keys.forEach(function(k){
      if(k === '_version') return;
      o[k] = undefined;
    });

    return this.sets(o, options);
  },

  // Set a value and trigger observers.
  // Optionally provide false as the third argument to skip observation.
  // Note: skipping observation does not stop changeRecords from accruing.
  set: function(key, value, options) {
    var steps = ~key.indexOf('.') ? pie.string.pathSteps(key) : null,
    o, oldKeys, type, change;

    change = { name: key, object: this.data };

    if(this.has(key)) {
      change.type = 'update';
      change.oldValue = pie.object.getPath(this.data, key);

      // if we haven't actually changed, don't bother.
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

    if(value === undefined) {
      pie.object.deletePath(this.data, key, true);
      change.type = 'delete';
    } else {
      pie.object.setPath(this.data, key, value);
      change.type = change.type || 'add';
    }

    this.changeRecords.push(change);

    if(steps) {
      steps.forEach(function(step) {
        oldKeys = step[1];
        step = step[0];

        o = this.get(step);

        if(change.type === 'delete') {
          type = o ? 'update' : 'delete';
        } else if(!oldKeys) {
          type = 'add';
        } else {
          type = 'update';
        }

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
    return this.deliverChangeRecords();
  },

  // Set a bunch of stuff at once.
  sets: function(obj, options) {
    pie.object.forEach(obj, function(k,v) {
      this.set(k, v, {skipObservers: true});
    }.bind(this));

    if(options && options.skipObservers) return this;
    return this.deliverChangeRecords();
  },


  // Unregister an observer. Optionally for specific keys.
  unobserve: function(/* fn[, key1, key2, key3] */) {
    var keys = pie.array.from(arguments),
    fn = keys.shift(),
    i;

    if(!keys.length) keys = Object.keys(this.observations);

    keys.forEach(function(k){
      i = this.observations[k].indexOf(fn);
      if(~i) this.observations[k].splice(i,1);
    }.bind(this));

    return this;
  },

  // Register a computed property which is accessible via `name` and defined by `fn`.
  // Provide all properties which invalidate the definition.
  // if the definition of the property is defined by a function of the same name, the function can be ommitted.
  // this.compute('fullName', 'first_name', 'last_name');
  compute: function(/* name, fn?[, prop1, prop2 ] */) {
    var props = pie.array.from(arguments),
    name = props.shift(),
    fn = props.shift();

    if(!pie.object.isFunction(fn)) {
      props.unshift(fn);
      fn = this[name].bind(this);
    }

    this.observe(function(/* changes */){
      this.set(name, fn.call(this));
    }.bind(this), props);

    // initialize it
    this.set(name, fn.call(this));
  }
});
// pie.view manages events delegation, provides some convenience methods, and some <form> standards.
pie.view = pie.base.extend('view', {

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

    if(this.options.setup) this.setup();
  },

  addedToParent: function() {
    this.emitter.fire('addedToParent');
  },

  appendToDom: function(target) {
    target = target || this.options.uiTarget;
    if(target !== this.el.parentNode) {
      this.emitter.fireSequence('attach', function(){
        target.appendChild(this.el);
      }.bind(this));
    }
  },

  consumeEvent: function(e, immediate) {
    if(e) {
      e.preventDefault();
      e.stopPropagation();
      if(immediate) e.stopImmediatePropagation();
    }
  },

  // all events observed using view.on() will use the unique namespace for this instance.
  eventNamespace: function() {
    return 'view'+ this.pieId;
  },


  navigationUpdated: function() {
    this.children.forEach(function(c){
      if('navigationUpdated' in c) c.navigationUpdated();
    });
  },


  // Events should be observed via this .on() method. Using .on() ensures the events will be
  // unobserved when the view is removed.
  on: function(e, sel, f, el) {
    el = el || this.el;
    if(!~this.eventedEls.indexOf(el)) this.eventedEls.push(el);

    var ns = this.eventNamespace(),
        f2 = function(e){
          if(e.namespace === ns) {
            return f.apply(this, arguments);
          }
        };

    e.split(' ').forEach(function(ev) {
      ev += "." + ns;
      pie.dom.on(el, ev, f2, sel);
    }.bind(this));

    return this;
  },

  // Observe changes to an observable, unobserving them when the view is removed.
  // If the object is not observable, an error will be thrown.
  onChange: function() {
    var observable = arguments[0], args = pie.array.from(arguments).slice(1);
    if(!('observe' in observable)) throw new Error("Observable does not respond to observe");

    this.changeCallbacks.push([observable, args]);
    observable.observe.apply(observable, args);
  },


  // shortcut for this.el.querySelector
  qs: function(selector) {
    return this.el.querySelector(selector);
  },


  // shortcut for this.el.querySelectorAll
  qsa: function(selector) {
    return this.el.querySelectorAll(selector);
  },

  removeFromDom: function() {
    if(this.el.parentNode) {
      this.emitter.fireSequence('detach', function() {
        this.el.parentNode.removeChild(this.el);
      }.bind(this));
    }
  },

  removedFromParent: function() {
    this.emitter.fire('removedFromParent');
  },

  // placeholder for default functionality
  setup: function(){
    this.emitter.fireSequence('setup');
    return this;
  },

  teardown: function() {

    this.emitter.fireSequence('teardown', function() {

      this.removeFromDom();

      this._unobserveEvents();
      this._unobserveChangeCallbacks();

      this.teardownChildren();
      // views remove their children upon removal to ensure all irrelevant observations are cleaned up.
      this.removeChildren();

    }.bind(this));

    return this;
  },

  teardownChildren: function() {
    this.children.forEach(function(child) {
      child.teardown();
    });
  },

  // release all observed events.
  _unobserveEvents: function() {
    var key = '*.' + this.eventNamespace();
    this.eventedEls.forEach(function(el) {
      pie.dom.off(el, key);
    });
  },


  // release all change callbacks.
  _unobserveChangeCallbacks: function() {
    var a;
    while(this.changeCallbacks.length) {
      a = this.changeCallbacks.pop();
      a[0].unobserve.apply(a[0], a[1]);
    }
  }

}, pie.mixins.container);
// a view class which handles some basic functionality
pie.activeView = pie.view.extend('activeView', {

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
      var content = this.app.templates.render(templateName, this.renderData());
      this.el.innerHTML = content;
    }
  },

  // If the first option passed is a node, it will use that as the query scope.
  // Return an object representing the values of fields within this.el.
  parseFields: function() {
    var o = {}, e = arguments[0], i = 0, n, el;

    if(pie.object.isString(e)) {
      e = this.el;
    } else {
      i++;
    }

    for(;i<arguments.length;i++) {
      n = arguments[i];
      el = e.querySelector('[name="' + n + '"]:not([disabled])');
      if(el) pie.object.setPath(o, n, el.value);
    }
    return o;
  },

  renderData: function() {
    if(this.model) {
      return this.model.data;
    }

    return {};
  },

  render: function() {
    this.emitter.fireSequence('render');
  },

  templateName: function() {
    return this.options.template;
  }

});
pie.ajax = pie.base.extend('ajax', {

  init: function(app){
    this.app = app;
    this.defaultAjaxOptions = {};
  },

  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',

  // default ajax options. override this method to
  _defaultAjaxOptions: function() {
    return pie.object.merge({}, this.defaultAjaxOptions, {
      accept: 'application/json',
      verb: this.GET,
      error: this.app.errorHandler.handleXhrError.bind(this.app.errorHandler)
    });
  },


  // interface for conducting ajax requests.
  // app.ajax.post({
  //  url: '/login',
  //  data: { email: 'xxx', password: 'yyy' },
  //  progress: this.progressCallback.bind(this),
  //  success: this.
  // })
  ajax: function(options) {

    options = pie.object.compact(options);
    options = pie.object.merge({}, this._defaultAjaxOptions(), options);
    options.verb = options.verb.toUpperCase();

    if(options.extraError) {
      var oldError = options.error;
      options.error = function(xhr){ oldError(xhr); options.extraError(xhr); };
    }

    var xhr = new XMLHttpRequest(),
    url = options.url,
    that = this,
    d;

    if(options.verb === this.GET && options.data) {
      url = pie.string.urlConcat(url, pie.object.serialize(options.data));
    }

    url = pie.string.normalizeUrl(url);


    if(options.progress) {
      xhr.addEventListener('progress', options.progress, false);
    } else if(options.uploadProgress) {
      xhr.upload.addEventListener('progress', options.uploadProgress, false);
    }

    xhr.open(options.verb, url, true);

    this._applyHeaders(xhr, options);
    if(options.setup) options.setup(xhr, options);

    xhr.onload = function() {
      if(options.tracker) options.tracker(this);

      that._parseResponse(this, options);

      if(this.status >= 200 && this.status < 300 || this.status === 304) {
        if(options.dataSuccess) options.dataSuccess(this.data);
        if(options.success) options.success(this.data, this);
      } else if(options.error){
        options.error(this);
      }

      if(options.complete) options.complete(this);
    };

    if(options.verb !== this.GET) {
      d = options.data ? (pie.object.isString(options.data) ? options.data : JSON.stringify(pie.object.compact(options.data))) : undefined;
    }

    xhr.send(d);
    return xhr;
  },

  get: function(options) {
    options = pie.object.merge({verb: this.GET}, options);
    return this.ajax(options);
  },

  post: function(options) {
    options = pie.object.merge({verb: this.POST}, options);
    return this.ajax(options);
  },

  put: function(options) {
    options = pie.object.merge({verb: this.PUT}, options);
    return this.ajax(options);
  },

  del: function(options) {
    options = pie.object.merge({verb: this.DELETE}, options);
    return this.ajax(options);
  },

  _applyCsrfToken: function(xhr, options) {
    var token = pie.fn.valueFrom(options.csrfToken),
    tokenEl;

    if(!token) {
      tokenEl = document.querySelector('meta[name="csrf-token"]'),
      token = tokenEl ? tokenEl.getAttribute('content') : null;
    }

    if(token) {
      xhr.setRequestHeader('X-CSRF-Token', token);
    }
  },

  _applyHeaders: function(xhr, options) {

    this._applyCsrfToken(xhr, options);

    if(options.accept) xhr.setRequestHeader('Accept', options.accept);

    if(options.contentType) {
      xhr.setRequestHeader('Content-Type', options.contentType);
    } else if(pie.object.isString(options.data)) {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    // if we aren't already sending a string, we will encode to json.
    } else {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }
  },

  _parseResponse: function(xhr, options) {
    var parser = options.accept && this.responseParsers[options.accept] || this.responseParsers.default;
    xhr.data = parser(xhr, options);
  },

  responseParsers: {

    "application/json" : function(xhr, options) {
      try{
        return xhr.responseText.trim().length ? JSON.parse(xhr.responseText) : {};
      } catch(err) {
        this.app.debug("could not parse JSON response: " + err);
        return {};
      }
    },

    "default" : function(xhr, options) {
      return xhr.responseText;
    }
  }
});
pie.cache = pie.model.extend('cache', {

  init: function(data, options) {
    this._super(data, options);
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
pie.emitter = pie.model.extend('emitter', {

  init: function() {
    this._super({
      triggeredEvents: [],
      eventCallbacks: {}
    });
  },

  debug: function(bool) {
    this.isDebugging = bool || bool === undefined;
  },


  hasEvent: function(event) {
    return !!~this.get('triggeredEvents').indexOf(event);
  },


  // Event Observation

  _on: function(event, fn, options, meth) {
    options = options || {},

    this.getOrSet('eventCallbacks.' + event, [])[meth](pie.object.merge({fn: fn}, options));
  },


  _once: function(event, fn, options, meth) {
    options = options || {};

    if(options.immediate && this.hasEvent(event)) {
      fn();
      return;
    }

    this._on(event, fn, {onceOnly: true}, meth);
  },

  // invoke fn when the event is triggered.
  // options:
  //  - onceOnly: if the callback should be called a single time then removed.
  on: function(event, fn, options) {
    this._on(event, fn, options, 'push');
  },

  prepend: function(event, fn, options) {
    this._on(event, fn, options, 'unshift');
  },

  once: function(event, fn, options) {
    this._once(event, fn, options, 'push');
  },

  prependOnce: function(event, fn, options) {
    this._once(event, fn, options, 'unshift');
  },

  // Event Triggering

  // trigger an event (string) on the app.
  // any callbacks associated with that event will be invoked with the extra arguments
  fire: function(/* event, arg1, arg2, */) {
    var args = pie.array.from(arguments),
    event = args.shift(),
    callbacks = this.get('eventCallbacks.' + event),
    compactNeeded = false;

    if(this.isDebugging) this.app.debug(event);

    if(callbacks) {
      callbacks.forEach(function(cb, i) {
        cb.fn.apply(null, args);
        if(cb.onceOnly) {
          compactNeeded = true;
          cb[i] = undefined;
        }
      });
    }

    if(compactNeeded) this.set('eventCallbacks.' + event, pie.array.compact(this.get('eventCallbacks.' + event)));
    if(!this.hasEvent(event)) this.get('triggeredEvents').push(event);
  },

  fireSequence: function(event, fn) {
    var before = pie.string.modularize("before_" + event),
    after = pie.string.modularize("after_" + event),
    around = pie.string.modularize('around_' + event);

    this.fire(before);
    this.fireAround(around, function() {
      if(fn) fn();
      this.fire(event);
      this.fire(after);
    }.bind(this));
  },

  fireAround: function(event, onComplete) {
    var callbacks = this.get('eventCallbacks.' + event) || [],
    compactNeeded = false,
    fns;

    fns = callbacks.map(function(cb, i) {
      if(cb.onceOnly) {
        compactNeeded = true;
        cb[i] = undefined;
      }
      return cb.fn;
    });

    if(compactNeeded) this.set('eventCallbacks.' + event, pie.array.compact(this.get('eventCallbacks.' + event)));
    if(!this.hasEvent(event)) this.get('triggeredEvents').push(event);

    pie.fn.async(fns, onComplete);
  }

});
pie.errorHandler = pie.model.extend('errorHandler', {

  init: function(app) {
    this._super({
      responseCodeHandlers: {}
    }, {
      app: app
    });
  },


  // extract the "data" object out of an xhr
  xhrData: function(xhr) {
    return xhr.data = xhr.data || (xhr.status ? JSON.parse(xhr.response) : {});
  },


  // extract an error message from a response. Try to extract the error message from
  // the xhr data diretly, or allow overriding by response code.
  errorMessagesFromRequest: function(xhr) {
    var d = this.xhrData(xhr),
    errors  = pie.array.map(d.errors || [], 'message'),
    clean;

    errors = pie.array.compact(errors, true);
    clean   = this.app.i18n.t('app.errors.' + xhr.status, {default: errors});

    this.app.debug(errors);

    return pie.array.from(clean);
  },

  getResponseCodeHandler: function(status) {
    return this.get('responseCodeHandlers.' + status);
  },

  // find a handler for the xhr via response code or the app default.
  handleXhrError: function(xhr) {

    var handler = this.getResponseCodeHandler(xhr.status.toString());

    if(handler) {
      handler.call(xhr, xhr);
    } else {
      this.notifyErrors(xhr);
    }

  },

  // build errors and send them to the notifier.
  notifyErrors: function(xhr){
    var n = this.app.notifier, errors = this.errorMessagesFromRequest(xhr);

    if(errors.length) {
      // clear all previous errors when an error occurs.
      n.clear('error');

      // delay so UI will visibly change when the same content is shown.
      setTimeout(function(){
        n.notify(errors, 'error', 10000);
      }, 100);
    }
  },


  // register a response code handler
  // registerHandler('401', myRedirectCallback);
  registerHandler: function(responseCode, handler) {
    this.set('responseCodeHandlers.' + responseCode.toString(), handler);
  },


  // provide an interface for sending errors to a bug reporting service.
  reportError: function(err, options) {
    options = options || {};

    if(options.prefix && 'message' in err) {
      err.message = options.prefix + ' ' + err.message;
    }

    if(options.prefix && 'name' in err) {
      err.name = options.prefix + ' ' + err.name;
    }

    this._reportError(err, options);
  },


  // hook in your own error reporting service. bugsnag, airbrake, etc.
  _reportError: function(err) {
    this.app.debug(err);
  }
});
pie.formView = pie.activeView.extend('formView', {

  init: function(options) {
    options = this.normalizeFormOptions(options);
    this._super(options);

    this.model = this.model || new pie.model({});
    if(!this.model.validates) this.model.reopen(pie.mixins.validatable);
  },

  setup: function() {
    this.emitter.once('setup', this.setupFormBindings.bind(this));
    this._super();
  },

  // the process of applying form data to the model.
  applyFieldsToModel: function(form) {
    var data = this.formData(form);
    this.model.sets(data);
  },

  // the data coming from the UI that should be applied to the model before validation
  formData: function(form) {
    var args = pie.array.map(this.options.fields, 'name');

    args.push(form);

    return this.parseFields.apply(this, args);
  },

  handleErrors: function() {},

  normalizeFormOptions: function(options) {
    options = options || {};
    options.fields = options.fields || [];
    options.fields.forEach(function(field) {
      field = pie.object.isString(field) ? {name: field} : field || {};
      if(!field.name) throw new Error("A `name` property must be provided for all fields.");
      field.binding = field.binding || {};
      field.binding.attr = field.binding.attr || field.name;
    });
    return options;
  },

  setupFormBindings: function() {
    var validation;
    this.on('submit', this.options.formSel || 'form', this.validateAndSubmitForm.bind(this));
    this.options.fields.forEach(function(field) {
      this.bind(field.binding);
      validation = field.validation;
      if(validation) {
        validation = {};
        validation[field.name] = field.validation;
        this.model.validates(validation);
      }
    }.bind(this));
  },

  // the data to be sent from the server.
  // by default these are the defined fields extracted out of the model.
  submissionData: function(form) {
    var fieldNames = pie.array.map(this.options.fields, 'name');
    return this.model.gets(fieldNames);
  },

  submitForm: function(form) {
    var data = this.submissionData(form);

    app.ajax.ajax(pie.object.merge({
      url: form.getAttribute('action'),
      verb: form.getAttribute('method') || 'post',
      data: data,
    }, this.options.ajax));
  },

  validateAndSubmitForm: function(e) {
    e.preventDefault();

    this.applyFieldsToModel(e.delegateTarget);

    this.model.validateAll(function(bool) {
      if(bool) {
        this.submitForm(e.delegateTarget);
      } else {
        this.handleErrors();
      }
    }.bind(this), this.options.validateImmediately);
  }

}, pie.mixins.bindings);
pie.helpers = pie.model.extend('helpers', {

  init: function(app) {
    this._super({}, {
      app: app
    });

    var i18n = this.app.i18n;

    this.register('t', i18n.t.bind(i18n));
    this.register('l', i18n.l.bind(i18n));
    this.register('timeago', i18n.timeago.bind(i18n));
    this.register('path', this.app.router.path.bind(this.app.router));
    this.register('get', pie.object.getPath);
  },

  register: function(name, fn) {
    if(!this[name]) this[name] = fn;
    return this.set(name, fn);
  },

  provide: function() {
    return this.data;
  }

});
// made to be used as an instance so multiple translations could exist if we so choose.
pie.i18n = pie.model.extend('i18n', {

  init: function(app) {
    this._super(pie.object.merge({}, pie.i18n.defaultTranslations), {
      app: app
    });
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
    return t.replace(/\$\{([^\}]+)\}/, function(match, path) {
      return this.translate(path, data);
    }.bind(this));
  },


  // assumes that dates either come in as dates, iso strings, or epoch timestamps
  _normalizedDate: function(d) {
    if(String(d).match(/^\d+$/)) {
      d = parseInt(d, 10);
      if(String(d).length < 13) d *= 1000;
      d = new Date(d);
    } else if(pie.object.isString(d)) {
      d = pie.date.timeFromISO(d);
    } else {
      // let the system parse
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

  attempt: function(key) {
    var m = key && key.match(this.keyCheck);
    if(!m) return key;
    return this.t(m[1], {default: key});
  },

  load: function(data, shallow) {
    var f = shallow ? pie.object.merge : pie.object.deepMerge;
    f.call(null, this.data, data);
  },


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

      if(data && data.hasOwnProperty('default')) {
        translation = pie.fn.valueFrom(data.default);
      } else {
        this.app.debug("Translation not found: " + path);
        return "";
      }
    }


    if(pie.object.isString(translation)) {
      translation = translation.indexOf('${') === -1 ? translation : this._nestedTranslate(translation, data);
      translation = translation.indexOf('%{') === -1 ? translation : pie.string.expand(translation, data);
    }

    if(changes.length) {
      changes.unshift(translation);
      translation = pie.string.change.apply(null, changes);
    }

    return translation;
  },


  timeago: function(t, now, scope) {
    t = this._normalizedDate(t).getTime()  / 1000;
    now = this._normalizedDate(now || new Date()).getTime() / 1000;

    var diff = now - t, c;

    scope = scope || 'app';

    if(diff < 60) { // less than a minute
      return this.t(scope + '.timeago.now', {count: diff});
    } else if (diff < 3600) { // less than an hour
      c = Math.floor(diff / 60);
      return this.t(scope + '.timeago.minutes', {count: c});
    } else if (diff < 86400) { // less than a day
      c = Math.floor(diff / 3600);
      return this.t(scope + '.timeago.hours', {count: c});
    } else if (diff < 86400 * 7) { // less than a week (
      c = Math.floor(diff / 86400);
      return this.t(scope + '.timeago.days', {count: c});
    } else if (diff < 86400 * 30) { // less than a month
      c = Math.floor(diff / (86400 * 7));
      return this.t(scope + '.timeago.weeks', {count: c});
    } else if (diff < 86500 * 365.25) { // less than a year
      c = Math.floor(diff / (86400 * 365.25 / 12));
      return this.t(scope + '.timeago.months', {count: c});
    } else {
      c = Math.floor(diff / (86400 * 365.25));
      return this.t(scope + '.timeago.years', {count: c});
    }
  },

  // pass in the date instance and the string 'format'
  strftime: function(date, f) {
    date = this._normalizedDate(date);

    // named format from translations.time.
    if(!~f.indexOf('%')) f = this.t('app.time.formats.' + f);

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

pie.i18n.prototype.t = pie.i18n.prototype.translate;
pie.i18n.prototype.l = pie.i18n.prototype.strftime;

pie.i18n.defaultTranslations = {
  app: {
    timeago: {
      now: "just now",
      minutes: {
        one: "%{count} minute ago",
        other: "%{count} minutes ago"
      },
      hours: {
        one: "%{count} hour ago",
        other: "%{count} hours ago"
      },
      days: {
        one: "%{count} day ago",
        other: "%{count} days ago"
      },
      weeks: {
        one: "%{count} week ago",
        other: "%{count} weeks ago"
      },
      months: {
        one: "%{count} month ago",
        other: "%{count} months ago"
      },
      years: {
        one: "%{count} year ago",
        other: "%{count} years ago"
      }
    },
    time: {
      formats: {
        isoDate: '%Y-%m-%d',
        isoTime: '%Y-%m-%dT%H:%M:%S.%L%:z',
        shortDate: '%m/%d/%Y',
        longDate: '%B %-do, %Y'
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

      ccNumber: "does not look like a credit card number",
      ccSecurity: "is not a valid security code",
      ccExpirationMonth: "is not a valid expiration month",
      ccExpirationYear: "is not a valid expiration year",
      chosen:   "must be chosen",
      date:     "is not a valid date",
      email:    "must be a valid email",
      format:   "is invalid",
      integer:  "must be an integer",
      length:   "length must be",
      number:   "must be a number",
      phone:    "is not a valid phone number",
      presence: "can't be blank",
      url:      "must be a valid url",

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
pie.list = pie.model.extend('list', {

  init: function(array, options) {
    array = array || [];
    this._super({items: array}, options);
  },


  _normalizedIndex: function(wanted) {
    wanted = parseInt(wanted, 10);
    if(!isNaN(wanted) && wanted < 0) wanted += this.data.items.length;
    return wanted;
  },


  _trackMutations: function(options, fn) {
    var oldLength = this.data.items.length,
    changes = [fn.call()],
    newLength = this.data.items.length;

    if(oldLength !== newLength) {
      changes.push({
        name: 'length',
        type: 'update',
        object: this.data.items,
        oldValue: oldLength,
        value: newLength
      });
    }

    this.changeRecords = this.changeRecords.concat(changes);

    if(options && options.skipObservers) return this;
    return this.deliverChangeRecords();
  },


  forEach: function(f) {
    return this.get('items').forEach(f);
  },


  get: function(key) {
    var idx = this._normalizedIndex(key), path;

    if(isNaN(idx)) path = key;
    else path = 'items.' + idx;

    return pie.model.prototype.get.call(this, path);
  },


  indexOf: function(value) {
    return this.get('items').indexOf(value);
  },


  insert: function(key, value, options) {
    var idx = this._normalizedIndex(key);

    return this._trackMutations(options, function(){
      var change = {
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


  length: function() {
    return this.get('items.length');
  },


  push: function(value, options) {
    return this._trackMutations(options, function(){
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


  remove: function(key, options) {
    var idx = this._normalizedIndex(key);

    return this._trackMutations(options, function(){
      var change = {
        name: String(idx),
        object: this.data.items,
        type: 'delete',
        oldValue: this.data.items[idx],
        value: undefined
      };

      this.data.items.splice(idx, 1);

      return change;
    }.bind(this));
  },


  set: function(key, value, options) {
    var idx = this._normalizedIndex(key);

    if(isNaN(idx)) {
      return pie.model.prototype.set.call(this, key, value, options);
    }

    return this._trackMutations(options, function(){
      var change = {
        name: String(idx),
        object: this.data.items,
        type: 'update',
        oldValue: this.data.items[idx]
      };

      this.data.items[idx] = change.value = value;

      return change;
    }.bind(this));
  },


  shift: function(options) {
    return this._trackMutations(options, function(){
      var change = {
        name: '0',
        object: this.data.items,
        type: 'delete'
      };

      change.oldValue = this.data.items.shift();
      change.value = this.data.items[0];

      return change;
    }.bind(this));
  },


  unshift: function(value, options) {
    return this.insert(0, value, options);
  }
});
pie.navigator = pie.model.extend('navigator', {

  init: function(app) {
    this.app = app;
    this._super({});
  },

  go: function(path, params, replace) {
    var url = path;

    params = params || {};

    if(this.get('path') === path && this.get('query') === params) {
      return this;
    }

    if(Object.keys(params).length) {
      url += '?';
      url += pie.object.serialize(params);
    }

    window.history[replace ? 'replaceState' : 'pushState']({}, document.title, url);
    window.historyObserver();
  },


  start: function() {
    if(!window.historyObserver) {
      window.historyObserver = function() {
        pie.dom.trigger(window, 'pieHistoryChange');
      };
    }

    pie.dom.on(window, 'popstate', function() {
      window.historyObserver();
    });

    pie.dom.on(window, 'pieHistoryChange.nav-' + this.pieId, this.setDataFromLocation.bind(this));

    return this.setDataFromLocation();
  },

  setDataFromLocation: function() {
    var stringQuery = window.location.search.slice(1),
    query = pie.string.deserialize(stringQuery);

    this.sets({
      url: window.location.href,
      path: window.location.pathname,
      fullPath: pie.array.compact([window.location.pathname, stringQuery], true).join('?'),
      query: query
    });
  }
});
// notifier is a class which provides an interface for rendering page-level notifications.
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

  // Show a notification or notifications.
  // Messages can be a string or an array of messages.
  // You can choose to close a notification automatically by providing `true` as the third arg.
  // You can provide a number in milliseconds as the autoClose value as well.
  notify: function(messages, type, autoRemove) {
    type = type || 'message';
    autoRemove = this.getAutoRemoveTimeout(autoRemove);

    messages = pie.array.from(messages);
    messages = messages.map(this.app.i18n.attempt.bind(this.app.i18n));

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
pie.resources = pie.model.extend('resources', {

  init: function(app, srcMap) {
    this._super({
      srcMap: srcMap || {},
      loaded: {}
    }, {
      app: app
    });
  },

  _appendNode: function(node) {
    var target = document.querySelector('head');
    target = target || document.body;
    target.appendChild(node);
  },

  _inferredResourceType: function(src) {
    if((/(\.|\/)js(\?|$)/).test(src)) return 'script';
    if((/(\.|\/)css(\?|$)/).test(src)) return 'link';
    return 'ajax';
  },

  _normalizeSrc: function(srcOrOptions) {
    var options = typeof srcOrOptions === 'string' ? {src: srcOrOptions} : pie.object.merge({}, srcOrOptions);
    return options;
  },

  _loadajax: function(options, resourceOnload) {
    var ajaxOptions = pie.object.merge({
      verb: 'GET',
      url: options.src
    }, options, {
      success: resourceOnload
    });

    this.app.ajax.ajax(ajaxOptions);
  },

  _loadscript: function(options, resourceOnload) {

    var script = document.createElement('script');

    if(options.noAsync) script.async = false;

    if(!options.callbackName) {
      script.onload = resourceOnload;
    }

    this._appendNode(script);
    script.src = options.src;

  },

  _loadlink: function(options, resourceOnload) {
    var link = document.createElement('link');

    link.href = options.src;
    link.media = options.media || 'screen';
    link.rel = options.rel || 'stylesheet';
    link.type = options.contentType || 'text/css';

    this._appendNode(link);

    // need to record that we added this thing.
    // the resource may not actually be present yet.
    resourceOnload();
  },

  define: function(name, srcOrOptions) {
    var options = this._normalizeSrc(srcOrOptions);
    this.set('srcMap.' + name, options);
  },

  load: function(/* src1, src2, src3, onload */) {
    var sources = pie.array.change(pie.array.from(arguments), 'flatten', 'compact'),
    onload = pie.object.isFunction(pie.array.last(sources)) ? sources.pop() : function(){},
    fns;

    sources = sources.map(this._normalizeSrc.bind(this));

    fns = sources.map(function(options){
      options = this.get('srcMap.' + options.src) || options;

      var src = options.src,
      loadedKey = 'loaded.' + src;

      return function(cb) {
        if(this.get(loadedKey) === true) {
          cb();
          return true;
        }

        if(this.get(loadedKey)) {
          this.get(loadedKey).push(cb);
          return false;
        }

        this.set(loadedKey, [cb]);

        var type = options.type || this._inferredResourceType(options.src),
        resourceOnload = function() {

          this.get(loadedKey).forEach(function(fn) { if(fn) fn(); });
          this.set(loadedKey, true);

          if(options.callbackName) delete window[options.callbackName];
        }.bind(this);

        if(options.callbackName) {
          window[options.callbackName] = resourceOnload;
        }


        this['_load' + type](options, resourceOnload);

        return false;
      }.bind(this);
    }.bind(this));

    pie.fn.async(fns, onload);
  }
});
pie.route = pie.model.extend('route', {

  init: function(path, options) {
    this._super({
      pathTemplate: pie.string.normalizeUrl(path)
    }, options);

    this.name = this.options.name;

    this.compute('splitPathTemplate', 'pathTemplate');
    this.compute('pathRegex', 'pathTemplate');
  },

  splitPathTemplate: function() {
    return this.get('pathTemplate').split('/');
  },

  pathRegex: function() {
    return new RegExp('^' + this.get('pathTemplate').replace(/(:[^\/]+)/g,'([^\\/]+)') + '$');
  },

  // assume path is already normalized and we've "matched" it.
  interpolations: function(path, parseValues) {
    var splitPath = path.split('/'),
    interpolations = {};

    for(var i = 0; i < splitPath.length; i++){
      if(/^:/.test(this.get('splitPathTemplate.' + i))) {
        interpolations[this.get('splitPathTemplate.' + i).replace(/^:/, '')] = splitPath[i];
      }
    }

    if(parseValues) interpolations = pie.string.deserialize(pie.object.serialize(interpolations), true);

    return interpolations;
  },

  isDirectMatch: function(path) {
    return path === this.get('pathTemplate');
  },

  isMatch: function(path) {
    return this.get('pathRegex').test(path);
  },

  path: function(data, interpolateOnly) {
    var usedKeys = [],
    s = this.get('pathTemplate'),
    params,
    unusedData;

    data = data || {};

    s = s.replace(/\:([a-zA-Z0-9_]+)/g, function(match, key){
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
pie.router = pie.model.extend('router', {

  init: function(app) {
    this._super({
      routes: [],
      routeNames: {},
      root: app.options.root || '/',
      cache: {}
    }, {
      app: app
    });


    this.compute('rootRegex', 'root');
  },

  rootRegex: function() {
    return new RegExp('^' + this.get('root'));
  },

  // get a url based on the current one but with the changes provided.
  // this will even catch interpolated values.
  // Given a named route: /things/page/:page.json
  // And the current path == /things/page/1.json?q=test
  // app.router.changedUrl({page: 3, q: 'newQuery'});
  // => /things/page/3.json?q=newQuery
  changedUrl: function(changes) {
    var current = this.app.parsedUrl;
    return this.path(current.route && current.route.name || current.path, pie.object.merge({}, current.data, changes));
  },


  findRoute: function(nameOrPath) {
    var route = this.get('routeNames.' + nameOrPath);
    route = route || pie.array.detect(this.get('routes'), function(r){ return r.isDirectMatch(nameOrPath); });
    route = route || pie.array.detect(this.get('routes'), function(r){ return r.isMatch(nameOrPath); });
    return route;
  },


  // invoke to add routes to the routers routeset.
  // routes objects which contain a "name" key will be added as a name lookup.
  // you can pass a set of defaults which will be extended into each route object.
  route: function(routes, defaults){
    defaults = defaults || {};

    var path, config, route;

    pie.object.forEach(routes, function(k,r) {
      if(pie.object.isObject(r)) {
        path = k;
        config = r;
      } else {
        path = r;
        config = {name: k};
      }

      if(defaults) config = pie.object.merge({}, defaults, config);

      route = new pie.route(path, config);
      this.get('routes').push(route);
      if(route.name) this.set('routeNames.' + route.name, route);
    }.bind(this));

    this.sortRoutes();
    this.set('cache', {});
  },

  // will return the named path. if there is no path with that name it will return itself.
  // you can optionally pass a data hash and it will build the path with query params or
  // with path interpolation path("/foo/bar/:id", {id: '44', q: 'search'}) => "/foo/bar/44?q=search"
  path: function(nameOrPath, data, interpolateOnly) {
    var r = this.findRoute(nameOrPath) || new pie.route(nameOrPath),
    path = r.path(data, interpolateOnly);

    // apply the root.
    if(!pie.string.PROTOCOL_TEST.test(path) && !this.get('rootRegex').test(path)) {
      path = this.get('root') + path;
      path = pie.string.normalizeUrl(path);
    }

    return path;
  },

  // sorts the routes to be the most exact to the most generic
  sortRoutes: function() {
    var ac, bc, c, d = Array(0);

    this.get('routes').sort(function(a,b) {
      a = a.get('pathTemplate');
      b = b.get('pathTemplate');

      ac = (a.match(/:/g) || d).length;
      bc = (b.match(/:/g) || d).length;
      c = ac - bc;
      c = c || (b.length - a.length);
      c = c || (ac < bc ? 1 : (ac > bc ? -1 : 0));
      return c;
    });
  },

  // look at the path and determine the route which this matches.
  parseUrl: function(path, parseQuery) {
    var result = this.get('cache')[path];
    if(result) return result;

    var pieces, query, match, fullPath, interpolations;

    pieces = path.split('?');

    path = pieces.shift();
    path = path.replace(this.get('rootRegex'), '');
    path = pie.string.normalizeUrl(path);

    query = pieces.join('&') || '';

    match = this.findRoute(path);

    query = pie.string.deserialize(query, parseQuery);
    fullPath = pie.array.compact([path, pie.object.serialize(query)], true).join('?');
    interpolations = match && match.interpolations(path, parseQuery);

    result = pie.object.merge({
      path: path,
      fullPath: fullPath,
      interpolations: interpolations || {},
      query: query,
      data: pie.object.merge({}, interpolations, query),
      route: match
    }, match && match.options);

    this.get('cache')[path] = result;
    return result;

  }
});
pie.templates = pie.model.extend('templates', {

  init: function(app) {
    this._super({}, {
      app: app
    });
  },

  _node: function(name) {
    return document.querySelector(this.app.options.templateSelector + '[id="' + name + '"]');
  },

  _registerTemplate: function(name, content) {
    this.app.debug('Compiling and storing template: ' + name);
    var vars = "var h = pie.apps[" + this.app.pieId + "].helpers.provide();";
    vars += "var get = function(p){ return pie.object.getPath(data, p); };";
    Object.keys(this.app.helpers.provide()).forEach(function(k){
      vars += "var " + k + " = h." + k + ";";
    });
    this.set(name, pie.string.template(content, vars));
  },

  load: function(name, cb) {
    var node = this._node(name),
    src = node && node.getAttribute('data-src') || name;

    this.app.resources.load({
      type: 'ajax',
      accept: 'text/html',
      src: src,
      dataSuccess: function(content) {
        this._registerTemplate(name, content);
      }.bind(this),
      error: function() {
        throw new Error("[PIE] Template fetch error: " + name);
      }
    }, cb);

  },

  render: function(name, data) {
    if(!this.get(name)) {

      var node = this._node(name);

      if(node) {
        this._registerTemplate(name, node.content || node.textContent);
      } else {
        throw new Error("[PIE] Unknown template error: " + name);
      }
    }

    return this.get(name)(data || {});
  },

  renderAsync: function(name, data, cb) {
    if(this.get(name)) {
      var content = this.render(name, data);
      cb(content);
      return;
    }

    this.load(name, function(){
      this.renderAsync(name, data, cb);
    }.bind(this));
  },
});
pie.validator = pie.base.extend('validator', (function(){

  // http://rosettacode.org/wiki/Luhn_test_of_credit_card_numbers#JavaScript
  var luhnCheck = function(a,b,c,d,e) {
    for(d = +a[b = a.length-1], e=0; b--;)
      c = +a[b], d += ++e % 2 ? 2 * c % 10 + (c > 4) : c;
    return !(d%10);
  };

  return {

    init: function(app) {
      this.app = app || pie.appInstance;
      this.i18n = app.i18n;
    },


    errorMessage: function(validationType, validationOptions) {
      if(validationOptions.message) return this.app.i18n.attempt(validationOptions.message);

      var base = this.i18n.t('app.validations.' + validationType),
      rangeOptions = new pie.validator.rangeOptions(this.app, validationOptions),
      range = rangeOptions.message();

      if(!range && validationType === 'length') {
        rangeOptions = new pie.validator.rangeOptions(this.app, {gt: 0});
        range = rangeOptions.message();
      }

      return (base + ' ' + range).trim();
    },


    withStandardChecks: function(value, options, f){
      options = options || {};

      if(options.allowBlank && !this.presence(value))
        return true;
      else if(options.unless && options.unless.call())
        return true;
      else if(options['if'] && !options['if'].call())
        return true;
      else
        return f.call();
    },


    ccNumber: function(value, options){
      return this.withStandardChecks(value, options, function(){

        // don't get rid of letters because we don't want a mix of letters and numbers passing through
        var sanitized = String(value).replace(/[^a-zA-Z0-9]/g, '');
        return this.number(sanitized) &&
               this.length(sanitized, {gte: 10, lte: 16}) &&
               luhnCheck(sanitized);
      }.bind(this));
    },


    ccExpirationMonth: function(value, options) {
      return this.withStandardChecks(value, options, function() {
        return this.integer(value, {gte: 1, lte: 12});
      }.bind(this));
    },


    ccExpirationYear: function(value, options) {
      return this.withStandardChecks(value, options, function() {
        var now = new Date();
        return this.integer(value, {gte: now.getFullYear(), lte: now.getFullYear() + 20});
      }.bind(this));
    },


    ccSecurity: function(value, options) {
      return this.withStandardChecks(value, options, function() {
        return this.number(value) &&
                this.length(value, {gte: 3, lte: 4});
      }.bind(this));
    },


    chosen: function(value, options){
      return this.presence(value, options);
    },


    // a date should be in the ISO format yyyy-mm-dd
    date: function(value, options) {
      options = options || {};
      return this.withStandardChecks(value, options, function() {
        var split = value.split('-'), y = split[0], m = split[1], d = split[2], iso;

        if(!y || !m || !d) return false;
        if(!this.length(y, {eq: 4}) && this.length(m, {eq: 2}) && this.length(d, {eq: 2})) return false;

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


    email: function(value, options) {
      options = pie.object.merge({allowBlank: false}, options || {});
      return this.withStandardChecks(value, options, function(){
        return (/^.+@.+\..+$/).test(value);
      });
    },


    fn: function(value, options, cb) {
      return this.withStandardChecks(value, options, function(){
        return options.fn.call(null, value, options, cb);
      });
    },


    format: function(value, options) {
      options = options || {};
      return this.withStandardChecks(value, options, function() {
        var fmt = options.format || options['with'];

        if(fmt === 'isoDate'){
          fmt = /^\d{4}\-\d{2}\-\d{2}$/;
        } else if(fmt === 'epochs'){
          fmt = /^\d{10}$/;
        } else if(fmt === 'epochms'){
          fmt = /^\d{13}$/;
        }

        return !!fmt.test(String(value));
      });
    },


    // must be an integer (2.0 is ok) (good for quantities)
    integer: function(value, options){
      return  this.withStandardChecks(value, options, function(){
        return  this.number(value, options) &&
                parseInt(value, 10) === parseFloat(value, 10);
      }.bind(this));
    },


    // min/max length of the field
    length: function(value, options){
      options = pie.object.merge({allowBlank: false}, options);

      if(!('gt'  in options)  &&
         !('gte' in options)  &&
         !('lt'  in options)  &&
         !('lte' in options)  &&
         !('eq'  in options) ){
        options.gt = 0;
      }

      return this.withStandardChecks(value, options, function(){
        var length = String(value).trim().length;
        return this.number(length, options);
      }.bind(this));
    },


    // must be some kind of number (good for money input)
    number: function(value, options){
      options = options || {};

      return this.withStandardChecks(value, options, function(){

        // not using parseFloat because it accepts multiple decimals
        if(!/^([\-])?([\d]+)?\.?[\d]+$/.test(String(value))) return false;

        var number = parseFloat(value),
        ro = new pie.validator.rangeOptions(this.app, options);

        return ro.matches(number);
      });
    },


    // clean out all things that are not numbers and + and get a minimum of 10 digits.
    phone: function(value, options) {
      options = pie.object.merge({allowBlank: false}, options || {});

      return this.withStandardChecks(value, options, function(){
        var clean = String(value).replace(/[^\+\d]+/g, '');
        return this.length(clean, {gte: 10});
      }.bind(this));
    },


    // does the value have any non-whitespace characters
    presence: function(value, options){
      return this.withStandardChecks(value, pie.object.merge({}, options, {allowBlank: false}), function(){
        return !!(value && (/[^ ]/).test(String(value)));
      });
    },


    url: function(value, options) {
      return this.withStandardChecks(value, options, function() {
        return (/^.+\..+$/).test(value);
      });
    }
  };
})());



// small utility class to handle range options.
pie.validator.rangeOptions = pie.base.extend('rangeOptions', {

  init: function(app, hash) {
    this.i18n = app.i18n;
    this.rangedata = hash || {};
    // for double casting new RangeOptions(new RangeOptions({}));
    if(this.rangedata.rangedata) this.rangedata = this.rangedata.rangedata ;
  },

  get: function(key) {
    return pie.fn.valueFrom(this.rangedata[key]);
  },

  has: function(key) {
    return !!(key in this.rangedata);
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
  },
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
      this.newChild.setup();
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
    this.applyClass(this.newChild.el, false);
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

  // build a transition callback, and apply the appropriate class.
  // when the transition is complete, invoke the callback.
  observeTransitionEnd: function(el, isIn, fire) {
    var trans = this.transitionEndEvent(),
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
      var backupDuration = this.determineBackupDuration(el);
      if(!isNaN(backupDuration)) {
        setTimeout(onTransitionEnd, backupDuration * 1.1);
      }
    } else {
      setTimeout(onTransitionEnd, this.options.backupDuration);
    }
  },

  // which transition event should we use?
  transitionEndEvent: function(){

    if(this._transitionEndEvent === undefined) {
      if('ontransitionend' in window) {
        this._transitionEndEvent = 'transitionend';
      } else if('onwebkittransitionend' in window) {
        this._transitionEndEvent = 'webkitTransitionEnd';
      } else if('msTransitionEnd' in window) {
        this._transitionEndEvent = 'msTransitionEnd';
      } else if('onotransitionend' in document.body || navigator.appName === 'Opera') {
        this._transitionEndEvent = 'oTransitionEnd';
      } else {
        this._transitionEndEvent = false;
      }
    }

    return this._transitionEndEvent;
  },

  // get a transition property based on the browser's compatability.
  transitionProperty: function(prop) {
    var trans = this.transitionEndEvent();
    return trans && trans.replace(/end/i, pie.string.capitalize(prop));
  },

  //
  refresh: function(cb) {
    if(this.oldChild) this.oldChild.el.getBoundingClientRect();
    if(this.newChild) this.newChild.el.getBoundingClientRect();
    if(cb) cb();
  },

  determineBackupDuration: function(el) {
    var durProp = this.transitionProperty('duration'),
      delayProp = this.transitionProperty('delay'),
      style = window.getComputedStyle(el),
      dur, delay;

    dur = parseInt(style[durProp].toLowerCase(), 10);
    delay = parseInt(style[delayProp].toLowerCase(), 10);

    if(durProp.indexOf('ms') < 0) {
      dur = dur * 1000;
      delay = delay * 1000;
    }

    return dur + delay;
  }

});
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(function () {
      return pie;
    });
  } else {
    window.pie = pie;
  }
})(this);
