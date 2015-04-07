var Base = require('../base');
var Emitter = require('../emitter');

// general framework for transitioning between views.
module.exports = Base.extend('abstractViewTransition', {

  init: function(parent, options) {
    options = options || {};

    this.emitter    = new Emitter();
    this.parent     = parent;
    this.oldChild   = options.oldChild;
    this.newChild   = options.newChild;
    this.childName  = options.childName || this.oldChild && this.oldChild._nameWithinParent;
    this.targetEl   = options.targetEl  || this.oldChild && this.oldChild.el.parentNode;

    if(!this.childName) throw new Error("No child name provided for view transition");
    if(!this.targetEl)  throw new Error("No target element provided for view transition");

    this.options = options;

    this.emitter.on('beforeTransition', this.manageChildren.bind(this));
  },

  // fire a sequence which looks like
  // ```
  // | beforeTransition
  // | transition
  // |--| beforeRemoveOldChild
  // |  | removeOldChild
  // |  | afterRemoveOldChild
  // |  |--| beforeAddNewChild
  // |     | addNewChild
  // |     | afterAddNewChild
  // | afterTransition
  // ```
  transition: function(cb) {
    var em = this.emitter;

    em.on('afterAddNewChild', function() {
      em.fire('afterTransition');
      if(cb) cb();
    });

    em.on('afterRemoveOldChild', function() {
      em.fire('beforeAddNewChild');
      em.fireAround('aroundAddNewChlid', function() {
        em.fire('addNewChild');
      });
    });

    em.on('transition', function() {
      em.fire('beforeRemoveOldChild');
      em.fireAround('aroundRemoveOldChild', function() {
        em.fire('removeOldChild');
      });
    });

    em.fire('beforeTransition');
    em.fireAround('aroundTransition', function() {
      em.fire('transition');
    });
  },

  // to be called at the beginning of each transition.
  // this removes the old child from it's parent and adds the new one
  // it also begins the setup process for the new child.
  manageChildren: function() {
    if(this.oldChild) this.parent.removeChild(this.oldChild);
    if(this.newChild) {
      this.parent.addChild(this.childName, this.newChild);
      if(!this.newChild.emitter.hasEvent('beforeSetup')) this.newChild.setup();
    }
  },

});
