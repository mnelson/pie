pie.dom._all = function(originalArgs, returnValues) {
  var nodes = pie.array.from(originalArgs[0]),
  meths = originalArgs[1].split('.'),
  args = Array.prototype.slice.call(originalArgs, 2),
  meth = meths[meths.length-1],
  assign = /=$/.test(meth),
  r, f, i, v;

  if(assign) meth = meth.substr(0,meth.length-1);
  if(returnValues) r = [];

  nodes.forEach(function(e){
    for(i=0;i < meths.length-1;i++) {
      f = e[meths[i]];
      e = pie.fn.valueFrom(f);
    }
    if(assign) v = e[meth] = args[0];
    else {
      f = e[meth];
      v = pie.fn.valueFrom(f, e, args);
    }

    if(returnValues) r.push(v);
  });

  return returnValues ? r : undefined;
};

// ###all
// Invokes the provided method or method chain with the provided arguments to all elements in the nodeList.
// Example usage:
// * pie.dom.all(nodeList, 'setAttribute', 'foo', 'bar');
// * pie.dom.all(nodeList, 'classList.add', 'active');
// * pie.dom.all(nodeList, 'clicked=', true);
//
// `nodeList` can either be a node, nodeList, or an array of nodes.
// `methodName` can be a string representing a method name, an attribute, or a property. Can be chained with periods. Can end in a `=` to invoke an assignment.
pie.dom.all = function(/* nodeList, methodName[, arg1, arg2, ...] */) {
  return pie.dom._all(arguments, false);
};

pie.dom.closest = function(el, sel) {
  while((el = el.parentNode) && !pie.dom.isDocument(el)) {
    if(pie.dom.matches(el, sel)) return el;
  }
};

// create an element based on the content provided.
pie.dom.createElement = function(str) {
  var wrap = document.createElement('div');
  wrap.innerHTML = str;
  return wrap.removeChild(wrap.firstElementChild);
};

pie.dom.cache = function() {
  pie.elementCache = pie.elementCache || new pie.cache();
  return pie.elementCache;
};

// Has the same method signature of `pie.dom.all` but returns the values of the result
// Example usage:
// * pie.dom.getAll(nodeList, 'clicked') //=> [true, true, false]
pie.dom.getAll = function() {
  return pie.dom._all(arguments, true);
};

pie.dom.isDocument = function(el) {
  return el && el.nodeType === el.DOCUMENT_NODE;
};

pie.dom.isWindow = function(el) {
  return el === window;
};

pie.dom.matches = function(el, sel) {
  if(el.matches) return el.matches(sel);

  var parent = el.parentNode || el.document;
  if(!parent || !parent.querySelectorAll) return false;

  var matches = parent.querySelectorAll(sel);
  for(var i = 0; i < matches.length; i++) {
    if(matches[i] === el) return true;
  }

  return false;
};

pie.dom.off = function(el, event, fn, selector, cap) {
  var eventSplit = event.split('.'),
    namespace, all, events;

  pie.setUid(el);
  event = eventSplit.shift();
  namespace = eventSplit.join('.');
  all = event === '*';

  events = pie.dom.cache().getOrSet('element-' + el.pieId + '.dom-events', {});

  (all ? Object.keys(events) : [event]).forEach(function(k) {
    pie.array.from(events[k]).forEach(function(obj, i, ary) {
      if(!cap && (k === 'focus' || k === 'blur') && obj.sel) cap = true;
      if((!namespace || namespace === obj.ns) && (!fn || fn === obj.fn) && (!selector || selector === obj.sel) && (cap === obj.cap)) {
        el.removeEventListener(k, obj.cb, obj.cap);
        delete ary[i];
      }

      events[k] = pie.array.compact(events[k]);
    });
  });
};

pie.dom.on = function(el, event, fn, selector, capture) {
  var eventSplit = event.split('.'),
      cb, namespace, events;

  event = eventSplit.shift();
  namespace = eventSplit.join('.');
  pie.setUid(el);

  // we force capture so that delegation works.
  if(!capture && (event === 'focus' || event === 'blur') && selector) capture = true;

  events = pie.dom.cache().getOrSet('element-' + el.pieId  + '.dom-events', {});
  events[event] = events[event] || [];

  cb = function(e) {
    var targ, els;

    if(namespace) {
      e.namespace = namespace;
    }

    if(!selector) {
      fn.call(el, e);
    } else {
      els = pie.array.from(el.querySelectorAll(selector));

      targ = pie.array.detect(els, function(qel) {
        return qel === e.target || qel.contains(e.target);
      });

      if(targ) {
        e.delegateTarget = targ;
        fn.call(targ, e);
      }
    }
  };

  events[event].push({
    ns: namespace,
    sel: selector,
    cb: cb,
    fn: fn,
    cap: capture
  });

  el.addEventListener(event, cb, capture);
  return cb;
};

pie.dom.parseForm = function() {
  var args = pie.array.from(arguments),
  form = args.shift(),
  names = pie.array.flatten(args),
  inputs = form.querySelectorAll('input[name], select[name], textarea[name]'),
  o = {};

  inputs = pie.array.from(inputs);
  inputs = pie.array.groupBy(inputs, 'name');

  pie.object.forEach(inputs, function(name,fields) {
    if(names.length && names.indexOf(name) < 0) return;

    if(!(name in o)) {
      o[name] = form.querySelectorAll('input[name="' + name + '"], select[name="' + name + '"], textarea[name="' + name + '"]').length > 1 ? [] : null;
    }
    fields = fields.filter(function(f){ return f.type.toLowerCase() === 'radio' || f.type.toLowerCase() === 'checkbox' ? f.checked : true; });

    if(Array.isArray(o[name])) o[name] = pie.array.map(fields, 'value');
    else o[name] = fields[0] && fields[0].value;
  });

  return o;
};

pie.dom.remove = function(el) {
  pie.setUid(el);
  pie.dom.cache().del('element-' + el.pieId);
  if(el.parentNode) el.parentNode.removeChild(el);
};

pie.dom.trigger = function(el, e, forceEvent) {

  if(!forceEvent && e === 'click') return el.click();

  var event = document.createEvent('Event');
  event.initEvent(e, true, true);
  return el.dispatchEvent(event);
};
