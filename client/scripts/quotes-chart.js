
Meteor.quotes = {

  quotes: function(quotesResult, ticker, dateRange) {
    console.log(quotesResult.data);

    var step = 1;
    var dateArr = [];
    var closeArr = [];
    var volumeArr = [];
    var quoteData = quotesResult.data.history.day;

    if(quoteData.length >= 256 && dateRange >= 256) {
      step = 5;
    }
    if(dateRange > quoteData.length) {
      dateRange = quoteData.length;
    }

    for (var i = quoteData.length - dateRange; i < quoteData.length; i+=step) {
      closeArr.push(quoteData[i]["close"]);
      dateArr.push(quoteData[i]["date"]);
      volumeArr.push(quoteData[i]["volume"]);
    }

    this.chart(ticker, closeArr, volumeArr, dateArr);
  },

  chart: function(ticker, close, volume, date) {
    var shorterDateArr = [];

    $(date).each(function(i) {
      var shorterDate = date[i].substr(5, 11);
      shorterDateArr.push(shorterDate);
    });

    $('#graph').highcharts({
      chart: {
        type: "spline",
        zoomType: "x"
      },
      plotOptions: {
        series: {
          marker: {
            enabled: true,
            symbol: "circle"
          }
        }
      },
      title: {
        text: ticker.toUpperCase()
      },
      xAxis: {
        categories: shorterDateArr,
        labels: {
          rotation: 45
        },
      },
      yAxis: [{
        max: Math.ceil(Math.max.apply(null, close)),
        min: Math.floor(Math.min.apply(null, close)),
        title: {
          text: "Price",
          style: {
            color: Highcharts.getOptions().colors[0]
          }
        },
        labels: {
          style: {
            color: Highcharts.getOptions().colors[0]
          }
        },
        opposite: true,
        gridLineColor: "#eee",
        gridLineWidth: 0.5
      }, {
        max: Math.ceil(Math.max.apply(null, volume)),
        min: Math.floor(Math.min.apply(null, volume)),
        title: {
          text: "Volume"
        },
        gridLineColor: "#eee",
        gridLineWidth: 0.5
      }],
      tooltip: {
        shared: true
      },
      series: [{
        name: "Volume",
        tooltip: {
          valueSuffix: " mil"
        },
        yAxis: 1,
        type: "column",
        data: volume,
        color: "#bbb",
      }, {
        name: "Closing Price",
        data: close,
        zIndex: 2
      }]
    });
  }
};