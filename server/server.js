// Meteor.publish("API-token", function() {
//   return token;
// });

var token = "REX0QnMxrkwLpwYVGYgDIP0rnTmx";
var optionsAPI = "https://api.tradier.com/v1/markets/options/chains?symbol=";
var quotesAPI = "https://api.tradier.com/v1/markets/history?symbol=";
var headers = {
  "Authorization": "Bearer " + token,
  "Accept": "application/json"
};

Meteor.methods({
  fetchOptions: function(ticker, expDate) {
    console.log(ticker, expDate);
    return HTTP.get(
      optionsAPI + ticker + "&expiration=" + expDate,
      { headers: headers }
    );
  },

  fetchQuotes: function(ticker) {
    return HTTP.get(
      quotesAPI + ticker,
      { headers: headers }
    );
  }
});