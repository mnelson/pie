
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
    if(this.options.trackVersion !== false) {
      this.set('_version', this.get('_version') + 1, {skipObservers: true});
    }
  },


  // After updates have been made we deliver our change records to our observers.
  deliverChangeRecords: function() {
    if(!this.changeRecords.length) return this;

    this.trackVersion();

    var changeSet = pie.object.merge(this.changeRecords, changeSet),
    observers = pie.object.values(this.observations),
    invoker = function(obj) {
      if(obj.keys === '__all__' || changeSet.hasAny.apply(changeSet, obj.keys)) {
        obj.fn.call(null, changeSet);
      }
    },
    o, idx;


    pie.object.merge(changeSet, pie.mixins.changeSet);


    // Deliver change records to all computed properties first.
    // This will ensure that the changeRecords include the computed property changes
    // along with the original property changes.
    while(~(idx = pie.array.indexOf(observers, 'computed'))) {
      o = observers[idx];
      observers.splice(idx, 1);
      invoker(o);
    }

    // now we reset the changeRecords on this model.
    this.changeRecords = [];

    // and deliver the changeSet
    observers.forEach(invoker);

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

    if(!keys.length) keys = '__all__';

    this.observations[fn.pieId] = {
      fn: fn,
      keys: keys
    };

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
    var recursive = (!options || !options.noRecursive),
    deleteRecursive = (!options || !options.noDeleteRecursive),
    steps = ~key.indexOf('.') && recursive ? pie.string.pathSteps(key) : null,
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
      pie.object.deletePath(this.data, key, deleteRecursive);
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
    observation;

    pie.setUid(fn);

    observation = this.observations[fn.pieId];

    if(!observation) return this;

    if(!keys.length || observation.keys === '__all__') {
      delete this.observations[fn.pieId];
      return this;
    }

    observation.keys = pie.array.subtract(observation.keys, keys);
    if(!observation.keys.length) {
      delete this.observations[fn.pieId];
      return this;
    }

    return this;
  },

  // Register a computed property which is accessible via `name` and defined by `fn`.
  // Provide all properties which invalidate the definition.
  // if the definition of the property is defined by a function of the same name, the function can be ommitted.
  // this.compute('fullName', 'first_name', 'last_name');
  compute: function(/* name, fn?[, prop1, prop2 ] */) {
    var props = pie.array.from(arguments),
    name = props.shift(),
    fn = props.shift(),
    wrap;

    if(!pie.object.isFunction(fn)) {
      props.unshift(fn);
      fn = this[name].bind(this);
    }

    wrap = function(/* changes */){
      this.set(name, fn.call(this), {skipObservers: true});
    }.bind(this);

    this.observe(wrap, props);
    this.observations[wrap.pieId].computed = true;

    // initialize it
    this.set(name, fn.call(this));
  }
});
