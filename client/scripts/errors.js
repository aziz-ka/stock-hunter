Meteor.errors = {
  noTickerError: function(error) {
    var alert = $(".tickerFormTemplate .alert");
    var submitButton = $(".ticker-form button");

    // if(error.error === 500) {
      alert.show();
      submitButton.attr("disabled", "true");
      // <div class="form-group has-error has-feedback">
      //   <label class="control-label" for="inputError2">Input with error</label>
      //   <input type="text" class="form-control" id="inputError2" aria-describedby="inputError2Status">
      //   <span class="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span>
      //   <span id="inputError2Status" class="sr-only">(error)</span>
      // </div>
    // }
  }
};