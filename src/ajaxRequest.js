pie.ajaxRequest = pie.model.extend('ajaxRequest', {

  init: function(data, options) {
    this._super(data, options);

    this.getOrSet('headers', {});

    this.xhr = null;
    this.emitter = pie.emitter.create();

    this.validates({
      url: { presence: true },
      verb: { inclusion: { in: pie.object.values(this.VERBS) }}
    }, null);
  },

  VERBS: {
    del: 'DELETE',
    get: 'GET',
    patch: 'PATCH',
    post: 'POST',
    put: 'PUT'
  },

  _append: function(name, fns, immediate) {
    fns = pie.array.change(fns, 'from', 'flatten');
    fns.forEach(function(fn){
      this.emitter.on(name, fn, {immediate: immediate});
    }.bind(this));
  },

  _onDataSuccess: function(data) {
    this.emitter.fire('dataSuccess', data);
  },

  _onSetModel: function(data) {
    this.emitter.fire('setModel', data);
  },

  _onSuccess: function(data, xhr) {
    this.emitter.fire('success', data, xhr);
  },

  _onComplete: function(xhr) {
    this.emitter.fire('complete', xhr);
  },

  _onError: function(xhr) {
    this.emitter.fire('error', xhr);
    this.emitter.fire('extraError', xhr);
  },

  _onProgress: function(event) {
    this.emitter.fire('progress', event);
  },

  _onUploadProgress: function(event) {
    this.emitter.fire('uploadProgress', event);
  },

  _parseOptions: function(options) {
    if(!options) return;

    options = pie.object.merge({}, options);

    ['setup', 'complete', 'dataSuccess', 'error', 'extraError', 'progress', 'success', 'uploadProgress', 'setModel'].forEach(function(n){
      if(options[n]) {

        pie.array.from(options[n]).forEach(function(fn){
          this[n](fn);
        }.bind(this));

        delete options[n];
      }
    }.bind(this));

    this.sets(options);
  },

  _validateOptions: function(cb) {
    // upcase before we validate inclusion.
    if(this.get('verb')) this.set('verb', this.get('verb').toUpperCase());

    return this.validateAll().catch(function(){
      throw new Error(JSON.stringify(this.get('validationErrors')));
    });
  },

  _applyHeaders: function(xhr) {

    var accept = this.get('accept'),
    contentType = this.get('contentType'),
    headers = this.get('headers'),
    data = this.get('data');

    this._applyCsrfToken(xhr);

    if(accept) {
      headers['Accept'] = accept;
    }

    if(contentType !== false) {

      if(contentType) {
        headers['Content-Type'] = contentType;
      }

      if(!headers['Content-Type']) {
        if(pie.object.isString(data) || pie.object.instanceOf(data, 'FormData')) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        // if we aren't already sending a string, we will encode to json.
        } else {
          headers['Content-Type'] = 'application/json';
        }
      }

    }

    if(!headers['X-Requested-With']) {
      headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    pie.object.forEach(headers, function(k,v) {
      xhr.setRequestHeader(k, v);
    });

  },

  _applyCsrfToken: function(xhr) {

    var token = pie.fn.valueFrom(this.get('csrfToken')) || this.app.cache.fetch('csrfToken', function(){
      var el = pie.qs('meta[name="csrf-token"]');
      return el ? el.getAttribute('content') : null;
    });

    if(token) {
      xhr.setRequestHeader('X-CSRF-Token', token);
    }
  },

  _parseResponse: function(xhr) {
    var accept = this.get('accept'),
    parser = accept && this.responseParsers[accept] || this.responseParsers.default;
    xhr.data = this.response = parser.call(this, xhr);
  },

  responseParsers: {

    "application/json" : function(xhr) {
      try{
        return xhr.responseText.trim().length ? JSON.parse(xhr.responseText) : {};
      } catch(err) {
        this.app.debug.apply(this.app, pie._debugArgs("could not parse JSON response: " + err));
        return {};
      }
    },

    "default" : function(xhr) {
      return xhr.responseText;
    }
  },

  _buildXhr: function() {
    var xhr = new XMLHttpRequest(),
    url = this.get('url'),
    verb = this.get('verb'),
    data = this.get('data'),
    tracker = this.get('tracker'),
    self = this;

    if(verb === this.VERBS.get && data) {
      url = pie.string.urlConcat(url, pie.object.serialize(data));
    }

    url = pie.string.normalizeUrl(url);

    if(this.hasCallback('progress')) {
      xhr.addEventListener('progress', this._onProgress.bind(this), false);
    }

    if(this.hasCallback('uploadProgress')) {
      xhr.upload.addEventListener('progress', this._onUploadProgress.bind(this), false);
    }

    xhr.open(verb, url, true);

    this._applyHeaders(xhr);
    this.emitter.fire('setup', xhr, this);

    xhr.onload = function() {
      if(tracker) tracker(xhr, self);

      self._parseResponse(xhr);

      if(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        self._onDataSuccess(self.response);
        self._onSetModel(self.response);
        self._onSuccess(self.response, xhr);
      } else {
        self._onError(xhr);
      }

      self._onComplete(xhr);
    };

    this.xhr = xhr;

    this.emitter.fire('xhrBuilt', xhr);

    return xhr;
  },

  // Validate the options and build the xhr object.
  // By default, it immediately sends the request.
  // By passing `skipSend = false` you can manage the `send()` invocation manually.
  build: function(options, skipSend) {
    this._parseOptions(options);

    var p = this._validateOptions().then('_buildXhr');
    if(!skipSend) p = p.then('send');
    return this;
  },

  // Send the xhr. Assumes build() has been called.
  send: function() {
    var data = this.get('data'), d;

    if(this.get('verb') !== this.VERBS.get) {

      if(pie.object.isString(data) || pie.object.instanceOf(data, 'FormData')) {
        d = data;
      } else {
        d = JSON.stringify(pie.object.compact(data));
      }
    }

    this.xhr.send(d);
    return this;
  },

  // Check if a callback is registered for a specific event.
  hasCallback: function(eventName) {
    return this.emitter.hasCallback(eventName);
  },

  // Register callbacks to be invoked as part of the setup process.
  // Callbacks are provided with the xhr & the request object (this).
  setup: function() {
    this._append('setup', arguments, false);
    return this;
  },

  // Utility method for clearing previous / default events out
  // request.clear('error').error(myErrorHandler);
  clear: function(eventName) {
    this.emitter.clear(eventName);
    return this;
  },

  // Register a callback for when the request is complete.
  complete: function() {
    this._append('complete', arguments, true);
    return this;
  },

  // Register a callback which will only receive the parsed data.
  dataSuccess: function() {
    this._append('dataSuccess', arguments, true);
    return this;
  },

  // Register a callback when the request is unsuccessful.
  // `app.ajax` will provide a default error callback as long as the `error` callbacks are empty.
  // If you would like the default & your error callback, use extraError.
  error: function() {
    this._append('error', arguments, true);
    return this;
  },

  // Register a callback when the request is unsuccessful.
  extraError: function() {
    this._append('extraError', arguments, true);
    return this;
  },

  setModel: function() {
    var fns = pie.array.from(arguments).map(function(m){ return m.sets.bind(m); });
    this._append('setModel', fns, true);
  },

  // Register a callback when the request succeeds.
  // Callbacks are invoked with the parsed response & the xhr object.
  success: function() {
    this._append('success', arguments, true);
    return this;
  },

  // Register a callback to be invoked when progress events are triggered from the request.
  progress: function() {
    this._append('progress', arguments, false);
    return this;
  },

  // Register a callback to be invoked when upload progress events are triggered from the request.
  uploadProgress: function() {
    this._append('uploadProgress', arguments, false);
    return this;
  },

}, pie.mixins.validatable);
