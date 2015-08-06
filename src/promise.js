pie.promise = pie.base.extend({

  __pieRole: 'promise',

  init: function(resolver) {

    this.resolves = [];
    this.rejects  = [];

    this.ctxt     = undefined;
    this.result   = undefined;
    this.state    = 'UNFULFILLED';

    if(resolver) {
      setTimeout(function(){
        try {
          resolver(this.resolve.bind(this), this.reject.bind(this));
        } catch(ex) {
          this.reject(ex);
        }
      }.bind(this), 0);
    }
  },

  bind: function(ctxt) {
    this.ctxt = ctxt;
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
    promises.forEach(function(p, i) {
      p.then(function(val) {
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
