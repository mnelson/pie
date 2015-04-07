var Abstract = require('abstract');
var Dom      = require('../extensions/dom');
var Obj      = require('../extensions/object');
var Str      = require('../extensions/string');
// A transition which applies an "out" class to the old view, removes it after it transitions out, then adds
// the new view to the dom and applies an "in" class.
// Preparation of the new view is done as soon as the transition is started, enabling the shortest possible
// amount of delay before the next view is added to the dom.
module.exports = Abstract.extend('inOutViewTransition', {

  init: function() {
    this._super.apply(this, arguments);

    this.options = Obj.merge({
      // the new view will gain this class
      inClass: 'view-in',
      // the old view will gain this class
      outClass: 'view-out',
      // if the browser doesn't support onTransitionEnd, here's the backup transition duration
      backupDuration: 250,
      // async=true means the new view doesn't wait for the old one to leave.
      // async=false means the new view won't be added to the dom until the previous is removed.
      async: false
    }, this.options);

    this.setupObservations();
  },

  setupObservations: function() {
    var em = this.emitter;

    if(this.oldChild) {
      em.on('transitionOldChild',       this.cancelWrap('transitionOldChild'));
      em.on('afterTransitionOldChild',  this.cancelWrap('teardownOldChild'));
    } else {
      em.on('transitionOldChild', function() {
        em.fire('afterTransitionOldChild');
      });
    }

    if(this.newChild) {
      em.on('addNewChild',              this.cancelWrap('addNewChild'));
      em.on('aroundTransitionNewChild', this.cancelWrap('ensureNewChildPrepared'));
      em.on('transitionNewChild',       this.cancelWrap('refresh'));
      em.on('transitionNewChild',       this.cancelWrap('transitionNewChild'));

      this.newChild.emitter.once('removedFromParent', this.cancel.bind(this));
    } else {
      em.on('transitionNewChild', function() {
        em.fire('afterTransitionNewChild');
      });
    }
  },

  cancelWrap: function(fnName) {
    return function(){
      if(!this.emitter.hasEvent('cancel')) {
        this[fnName].apply(this, arguments);
      }
    }.bind(this);
  },

  // apply the relevant class(es) to the element.
  applyClass: function(el, isIn) {
    var add = isIn ? this.options.inClass : this.options.outClass,
        remove = isIn ? this.options.outClass : this.options.inClass;

    if(add) el.classList.add(add);
    if(remove) el.classList.remove(remove);
  },

  // WHEN options.async !== true
  // fire a sequence which looks like
  // ```
  // | beforeTransition
  // | transition
  // |  |--| beforeRemoveOldChild
  // |     |--| beforeTransitionOldChild
  // |        | transitionOldChild
  // |        |--| afterTransitionOldChild
  // |           |--| removeOldChild
  // |           |  |--| afterRemoveOldChild
  // |           |
  // |           |--| beforeAddNewChild
  // |              | addNewChild
  // |              |--| afterAddNewChild
  // |                 |--| beforeTransitionNewChild
  // |                    | transitionNewChild
  // |                    |--| afterTransitionNewChild
  // |                       |--| afterTransition
  // ```
  //
  // WHEN options.async === true
  // fire a sequence which looks like
  // ```
  // | beforeTransition
  // | transition
  // |  |--| beforeRemoveOldChild
  // |  |  |--| beforeTransitionOldChild
  // |  |     | transitionOldChild
  // |  |     |--| afterTransitionOldChild
  // |  |        |--| removeOldChild
  // |  |           |--| afterRemoveOldChild
  // |  |
  // |  |--| beforeAddNewChild
  // |     | addNewChild
  // |     |--| afterAddNewChild
  // |        |--| beforeTransitionNewChild
  // |           | transitionNewChild
  // |           |--| afterTransitionNewChild
  // |              |--| afterTransition
  // ```

  transition: function(cb) {
    var em = this.emitter;

    em.on('afterTransitionNewChild', function() {
      em.fire('afterTransition');
      if(cb) cb();
    });

    if(this.options.async) {
      em.on('transition', function() {
        em.fireSequence('addNewChild');
      });
    } else {
      em.on('afterRemoveOldChild', function() {
        em.fireSequence('addNewChild');
      });
    }

    em.on('afterAddNewChild', function() {
      em.fire('beforeTransitionNewChild');
      em.fireAround('aroundTransitionNewChild', function() {
        em.fire('transitionNewChild');
      });
    });

    em.on('afterTransitionOldChild', function() {
      em.fireSequence('removeOldChild');
    });

    em.on('transition', function() {
      em.fire('beforeTransitionOldChild');
      em.fireAround('aroundTransitionOldChild', function() {
        em.fire('transitionOldChild');
      });
    });

    em.fire('beforeTransition');
    em.fireAround('aroundTransition', function() {
      em.fire('transition');
    });

  },

  cancel: function() {
    if(!this.emitter.hasEvent('afterTransitionNewChild')) {

      // the goal of a transition is to get the old child out and the new child in,
      // we make sure we've done that.
      if(this.oldChild) {
        this.teardownOldChild();
      }

      if(this.newChild) {
        this.applyClass(this.newChild.el, true);
        this.newChild.appendToDom(this.targetEl);
      }

      // then we let everyone else know.
      this.emitter.fire('cancel');
    }
  },

  // teardown() the child if it hasn't already.
  teardownOldChild: function() {
    if(!this.oldChild.emitter.hasEvent('beforeTeardown')) {
      this.oldChild.teardown();
    }
  },

  // give the new child the "out" classes, then add it to the dom.
  addNewChild: function() {
    // this.applyClass(this.newChild.el, false);
    this.newChild.appendToDom(this.targetEl);
  },

  ensureNewChildPrepared: function(cb) {
    this.newChild.emitter.once('afterRender', cb, {immediate: true});
  },

  // make sure we're rendered, then begin the ui transition in.
  // when complete, invoke the callback.
  transitionNewChild: function() {
    this.observeTransitionEnd(this.newChild.el, true, 'afterTransitionNewChild');
  },

  // start the transition out. when complete, invoke the callback.
  transitionOldChild: function() {
    if(!this.oldChild.el.parentNode) this.emitter.fire('afterTransitionOldChild');
    else this.observeTransitionEnd(this.oldChild.el, false, 'afterTransitionOldChild');
  },

  // ensure the browser has redrawn and locations are up to date.
  refresh: function(cb) {
    if(this.oldChild) this.oldChild.el.getBoundingClientRect();
    if(this.newChild) this.newChild.el.getBoundingClientRect();
    if(cb) cb();
  },

  // build a transition callback, and apply the appropriate class.
  // when the transition is complete, invoke the callback.
  observeTransitionEnd: function(el, isIn, fire) {
    var transitionEvent = this.transitionEvent(el),
    trans = transitionEvent.event,
    dur = transitionEvent.duration,
    called = false,
    onTransitionEnd = function() {
      if(called) return;
      called = true;
      if(trans) Dom.off(el, trans, onTransitionEnd);
      this.emitter.fire(fire);
    }.bind(this);

    this.emitter.once('cancel', onTransitionEnd);

    if(trans) {
      Dom.on(el, trans, onTransitionEnd);
    }

    this.applyClass(el, isIn);

    if(trans) {
      if(!isNaN(dur)) {
        setTimeout(onTransitionEnd, dur * 1.1);
      }
    } else {
      setTimeout(onTransitionEnd, this.options.backupDuration);
    }
  },

  // which transition event should we use?
  transitionEndEvent: function(base){
    var cap = Str.capitalize(base);

    if(this._transitionEndEvent === undefined) {
      if(Obj.has(window, 'on' + base + 'end', true)) {
        this._transitionEndEvent = base + 'end';
      } else if(Obj.has(window, 'onwebkit' + base + 'end', true)) {
        this._transitionEndEvent = 'webkit' + cap + 'End';
      } else if(Obj.has(window, 'ms' + cap + 'End', true)) {
        this._transitionEndEvent = 'ms' + cap + 'End';
      } else if(Obj.has(document.body, 'ono' + base + 'end', true) || navigator.appName === 'Opera') {
        this._transitionEndEvent = 'o' + cap + 'End';
      } else {
        this._transitionEndEvent = false;
      }
    }

    return this._transitionEndEvent;
  },

  // get a transition or animation property based on the browser's compatability.
  subProperty: function(endEvent, prop) {
    return endEvent.replace(/end/i, Str.capitalize(prop));
  },

  transitionEvent: function(el) {
    var endA = this.transitionEndEvent('transition'),
        endB = this.transitionEndEvent('animation'),
        objA = this._transitionEvent(endA, el),
        objB = this._transitionEvent(endB, el);


    return objA.duration > objB.duration ? objA : objB;
  },

  _transitionEvent: function(endEvent, el) {
    if(!endEvent) {
      return {
        duration: 0
      };
    }

    var durProp = this.subProperty(endEvent, 'duration'),
        delayProp = this.subProperty(endEvent, 'delay'),
        style = window.getComputedStyle(el),
        durs = durProp && style[durProp] && style[durProp].split(',') || ['0'],
        delays = delayProp && style[delayProp] && style[delayProp].split(',') || ['0'],
        dur, delay;

    durs = durs.map(function(d){ return parseFloat(d.toLowerCase(), 10); });
    delays = delays.map(function(d){ return parseFloat(d.toLowerCase(), 10); });

    dur = Math.max.apply(null, durs);
    delay = Math.max.apply(null, delays);

    if(durProp && durProp.indexOf('ms') < 0) {
      dur *= 1000;
    }

    if(delayProp && delayProp.indexOf('ms') < 0) {
      delay *= 1000;
    }

    return {
      event: endEvent,
      duration: parseInt(dur + delay, 10)
    };
  }

});
