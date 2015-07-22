Meteor.subscribe("userData");

//*** REACTIVE VARs ***\\

Template.tickerForm.onCreated(function() {
  this.symbols = new ReactiveVar();
});

//*** ON TEMPLATE RENDER ***\\

Template.home.onRendered(function() {
  var ticker = Session.get("ticker");
  var quotes = Session.get("quotes");

  // re-draw chart on home render
  if(ticker && quotes) {
    Meteor.quotes.quotes(quotes, ticker, 22);
  }
  if(ticker && !quotes) {
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

Template.news.onRendered(function() {
  if(Session.get("news")) {
    $(".newsTemplate").removeClass("hidden");
  }
});

Template.tweets.onRendered(function() {
  twttr.widgets.load();
});

Template.options.onRendered(function() {
  var optionsData = Session.get("options");
  var ticker = Session.get("ticker");
  if(optionsData && optionsData[0].ticker === ticker) {
    // display options chain data when template is re-rendered
    Meteor.options.options(optionsData[0].content, ticker);
  } else {
    $(".ticker-form").submit();
  }
});

//*** HELPERS ***\\

Template.nav.helpers({
  userEmail: function() {
    return Meteor.user().emails[0].address;
  }
});

Template.tickerForm.helpers({
  optionsUrl: function() {
    return Meteor.helperFunctions.currentUrl("options");
  },
  homeUrl: function() {
    return Meteor.helperFunctions.currentUrl(undefined);
  },
  disableInput: function() {
    // if not logged in disable submit
    if(Meteor.helperFunctions.currentUrl("watchlists") && Meteor.user() === null) {
      return {"disabled": true,
              "data-toggle": "tooltip",
              "data-placement": "top",
              "title": "You must sign in first"
            };
    }
  },
  symbolList: function() {
    return Template.instance().symbols.get();
  }
});

Template.watchlists.helpers({
  ticker: function() {
    var currentUser = Meteor.userId();
    return Meteor.user().watchlist;
  }
});

Template.news.helpers({
  newsList: function() {
    var newsContent = Session.get("news");
    return newsContent[0];
  }
});

Template.tweets.helpers({
  ticker: function() {
    var ticker = Session.get("ticker");
    if(ticker) return ticker;
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
  }
});

Template.tickerForm.events({
  "keyup input[type='text']": function(event, template) {
    var ticker = event.target.value;
    var submitButton = $(".ticker-form button");
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
          var title = $(itemsArray[i]).find("title").text();
          var link = $(itemsArray[i]).find("link").text();
          var date = $(itemsArray[i]).find("pubDate").text();
          var newsObject = {"title": title, "link": link, "date": date};
          newsArray[0].content.push(newsObject);
        }

        Session.set("news", newsArray);
      });

      Meteor.call("getTweets", ticker, function(error, tweets, response) {
        if(error) throw error;

        console.log(response);
        console.log(tweets);
      });
    }

    if(Meteor.helperFunctions.currentUrl("watchlists")) {
      Meteor.call("addToWatchlist", ticker);
    }

    // $(".ticker-form input[name='ticker']").blur();
    $(".tickerFormTemplate .list-group").addClass("hidden");
  },

  "change select[name='dateRange']": function(event) {
    var dateRange = parseInt(event.target.value);
    var ticker = Session.get("ticker");
    var quotes = Session.get("quotes");

    if(ticker) {
      Meteor.quotes.quotes(quotes, ticker, dateRange);
    }
  }
});

Template.signin.events({
  "submit form": function(event) {
    event.preventDefault();
    var emailValue = event.target.email.value;
    var passwordValue = event.target.password.value;
    Meteor.loginWithPassword(emailValue, passwordValue, function(error) {
      if(error) {
        Meteor.helperFunctions.displayError(error);
      } else {
        Meteor.helperFunctions.hideModal();
      }
    });
  }
});

Template.signup.events({
  "submit form": function(event) {
    event.preventDefault();
    var emailValue = event.target.email.value;
    var passwordValue = event.target.password.value;
    Meteor.call("createNewUser", emailValue, passwordValue, function(error) {
      if(error) {
        console.log(error.reason);
        Meteor.helperFunctions.displayError(error);
      } else {
        Meteor.helperFunctions.hideModal();
        Meteor.loginWithPassword(emailValue, passwordValue);
      }
    });
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
    $(".modal-header").removeClass("hidden");
    $(".alert-danger span").empty();
    $(".alert-danger").append("<span>"+error.reason+"</span>");
  },
  hideModal: function() {
    $(".sign-in-up").modal("hide");
    $(".modal-backdrop").remove();
  }
};


