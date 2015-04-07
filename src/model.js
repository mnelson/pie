var Pie       = require('./pie');
var Base      = require('./base');
var Arr       = require('./extensions/array');
var Obj       = require('./extensions/object');
var Str       = require('./extensions/string');
var ChangeSet = require('./mixins/changeSet');
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


module.exports = Base.extend('model', {

  init: function(d, options) {
    this.data = Obj.merge({_version: 1}, d);
    this.options = options || {};
    this.app = this.app || this.options.app || Pie.appInstance;
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
    var props = Arr.from(arguments),
    name = props.shift(),
    fn = props.shift(),
    wrap;

    props = Arr.flatten(props);

    if(!Obj.isFunction(fn)) {
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
    observers = Obj.values(this.observations),
    invoker = function(obj) {
      if(changeSet.hasAny.apply(changeSet, obj.keys)) {
        obj.fn.call(null, changeSet);
      }
    },
    o, idx;

    /* We modify the `changeSet` array with the `pie.mixins.changeSet`. */
    Obj.merge(changeSet, ChangeSet);


    /* Deliver change records to all computed properties first. */
    /* This will ensure that the change records include the computed property changes */
    /* along with the original property changes. */
    while(~(idx = Arr.indexOf(observers, 'computed'))) {
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
    return Obj.getPath(this.data, key);
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
    var args = Arr.change(arguments, 'from', 'flatten', 'compact'),
    o = {};

    args.forEach(function(arg){
      if(this.has(arg)) {
        Obj.setPath(o, arg, this.get(arg));
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
    return !!Obj.hasPath(this.data, path);
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
    var obj = arguments.length > 1 ? Obj.deepMerge.apply(null, arguments) : arguments[0]
    obj = Obj.flatten(obj);
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
    var args = Arr.change(arguments, 'from', 'flatten'),
    part = Arr.partition(args, Obj.isFunction),
    fns = part[0],
    keys = part[1];

    if(!keys.length) keys = ['_version'];

    fns.forEach(function(fn){

      /* Setting the uid is needed because we'll want to manage unobservation effectively. */
      Pie.setUid(fn);

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
    steps = ~key.indexOf('.') && recursive ? Str.pathSteps(key) : null,
    o, oldKeys, type, change;

    change = { name: key, object: this.data };

    if(this.has(key)) {
      change.type = 'update';
      change.oldValue = Obj.getPath(this.data, key);

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
      Obj.deletePath(this.data, key, deleteRecursive);
      change.type = 'delete';

    /* Otherwise, we set the value within `this.data`. */
    } else {
      Obj.setPath(this.data, key, value);
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
    var existing = Object.keys(Obj.flatten(this.data)),
    given = Object.keys(Obj.flatten(obj)),
    removed = Arr.subtract(existing, given),
    rmOptions = Obj.merge({}, options, {skipObservers: true});

    removed = Arr.remove(removed, '_version');

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
    Obj.forEach(obj, function(k,v) {
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
    else if (Obj.isRegExp(value)) return value.test(String(owned));
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
    var args = Arr.change(arguments, 'from', 'flatten'),
    part = Arr.partition(args, Obj.isFunction),
    fns = part[0],
    keys = part[1],
    observation;

    fns.forEach(function(fn){
      Pie.setUid(fn);

      observation = this.observations[fn.pieId];
      if(!observation) return;

      if(!keys.length) {
        delete this.observations[fn.pieId];
        return;
      }

      observation.keys = Arr.subtract(observation.keys, keys);

      if(!observation.keys.length) {
        delete this.observations[fn.pieId];
        return;
      }
    }.bind(this));

    return this;
  }
});
