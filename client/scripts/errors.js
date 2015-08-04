Meteor.errors = {
  noTickerError: function(error) {
    var alert = $(".tickerFormTemplate .alert");
    var submitButton = $(".ticker-form button");

    alert.show();
    submitButton.attr("disabled", "true");
  }
};