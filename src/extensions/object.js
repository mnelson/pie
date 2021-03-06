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
