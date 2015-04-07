var Obj     = require('object');
var PieDate = require('date');
var PieMath = require('math');

var Fn = {
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

  async: function(fns, cb, counterObserver) {

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
  },

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
  debounce: function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = PieDate.now() - timestamp;

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
      timestamp = PieDate.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  },


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
  ease: function(each, o, complete) {
    o = Obj.merge({
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
    var fn = PieMath.easing[o.name],
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
  },

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
  once: function(f) {
    var called = false,
    result;

    return function() {

      if(!called) {
        called = true;
        result = f.apply(null, arguments);
      }

      return result;
    };
  },

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
  throttle: function(fn, threshold, scope) {
    threshold = threshold || 250;
    var last, deferTimer;

    return function () {
      var context = scope || this;

      var now = PieDate.now(),
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
  },


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
  valueFrom: function(f, binding, args) {
    if(Obj.isFunction(f)) return f.apply(binding, args) ;
    return f;
  }
};
