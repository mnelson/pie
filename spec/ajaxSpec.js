describe("pie.ajax", function() {

  beforeEach(function() {
    this.ajax = app.ajax;
  });

  it("get() should invoke ajax() with a GET", function() {
    spyOn(this.ajax, 'ajax');

    this.ajax.get({"data" : "test"});
    expect(this.ajax.ajax).toHaveBeenCalledWith({"verb" : "GET", "data" : "test"}, undefined);
  });

  it("post() should invoke ajax() with a POST", function() {
    spyOn(this.ajax, 'ajax');

    this.ajax.post({"data" : "test"});
    expect(this.ajax.ajax).toHaveBeenCalledWith({"verb" : "POST", "data" : "test"}, undefined);
  });

  it("put() should invoke ajax() with a PUT", function() {
    spyOn(this.ajax, 'ajax');

    this.ajax.put({"data" : "test"});
    expect(this.ajax.ajax).toHaveBeenCalledWith({"verb" : "PUT", "data" : "test"}, undefined);
  });

  it("del() should invoke ajax() with a DELETE", function() {
    spyOn(this.ajax, 'ajax');

    this.ajax.del({"data" : "test"});
    expect(this.ajax.ajax).toHaveBeenCalledWith({"verb" : "DELETE", "data" : "test"}, undefined);
  });

  describe("with mock-ajax running", function() {

    beforeEach(function() {
      jasmine.Ajax.install();

      jasmine.Ajax.stubRequest('/get-path').andReturn({
        responseText: '{"get" : "response"}',
        status: 200,
        contentType: 'application/json'
      });

      jasmine.Ajax.stubRequest('/post-path').andReturn({
        responseText: '{"post" : "response"}',
        status: 200,
        contentType: 'application/json'
      });

      jasmine.Ajax.stubRequest('/post-path-html').andReturn({
        responseText: '<span>foo</span>',
        status: 200,
        contentType: 'text/html'
      });

      jasmine.Ajax.stubRequest('/put-path').andReturn({
        responseText: '{"put" : "response"}',
        status: 200,
        contentType: 'application/json'
      });

      jasmine.Ajax.stubRequest('/delete-path').andReturn({
        responseText: '{"delete" : "response"}',
        status: 200,
        contentType: 'application/json'
      });

      jasmine.Ajax.stubRequest('/head-path').andReturn({
        responseText: ' ',
        status: 200,
        contentType: 'application/json'
      });

      jasmine.Ajax.stubRequest('/error-path').andReturn({
        responseText: '{"errors" : [{"message" : "error response"]}',
        status: 422,
        contentType: 'application/json'
      });

      jasmine.Ajax.stubRequest('/disconnected-path').andReturn({
        responseText: ' ',
        status: undefined,
        contentType: 'application/json'
      });

    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("should not blow up if there is no csrf token in the dom", function(done) {
      var meta = document.querySelector('meta[name="csrf-token"]');
      if(meta) meta.parentNode.removeChild(meta);

      var doneFn = jasmine.createSpy('success');

      this.ajax.get({
        url: '/get-path',
        dataSuccess: doneFn
      }).complete(function(){
        expect(doneFn).toHaveBeenCalledWith({'get' : 'response'});
      }, done);
    });

    it("should use the csrf token in the dom if it is present", function(done) {
      this.ajax.app.cache.set('csrfToken', undefined);
      var meta = pie.dom.createElement('<meta name="csrf-token" content="abcdefg" />'), request;
      document.querySelector('head').appendChild(meta);

      this.ajax.get({ url: '/get-path' }).complete(function(){
        request = jasmine.Ajax.requests.mostRecent();
        expect(request.requestHeaders['X-CSRF-Token']).toEqual('abcdefg');
      }, done);
    });

    it("should set default options on the request", function(done) {
      this.ajax.get({ url: '/get-path' }).complete(function(){

        var request = jasmine.Ajax.requests.mostRecent();
        expect(request.requestHeaders['Accept']).toEqual('application/json');
        expect(request.requestHeaders['Content-Type']).toEqual('application/json');
        expect(request.method).toEqual('GET');
      }, done);
    });

    it("should allow alternate formats to be sent", function(done) {
      this.ajax.post({
        url: '/post-path-html',
        accept: 'text/html',
        data: "foo=bar&baz=qux",
        csrfToken: 'xyz',
        verb: 'POST'
      }).complete(function(){
        var request = jasmine.Ajax.requests.mostRecent();
        expect(request.requestHeaders['Accept']).toEqual('text/html');
        expect(request.requestHeaders['Content-Type']).toEqual('application/x-www-form-urlencoded');
        expect(request.method).toEqual('POST');
        expect(request.params).toEqual('foo=bar&baz=qux');
        expect(request.data).toEqual('<span>foo</span>');
      }, done);
    });

    it("should allow a promise-style request to be conducted", function(done) {
      var response, xhr, request = this.ajax.get('/get-path');

      request.dataSuccess(function(d) {
        response = d;
      });

      request.success(function(d, x) {
        xhr = x;
      });

      request.complete(function() {
        expect(response).toEqual({get: 'response'});
        expect(xhr).toEqual(request.xhr);
      }, done);
    });

  });


});
