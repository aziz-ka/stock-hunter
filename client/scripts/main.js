// Meteor.subscribe("API-token");

Template.tickerForm.events({
  "submit .ticker-form": function(e) {
    e.preventDefault();

    $(".data").empty();

    var ticker = e.target.ticker.value;
    var expDate = e.target.expDate.value;
    $("#empty").text(ticker.toUpperCase());

    Meteor.call("fetchOptions", ticker, expDate, function (error, optionsResult) {
      Meteor.options.options(optionsResult, ticker);
    });
    Meteor.call("fetchQuotes", ticker, function (error, quotesResult) {
      Meteor.quotes.quotes(quotesResult, ticker);
    });
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
    Accounts.createUser({
      email: emailValue,
      password: passwordValue
    });
    $("#signup-form").modal("hide");
    $(".modal-backdrop").remove();
  }
});

Template.nav.events({
  "click .signout-btn": function() {
    Meteor.logout();
  }
});

Template.nav.helpers({
  userEmail: function() {
    return Meteor.user().emails[0].address;
  }
})


