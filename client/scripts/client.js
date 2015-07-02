Meteor.subscribe("userData");

//*** HELPERS ***\\

Template.nav.events({
  "click .signout-btn": function() {
    Meteor.logout();
  }
});

Template.nav.helpers({
  userEmail: function() {
    return Meteor.user().emails[0].address;
  }
});

Template.tickerForm.helpers({
  optionsUrl: function() {
    return Meteor.getUrl.getOptionsUrl();
  }
});

Template.watchlists.helpers({
  ticker: function() {
    var currentUser = Meteor.userId();
    return Meteor.user().watchlist;
  }
});

//*** EVENTS ***\\

Template.tickerForm.events({
  "submit .ticker-form": function(e) {
    e.preventDefault();

    $(".data").empty();

    var ticker = e.target.ticker.value.toUpperCase();
    $("#empty").text(ticker);

    if(Meteor.getUrl.currentUrl() === "options") {
      var expDate = e.target.expDate.value;
      Meteor.call("fetchOptions", ticker, expDate, function (error, optionsResult) {
        Meteor.options.options(optionsResult, ticker);
      });
    }

    if(Meteor.getUrl.currentUrl() == undefined) {
      Meteor.call("fetchQuotes", ticker, function (error, quotesResult) {
        Meteor.quotes.quotes(quotesResult, ticker);
      });
    }

    if(Meteor.getUrl.currentUrl() === "watchlists") {
      Meteor.call("addToWatchlist", ticker);
    }
  }
});

Template.signin.events({
  "submit form": function(e) {
    e.preventDefault();
    var emailValue = e.target.email.value;
    var passwordValue = e.target.password.value;
    Meteor.loginWithPassword(emailValue, passwordValue);
    $("#signin-form").modal("hide");
    $(".modal-backdrop").remove();
  }
});

Template.signup.events({
  "submit form": function(e) {
    e.preventDefault();
    var emailValue = e.target.email.value;
    var passwordValue = e.target.password.value;
    Meteor.call("createNewUser", emailValue, passwordValue);
    $("#signup-form").modal("hide");
    $(".modal-backdrop").remove();
  }
});

//*** CUSTOM FUNCTIONS ***\\

Meteor.getUrl = {
  currentUrl: function() {
    return Router.current().route.getName();
  },
  getOptionsUrl: function() {
    if(this.currentUrl() === "options") {
      console.log(this.currentUrl());
      return true;
    }
  },
  getHomeUrl: function() {
    if(this.currentUrl === this.originUrl) {
      return true;
    }
  }
};


