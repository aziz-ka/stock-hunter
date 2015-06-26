// Meteor.subscribe("API-token");

Template.home.events({
  "submit .ticker-form": function(e) {
    e.preventDefault();

    $(".data").empty();

    var ticker = e.target.ticker.value;
    var expDate = e.target.expDate.value;
    $("#empty").text(ticker.toUpperCase());

    Meteor.call("fetchOptions", ticker, expDate, function (error, optionsResult) {
      Meteor.options.options(optionsResult, ticker);
    });
    Meteor.call("fetchQuotes", ticker, function (error, quotesResult) {
      Meteor.quotes.quotes(quotesResult, ticker);
    });
  }
});



