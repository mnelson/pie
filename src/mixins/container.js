var Arr = require('../extensions/array');
var Obj = require('../extensions/object');

module.exports = {

  init: function() {
    this.children = [];
    this.childNames = {};
    if(this._super) this._super.apply(this, arguments);
  },

  addChild: function(name, child) {
    var idx;

    this.children.push(child);
    idx = this.children.length - 1;

    this.childNames[name] = idx;
    child._indexWithinParent = idx;
    child._nameWithinParent = name;
    child.parent = this;

    if(Obj.has(child, 'addedToParent', true)) child.addedToParent.call(child);

    return this;
  },

  addChildren: function(obj) {
    Obj.forEach(obj, function(name, child) {
      this.addChild(name, child);
    }.bind(this));
  },

  getChild: function(obj, recurse) {
    /* jslint eqeq:true */
    if(obj == null) return;
    if(obj._nameWithinParent) return obj;

    var idx = this.childNames[obj];
    if(idx == null) idx = obj;

    if(recurse === undefined) recurse = true;

    // It's a path.
    if(recurse && String(idx).match(/\./)) {
      var steps = idx.split('.'),
      child = this, step;
      while(step = steps.shift()) {
        child = child.getChild(step);
        if(!child) return undefined;
        /* dig as far as we can go, if we have non-container child we're done */
        if(steps.length && !child.getChild) return undefined;
      }

      return child;
    }

    return ~idx && this.children[idx] || undefined;
  },

  bubble: function() {
    var args = Arr.from(arguments),
    fname = args.shift(),
    obj = this.parent;

    while(obj && !(fname in obj)) {
      obj = obj.parent;
    }

    if(obj) return obj[fname].apply(obj, args);
  },

  sendToChildren: function(/* fnName, arg1, arg2 */) {
    var allArgs = Arr.change(arguments, 'from'),
    fnName = allArgs[0],
    args = allArgs.slice(1);

    this.children.forEach(function(child){
      if(Obj.has(child, fnName, true)) child[fnName].apply(child, args);
      if(Obj.has(child, 'sendToChildren', true)) child.sendToChildren.apply(child, allArgs);
    }.bind(this));
  },

  removeChild: function(obj) {
    var child = this.getChild(obj), i;

    if(child) {
      i = child._indexWithinParent;
      this.children.splice(i, 1);

      for(;i < this.children.length;i++) {
        this.children[i]._indexWithinParent = i;
        this.childNames[this.children[i]._nameWithinParent] = i;
      }

      // clean up
      delete this.childNames[child._nameWithinParent];
      delete child._indexWithinParent;
      delete child._nameWithinParent;
      delete child.parent;

      if(Obj.has(child, 'removedFromParent', true)) child.removedFromParent.call(child, this);
    }

    return this;
  },

  removeChildren: function() {
    var child;

    while(child = this.children[this.children.length-1]) {
      this.removeChild(child);
    }

    return this;
  },

  sortChildren: function(fn) {
    this.children.sort(fn);
    this.children.forEach(function(c, i) {
      c._indexWithinParent = i;
      this.childNames[c._nameWithinParent] = i;
    }.bind(this));
  },

  __tree: function(indent) {
    indent = indent || 0;
    var pad = function(s, i){
      if(!i) return s;
      while(i-- > 0) s = " " + s;
      return s;
    };
    var str = "\n", nextIndent = indent + (indent ? 4 : 1);
    str += pad((indent ? '|- ' : '') + (this._nameWithinParent || this._indexWithinParent || this.className) + ' (' + (this.className || this.pieId) + ')', indent);

    this.children.forEach(function(child) {
      str += "\n" + pad('|', nextIndent);
      str += child.__tree(nextIndent);
    });

    if(!indent) str += "\n";

    return str;
  }
};
