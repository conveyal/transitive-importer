var _ = require('underscore');
var $ = jQuery = require('jquery');

module.exports = ConstructTransitiveData;

function ConstructTransitiveData(selectedRoutes, otpIndexEndpoint, successCallback) {
  this.otpIndexEndpoint = otpIndexEndpoint;
  this.successCallback = successCallback;

  this.transitiveData = {};
  var patternsReqCount = 0;
  var patternIds = [];

  this.transitiveData.routes = [];

  var self = this;

  _.each(selectedRoutes, function(route) {
    self.transitiveData.routes.push({
      route_id: route.id,
      agency_id: route.id.split(':')[0],
      route_short_name: route.shortName,
      route_long_name: route.longName,
      route_color: route.color,
      route_type: getGtfsType(route.mode)
    });

    $.getJSON(self.otpIndexEndpoint + '/routes/' + route.id + '/patterns', function (data) {
      patternIds = patternIds.concat(_.pluck(data, 'id'));
      patternsReqCount++;
      if(patternsReqCount == selectedRoutes.length) {
        self.getPatterns(patternIds);
      }
    });
  });
}

ConstructTransitiveData.prototype.getPatterns = function(patternIds) {
  var self = this;
  var reqCount = 0;
  var patterns = [];
  _.each(patternIds, function(patternId) {
    $.getJSON(self.otpIndexEndpoint + '/patterns/' + patternId, function (data) {
      patterns.push(data)
      reqCount++;
      if(reqCount == patternIds.length) {
        self.processPatterns(patterns);
      }
    });
  });
};

ConstructTransitiveData.prototype.processPatterns = function(patterns) {
  var self = this;

  var stops = {};

  this.transitiveData.patterns = [];

  _.each(patterns, function(pattern) {

    var tdPattern = {
      pattern_id: pattern.id,
      pattern_name: pattern.desc,
      route_id: pattern.routeId,
      render: true,
      stops: []
    };

    _.each(pattern.stops, function(stop) {
      stops[stop.id] = stop;
      tdPattern.stops.push({ stop_id: stop.id });
    });

    self.transitiveData.patterns.push(tdPattern);
  });

  this.transitiveData.stops = _.map(_.values(stops), function(stop) {
    return {
      stop_id: stop.id,
      stop_name: stop.name,
      stop_lat: stop.lat,
      stop_lon: stop.lon
    };
  });

  this.successCallback.call(this, this.transitiveData);
};

function getGtfsType(otpMode) {
  switch(otpMode) {
    case 'TRAM': return 0;
    case 'SUBWAY': return 1;
    case 'RAIL': return 2;
    case 'BUS': return 3;
    case 'FERRY': return 4;
    case 'CABLE_CAR': return 5;
    case 'GONDOLA': return 6;
    case 'FUNICULAR': return 7;
  }
};