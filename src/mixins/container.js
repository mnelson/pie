pie.mixins.container = {

  init: function() {
    this.children = [];
    this.childNames = {};
    if(this._super) this._super.apply(this, arguments);
  },

  addChild: function(name, child, idx) {
    var append = idx == null;
    idx = append ? this.children.length : idx;
    this.children.splice(idx, 0, child);

    this.childNames[name] = idx;
    child._indexWithinParent = idx;
    child._nameWithinParent = name;
    child.parent = this;

    if(!append) this.sortChildren();

    if(pie.object.has(child, 'addedToParent', true)) child.addedToParent.call(child);

    return this;
  },

  addChildren: function(obj) {
    pie.object.forEach(obj, function(name, child) {
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
    if(recurse && String(idx).indexOf('.') > 0) {
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

    return ~idx && pie.object.isNumber(idx) && this.children[idx] || undefined;
  },

  isInApp: function() {
    if(pie.object.isApp(this)) return true;
    else if(this.parent) {
      return this.parent.isInApp()
    } else {
      return false;
    }
  },

  bubble: function() {
    var args = pie.array.from(arguments),
    fname = args.shift(),
    obj = this.parent;

    while(obj && !pie.object.has(obj, fname, true)) {
      obj = obj.parent;
    }

    if(obj) return obj[fname].apply(obj, args);
  },

  sendToChildren: function(/* fnName, arg1, arg2 */) {
    var allArgs = pie.array.from(arguments),
    fnName = allArgs[0],
    args = allArgs.slice(1);

    this.children.forEach(function(child){
      if(pie.object.has(child, fnName, true)) child[fnName].apply(child, args);
      if(pie.object.has(child, 'sendToChildren', true)) child.sendToChildren.apply(child, allArgs);
    }.bind(this));
  },

  removeChild: function(obj) {
    var child = this.getChild(obj), i;

    if(child) {
      i = child._indexWithinParent;
      this.children.splice(i, 1);

      // clean up
      delete this.childNames[child._nameWithinParent];
      delete child._indexWithinParent;
      delete child._nameWithinParent;
      delete child.parent;

      this.sortChildren();

      if(pie.object.has(child, 'removedFromParent', true)) child.removedFromParent.call(child, this);
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
    if(fn) this.children.sort(fn);
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
    str += pad((indent ? '|- ' : '') + (this._nameWithinParent || this._indexWithinParent || this.__className) + ' (' + (this.__className || pie.uid(this)) + ')', indent);

    this.children.slice(0, 10).forEach(function(child) {
      str += "\n" + pad('|', nextIndent);
      str += child.__tree(nextIndent);
    });

    if(!indent) str += "\n";

    return str;
  }
};
