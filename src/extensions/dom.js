var Pie       = require('../pie');
var Arr       = require('array');
var Fn        = require('function');
var Obj       = require('object');
var Str       = require('string');
var Cache     = require('../cache');

// # Pie DOM Utilities
// A series of helpful methods for working with DOM elements.
var Dom = {
  _all: function(originalArgs, returnValues) {
    var nodes = Arr.from(originalArgs[0]),
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
        e = Fn.valueFrom(f);
      }
      if(assign) v = e[meth] = args[0];
      else {
        f = e[meth];
        v = Fn.valueFrom(f, e, args);
      }

      if(returnValues) r.push(v);
    });

    return returnValues ? r : undefined;
  },

  // **pie.dom.all**
  //
  // Invokes the provided method or method chain with the provided arguments to all elements in the nodeList.
  // `nodeList` can either be a node, nodeList, or an array of nodes.
  // `methodName` can be a string representing a method name, an attribute, or a property. Can be chained with periods. Can end in a `=` to invoke an assignment.
  // ```
  // pie.dom.all(nodeList, 'setAttribute', 'foo', 'bar');
  // pie.dom.all(nodeList, 'classList.add', 'active');
  // pie.dom.all(nodeList, 'clicked=', true);
  // ```
  all: function(/* nodeList, methodName[, arg1, arg2, ...] */) {
    return Dom._all(arguments, false);
  },

  // **pie.dom.closest**
  //
  // Retrieve the closest ancestor of `el` which matches the provided `sel`.
  // ```
  // var form = pie.dom.closest(input, 'form');
  // form.submit();
  // ```
  closest: function(el, sel) {
    while((el = el.parentNode) && !Dom.isDocument(el)) {
      if(Dom.matches(el, sel)) return el;
    }
  },

  // **pie.dom.createElement**
  //
  // Create an element based on the string content provided.
  // ```
  // var el = pie.dom.createElement('<div class="foo"><strong>Hi</strong>, John</div>')
  // el.innerHTML
  // //=> "<strong>Hi</strong>, John"
  // el.classList
  // //=> ['foo']
  // ```
  createElement: function(str) {
    var wrap = document.createElement('div');
    wrap.innerHTML = str;
    return wrap.removeChild(wrap.firstElementChild);
  },

  // **pie.dom.cache**
  //
  // A cache created solely for caching element specific information,
  // easier for cleanup via `pie.dom.remove()`.
  cache: function() {
    Pie.elementCache = Pie.elementCache || new Cache();
    return Pie.elementCache;
  },

  // **pie.dom.getAll**
  //
  // Has the same method signature of `pie.dom.all` but returns the values of the result
  // ```
  // pie.dom.getAll(nodeList, 'clicked')
  // //=> [true, true, false]
  // ```
  getAll: function() {
    return Dom._all(arguments, true);
  },

  // **pie.dom.isDocument**
  //
  // Determine whether the `el` is a document node.
  isDocument: function(el) {
    return el && el.nodeType === el.DOCUMENT_NODE;
  },

  // **pie.dom.isWindow**
  //
  // Determine whether the provided `el` is the `window`.
  isWindow: function(el) {
    return el === window;
  },

  // **pie.dom.matches**
  //
  // Test whether an element matches a given selector.
  // ```
  // pie.dom.matches(form, 'input');
  // //=> false
  // pie.dom.matches(form, 'form');
  // //=> true
  // ```
  matches: function(el, sel) {
    var fn = Dom.prefixed(el, 'matches');
    if(fn) return fn(sel);

    fn = Dom.prefixed(el, 'matchesSelector');
    if(fn) return fn(sel);

    var parent = el.parentNode || el.document;
    if(!parent || !parent.querySelector) return false;

    pie.setUid(el);
    el.setAttribute('data-pie-id', el.pieId);

    sel += '[data-pie-id="' + el.pieId + '"]';
    return parent.querySelector(sel) === el;
  },

  // **pie.dom.off**
  //
  // Remove an observer from an element. The more information provided the more tests will be run to determine
  // whether the observer is a match. Support of namespaces are the same as `pie.dom.on`, however, in the case
  // of `off`, `"*"` can be provided to remove all events within a namespace.
  // ```
  // pie.dom.off(document.body, 'click');
  // pie.dom.off(document.body', 'click.fooNs');
  // pie.dom.off(document.body', '*.fooNs');
  // ```

  off: function(el, event, fn, selector, cap) {
    var eventSplit = event.split('.'),
      namespace, all, events, compactNeeded;

    pie.setUid(el);
    event = eventSplit.shift();
    namespace = eventSplit.join('.');
    all = event === '*';

    events = Dom.cache().getOrSet('element-' + el.pieId + '.dom-events', {});

    (all ? Object.keys(events) : [event]).forEach(function(k) {
      compactNeeded = false;

      Arr.from(events[k]).forEach(function(obj, i, ary) {
        if(cap == null && (k === 'focus' || k === 'blur') && obj.sel) cap = true;
        if((namespace == null || namespace === obj.ns) &&
            (fn == null || fn === obj.fn) &&
            (selector == null || selector === obj.sel) &&
            (cap === obj.cap)) {
          el.removeEventListener(k, obj.cb, obj.cap);
          delete ary[i];
          compactNeeded = true;
        }
      });

      if(compactNeeded) events[k] = Arr.compact(events[k]);

    });
  },

  // **pie.dom.on**
  //
  // Observe an event on a particular `el`.
  // ```
  // var handler = function(e){
  //   var btn = e.delegateTarget;
  //   btn.classList.toggle('is-loading');
  // }
  // pie.dom.on(pie.qs('.btn'), 'click', handler);
  // // => all events on the first .btn will be observed.
  // ```
  // Optionally, the event can be filtered by a `selector`.
  // If a selector is provided, a `delegateTarget` which represents the
  // matching target as defined by `selector` will be placed
  // on the event. The event is then provided to `fn`.
  //
  // ```
  // pie.dom.on(document.body, 'click', handler, '.btn');
  // //=> all events that bubble to document.body and pass through or
  // //=> originate from a .btn, will be observed.
  // ```
  on: function(el, event, fn, selector, capture) {
    var eventSplit = event.split('.'),
        cb, namespace, events;

    event = eventSplit.shift();
    namespace = eventSplit.join('.');
    pie.setUid(el);

    // we force capture so that delegation works.
    if(!capture && (event === 'focus' || event === 'blur') && selector) capture = true;

    events = Dom.cache().getOrSet('element-' + el.pieId  + '.dom-events', {});
    events[event] = events[event] || [];

    cb = function(e) {
      var targ, els, qel;

      if(namespace) {
        e.namespace = namespace;
      }

      if(!selector) {
        fn.call(el, e);
      } else {
        // if the target matches the selector, it is the delegateTarget.
        targ = Dom.matches(e.target, selector) ? e.target : null;

        // othwerwise, try to find a parent that is a child of el which matches the selector.
        if(!targ) {
          qel = Dom.closest(e.target, selector);
          if(qel && el.contains(qel)) targ = qel;
        }

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
  },

  // **pie.dom.parseForm**
  //
  // Given a form element `el` parse the names & values from it.
  // Optionally, the fields to parse can be filtered by providing a list of names.
  //
  // Given the markup:
  // ```
  // <form>
  //   <input name="fullName" />
  //   <input name="email" />
  //   <select name="interest">...</select>
  // </form>
  // ```
  // We can retrieve the fields using `parseForm`.
  // ```
  // pie.dom.parseForm(form)
  // //=> {fullName: 'foo', email: 'foo@bar.com', interest: 'user'}
  // pie.dom.parseForm(form, 'fullName')
  // //=> {fullName: 'foo'}
  // ```
  parseForm: function(/* el, *fields */) {
    var args = Arr.from(arguments),
    form = args.shift(),
    names = Arr.flatten(args),
    inputs = form.querySelectorAll('input[name], select[name], textarea[name]'),
    o = {},
    origLength;

    inputs = Arr.groupBy(inputs, 'name');

    Obj.forEach(inputs, function(name,fields) {
      if(names.length && names.indexOf(name) < 0) return;

      origLength = fields.length;

      if(fields[0].type === 'radio') {
        origLength = 1;
        fields = fields.filter(function(f){ return f.checked; });
      } else {
        fields = fields.filter(function(f){ return f.type === 'checkbox' ? f.checked : true; });
      }


      if(origLength > 1) o[name] = Arr.map(fields, 'value');
      else o[name] = fields[0] && fields[0].value;
    });

    return o;
  },

  // **pie.dom.prependChild**
  //
  // Insert a child at the top of the parent.
  // ```
  // // el = <div><p>Things</p></div>
  // // child = <h3>Title</h3>
  // pie.dom.prependChild(el, child)
  // // el = <div><h3>Title</h3><p>Things</p></div>
  // ```
  prependChild: function(el, child) {
    el.insertBefore(child, el.firstChild);
  },

  // **pie.dom.remove**
  //
  // Remove `el` from the dom, clearing any cache we've constructed.
  // If you intend on adding the element back into the dom you should
  // remove `el` manually, not via `pie.dom.remove`.
  //
  // ```
  // pie.dom.remove(el)
  // // => el.parentNode == null;
  // ```
  remove: function(el) {
    pie.setUid(el);
    Dom.cache().del('element-' + el.pieId);
    if(el.parentNode) el.parentNode.removeChild(el);
  },

  // **pie.dom.scrollParents**
  //
  // Find all the parent elements of `el` that have a scroll property.
  // Useful for spying on scroll and determing element position.
  // Optionally, you can provide the following options:
  //  * direction = 'x' or 'y', defaults to null (both)
  //  * includeSelf - if `true` it will evaluate `el`'s scroll property and include it in the parent list.
  //  * closest - if `true` it will return the first scroll parent instead of all of them.
  //
  // ```
  // pie.dom.scrollParents(el)
  // //=> document.body
  // ```
  // **Note** window will not be included in the response.
  scrollParents: (function(){
    var regex = /scroll|auto/,
    prop = function(el, dir) {
      var style = getComputedStyle(el),
      flow = style.getPropertyValue('overflow');
      if(!dir || dir === 'x') flow += style.getPropertyValue('overflow-x');
      if(!dir || dir === 'y') flow += style.getPropertyValue('overflow-y');
      return flow;
    };

    return function(el, options) {
      var parents = options && options.closest ? undefined : [],
      style;

      if(!options || !options.includeSelf) el = el.parentNode;

      while(el && !Dom.isDocument(el)) {
        style = prop(el, options && options.direction);

        if(regex.test(style)) {
          if(options && options.closest) return el;
          parents.unshift(el);
        }

        el = el.parentNode;
      }

      return parents;
    };
  })(),

  // **pie.dom.scrollTo**
  //
  // Scroll the page to `sel`.
  // If `sel` is a string it will find the first occurrence via a querySelector.
  // Available options:
  //  * container - the container to scroll, defaults to document.body
  //  * cb - the callback to invoke when scrolling is finished.
  //  * onlyUp - only scrolls if the element is above the current position.
  //  * onlyDown - only scrolls if the element is below the current position.
  //  * * - any option available in Fn.ease
  //
  // ```
  // pie.dom.scrollTo('header', {onlyUp: true, cb: fn, name: 'easeInQuart'});
  scrollTo: function(sel, options) {
    var position = 0,
    container = options && options.container || document.body,
    cb = options && options.cb,
    quit = false;

    if(sel) {
      var target = Obj.isString(sel) ? container.querySelector(sel) : sel;
      while(target && target !== container) {
        position += (target.offsetTop - target.scrollTop);
        target = target.offsetParent;
      }
    }

    if(options) {
      if(options.onlyUp && container.scrollTop <= position) quit = true;
      if(options.onlyDown && container.scrollTop >= position) quit = true;
    }

    if(position === container.scrollTop) quit = true;

    if(quit) {
      if(cb) cb();
      return;
    }

    options = Obj.merge({
      from: container.scrollTop,
      to: position,
      name: 'easeInOutCubic',
      duration: 250
    }, options);

    delete options.cb;
    delete options.container;
    delete options.onlyUp;
    delete options.onlyDown;

    Fn.ease(function(p){
      container.scrollTop = p;
    }, options, cb);

  },

  // **pie.dom.trigger**
  //
  // Trigger an event `e` on `el`.
  // If the event is a click, it will invoke the click() handler instead of creating
  // a dom event. This is for browser compatability reasons (certain versions of FF).
  // If you want to force an event, pass true as the third argument.
  //
  // ```
  // pie.dom.trigger(el, 'click');
  // pie.dom.trigger(el, 'foo.bar');
  // ```
  //
  trigger: function(el, e, forceEvent) {

    if(!forceEvent && e === 'click') return el.click();

    var event = document.createEvent('Event');
    event.initEvent(e, true, true);
    return el.dispatchEvent(event);
  },

  // **pie.dom.prefixed**
  //
  // Find the first available version of the desired function, including browser specific implementations.
  // ```
  // pie.dom.prefixed(el, 'matches');
  // pie.dom.prefixed(el, 'matchesSelector');
  // pie.dom.prefixed(getComputedStyle(document.body), 'animation-delay')
  // ```
  prefixed: (function(){
    var prefixes = ['', 'webkit', 'moz', 'ms', 'o'],
    returnVal = function(val, el){
      return Obj.isFunction(val) ? val.bind(el) : val;
    };

    return function(el, standardName) {
      var prefix, i = 0,
      capd = Str.capitalize(standardName);

      for(; i < prefixes.length; i++) {
        prefix = prefixes[i];

        if(el[prefix + standardName]) return returnVal(el[prefix + standardName], el);
        if(el['-' + prefix + '-' + standardName]) return returnVal(el['-' + prefix + '-' + standardName], el);
        if(el[prefix + capd]) return returnVal(el[prefix + capd], el);
      }
    };
  })()
};

module.exports = Dom;
