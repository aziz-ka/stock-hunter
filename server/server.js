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

var embedlyToken = Meteor.settings.embedly.token;
var tradierToken = Meteor.settings.tradier.token;

var headers = {
  "Authorization": "Bearer " + tradierToken,
  "Accept": "application/json"
};
var intradayQuotesAPI = "https://api.tradier.com/v1/markets/quotes?symbols=";
var optionsAPI = "https://api.tradier.com/v1/markets/options/chains?symbol=";
var quotesAPI = "https://api.tradier.com/v1/markets/history?start="+yyyy+"-"+mm+"-"+dd+"&symbol=";
var symbolLookupAPI = "https://api.tradier.com/v1/markets/lookup?q=";

var embedlyAPI = "http://api.embed.ly/1/oembed?key="+embedlyToken+"&url=";
var newsAPI = "http://finance.yahoo.com/rss/headline?s=";

var TwitterAPI = Meteor.npmRequire("twitter");
var Twitter = new TwitterAPI({
  "consumer_key": Meteor.settings.twitter.consumer_key,
  "consumer_secret": Meteor.settings.twitter.consumer_secret,
  "access_token_key": Meteor.settings.twitter.access_token_key,
  "access_token_secret": Meteor.settings.twitter.access_token_secret,
});

Meteor.methods({
  addToWatchlist: function(ticker) {
    Meteor.users.update({"_id": this.userId}, {$addToSet: {"watchlist": ticker}});
  },

  addPosition: function(ticker, amount, price, date) {
    Meteor.users.update({"_id": this.userId}, {$addToSet: {"positions": {
      "ticker": ticker,
      "amount": amount,
      "price": price,
      "date": date
    }}});
  },

  createNewUser: function(email, password) {
    if(password.length > 5) {
      Accounts.createUser({
        email: email,
        password: password
      });
    } else {
      var passwordError = new Meteor.Error(403, "Password must be at least 6 characters long");
      throw passwordError;
    }
  },

  embedNews: function(url) {
    return HTTP.get(
      embedlyAPI + url
    );
  },

  fetchNews: function(ticker) {
    return HTTP.get(
      newsAPI + ticker
    );
  },

  fetchOptions: function(ticker, expDate) {
    console.log(ticker, expDate);
    return HTTP.get(
      optionsAPI + ticker + "&expiration=" + expDate,
      {headers: headers}
    );
  },

  fetchQuotes: function(ticker) {
    return HTTP.get(
      quotesAPI + ticker,
      {headers: headers}
    );
  },

  getTweets: function(ticker) {
    var tweetSearch = function(ticker, callback) {
      Twitter.get("search/tweets", {q: "%24" + ticker, lang: "en", result_type: "popular"}, callback);
    };
    var asyncTweetSearch = Meteor.wrapAsync(tweetSearch);
    return asyncTweetSearch(ticker);
  },

  intradayQuotes: function(tickers) {
    return HTTP.get(
      intradayQuotesAPI + tickers,
      {headers: headers}
    );
  },

  lookupSymbol: function(ticker) {
    try {
      var result = HTTP.get(
        symbolLookupAPI + ticker,
        {headers: headers}
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

  removeFromWL: function(ticker) {
    Meteor.users.update({"_id": this.userId}, {$pull: {"watchlist": ticker}});
  }
});





