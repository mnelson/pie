var Pie = require('./pie');
var Arr = require('./extensions/array');
var Obj = require('./extensions/object');

var Base = function() {
  Pie.setUid(this);
  this.init.apply(this, arguments);
  if(!this.app) {
    if(this.options && this.options.app) this.app = this.options.app;
    else this.app = Pie.appInstance;
  }
};
Base.prototype.init = function(){};

Base.prototype.reopen = function() {
  var extensions = Arr.change(arguments, 'from', 'flatten'),
  extender = function(k,fn) {
    this[k] = Base._wrap(fn, this[k]);
  }.bind(this);

  extensions.forEach(function(e) {
    Obj.forEach(e, extender);
    if(e.init) e.init.call(this);
  }.bind(this));

  return this;
};

Base.subClasses = [];

Base.extend = function() {
  return Base._extend(Base, arguments);
};

Base.reopen = function() {
  return Base._reopen(Base, arguments);
};

Base._extend = function(parentClass, extensions) {
  extensions = Arr.change(extensions, 'from', 'flatten');

  var oldLength = extensions.length;
  extensions = Arr.compact(extensions);

  if(extensions.length !== oldLength) throw new Error("Null values not allowed");

  var name = "", child;

  if(Obj.isString(extensions[0])) {
    name = extensions.shift();
  }

  if(Obj.isFunction(extensions[0])) {
    extensions.unshift({init: extensions.shift()});
  }

  if(!name) {
    name = Obj.getPath(extensions[0], 'init.name') || '';
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
    return Base._extend(child, arguments);
  };

  child.reopen = function() {
    return Base._reopen(child, arguments);
  };

  if(extensions.length) child.reopen(extensions);

  return child;
};

Base._reopen = function(klass, extensions) {
  extensions = Arr.change(extensions, 'from', 'flatten', 'compact');
  extensions.forEach(function(ext) {
    Obj.forEach(ext, function(k,v) {
      klass.prototype[k] = Base._wrap(v, klass.prototype[k]);
    });
  });
};

Base._wrap = (function() {

  var fnTest = /xyz/.test(function(){ "xyz"; });
  fnTest = fnTest ? /\b_super\b/ : /.*/;

  return function(newF, oldF) {
    /* jslint eqnull:true */

    // if we're not defining anything new, return the old definition.
    if(newF == null) return oldF;
    // if there is no old definition
    if(oldF == null) return newF;
    // if we're not overriding with a function
    if(!Obj.isFunction(newF)) return newF;
    // if we're not overriding a function
    if(!Obj.isFunction(oldF)) return newF;
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


module.exports = Base;
