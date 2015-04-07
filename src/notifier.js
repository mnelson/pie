var Pie  = require('pie');
var Base = require('base');
var List = require('list');
var Arr  = require('extensions/array');
var Obj  = require('extensions/object');

// # Pie Notifier
// A class which provides an interface for rendering page-level notifications.
// This does only structures and manages the data to be used by a view. This does not impelement
// UI notifications.
module.exports = Base.extend('notifier', {

  init: function(app, options) {
    this.options = options || {};
    this.app = app || this.options.app || Pie.appInstance;
    this.notifications = new List([]);
  },

  // remove all alerts, potentially filtering by the type of alert.
  clear: function(type) {
    if(type) {
      this.notifications.forEach(function(n) {
        this.remove(n.id);
      }.bind(this));
    } else {
      while(this.notifications.length()) {
        this.remove(this.notifications.get(0).id);
      }
    }
  },

  // ** pie.notifier.notify **
  //
  // Show a notification or notifications.
  // Messages can be a string or an array of messages.
  // You can choose to close a notification automatically by providing `true` as the third arg.
  // You can provide a number in milliseconds as the autoClose value as well.
  notify: function(messages, type, autoRemove) {
    type = type || 'message';
    autoRemove = this.getAutoRemoveTimeout(autoRemove);

    messages = Arr.from(messages);
    messages = messages.map(function(m){ return this.app.i18n.attempt(m); }.bind(this));

    var msg = {
      id: Pie.unique(),
      messages: messages,
      type: type
    };

    this.notifications.push(msg);

    if(autoRemove) {
      setTimeout(function(){
        this.remove(msg.id);
      }.bind(this), autoRemove);
    }

  },

  getAutoRemoveTimeout: function(timeout) {
    if(timeout === undefined) timeout = true;
    if(timeout && !Obj.isNumber(timeout)) timeout = 7000;
    return timeout;
  },

  remove: function(msgId) {
    var msgIdx = Arr.indexOf(this.notifications.get('items'), function(m) {
      return m.id === msgId;
    });

    if(~msgIdx) {
      this.notifications.remove(msgIdx);
    }
  }
});
