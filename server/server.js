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

var tradierToken = Meteor.settings.tradier.token;
var optionsAPI = "https://api.tradier.com/v1/markets/options/chains?symbol=";
var quotesAPI = "https://api.tradier.com/v1/markets/history?start="+yyyy+"-"+mm+"-"+dd+"&symbol=";
var symbolLookupAPI = "https://api.tradier.com/v1/markets/lookup?q=";
var headers = {
  "Authorization": "Bearer " + tradierToken,
  "Accept": "application/json"
};
var newsAPI = "http://finance.yahoo.com/rss/headline?s=";
var embedlyToken = Meteor.settings.embedly.token;
var embedlyAPI = "http://api.embed.ly/1/oembed?key="+embedlyToken+"&url=";

var TwitterAPI = Meteor.npmRequire("twitter");
var Twitter = new TwitterAPI({
  "consumer_key": Meteor.settings.twitter.consumer_key,
  "consumer_secret": Meteor.settings.twitter.consumer_secret,
  "access_token_key": Meteor.settings.twitter.access_token_key,
  "access_token_secret": Meteor.settings.twitter.access_token_secret,
});

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

  embedNews: function(url) {
    return HTTP.get(
      embedlyAPI + url
    );
  },

  getTweets: function(ticker) {
    var tweetSearch = function(ticker, callback) {
      Twitter.get("search/tweets", {q: "%24" + ticker, lang: "en", result_type: "popular"}, callback);
    };
    var asyncTweetSearch = Meteor.wrapAsync(tweetSearch);
    return asyncTweetSearch(ticker);
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





