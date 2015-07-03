Meteor.publish("userData", function() {
  var currentUser = this.userId;
  return Meteor.users.find({"_id": currentUser});
});

Accounts.config({
  forbidClientAccountCreation: true,
});

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





