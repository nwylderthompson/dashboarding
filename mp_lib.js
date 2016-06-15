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

Mixpanel.prototype.segment = function(event, property, params) {
  var property = property || false;
  var params = params || false;
  if (params && typeof(params) != "object"){
    throw "Invalid params"
  }
  var url_params = segmentation_url_params(event, property, params)
  return $.ajax({
      url: "https://mixpanel.com/api/2.0/segmentation?" + url_params,
      beforeSend: function(xhr) { 
      xhr.setRequestHeader("Authorization", "Basic " + btoa("bf7a39e99c9d0a006e112693736a3e20")); 
    },
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json',
  })
}

function segmentation_url_params(event, property, params) {
  var url_params = "event=" + String(event);
  if (property){
    url_params = url_params + "&on=properties[" + JSON.stringify(property) + "]";
  }
  if (params) {
    _.each(params, function(value, key){
      url_params = url_params + "&" + String(key) + "=" + String(value)
    })
  } 
  if (url_params.indexOf('&to_date') < 0 || url_params.indexOf('&from_date') < 0){
    var to_date = moment().format('YYYY-MM-DD')
    var from_date = moment().subtract(7, 'days').format('YYYY-MM-DD')
    url_params = url_params + "&to_date=" + to_date + "&from_date=" + from_date
  }
  return url_params
}