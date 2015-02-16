var $ = jQuery = require('jquery');
var _ = require('underscore');
var Handlebars = require('handlebars');
require('bootstrap');

var Transitive = require('transitive.js');

var ConstructTransitiveData = require('construct-data');

Handlebars.registerHelper('getAgencyId', function(agencyAndId) {
  return agencyAndId.split(':')[0];
});


module.exports = Application;


function Application() {

  this.routes = {};
  this.selectedRoutes = [];

  var self = this;

  //this.setOtpEndpoint('http://localhost:8001/otp/routers/default/index');

  $('#set-endpoint-button').click(function() {
    var endpoint = prompt("Enter OTP Index endpoint:");
    self.setOtpEndpoint(endpoint);
  });

  $('#update-button').click(function() {
    new ConstructTransitiveData(self.selectedRoutes, self.otpIndexEndpoint, function(data) {
      $("#transitive-code").html(JSON.stringify(data));

      var transitive = new Transitive({
        data: data,
        el: document.getElementById('transitive-preview')
      })
      transitive.render();

    });
  });

  $('#tabs').tab();
}

Application.prototype.setOtpEndpoint = function(endpoint) {
  this.otpIndexEndpoint = endpoint;
  $("#otp-endpoint").html(this.otpIndexEndpoint);
  this.updateRoutes();
};

Application.prototype.updateRoutes = function() {
  var self = this;
  $.getJSON(this.otpIndexEndpoint + '/routes', function (data) {
    _.each(data, function(route) {
      self.routes[route.id] = route;
    });

    data = _.sortBy(data, function(o) {
      var rsn = o.shortName;
      var int = parseInt(rsn);
      return isNaN(int) ? rsn : int;
    });

    var template = Handlebars.compile(require('./route-table.html'));
    $("#route-list").html(template({ routes : data }));

    $(".route-checkbox").click(function(event) {
      var agencyAndId = $(this).data('agency-and-id');
      var checked = $(event.target).is(':checked');
      if(checked) self.addRoute(self.routes[agencyAndId]);
      else self.removeRoute(self.routes[agencyAndId]);
    });
  });};

Application.prototype.addRoute = function(route) {
  if(!_.contains(this.selectedRoutes, route)) this.selectedRoutes.push(route);
  this.updateSelectedRoutes();
};

Application.prototype.removeRoute = function(route) {
  if(_.contains(this.selectedRoutes, route))
    this.selectedRoutes.splice(this.selectedRoutes.indexOf(route), 1);
  this.updateSelectedRoutes();
};

Application.prototype.updateSelectedRoutes = function() {
  var template = Handlebars.compile(require('./selected-route-table.html'));
  $("#selected-route-list").html(template({ routes : this.selectedRoutes }));
  var self = this;
  $(".remove-route-button").click(function(event) {
    var agencyAndId = $(this).data('agency-and-id');
    self.removeRoute(self.routes[agencyAndId]);
    var selector = ('#route-checkbox-'+agencyAndId).replace(':', '\\:');
    $(selector).attr('checked', false);
  });
};

$(document).ready(function() {
  new Application();
});
