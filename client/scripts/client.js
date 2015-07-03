Meteor.subscribe("userData");

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
  "submit .ticker-form": function(e) {
    e.preventDefault();

    $(".data").empty();

    var ticker = e.target.ticker.value.toUpperCase();
    $("#empty").text(ticker);

    if(Meteor.helperFunctions.currentUrl() === "options") {
      var expDate = e.target.expDate.value;
      Meteor.call("fetchOptions", ticker, expDate, function (error, optionsResult) {
        Meteor.options.options(optionsResult, ticker);
      });
    }

    if(Meteor.helperFunctions.currentUrl() == undefined) {
      Meteor.call("fetchQuotes", ticker, function (error, quotesResult) {
        Meteor.quotes.quotes(quotesResult, ticker);
      });
    }

    if(Meteor.helperFunctions.currentUrl() === "watchlists") {
      Meteor.call("addToWatchlist", ticker);
    }
  }
});

Template.signin.events({
  "submit form": function(e) {
    e.preventDefault();
    var emailValue = e.target.email.value;
    var passwordValue = e.target.password.value;
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
  "submit form": function(e) {
    e.preventDefault();
    var emailValue = e.target.email.value;
    var passwordValue = e.target.password.value;
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


