Meteor.options = {
  strikePriceArray: [],

  options: function(optionsResult, ticker) {
    $("#empty").text(ticker);
    $(".data").empty();
    
    var optionsData = optionsResult.data.options.option;
    
    optionsData.sort(function(a,b) {
      if(a.strike > b.strike) {
        return 1;
      }
      if(a.strike < b.strike) {
        return -1;
      }
      return 0;
    });

    for (var i in optionsData) {
      for (var key in optionsData[i]) {
        this.optionsTable("td", key, optionsData[i]);
      }
    }
  },

  optionsTable: function(el, className, optionsData) {
    var strikes = this.strikePriceArray;

    if ($(el).hasClass(className)) {
      var row = $("<tr>").addClass("data animated zoomInDown center-block").html(Math.round(optionsData[className] * 100) / 100);
      if (optionsData["option_type"] === "call") {
        $(".C." + className).append(row);
      }
      if (optionsData["option_type"] === "put") {
        $(".P." + className).append(row);
      }
      if (className === "strike" && optionsData["strike"] !== strikes[strikes.length - 1]) {
        strikes.push(optionsData[className]);
        var strikeRow = $("<tr>").addClass("data animated zoomInDown center-block").html(strikes[strikes.length - 1]);
        $(".strike").append(strikeRow);
      }
    }
  }
};