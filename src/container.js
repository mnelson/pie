pie.container = {

  addChild: function(name, child) {
    var children = this.children(),
    names = this.childNames(),
    idx;

    children.push(child);
    idx = children.length - 1;

    names[name] = idx;
    child._indexWithinParent = idx;
    child._nameWithinParent = name;

    if('addedToParent' in child) child.addedToParent.call(child, this);

    return this;
  },

  addChildren: function(obj) {
    pie.object.forEach(obj, function(name, child) {
      this.addChild(name, child);
    }.bind(this));
  },

  childNames: function() {
    return this._childNames = this._childNames || {};
  },

  children: function() {
    return this._children = this._children || [];
  },

  getChild: function(obj) {
    var name = obj._nameWithinParent || obj,
    idx = this.childNames()[name];

    /* jslint eqeq:true */
    if(idx == null) idx = obj;

    return ~idx && this.children()[idx] || undefined;
  },

  removeChild: function(obj) {
    var child = this.getChild(obj),
    names = this.childNames(),
    children = this.children(),
    i;

    if(child) {
      i = child._indexWithinParent;
      delete names[child._nameWithinParent];
      children.splice(i, 1);
      for(;i < children.length;i++) {
        children[i]._indexWithinParent = i;
      }

      if('removedFromParent' in child) child.removedFromParent.call(child, this);
    }

    return this;
  },

  removeChildren: function() {
    var children = this.children(),
    child;

    while(child = children[children.length-1]) {
      this.removeChild(child);
    }

    return this;
  }
};
