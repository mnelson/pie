var Arr = require('./array');
var Fn  = require('./function');
var Str = require('./string');

var Obj = {
  // deletes all undefined and null values.
  // returns a new object less any empty key/values.
  compact: function(a, removeEmpty){
    var b = Obj.merge({}, a);
    Object.keys(b).forEach(function(k) {
      /* jslint eqnull:true */
      if(b[k] == null || (removeEmpty && b[k].toString().length === 0)) delete b[k];
    });
    return b;
  },


  // deep merge. Does not preserve identity of inner objects.
  deepMerge: function() {
    var args = Arr.from(arguments),
        targ = args.shift(),
        obj;

    function fn(k) {

      if(Obj.has(targ, k) && Obj.isPlainObject(targ[k])) {
        targ[k] = Obj.deepMerge({}, targ[k], obj[k]);
      } else if(Obj.isPlainObject(obj[k])) {
        targ[k] = Obj.deepMerge({}, obj[k]);
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
  },


  // grab the sub-object from the provided object less the provided keys.
  // pie.object.except({foo: 'bar', biz: 'baz'}, 'biz') => {'foo': 'bar'}
  except: function(){
    var keys = Arr.from(arguments),
    a = keys.shift(),
    b = {};

    keys = Arr.flatten(keys);

    Object.keys(a).forEach(function(k){
      if(keys.indexOf(k) < 0) b[k] = a[k];
    });

    return b;
  },

  // delete a path,
  deletePath: function(obj, path, propagate) {

    if(!~path.indexOf('.')) {
      delete obj[path];
    }

    var steps = Str.pathSteps(path), attr, subObj;

    while(steps.length) {
      attr = Arr.last(steps.shift().split('.'));
      subObj = Obj.getPath(obj, steps[0]);
      if(!subObj) return;
      delete subObj[attr];
      if(!propagate || Object.keys(subObj).length) return;
    }

  },

  dup: function(obj, deep) {
    return Obj[deep ? 'deepMerge' : 'merge']({}, obj);
  },

  flatten: function(a, object, prefix) {
    var b = object || {};
    prefix = prefix || '';

    Obj.forEach(a, function(k,v) {
      if(Obj.isPlainObject(v)) {
        Obj.flatten(v, b, k + '.');
      } else {
        b[prefix + k] = v;
      }
    });

    return b;
  },

  isWindow: function(obj) {
    return obj && typeof obj === "object" && "setInterval" in obj;
  },


  /* From jQuery */
  isPlainObject: function(obj) {

    if ( !obj || !Obj.isObject(obj) || obj.nodeType || Obj.isWindow(obj) ) {
      return false;
    }

    if ( obj.constructor &&
      !Obj.has(obj, "constructor") &&
      !Obj.has(obj.constructor.prototype, "isPrototypeOf") ) {
      return false;
    }

    // Own properties are enumerated firstly, so to speed up,
    // if last one is own, then all properties are own.
    var key;
    for ( key in obj ) {}
    return key === undefined || Obj.has(obj, key);
  },

  isNotPlainObject: function(obj) {
    return !Obj.isPlainObject(obj);
  },

  isUndefined: function(obj) {
    return obj === void 0;
  },

  isNotUndefined: function(obj) {
    return !Obj.isUndefined();
  },

  // shallow merge
  merge: function() {
    var args = Arr.from(arguments),
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
  },


  // yield each key value pair to a function
  // Obj.forEach({'foo' : 'bar'}, function(k,v){ console.log(k, v); });
  //
  // => foo, bar
  forEach: function(o, f) {
    if(!o) return;

    Object.keys(o).forEach(function(k) {
      f(k, o[k]);
    });
  },


  getPath: function(obj, path) {
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
  },


  getValue: function(o, attribute) {
    if(Obj.isFunction(attribute))          return attribute.call(null, o);
    else if (o == null)                           return void 0;
    else if(Obj.isFunction(o[attribute]))  return o[attribute].call(o);
    else if(Obj.has(o, attribute, true))   return o[attribute];
    else                                          return void 0;
  },

  has: function(obj, key, includeInherited) {
    return obj && (obj.hasOwnProperty(key) || (includeInherited && (key in obj)));
  },

  hasAny: function(/* obj, *keys */) {
    var obj = arguments[0], keys, checks;
    if(!obj) return false;

    if(arguments.length === 1) return !!Object.keys(obj).length;

    checks = Arr.flatten(Arr.get(arguments, 1, -1));
    for(var i=0;i<checks.length;i++) {
      if(Obj.has(obj, checks[i])) return true;
    }

    return false;
  },


  // does the object have the described path
  hasPath: function(obj, path) {
    if(!~path.indexOf('.')) return Obj.has(obj, path);

    var parts = path.split('.'), part;
    while(part = parts.shift()) {

      /* jslint eqeq:true */
      if(Obj.has(obj, part)) {
        obj = obj[part];
      } else {
        return false;
      }
    }

    return true;
  },

  reverseMerge: function(/* args */) {
    var args = Arr.from(arguments);
    args.reverse();
    return Obj.merge.apply(null, args);
  },

  // serialize object into query string
  // {foo: 'bar'} => foo=bar
  // {foo: {inner: 'bar'}} => foo[inner]=bar
  // {foo: [3]} => foo[]=3
  // {foo: [{inner: 'bar'}]} => foo[][inner]=bar
  serialize: function(obj, removeEmpty) {
    var s = [], append, appendEmpty, build, rbracket = /\[\]$/;

    append = function(k,v){
      v = Fn.valueFrom(v);
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
      } else if(Obj.isPlainObject(o)) {
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
  },


  setPath: function(obj, path, value) {
    if(!~path.indexOf('.')) return obj[path] = value;

    var p = path.split('.'), key;
    while(p.length) {
      key = p.shift();
      if (!p.length) return obj[key] = value;
      else if (obj[key]) obj = obj[key];
      else obj = obj[key] = {};
    }
  },


  // grab a sub-object from the provided object.
  // Obj.slice({foo: 'bar', biz: 'baz'}, 'biz') => {'biz': 'baz'}
  slice: function() {
    var keys = Arr.from(arguments),
    a = keys.shift(),
    b = {};

    keys = Arr.flatten(keys);
    keys.forEach(function(k){
      if(Obj.has(a, k)) b[k] = a[k];
    });

    return b;
  },

  // return all the values of the object
  values: function(a) {
    return Object.keys(a).map(function(k) { return a[k]; });
  }
};



['Object', 'Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Boolean'].forEach(function(name) {
  Obj['is' + name] = function(obj) {
    return Object.prototype.toString.call(obj) === '[object ' + name + ']';
  };

  Obj['isNot' + name] = function(obj) {
    return !Obj['is' + name](obj);
  };
});

(function(){
  if(!Obj.isArguments(arguments)) {
    Obj.isArguments = function(obj) {
      return obj && obj.hasOwnProperty('callee');
    };
  }
})();

module.exports = Obj;
