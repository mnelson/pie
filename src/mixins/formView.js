// # Pie FormView
// A view designed to ease form modeling & interactions.
// FormViews make use of bindings & validations to simplify the input, validation, and submission of forms.
// FormViews expect the activeView and bindings mixins to be included.
// ```
// myForm = new pie.formView({
//   fields: [
//     {
//       name: 'full_name'
//       validation: {
//         presence: true
//       }
//     },
//     ...
//     {
//       name: 'terms_of_service',
//       binding: {
//         type: 'check',
//         dataType: 'boolean'
//       },
//       validation: {
//         chosen: true
//       }
//     }
//   ]
// })
// ```
// Valid options are as follows:
//   * **fields** - a list of fields to bind to, validate, and submit. Each field can have the following:
//     * **name** - the name of the field to bind to. Should be the same as the name attribute of the field & the attribute you'd like to submit as.
//     * **binding** - options for the binding. All options present in `pie.mixins.bindings#normalizeBindingOptions` are available.
//     * **validation** - options for the validation. All options present in `pie.mixins.validatable` are available.
//   * **ajax** - (optional) an object of ajax options to use as part of the submission. By default it will infer the url & verb from the `<form>` this view contains.
//   * **formSel** - (optional) defaulted to "form", this is the selector which will be observed for submission.
//   * **model** - (optional) a model to be bound to. By default it will create a new model automatically. Keep in mind if you supply a model, the model will have validations applied to it.
//   * **validationStrategy** - (optional) a validation strategy to be applied to the model. See `pie.mixins.validatable` for more info on that.
//
// Upon submission a few things happen. If the ajax call is a success, the view's `onSuccess` function is invoked. The emitter also fires an `onSuccess` event.
// Similarly, upon failure, `onFailure` is invoked & emitted. If you override `ajax.extraError` or `ajax.success` in the options, the associated function & event will not be triggered.
// If you're overriding formView behavior, here's the general process which is taken:
//   1. Upon setup, fields are bound & initialized
//   2. Upon submission, fields are read one final time
//   3. A `submit` event is triggered on our emitter.
//   4. The model is validated.
//   5. If invalid, an `onInvalid` event is fired and the `onInvalid` function is invoked.
//   6. If invalid, an `onValid` event is fired and the `onValid` function is invoked.
//   7. By default, the `onValid` function invokes `prepareSubmissionData` with a callback.
//   8. `prepareSubmissionData` reads the fields out of the model. This is the point when ajax could take place if, say, a token needed to be generated by an external service (I'm talking to you, Stripe).
//   9. When the data is prepared, the callback is invoked.
//   10. The ajax request is made to the form target.
//   11. If unsuccessful, an `onFailure` event & function are triggered.
//   12. If successful, an `onSuccess` event & function are triggered.
pie.mixins.formView = {

  init: function() {
    this._super.apply(this, arguments);
    this._ensureModel();
    this._normalizeFormOptions();
  },

  setup: function() {
    this._setupFormBindings();

    this.on('submit', this.options.formSel, this.validateAndSubmitForm.bind(this));

    this._super.apply(this, arguments);
  },

  /* we build a model if one isn't present already */
  /* if the model doesn't know how to perform validations, we extend it with the functionality */
  _ensureModel: function() {
    this.model = this.model || this.options.model || new pie.model({});

    if(!this.model.validates) this.model.reopen(pie.mixins.validatable);
  },


  _normalizeFormOptions: function() {
    this.options.formSel  = this.options.formSel || 'form';
    this.options.fields   = this.options.fields || [];
    this.options.fields   = this.options.fields.map(function(field) {

      if(!field || !field.name) throw new Error("A `name` property must be provided for all fields.");

      field.binding = field.binding || {};
      field.binding.attr = field.binding.attr || field.name;

      return field;
    });
  },

  /* These `_on*` methods are provided to enable event observation. */
  /* Implementers of formView should override `on*` methods. */
  _onInvalid: function() {
    this.emitter.fire('onInvalid');
    this.onInvalid.apply(this, arguments);
  },

  _onFailure: function() {
    this.emitter.fire('onFailure');
    this.onFailure.apply(this, arguments);
  },

  _onSuccess: function() {
    this.emitter.fire('onSuccess');
    this.onSuccess.apply(this, arguments);
  },

  _onValid: function() {
    this.emitter.fire('onValid');
    this.onValid.apply(this, arguments);
  },

  _setupFormBindings: function() {
    var validation;

    this.options.fields.forEach(function(field) {

      this.bind(field.binding);

      validation = field.validation;

      if(validation) {
        validation = {};
        validation[field.name] = field.validation;
        this.model.validates(validation, this.options.validationStrategy);
      }
    }.bind(this));
  },

  /* The ajax options to be applied before submission */
  ajaxOptions: function() {
    return this.options.ajax;
  },

  /* the process of applying form data to the model. */
  applyFieldsToModel: function(/* form */) {
    this.readBoundFields();
  },

  // ** pie.formView.onInvalid **
  //
  // For the inheriting class to override.
  onInvalid: function(/* form */) {},


  // ** pie.formView.onValid **
  //
  // What happens when the model validations pass.
  // By default, the data is prepared for submission via `prepareSubmissionData`
  // and sent to `performSubmit`.
  onValid: function(form) {
    this.prepareSubmissionData(function(data) {

      this.performSubmit(form, data, function(bool, data) {

        if(bool) {
          this._onSuccess(data);
        } else {
          this._onFailure(data);
        }
      }.bind(this));

    }.bind(this));

  },

  // ** pie.formView.performSubmit **
  //
  // By default it builds an ajax request based on `this.options.ajax`
  // and / or the <form> tag identified by `form`.
  // Upon success or failure of the request, the `cb` is invoked with
  // a signature of `cb(success?, responseData)`
  // ```
  // formView.performSubmit(<form>, {foo: 'bar'}, function(isSuccess, data){ console.log(isSuccess, data); });
  // ```
  performSubmit: function(form, data, cb) {
    var request = app.ajax.ajax(pie.object.merge({
      url: form.getAttribute('action'),
      verb: form.getAttribute('method') || 'post',
      data: data
    }, this.ajaxOptions()));

    request.dataSuccess(function(d){
      cb(true, d);
    });

    request.extraError(function(xhr) {
      cb(false, xhr.data);
    });
  },

  /* for the inheriting class to override. */
  onFailure: function(/* response, xhr */) {},

  /* for the inheriting class to override. */
  onSuccess: function(/* response, xhr */) {},

  // ** pie.formView.prepareSubmissionData **
  //
  // The data to be sent to the server.
  // By default these are the defined fields extracted out of the model.
  prepareSubmissionData: function(cb) {
    var fieldNames = pie.array.map(this.options.fields, 'name'),
    data = this.model.gets(fieldNames);

    if(cb) cb(data);
    return data;
  },

  // ** pie.formView.validateModel **
  //
  // Perform validations on the model & invoke `cb` when complete.
  // By default, `model.validateAll` will be invoked but this can be overridden
  // to talk to external services, etc.
  validateModel: function(cb) {
    this.model.validateAll(cb);
  },

  // ** pie.formView.validateAndSubmitForm **
  //
  // Start the submission process. We apply our form fields to the model
  // via `applyFieldsToModel`, fire a submit event via our emitter, then
  // begin the validation process via `validateModel`. If the model validates,
  // we invoke our `onValid` function, otherwise the `onInvalid` function.
  validateAndSubmitForm: function(e) {
    this.consumeEvent(e);

    var form = e && e.delegateTarget;

    this.applyFieldsToModel(form);

    this.emitter.fire('submit');

    this.validateModel(function(bool) {
      if(bool) {
        this._onValid(form);
      } else {
        this._onInvalid(form);
      }
    }.bind(this));
  }

};
