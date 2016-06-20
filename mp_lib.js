var Mixpanel = function(token, api_secret) {
  this.token = token;
  this.api_secret = api_secret;
}

Mixpanel.prototype.people_set = function(data, distinct) {
    var update = {
      "$set":data
    }
    $.extend(update, {
      '$token': this.token,
      '$distinct_id': distinct,
      '$ignore_time':'True',
    })
    var proto = document.location.protocol;
    var setUrl = proto + "//api.mixpanel.com/engage";
    var payload = { 'data': btoa(JSON.stringify(update)), "ip": 0, "verbose": 1 };
    var setXHR = new XMLHttpRequest();
    setXHR.open("POST", setUrl, true);
    setXHR.send($.param(payload))
  } 