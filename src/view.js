var Pie       = require('pie');
var Base      = require('base');
var Emitter   = require('emitter');
var Arr       = require('extensions/array');
var Dom       = require('extensions/dom');
var Obj       = require('extensions/object');
var Container = require('mixins/container');

// # Pie View
//
// Views are objects which wrap and interact with DOM. They hold reference to a single element via `this.el`. All
// event obsrevation, delegation, and querying is conducted within the scope of the view's `el`.
//
// Views are equipped with an emitter. The emitter can be utilized for observing any type of lifecycle activity.
// View lifecycle:
//   * init - the constructor
//   * setup - if `setup: true` is provided to the constructor this will happen immediately after instantiation, otherwise this needs to be invoked.
//   * attach - the stage in which the view's el is added to the DOM.
//   * user interaction
//   * teardown - removes any added events from the dom elements, removes any model observations, removes the el from the dom, etc.
//   * detach - when the view's el is removed from the DOM.
var View = Base.extend('view');

/* true constructor overriden to invoke setup after init() is finished if `setup:true` was provided as an option */
View.prototype.constructor = function view() {
  Base.prototype.constructor.apply(this, arguments);
  if(this.options.setup) this.setup();
};

View.reopen({

  // **pie.view.init
  // Options:
  //   * el - (optional) the root element of the views control. if not provided, a new <div> will be created.
  //   * app - (optional) the app this view is associated with.
  //   * uiTarget - (optional) element to attach to. if provided, after this view is set up it will automatically attach this element.
  //   * setup - (option) if truthy, this view's setup function will be called directly after initialization.
  init: function(options) {
    this.options = options || {},
    this.app = this.options.app || Pie.appInstance;
    this.el = this.options.el || Dom.createElement('<div></div>');
    this.eventedEls = [];
    this.changeCallbacks = [];

    this.emitter = new Emitter();

    if(this.options.uiTarget) {
      this.emitter.once('afterSetup', this.appendToDom.bind(this));
    }
  },

  // **pie.view.addedToParent**
  //
  // Accommodates the `addedToParent` hook event in pie.container.
  // Emits the event via the emitter, meaning this can be subscribed to in the init or setup process.
  addedToParent: function() {
    this.emitter.fire('addedToParent');
  },

  // **pie.view.appendToDom**
  //
  // A function which appends the view's el to the DOM within target (or this.options.uiTarget).
  // An "attach" sequence is fired so views can control how they enter the DOM.
  appendToDom: function(target) {
    target = target || this.options.uiTarget;
    if(target !== this.el.parentNode) {
      this.emitter.fireSequence('attach', function(){
        target.appendChild(this.el);
      }.bind(this));
    }
  },

  // **pie.view.consumeEvent**
  //
  // A utility method for consuming an event, and optionally immediately stopping propagation.
  // ```
  // clickCallback: function(e) {
  //   this.consumeEvent(e);
  //   console.log(e.delegateTarget.href);
  // }
  // ```
  consumeEvent: function(e, immediate) {
    if(e) {
      e.preventDefault();
      e.stopPropagation();
      if(immediate) e.stopImmediatePropagation();
    }
  },

  // **pie.view.eventNamespace**
  //
  // The namespace used for this view's events. All views have a separate namespace to ensure
  // event triggers are propagated efficiently.
  eventNamespace: function() {
    return 'view'+ this.pieId;
  },


  // **pie.view.navigationUpdated**
  //
  // When navigation changes but this view is still deemed relevant by the routeHandler, `navigationUpdated` will be invoked.
  // A `navigationUpdated` event is emmitted, then all children are checked for a navigationUpdated function which, if found, is invoked.
  navigationUpdated: function(changeSet) {
    this.emitter.fire('navigationUpdated', changeSet);
    this.children.forEach(function(c){
      if(Obj.has(c, 'navigationUpdated', true)) c.navigationUpdated(changeSet);
    });
  },


  // **pie.view.on**
  //
  // Observe a dom event and invoke the provided functions.
  // By default all events are delegated to this.el, but if you pass in an element as the last argument
  // that will be used. If the functions are provided as strings, they will be looked up on `this`.
  //
  // ```
  // view.on('click', 'a', this.handleClick.bind(this), this.trackClickEvent.bind(this));
  // view.on('submit', 'form', 'handleSubmit');
  // view.on('resize', null, 'onResize', window);
  // ```
  on: function(/* e, sel, f1, f2, f3, el */) {
    var fns = Arr.from(arguments),
        events = fns.shift(),
        sel = fns.shift(),
        ns = this.eventNamespace(),
        f2, el;

    if(!Obj.isFunction(Arr.get(fns, -1))) el = fns.pop();
    el = el || this.el;

    if(!~this.eventedEls.indexOf(el)) this.eventedEls.push(el);

    events = events.split(' ');

    fns.forEach(function(fn) {
      fn = Obj.isString(fn) ? this[fn].bind(this) : fn;

      f2 = function(e){
        if(e.namespace === ns) {
          return fn.apply(this, arguments);
        }
      };

      events.forEach(function(ev) {
        ev += "." + ns;
        Dom.on(el, ev, f2, sel);
      }.bind(this));

    }.bind(this));

    return this;
  },

  // **pie.view.onChange**
  //
  // Observe changes of an model, unobserving them when the view is removed.
  // If the object is not observable, an error will be thrown.
  // The first argument must be the observable model, the remaining arguments must match
  // the expected arguments of model.observe.
  // ```
  // view.onChange(user, this.onNameChange.bind(this), 'firstName', 'lastName');
  // view.onChange(context, this.onContextChange.bind(this));
  // ```
  onChange: function() {

    var parts = Arr.partitionAt(arguments, Obj.isFunction),
    observables = parts[0],
    args = parts[1];

    observables.forEach(function(observable){
      if(!Obj.has(observable, 'observe', true)) throw new Error("Observable does not respond to observe");

      this.changeCallbacks.push({
        observable: observable,
        args: args
      });

      observable.observe.apply(observable, args);
    }.bind(this));


  },


  // **pie.view.qs**
  //
  // Shortcut for this.el.querySelector
  qs: function(selector) {
    return this.el.querySelector(selector);
  },


  // **pie.view.qsa**
  //
  // shortcut for this.el.querySelectorAll
  qsa: function(selector) {
    return this.el.querySelectorAll(selector);
  },

  // **pie.view.removeFromDom**
  //
  // Assuming the view's el is in the DOM, a detach sequence will be invoked, resulting in the el being removed.
  // Note we don't use Dom.remove since we know we're cleaning up our events. Multiple views could be associated
  // with the same el.
  removeFromDom: function() {
    if(this.el.parentNode) {
      this.emitter.fireSequence('detach', function() {
        this.el.parentNode.removeChild(this.el);
      }.bind(this));
    }
  },

  // **pie.view.removedFromParent**
  //
  // Accommodates the `removedFromParent` hook event in pie.container.
  // It emits a `removedFromParent` event which can be observed in the setup process.
  removedFromParent: function() {
    this.emitter.fire('removedFromParent');
  },

  // **pie.view.setup**
  //
  // Placeholder for default functionality.
  // By default, the setup event is triggered on the emitter.
  setup: function(){
    this.emitter.fireSequence('setup');
    return this;
  },


  // **pie.view.teardown**
  //
  // This function should be invoked when it's ready to dismiss the view.
  // Upon invocation, a `teardown` sequence is emitted.
  // When teardown runs, the view's `el` is removed from the dom, all observations are removed,
  // and all children have teardown invoked.
  teardown: function() {

    this.emitter.fireSequence('teardown', function() {

      this.removeFromDom();

      this._unobserveEvents();
      this._unobserveChangeCallbacks();

      this.teardownChildren();
      /* views remove their children upon removal to ensure all irrelevant observations are cleaned up. */
      this.removeChildren();

    }.bind(this));

    return this;
  },

  // **pie.view.teardownChildren**
  //
  // Invokes teardown on each child that responds to it.
  teardownChildren: function() {
    this.children.forEach(function(child) {
      if(Obj.has(child, 'teardown', true)) child.teardown();
    });
  },

  /* release all observed events. */
  _unobserveEvents: function() {
    var key = '*.' + this.eventNamespace();
    this.eventedEls.forEach(function(el) {
      Dom.off(el, key);
    });
  },


  /* release all change callbacks. */
  _unobserveChangeCallbacks: function() {
    var a;
    while(this.changeCallbacks.length) {
      a = this.changeCallbacks.pop();
      a.observable.unobserve.apply(a.observable, a.args);
    }
  }

}, Container);
