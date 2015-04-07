var Arr = require('../extensions/array');
var Fn  = require('../extensions/function');
var Obj = require('../extensions/object');

// # Bindings Mixin
// A mixin to provide two way data binding between a model and dom elements.
// This mixin should be used with a pie view.
module.exports = (function(){


  var integrations = {};


  // Bind to an element's attribute.
  integrations.attribute = (function(){

    // extract the attribute name from the binding configuration.
    var attributeName = function(binding){
      return binding.options.attribute || ('data-' + binding.attr);
    };

    return {

      getValue: function(el, binding) {
        return el.getAttribute(attributeName(binding));
      },

      setValue: function(el, binding) {
        var value = binding.model.get(binding.attr);
        return el.setAttribute(attributeName(binding), value);
      }

    };
  })();

  integrations['class'] = (function(){

    /* will handle strings and arrays of strings */
    var getClassNames = function(string) {
      if(!string) return [];
      string = String(string);
      return Arr.compact(Arr.map(string.split(/[\,\s]/), 'trim', true), true);
    };

    return {
      getValue: function(/* el, binding */) {
        throw new Error("class bindings can only be from the model to the view. Please declare toModel: false");
      },

      setValue: function(el, binding) {
        var className = binding.options.className;

        if(className === '_value_') {
          var change = binding.lastChange;
          if(change) {
            if(change.oldValue) {
              getClassNames(change.oldValue).forEach(function(c) {
                el.classList.remove(c);
              });
            }

            if(change.value) {
              getClassNames(change.value).forEach(function(c) {
                el.classList.add(c);
              });
              return change.value;
            }
          }
        } else {
          var value = binding.model.get(binding.attr);
          className = className || binding.attr;

          getClassNames(className).forEach(function(c){
            el.classList[!!value ? 'add' : 'remove'](c);
          });

          return className;
        }
      }
    };
  })();

  integrations.value = {

    // Simple value extraction
    getValue: function(el /*, binding */) {
      return el.value;
    },

    // Apply the model's value to the element's value.
    setValue: function(el, binding) {
      var value = binding.model.get(binding.attr);
      /* jslint eqnull:true */
      if(value == null) value = '';
      return el.value = value;
    }

  };

  integrations.check = (function(){

    // String based index.
    var index = function(arr, value) {
      if(!arr) return -1;
      value = String(value);
      return Arr.indexOf(arr, function(e){ return String(e) === value; });
    };

    return {

      getValue: function(el, binding) {

        // If we have an array, manage the values.
        if(binding.dataType === 'array') {

          var existing = Arr.from(binding.model.get(binding.attr)), i;

          i = index(existing, el.value);

          // If we are checked and we don't already have it, add it.
          if(el.checked && i < 0) {
            existing = Arr.dup(existing);
            existing.push(el.value);
          // If we are not checked but we do have it, then we add it.
          } else if(!el.checked && i >= 0) {
            existing = Arr.dup(existing);
            existing.splice(i, 1);
          }

          return existing;
        } else if(binding.dataType === 'boolean'){
          return el.checked;
        } else {
          // Otherwise, we return the el's value if it's checked.
          return el.checked ? el.value : null;
        }
      },

      // If the model's value contains the checkbox, check it.
      setValue: function(el, binding) {
        var value = binding.model.get(binding.attr),
        elValue = el.value;

        // In the case of an array, we check for inclusion.
        if(binding.dataType === 'array') {
          var i = index(value, elValue);
          return el.checked = !!~i;
        } else {
          var caster = typeCaster(binding.dataType);

          // Otherwise we check for equality
          return el.checked = caster(elValue) === caster(value);
        }
      }
    };

  })();


  integrations.radio = {

    // If a radio input is checked, return it's value.
    // Otherwise, return the existing value.
    getValue: function(el, binding) {
      var existing = binding.model.get(binding.attr);
      if(el.checked) return el.value;
      return existing;
    },

    // Check a radio button if the value matches.
    setValue: function(el, binding) {
      var value = binding.model.get(binding.attr),
      elValue = el.value,
      caster = typeCaster(binding.dataType);

      /* jslint eqeq:true */
      return el.checked = caster(elValue) === caster(value);
    }

  };

  // Set the innerTEXT of an element based on the model's value.
  integrations.text = {

    getValue: function(el /*, binding */) {
      return el.textContent;
    },

    setValue: function(el, binding) {
      var value = binding.model.get(binding.attr);

      /* jslint eqnull:true */
      if(value == null) value = '';
      return el.textContent = value;
    }

  };

  // Set the innerHTML of an element based on the model's value.
  integrations.html = {

    getValue: function(el /*, binding */) {
      return el.innerHTML;
    },

    setValue: function(el, binding) {
      var value = binding.model.get(binding.attr);
      /* jslint eqnull:true */
      if(value == null) value = '';
      return el.innerHTML = value;
    }

  };

  // If type=auto, this does it's best to determine the appropriate integration.
  var determineIntegrationForBinding = function(el, binding) {
      var mod;
      if(el.hasAttribute && el.hasAttribute('data-' + binding.attr)) mod = 'attribute';
      else if(el.nodeName === 'INPUT' && el.getAttribute('type') === 'checkbox') mod = 'check';
      else if(el.nodeName === 'INPUT' && el.getAttribute('type') === 'radio') mod = 'radio';
      else if(el.nodeName === 'INPUT' || el.nodeName === 'SELECT' || el.nodeName === 'TEXTAREA') mod = 'value';
      else mod = 'text';

      return integrations[mod];
    };

  // Provide a way to retrieve values out of the dom & apply values to the dom.
  var integration = function(el, binding) {
    if(binding.type === 'auto') return determineIntegrationForBinding(el, binding);
    return integrations[binding.type] || integrations.value;
  };



  // A set of methods to cast raw values into a specific type.
  var typeCasters = {

    // Note that `undefined` and `null` will result in `[]`.
    array: function(raw) {
      return Arr.from(raw);
    },

    boolean: (function(){

      // Match different strings representing truthy values.
      var reg = /^(1|true|yes|t|ok|on)$/;

      return function(raw) {
        if(raw == null) return raw;
        return !!(raw && reg.test(String(raw)));
      };

    })(),

    // Attempt to parse as a float, if `NaN` return `null`.
    number: function(raw) {
      var val = parseFloat(raw, 10);
      if(isNaN(val)) return null;
      return val;
    },

    // Attempt to parse as an integer, if `NaN` return `null`.
    integer: function(raw) {
      var val = parseInt(raw, 10);
      if(isNaN(val)) return null;
      return val;
    },

    // `null` or `undefined` are passed through, otherwise cast as a String.
    string: function(raw) {
      return raw == null ? raw : String(raw);
    },

    "default" : function(raw) {
      return raw;
    }

  };

  // The type caster based on the `dataType`.
  var typeCaster = function(dataType) {
    return typeCasters[dataType] || typeCasters['default'];
  };


  // Take horrible user provided options and turn it into magical pie options.
  var normalizeBindingOptions = function(given) {

    if(!given.attr) throw new Error("An attr must be provided for data binding. " + JSON.stringify(given));

    var out         = {};
    /* the model attribute to be observed / updated. */
    out.attr        = given.attr;
    /* the model to apply changes to. */
    out.model       = given.model       || this.model;
    /* the selector to observe */
    out.sel         = given.sel         || '[name="' + given.attr + '"]';
    /* the way in which the binding should extract the value from the dom. */
    out.type        = given.type        || 'auto';
    /* the desired type the dom value's should be cast to. */
    out.dataType    = given.dataType    || 'default';
    /* if `dataType` is "array", they type which should be applied to each. */
    out.eachType    = given.eachType    || undefined;
    /* when an input changes or has a keyup event, the model will update. */
    out.trigger     = given.trigger     || 'change keyup';
    /* just in case the dom events should be based on a different field than that provided by `sel` */
    out.triggerSel  = given.triggerSel  || out.sel;
    /* if toModel is not provided, it's presumed to be desired. */
    out.toModel     = given.toModel     || (given.toModel === undefined && out.type !== 'class');
    /* if toView is not provided, it's presumed to be desired. */
    out.toView      = given.toView      || given.toView === undefined;
    /* no debounce by default. */
    out.debounce    = given.debounce    || false;
    /* secondary options. */
    out.options     = given.options     || {};

    /* A `true` value will results in a default debounce duration of 250ms. */
    if(out.debounce === true) out.debounce = 250;

    return out;
  };

  // Apply a value to the model, ensuring the model-to-view triggers do not take place.
  var applyValueToModel = function(value, binding, opts) {
    try{
      binding.ignore = true;
      binding.model.set(binding.attr, value, opts);

    // Even if we error, we should reset the ignore.
    } finally {
      binding.ignore = false;
    }
  };

  // Take a model's value, and apply it to all relevant elements within `parentEl`.
  var applyValueToElements = function(parentEl, binding) {
    if(binding.ignore) return;

    var els = parentEl.querySelectorAll(binding.sel);

    // For each matching element, set the value based on the binding.
    for(var i = 0; i < els.length; i++) {
      integration(els[i], binding).setValue(els[i], binding);
    }
  };

  // Extract a value out of an element based on a binding configuration.
  var getValueFromElement = function(el, binding) {
    // Get the basic value out of the element.
    var val = integration(el, binding).getValue(el, binding),
    // Get the type casting function it based on the configuration.
    fn = typeCaster(binding.dataType);
    // Type cast the value.
    val = fn(val);

    // If we're configured to have an array and have defined an `eachType`
    // use it to typecast each value.
    if(binding.dataType === 'array' && binding.eachType) {
      var eachFn = typeCaster(binding.eachType);
      val = val.map(eachFn);
    }

    return val;
  };

  // ### Binding Initializations
  // With a binding configuration ready, let's wire up the callbacks.
  var initCallbacks = function(binding) {
    initModelCallbacks.call(this, binding);
    initViewCallbacks.call(this, binding);

    return binding;
  };

  // Wiring of the view-to-model callbacks. These will observe dom events
  // and translate them to model values.
  var initViewCallbacks = function(binding) {

    // If no view-to-model binding is desired, escape.
    if(!binding.toModel) return;

    // If a function is provided, use that as the base implementation.
    if(Obj.isFunction(binding.toModel)) {
      binding._toModel = binding.toModel;
    } else {
      // Otherwise, we provide a default implementation.
      binding._toModel = function(el, opts) {
        var value = getValueFromElement(el, binding);
        applyValueToModel(value, binding, opts);
      };
    }

    // We wrap our base implementation with a function that handles event arguments
    binding.toModel = function(e) {
      var el = e.delegateTarget;
      binding._toModel(el);
    };

    // If a debounce is requested, we apply the debounce to the wrapped function,
    // Leaving the base function untouched.
    if(binding.debounce) binding.toModel = Fn.debounce(binding.toModel, binding.debounce);

    // Multiple events could be supplied, separated by a space.
    var events = binding.trigger.split(' ');
    events.forEach(function(event){
      // Use the view's event management to register the callback.
      this.on(event, binding.triggerSel, binding.toModel);
    }.bind(this));
  };

  // Initialization of model-to-view callbacks. These will observe relevant model
  // changes and update the dom.
  var initModelCallbacks = function(binding) {
    // If no model-to-view binding is desired, escape.
    if(!binding.toView) return;

    // If a toView function is not provided, apply the default implementation.
    if(!Obj.isFunction(binding.toView)) {
      binding.toView = function(changes) {
        binding.lastChange = changes && changes.get(binding.attr);
        applyValueToElements(this.el, binding);
      }.bind(this);
    }

    // Register a change observer with the new.
    this.onChange(binding.model, binding.toView, binding.attr);
  };


  // ## Bindings Mixin
  return {

    // The registration & configuration of bindings is kept in this._bindings.
    init: function() {
      this._bindings = [];
      if(this._super) this._super.apply(this, arguments);
    },

    // If we have an emitter, tap into the afterRender event and initialize the dom
    // with our model values.
    setup: function() {
      if(this.emitter) this.emitter.prepend('afterRender', this.initBoundFields.bind(this));
      if(this._super) this._super.apply(this, arguments);
    },

    // Register 1+ bindings within the view.
    //
    // ```
    // this.bind({ attr: 'first_name' }, { attr: 'last_name' })
    // ```;
    bind: function() {
      var wanted = Arr.from(arguments);
      wanted = wanted.map(function(opts) {
        opts = normalizeBindingOptions.call(this, opts);
        return initCallbacks.call(this, opts);
      }.bind(this));

      this._bindings = this._bindings.concat(wanted);
    },

    // Iterate each binding and propagate the model value to the dom.
    initBoundFields: function() {
      this._bindings.forEach(function(b){
        if(b.toView) b.toView();
      });
    },


    /* Iterate each binding and propagate the dom value to the model. */
    /* A single set of change records will be produced (`_version` will only increment by 1). */
    readBoundFields: function() {
      var models = {}, skip = {skipObservers: true}, els, i;

      this._bindings.forEach(function(b) {
        if(!b.toModel) return;

        models[b.model.pieId] = b.model;
        els = this.qsa(b.sel);

        for(i = 0; i < els.length; i++) {
          b._toModel(els[i], skip);
        }
      }.bind(this));

      Obj.forEach(models, function(id, m) {
        m.deliverChangeRecords();
      });

    }
  };

})();
