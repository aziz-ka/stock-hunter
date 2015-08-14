Meteor.subscribe("userData");

//*** REACTIVE VARs ***\\

Template.tickerForm.onCreated(function() {
  this.symbols = new ReactiveVar();
});

//*** ON TEMPLATE RENDER ***\\

Template.home.onRendered(function() {
  var news = Session.get("news")[0];
  var quotes = Session.get("quotes");
  var ticker = Session.get("ticker");

  // BUG - doesn't fire on intial load :[
  if(ticker && !quotes || news.ticker !== ticker) {
    $(".ticker-form").submit();
  }
  // re-draw chart on home render
  if(ticker && quotes) {
    Meteor.quotes.quotes(quotes, ticker, 22);
  }
});

Template.news.onRendered(function() {
  if(Session.get("news")) {
    $(".newsTemplate").removeClass("hidden");
  }
});

Template.options.onRendered(function() {
  var optionsData = Session.get("options");
  var ticker = Session.get("ticker");

  if(optionsData && optionsData[0].ticker === ticker && optionsData[0].content.data.options !== null) {
    // display options chain data when template is re-rendered
    Meteor.options.options(optionsData[0].content, ticker);
  } else {
    $(".ticker-form").submit();
  }
});

Template.tickerForm.onRendered(function() {
  var ticker = Session.get("ticker");

  if(ticker) {
    $(".ticker-form input[name='ticker']").val(ticker);
  }
  $(".tickerFormTemplate .alert").hide();
});

Template.tweets.onRendered(function() {
  twttr.widgets.load();
});

//*** HELPERS ***\\

Template.nav.helpers({
  userEmail: function() {
    return Meteor.user().emails[0].address;
  }
});

Template.news.helpers({
  newsList: function() {
    var newsContent = Session.get("news");
    return newsContent[0];
  },
  embeds: function() {
    var embededURL = Session.get("embeds");
    return embededURL;
  }
});

Template.options.helpers({
  ticker: function() {
    return Session.get("ticker");
  }
});

Template.positions.helpers({
  positions: function() {
    var positions = Meteor.user().positions;
    var tickers = "";
    for(var j = 0; j < positions.length; j++) {
      tickers = tickers.concat(positions[j].ticker + ",");
    }
    // get current price for each position in order to calculate P/Ls
    Meteor.call("intradayQuotes", tickers, function(error, positionsResult) {
      if(error) throw error;
      var data = positionsResult.data.quotes.quote;

      for(var i = 0; i < positions.length; i++) {
        var currentPrice = data[i].last;
        var PLDollar = +((currentPrice - positions[i].price) * positions[i].amount).toFixed(2);
        var PLPercent = +(currentPrice / positions[i].price * 100 - 100).toFixed(2);
        positions[i]["currentPrice"] = currentPrice;
        positions[i]["PLDollar"] = PLDollar;
        positions[i]["PLPercent"] = PLPercent;
        if(PLPercent > 0) {
          positions[i]["upORdown"] = "up";
          positions[i]["color"] = "green";
        } else {
          positions[i]["upORdown"] = "down";
          positions[i]["color"] = "red";
        }
      }

      Session.set("positions", positions);
    });

    return Session.get("positions");
  },
  total: function() {
    var positions = Session.get("positions");
    var totalPLDollar = 0;
    var totalInvested = 0;

    // calculate portfolio totals
    for(var i = 0; i < positions.length; i++) {
      totalPLDollar += positions[i].PLDollar;
      totalInvested += parseInt(positions[i].amount) * parseInt(positions[i].price);
    }

    var totalPLPercent = +((totalPLDollar / totalInvested) * 100).toFixed(2);
    return {
      "totalInvested": totalInvested,
      "totalPLDollar": +(totalPLDollar).toFixed(2),
      "totalPLPercent": totalPLPercent
    };
  }
});

Template.tickerForm.helpers({
  optionsUrl: function() {
    return Meteor.helperFunctions.currentUrl("options");
  },
  homeUrl: function() {
    return Meteor.helperFunctions.currentUrl(undefined);
  },
  positionsUrl: function() {
    return Meteor.helperFunctions.currentUrl("positions");
  },
  symbolList: function() {
    return Template.instance().symbols.get();
  }
});

Template.tweets.helpers({
  ticker: function() {
    var ticker = Session.get("ticker");
    if(ticker) return ticker;
  }
});

Template.watchlists.helpers({
  ticker: function() {
    var currentUser = Meteor.userId();
    var WLSession = Session.get("WLQuotes");
    var WLTickers = Meteor.user().watchlist;
    if(!WLSession || WLTickers.length !== WLSession.length) {
      Meteor.call("intradayQuotes", WLTickers.toString(), function(error, WLTickersResult) {
        if(error) throw error;

        var data = WLTickersResult.data.quotes.quote;
        
        for(var i = 0; i < data.length; i++) {
          if(data[i].change > 0) {
            data[i]["color"] = "#acffac";
          } else {
            data[i]["color"] = "#ffacac";
          }
          data[i].volume = +(data[i].volume / 1000000).toFixed(1);
        }
        Session.set("WLQuotes", data);
      });
    }
    return WLSession;
  }
});

//*** EVENTS ***\\

Template.nav.events({
  "click .signout-btn": function() {
    Meteor.logout();
  },
  "click #navbar a": function() {
    // collpase nav menu, stays open otherwise
    if(window.innerWidth < 766) {
      $(".navbar-toggle").click();
    }
  },
  "click .signin-btn, click .signup-btn": function() {
    $(".modal-header").hide();
  }
});

Template.news.events({
  "click .list-group a": function(event) {
    event.preventDefault();
    var url = this.link;
    var encodedURL = encodeURIComponent(url);
    // avoid unnecessary API calls if news embed is expanded
    if(!($(".newsTemplate .collapse").hasClass("in"))) {
      Meteor.call("embedNews", encodedURL, function(error, embeds) {
        if(error) throw error;
        console.log(embeds.data);
        Session.set("embeds", embeds.data);
      });
    }
  }
});

Template.positions.events({
  "click .remove": function(event) {
    var ticker = this.ticker;
    var date = this.date;
    Meteor.call("removePosition", ticker, date);
  }
});

Template.signin.events({
  "submit form": function(event) {
    Meteor.helperFunctions.signInUp(event);
  }
});

Template.signup.events({
  "submit form": function(event) {
    Meteor.helperFunctions.signInUp(event);
  }
});

Template.tickerForm.events({
  "keyup input[type='text']": function(event, template) {
    var submitButton = $(".ticker-form button");
    var ticker = event.target.value;
    var validateTicker = /[\d\s+,!@#$%^&*();\/|<>"']+/g.test(ticker);
    var validateKeypress = event.keyCode > 64 && event.keyCode < 91 || event.keyCode > 188 && event.keyCode < 191;

    if(!validateTicker && ticker.length < 7 && validateKeypress) {
      // show symbol lookup results
      $(".tickerFormTemplate .list-group").removeClass("hidden");

      Meteor.call("lookupSymbol", ticker, function (error, lookupSymbolResult) {
        if(error) {
          Meteor.errors.noTickerError(error);
        } else {
          // hide alert and re-enable submit button
          $(".tickerFormTemplate .alert").hide();
          submitButton.removeAttr("disabled");
          template.symbols.set(lookupSymbolResult);
        }
      });
    }

    if(validateTicker) {
      Meteor.errors.noTickerError(null);
    }

    // on ESC hide alert and symbol lookup results
    if(event.keyCode === 27) {
      $(".tickerFormTemplate .list-group").addClass("hidden");
      $(".tickerFormTemplate .alert").hide();
    }
  },

  "click .list-group-item": function() {
    var ticker = $(this)[0].symbol;
    var tickerField = $(".ticker-form input[name='ticker']");
    tickerField.val(ticker);

    // submit form with clicked on value, hide everything and re-enable submit button
    $(".ticker-form").submit();
    $(".tickerFormTemplate .list-group").addClass("hidden");
    $(".tickerFormTemplate .alert").hide();
    $(".ticker-form button").removeAttr("disabled");
  },

  "submit .ticker-form": function(event) {
    event.preventDefault();

    var ticker = event.target.ticker.value.toUpperCase();
    Session.set("ticker", ticker);

    if(Meteor.helperFunctions.currentUrl("options")) {
      var expDate = event.target.expDate.value;

      Meteor.call("fetchOptions", ticker, expDate, function (error, optionsResult) {
        if(error) throw error;

        if(optionsResult.data.options === null) {
          $(".optionsTemplate .alert").removeClass("hidden");
        } else {
          $(".optionsTemplate .alert").addClass("hidden");
        }

        var optionsArray = [{"ticker": ticker, "content": optionsResult}];
        Session.set("options", optionsArray);

        Meteor.options.options(optionsResult, ticker);
      });
    }

    if(Meteor.helperFunctions.currentUrl(undefined)) {
      var dateRange = parseInt(event.target.dateRange.value);

      Meteor.call("fetchQuotes", ticker, function (error, quotesResult) {
        if(error) throw error;

        // display alert if ticker is valid but no data on it
        if(quotesResult.data.history === null) {
          Meteor.errors.noTickerError(null);
        }

        Session.set("quotes", quotesResult);
        Meteor.quotes.quotes(quotesResult, ticker, dateRange);
      });

      Meteor.call("fetchNews", ticker, function(error, newsResult) {
        if(error) throw error;

        $(".newsTemplate").removeClass("hidden");

        // parse Yahoo Finance Feed XML into JSON-able object
        var newsXML = $.parseXML(newsResult.content);
        var itemsArray = $(newsXML).find("item");
        var newsArray = [{"ticker": ticker, "content": []}];

        for (i = 0; i < itemsArray.length; i++) {
          var date = $(itemsArray[i]).find("pubDate").text();
          var id = i;
          var link = $(itemsArray[i]).find("link").text();
          link = link.substr(link.indexOf("*")+1);
          var title = $(itemsArray[i]).find("title").text();
          var newsObject = {"title": title, "link": link, "date": date, "id": id};
          newsArray[0].content.push(newsObject);
        }

        Session.set("news", newsArray);
      });

      // Meteor.call("getTweets", ticker, function(error, tweets, response) {
      //   if(error) throw error;

      //   console.log(response);
      //   console.log(tweets);
      // });
    }

    if(Meteor.helperFunctions.currentUrl("positions")) {
      var amount = event.target.amountBought.value;
      var price = event.target.priceBought.value;
      var date = event.target.dateBought.value;

      Meteor.call("addPosition", ticker, amount, price, date);
    }

    if(Meteor.helperFunctions.currentUrl("watchlists")) {
      Meteor.call("addToWatchlist", ticker);
    }

    $(".tickerFormTemplate .list-group").addClass("hidden");
  },

  "blur .ticker-form input[name='ticker']": function() {
    $(".tickerFormTemplate .list-group").addClass("hidden");
  },

  "change select[name='dateRange']": function(event) {
    var dateRange = parseInt(event.target.value);
    var quotes = Session.get("quotes");
    var ticker = Session.get("ticker");

    if(ticker) {
      Meteor.quotes.quotes(quotes, ticker, dateRange);
    }
  }
});

Template.watchlists.events({
  "click .watchlistTemplate .ticker-link": function(event) {
    var ticker = this.symbol;
    Session.set("ticker", ticker);
  },
  "click .close": function(event) {
    var ticker = this.symbol;
    Meteor.call("removeFromWL", ticker);
  }
});

//*** CUSTOM FUNCTIONS ***\\

Meteor.helperFunctions = {
  currentUrl: function(url) {
    if(Router.current().route.getName() === url) {
      return true;
    }
  },
  // display error upon sign in/up
  displayError: function(error) {
    $(".modal-header").show();
    $(".alert-danger span").empty();
    $(".alert-danger").append("<span>"+error.reason+"</span>");
  },
  hideModal: function() {
    $(".sign-in-up").modal("hide");
    $(".modal-backdrop").remove();
  },
  signInUp: function(event) {
    event.preventDefault();
    var emailValue = event.target.email.value;
    var passwordValue = event.target.password.value;
    var whichButton = event.target.children[2].innerHTML;

    if(whichButton === "Sign In") {
      Meteor.loginWithPassword(emailValue, passwordValue, function(error) {
        if(error) {
          Meteor.helperFunctions.displayError(error);
        } else {
          Meteor.helperFunctions.hideModal();
        }
      });
    }
    if(whichButton === "Sign Up") {
      Meteor.call("createNewUser", emailValue, passwordValue, function(error) {
        if(error) {
          Meteor.helperFunctions.displayError(error);
        } else {
          Meteor.helperFunctions.hideModal();
          Meteor.loginWithPassword(emailValue, passwordValue);
        }
      });
    }
  }
};


