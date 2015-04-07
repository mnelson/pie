var Simple = require('simple');
var PieDate = require('../extensions/date');

module.exports = Simple.extend('loadingViewTransition', {

  init: function() {
    this._super.apply(this, arguments);

    this.options.loadingClass = this.options.loadingClass || 'is-loading';
  },

  setLoading: function(bool) {
    this.targetEl.classList[bool ? 'add' : 'remove'](this.options.loadingClass);
  },

  addNewChild: function() {
    if(!this.newChild) {
      this.emitter.fire('afterAddNewChild');
      return;
    }

    this.begin = PieDate.now();

    this.setLoading(true);

    if(this.options.minDelay) {
      setTimeout(this.attemptToAddChild.bind(this), this.options.minDelay);
    }

    this.newChild.emitter.once('afterSetup', function() {
      this.attemptToAddChild(true);
    }.bind(this), {immediate: true});
  },

  attemptToAddChild: function(partOfAfterSetup) {
    var now = PieDate.now();
    if(partOfAfterSetup || this.newChild.emitter.hasEvent('afterSetup')) {
      if(!this.options.minDelay || now >= (this.begin + this.options.minDelay)) {
        if(!this.newChild.emitter.hasEvent('removedFromParent')) {
          this.setLoading(false);
          this.newChild.appendToDom(this.targetEl);
          this.emitter.fire('afterAddNewChild');
        }
      }
    }
  }
});
