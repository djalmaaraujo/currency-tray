'use strict';

var path     = require('path');
var request  = require('request');
var fs       = require('fs');
var cheerio  = require('cheerio');
var gui      = require('nw.gui');

var TRAY
    , TRAY_MENU
    , FETCH_CLOCK_START        = 8
    , PAYPAL_EXAMPLE_FEE       = 3.5
    , FETCH_CLOCK_STOP         = 18
    , REFRESH_TIMER            = 60000 // 60s
    , NOTIFICATION_CLOSE_TIMER = 6000
    , FETCH_URL                = 'http://www.reuters.com/finance/currencies/quote?srcAmt=1.00&srcCurr=USD&destAmt=&destCurr=BRL'
    , CURRENCY_PATH            = "#topContent > div > div.sectionColumns > div.column1.gridPanel.grid8 > div:nth-child(1) > div.moduleBody > div:nth-child(1) > div.fourUp.currQuote > div.norm.currData"
    , CURRENCY_MAX_PATH        = "#topContent > div > div.sectionColumns > div.column1.gridPanel.grid8 > div:nth-child(1) > div.moduleBody > div:nth-child(1) > div:nth-child(2) > div"
    , CURRENCY_MIN_PATH        = "#topContent > div > div.sectionColumns > div.column1.gridPanel.grid8 > div:nth-child(1) > div.moduleBody > div:nth-child(1) > div:nth-child(3) > div"
    , DEFAULT_CURRENCY         = 'R$';

//
// Currency Tray
//

var CT = {
  fetch: function () {
    if (!CT.canFetch()) {
      return false;
    }

    request(FETCH_URL, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $         = cheerio.load(body);
        var currency  = parseFloat($(CURRENCY_PATH).text().trim());
        var currencyMAX  = parseFloat($(CURRENCY_MAX_PATH).text().trim());
        var currencyMIN  = parseFloat($(CURRENCY_MIN_PATH).text().trim());

        if (currency > CT.currency()) {
          var notificationTitle = DEFAULT_CURRENCY + currency + ' up!';
          var notificationBody  = "Max: " + DEFAULT_CURRENCY + currencyMAX + " / Min: " + DEFAULT_CURRENCY + currencyMIN + "\n Paypal: ~" + DEFAULT_CURRENCY + CT.paypalCalc(currency);

          CTNotifier.notify(notificationTitle, notificationBody);
        }

        CT.currency(currency);

        CTSystem.updateTitle(currency);
      }
      else {
        CTSystem.updateTitle(CT.currency());
      }
    });
  },

  paypalCalc: function (currency) {
    var fee = CTNotifier.paypalFee() / 100;

    return parseFloat(currency - (currency * fee)).toFixed(3);
  },

  canFetch: function () {
    var hours = new Date().getHours();

    return ((hours >= FETCH_CLOCK_START) && (hours <= FETCH_CLOCK_STOP)) ? true : false;
  },

  currency: function (currency) {
    var ctCurrenty = 'ct_currency';

    if (currency) {
      localStorage.setItem(ctCurrenty, currency)
    }
    else {
      return parseFloat(localStorage.getItem(ctCurrenty));
    }
  }
};

//
// Tray Menu
//

var CTSystem = {
  createTray: function () {
    TRAY = new gui.Tray({ icon: 'icon.png' });
    TRAY_MENU  = new gui.Menu();

    var quitMenu = new gui.MenuItem({
      type: 'checkbox'
      , label: 'Quit'
      , click: function () {
        gui.App.quit();
      }
    });

    var notificationsMenu = new gui.MenuItem({
      type: 'checkbox'
      , label: 'Enable Notifications'
      , checked: CTNotifier.status()
      , click: function (something) {
        var status = CTNotifier.status();

        CTNotifier.status((status) ? "false" : "true");
      }
    });

    var paypalFeeQuestions = new gui.MenuItem({
      type: 'normal'
      , label: 'Define Paypal FEE'
      , click: function () {
        var paypalStatus = CTNotifier.paypalFee();

        CTNotifier.paypalFee(prompt("Type the Paypal Fee. Ex: 3.5", CTNotifier.paypalFee()))
      }
    });

    TRAY_MENU.append(notificationsMenu);
    TRAY_MENU.append(paypalFeeQuestions);
    TRAY_MENU.append(quitMenu);
    TRAY.menu = TRAY_MENU;
  },

  updateTitle: function (title) {
    TRAY.title = title.toString().substr(0, 5);
  }
};

//
// Notifier
//

var CTNotifier = {
  notify: function (title, body) {
    if (!CTNotifier.status()) {
      return false;
    }

    var options = {
      icon: "icon.png",
      body: body
    };

    var notification = new Notification(title, options);

    notification.onshow = function () {
      setTimeout(function() { notification.close(); }, NOTIFICATION_CLOSE_TIMER);
    }
  },

  status: function (status) {
    var ctNotificationStatus = 'ct_notification_status';

    if (status !== undefined) {
      localStorage.setItem(ctNotificationStatus, status);
    }
    else {
      return ((localStorage.getItem(ctNotificationStatus) == "true") || (localStorage.getItem(ctNotificationStatus) == "")) ? true : false;
    }
  },

  paypalFee: function (fee) {
    var ctNotificatioPaypalFee = 'ct_notification_paypal_fee';

    if (fee !== undefined) {
      fee = fee.replace(',', '.')
      fee = fee.replace('%', '')

      localStorage.setItem(ctNotificatioPaypalFee, parseFloat(fee));
    }
    else {
      return (localStorage.getItem(ctNotificatioPaypalFee) !== "null") ? localStorage.getItem(ctNotificatioPaypalFee) : PAYPAL_EXAMPLE_FEE;
    }
  }
};

CTSystem.createTray();
CT.fetch();

setInterval(function () {
  CT.fetch();
}, REFRESH_TIMER);
