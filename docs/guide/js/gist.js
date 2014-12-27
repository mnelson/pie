/* global hljs */

(function() {
  'use strict';

  var gistCache = {};
  var proto = Object.create(HTMLElement.prototype);

  proto.externalResources = function(){
    return [app.router.path('/css/highlight.css'), app.router.path('/js/highlight.js')];
  },

  proto.createdCallback = function() {
    // prefetch as much as possible.
    app.resources.load(this.externalResources());
  };

  proto.contentCallback = function(data) {
    var filename = this.getAttribute('filename') || Object.keys(data.files)[0],
    file = data.files[filename],
    content = pie.string.escape(file.content);

    var lines = content.split("\n");

    // remove empty lines from the beginning
    while(lines.length && !lines[0].trim().length) lines.shift();

    // and from the end
    while(lines.length && !lines[lines.length - 1].trim().length) lines.pop();

    // then remove the block of whitespace from the left.
    if(lines.length) {
      var toStrip = lines[0].match(/^(\s+)/);

      if(toStrip && toStrip.length) {
        toStrip = toStrip[0];
        var regex = new RegExp("^[\\s]{" + toStrip.length + "}");
        lines = lines.map(function(l){ return l.replace(regex, ""); });
      }
    }

    app.resources.load(this.externalResources(), function() {

      this.innerHTML = "<code><pre>" + lines.join("\n") + "</pre></code>";

      hljs.configure({useBr: true, language: file.language || ['javascript', 'json']});
      hljs.highlightBlock(this.querySelector('pre'));

    }.bind(this));
  };

  proto.attachedCallback = function() {
    var gistId = this.getAttribute('gist'),
    path = 'https://api.github.com/gists/' + gistId;

    this.classList.add('gist-loading');

    app.resources.load({
      src: path,
      dataSuccess: function(content){
        gistCache[gistId] = content;
      }
    }, function() {
      this.contentCallback(gistCache[gistId]);
      this.classList.remove('gist-loading');
    }.bind(this));

  };

  // register element as x-gist
  window.GistElement = document.registerElement('x-gist', {
    prototype: proto
  });
})();