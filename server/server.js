Meteor.publish("userData", function() {
  var currentUser = this.userId;
  return Meteor.users.find({"_id": currentUser});
});

Accounts.config({
  forbidClientAccountCreation: true,
});

var now = new Date();
var yyyy = now.getFullYear() - 2;
var mm = now.getMonth() + 1;
var dd = 01;

var token = "REX0QnMxrkwLpwYVGYgDIP0rnTmx";
var optionsAPI = "https://api.tradier.com/v1/markets/options/chains?symbol=";
var quotesAPI = "https://api.tradier.com/v1/markets/history?start="+yyyy+"-"+mm+"-"+dd+"&symbol=";
var symbolLookupAPI = "https://api.tradier.com/v1/markets/lookup?q=";
var headers = {
  "Authorization": "Bearer " + token,
  "Accept": "application/json"
};
var newsAPI = "http://finance.yahoo.com/rss/headline?s=";

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
  },

  fetchNews: function(ticker) {
    return HTTP.get(
      newsAPI + ticker
    );
  },

  lookupSymbol: function(ticker) {
    try {
      var result = HTTP.get(
        symbolLookupAPI + ticker,
        { headers: headers }
      );
      var dataArr = result.data.securities.security;
      if(dataArr.length > 10) {
        return result.data.securities.security.slice(0,10);
      } else {
        return dataArr;
      }
    } catch(error) {
      throw error;
    }
  },

  addToWatchlist: function(ticker) {
    Meteor.users.update({"_id": this.userId}, {$push: {"watchlist": ticker}});
  },

  createNewUser: function(email, password) {
    if(password.length > 5) {
      Accounts.createUser({
        email: email,
        password: password
      });
    } else {
      var passwordError = new Meteor.Error(403, "Password must be at least 5 characters long");
      throw passwordError;
    }
  }
});





