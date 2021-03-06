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
