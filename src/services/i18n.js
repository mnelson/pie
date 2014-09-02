// made to be used as an instance so multiple translations could exist if we so choose.
pie.services.i18n = function i18n(app) {
  this.translations = {};
  this.app = app;
};


pie.services.i18n.prototype._ampm = function(num) {
  return num >= 12 ? 'pm' : 'am';
};


pie.services.i18n.prototype._countAlias = {
  '0' : 'zero',
  '1' : 'one'
};


pie.services.i18n.prototype._dayName = function(d) {
  return this.t('app.date.day_names.' + d);
};


pie.services.i18n.prototype._hour = function(h) {
  if(h > 12) h -= 12;
  if(!h) h += 12;
  return h;
};


pie.services.i18n.prototype._isoDate = function(t, convertToUtc) {
  if(convertToUtc) t = this._utc(t);
  return t.getFullYear() + '-' + this._space(t.getMonth() + 1, 2, '0') + '-' + this._space(t.getDate(), 2, '0');
};


pie.services.i18n.prototype._isoTime = function(t) {
  t = this._utc(t);
  return  this._space(t.getHours(), 2, '0') + ':' +
          this._space(t.getMinutes(), 2, '0') + ':' +
          this._space(t.getSeconds(), 2, '0') + '.' +
          this._space(t.getMilliseconds(), 3, '0') +
          'Z';
};


pie.services.i18n.prototype._monthName = function(m) {
  return this.t('app.date.month_names.' + m);
};


// assumes that dates either come in as dates or iso strings
pie.services.i18n.prototype._normalizedDate = function(d) {
  if('string' === typeof(d)) d = pie.date.timeFromISO(d);
  return d;
},


pie.services.i18n.prototype._shortDayName = function(d) {
  return this.t('app.date.short_day_names.' + d);
};


pie.services.i18n.prototype._shortMonthName = function(m) {
  return this.t('app.date.short_month_names.' + m);
};


pie.services.i18n.prototype._space = function(num, cnt, pad) {
  var s = '',
      p = cnt - num.toString().length;
  if(pad === undefined) pad = ' ';
  while(p>0){
    s += pad;
    p -= 1;
  }
  return s + num.toString();
};


pie.services.i18n.prototype._timezoneAbbr = function(date) {
  var str = date && date.toString();
  return str && str.split(/\((.*)\)/)[1];
},


pie.services.i18n.prototype._utc = function(t) {
  var t2 = new Date(t.getTime());
  t2.setMinutes(t2.getMinutes() + t2.getTimezoneOffset());
  return t2;
};


pie.services.i18n.prototype.load = function() {
  var d, i = 0;
  for(;i<arguments.length;i++) {
    d = arguments[i];
    pie.h.extend(this.translations, d);
  }
};


pie.services.i18n.prototype.t = function(path, data) {
  var translation = pie.h.getPath(path, this.translations), count;

  if (data && data.hasOwnProperty('count') && typeof translation === 'object') {
    count = (data.count || 0).toString();
    count = this._countAlias[count] || 'other';
    translation = translation[count] === undefined ? translation.other : translation[count];
  }

  if(!translation) {

    if(data && data.hasOwnProperty('default')) {
      return data.default;
    }

    this.app.debug("Translation not found: " + path);
    return "";
  }


  if(typeof translation === 'string') {
    return translation.indexOf('%{') === -1 ? translation : pie.string.expand(translation, data);
  }

  return translation;
};


pie.services.i18n.prototype.timeago = function(t) {
  t = this._normalizedDate(t).getTime()  / 1000;
  var now = (new Date().getTime()) / 1000,
    diff = now - t,
    c;

  if(diff < 60) { // less than a minute
    return this.t('app.timeago.now');
  } else if (diff < 3600) { // less than an hour
    c = Math.floor(diff / 60);
    return this.t('app.timeago.minutes', {count: c});
  } else if (diff < 86400) { // less than a day
    c = Math.floor(diff / 3600);
    return this.t('app.timeago.hours', {count: c});
  } else if (diff < 86400 * 7) { // less than a week (
    c = Math.floor(diff / 86400);
    return this.t('app.timeago.days', {count: c});
  } else if (diff < 86400 * 30) { // less than a month
    c = Math.floor(diff / (86400 * 7));
    return this.t('app.timeago.weeks', {count: c});
  } else if (diff < 86500 * 365.25) { // less than a year
    c = Math.floor(diff / (86400 * 365.25 / 12));
    return this.t('app.timeago.months', {count: c});
  } else {
    c = Math.floor(diff / 86400 * 365.25);
    return this.t('app.timeago.years', {count: c});
  }
};

// pass in the date instance and the string 'format'
pie.services.i18n.prototype.strftime = function(date, f) {
  date = this._normalizedDate(date);

  var weekDay           = date.getDay(),
      day               = date.getDate(),
      year              = date.getFullYear(),
      month             = date.getMonth() + 1,
      hour              = date.getHours(),
      hour12            = this._hour(hour),
      meridian          = this.ampm(hour),
      secs              = date.getSeconds(),
      mins              = date.getMinutes(),
      offset            = date.getTimezoneOffset(),
      absOffsetHours    = Math.floor(Math.abs(offset / 60)),
      absOffsetMinutes  = Math.abs(offset) - (absOffsetHours * 60),
      timezoneoffset    = (offset > 0 ? "-" : "+") + this._pad(absOffsetHours, 2) + this._pad(absOffsetMinutes, 2);

  f = f.replace("%a", this._shortDayName(weekDay))
      .replace("%A",  this._dayName(weekDay))
      .replace("%b",  this._shortMonthName(month))
      .replace("%d",  this._pad(day))
      .replace("%e",  day)
      .replace("%-d", day)
      .replace("%H",  this._pad(hour))
      .replace("%k",  hour)
      .replace("%I",  this._pad(hour12))
      .replace("%l",  hour12)
      .replace("%m",  this._pad(month))
      .replace("%-m", month)
      .replace("%M",  this._pad(mins))
      .replace("%p",  meridian.toUpperCase())
      .replace("%P",  meridian)
      .replace("%S",  this._pad(secs))
      .replace("%-S", secs)
      .replace("%w",  weekDay)
      .replace("%y",  this._pad(year))
      .replace("%-y", this._pad(year).replace(/^0+/, ""))
      .replace("%Y",  year)
      .replace("%z",  timezoneoffset)
      .replace("%Z",  this._timezoneAbbr(date));

  return f;
};

pie.services.i18n.prototype.l = pie.services.i18n.prototype.strftime;
