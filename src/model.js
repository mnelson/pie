
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
//      object: {..}
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


pie.model = function(d, options) {
  this.data = pie.object.extend({}, d);
  this.options = options || {};
  this.uid = pie.unique();
  this.observations = {};
  this.changeRecords = [];
};

// Give ourselves _super functionality.
pie.object.extend(pie.model.prototype, pie.mixins.inheritance);


// After updates have been made we deliver our change records to our observers.
pie.model.prototype.deliverChangeRecords = function() {
  var observers = {}, os, o, change, all;

  // grab each change record
  while(change = this.changeRecords.shift()) {

    // grab all the observers for the attribute specified by change.name
    os = pie.array.union(this.observations[change.name], this.observations.__all__);

    // then for each observer, build or concatenate to the array of changes.
    while(o = os.shift()) {
      observers[o.uid] = observers[o.uid] || {fn: o, changes: []};
      observers[o.uid].changes.push(change);
    }
  }

  // Iterate each observer, calling it with the changes which it was subscribed for.
  pie.object.forEach(observers, function(uid, obj) {
    obj.fn.call(null, obj.changes);
  });

  return this;
};

// Access the value stored at data[key]
// Key can be multiple levels deep by providing a dot separated key.
pie.model.prototype.get = function(key) {
  return pie.object.getPath(this.data, key);
};

// Retrieve multiple values at once.
pie.model.prototype.gets = function() {
  var args = pie.array.args(arguments), o = {};
  args = pie.array.flatten(args);
  args = pie.array.compact(args);

  args.forEach(function(arg){
    o[arg] = pie.object.getPath(this.data, arg);
  }.bind(this));

  return pie.object.compact(o);
};


// Register an observer and optionally filter by key.
pie.model.prototype.observe = function(/* fn[, key1, key2, key3] */) {
  var keys = pie.array.args(arguments),
  fn = keys.shift();

  fn.uid = fn.uid || String(pie.unique());

  keys = pie.array.flatten(keys);

  if(!keys.length) keys.push('__all__');

  keys.forEach(function(k) {
    this.observations[k] = this.observations[k] || [];
    if(this.observations[k].indexOf(fn) < 0) this.observations[k].push(fn);
  }.bind(this));

  return this;
};

// Set a value and trigger observers.
// Optionally provide false as the third argument to skip observation.
// Note: skipping observation does not stop changeRecords from accruing.
pie.model.prototype.set = function(key, value, skipObservers) {
  var change = { name: key, object: this.data };

  if(pie.object.hasPath(this.data, key)) {
    change.type = 'update';
    change.oldValue = pie.object.getPath(this.data, key);
  } else {
    change.type = 'add';
  }

  change.value = value;
  pie.object.setPath(this.data, key, value);

  this.changeRecords.push(change);

  if(skipObservers) return this;
  return this.deliverChangeRecords();
};

// Set a bunch of stuff at once.
pie.model.prototype.sets = function(obj, skipObservers) {
  pie.object.forEach(obj, function(k,v) {
    this.set(k, v, true);
  }.bind(this));

  if(skipObservers) return this;
  return this.deliverChangeRecords();
};


// Unregister an observer. Optionally for specific keys.
pie.model.prototype.unobserve = function(/* fn[, key1, key2, key3] */) {
  var keys = pie.array.args(arguments),
  fn = keys.shift(),
  i;

  if(!keys.length) keys = Object.keys(this.observations);

  keys.forEach(function(k){
    i = this.observations[k].indexOf(fn);
    if(~i) this.observations[k].splice(i,1);
  }.bind(this));

  return this;
};

// Register a computed property which is accessible via `name` and defined by `fn`.
// Provide all properties which invalidate the definition.
pie.model.prototype.compute = function(/* name, fn[, prop1, prop2 ] */) {
  var props = pie.array.args(arguments),
  name = props.shift(),
  fn = props.shift();

  this.observe(function(changes){
    this.set(name, fn.call(this));
  }.bind(this), props);

  // initialize it
  this.set(name, fn.call(this));
};




