Meteor.subscribe("userData");

//*** REACTIVE VARs ***\\

Template.tickerForm.onCreated(function() {
  this.symbols = new ReactiveVar();
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
  disableSubmit: function() {
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

//*** EVENTS ***\\

Template.nav.events({
  "click .signout-btn": function() {
    Meteor.logout();
  }
});

Template.tickerForm.events({
  "keyup input[type='text']": function(event, template) {
    $(".list-group").removeClass("hidden");
    var ticker = event.target.value;
    Meteor.call("lookupSymbol", ticker, function (error, lookupSymbolResult) {
      console.log(lookupSymbolResult.data.securities.security);
      template.symbols.set(lookupSymbolResult.data.securities.security.slice(0,10));
    });
  },

  "click .list-group-item": function() {
    var ticker = $(this)[0].symbol;
    var tickerField = $(".ticker-form input[name='ticker']");
    console.log(ticker);
    tickerField.val(ticker);
    $(".ticker-form").submit();
    $(".list-group").addClass("hidden");
  },

  "submit .ticker-form": function(event) {
    event.preventDefault();

    $(".data").empty();

    var ticker = event.target.ticker.value.toUpperCase();
    $("#empty").text(ticker);

    if(Meteor.helperFunctions.currentUrl("options")) {
      var expDate = event.target.expDate.value;
      Meteor.call("fetchOptions", ticker, expDate, function (error, optionsResult) {
        Meteor.options.options(optionsResult, ticker);
      });
    }

    if(Meteor.helperFunctions.currentUrl(undefined)) {
      Meteor.call("fetchQuotes", ticker, function (error, quotesResult) {
        Meteor.quotes.quotes(quotesResult, ticker);
      });
    }

    if(Meteor.helperFunctions.currentUrl("watchlists")) {
      Meteor.call("addToWatchlist", ticker);
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


