'use strict';

var notifier = require('node-notifier');
var path     = require('path');
var request  = require('request');
var fs       = require('fs');
var cheerio  = require('cheerio');
var open     = require('open');
var gui      = require('nw.gui');

var TRAY
    , TRAY_MENU
    , REFRESH_TIMER    = 60000 // 60s
    , FETCH_URL        = 'http://economia.uol.com.br/cotacoes/'
    , CURRENCY_PATH    = "#conteudo > div > section > div.colunas.colunas2 > div:nth-child(1) > div.colunas.colunas3 > div:nth-child(1) > section:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(3)"
    , variationPath    = "#conteudo > div > section > div.colunas.colunas2 > div:nth-child(1) > div.colunas.colunas3 > div:nth-child(1) > section:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(4) > span"
    , DEFAULT_CURRENCY = 'BRL';

//
// Currency Tray
//

var CurrencyTray = {
  fetch: function () {
    request(FETCH_URL, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $         = cheerio.load(body);
        var currency  = parseFloat($(CURRENCY_PATH).text().replace(',', '.')).toFixed(3);
        var variation = $(variationPath).text();

        CurrencyTray.currency(currency);
        CurrencyTray.variation(variation);

        CurrencyTraySystem.updateTitle(currency);

        if (currency > CurrencyTray.currency()) {
          var notificationTitle = 'Dollar up!';
          var notificationBody  = currency + ' ' + DEFAULT_CURRENCY + ' (' + variation + ')';

          CurrencyTrayNotifier.notify(notificationTitle, notificationBody);
        }
      }
      else {
        CurrencyTraySystem.updateTitle(CurrencyTray.currency());
      }
    });
  },

  currency: function (currency) {
    var ctCurrenty = 'ct_currency';

    if (currency) {
      localStorage.setItem(ctCurrenty, currency)
    }
    else {
      return localStorage.getItem(ctCurrenty);
    }
  },

  variation: function (variation) {
    var ctVariation = 'ct_variation';

    if (variation) {
      localStorage.setItem(ctVariation, variation)
    }
    else {
      return localStorage.getItem(ctVariation);
    }
  }
};

//
// Tray Menu
//

var CurrencyTraySystem = {
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
      , checked: CurrencyTrayNotifier.status()
      , click: function (something) {
        var status = CurrencyTrayNotifier.status();

        CurrencyTrayNotifier.status((status) ? "false" : "true");
      }
    })

    TRAY_MENU.append(notificationsMenu);
    TRAY_MENU.append(quitMenu);
    TRAY.menu = TRAY_MENU;
  },

  updateTitle: function (title) {
    TRAY.title = title.replace('.', ',');
  }
};

//
// Notifier
//

var CurrencyTrayNotifier = {
  notify: function (title, body) {
    if (CurrencyTrayNotifier.status()) {
      notifier.notify({
        title: title,
        message: body,
        icon: 'icon@2x.png',
        sound: true
      });
    }
  },

  status: function (status) {
    var ctNotificationStatus = 'ct_notification_status';

    if (status !== undefined) {
      localStorage.setItem(ctNotificationStatus, status)
    }
    else {
      return ((localStorage.getItem(ctNotificationStatus) == "true") || (localStorage.getItem(ctNotificationStatus) == "")) ? true : false;
    }
  }
};

CurrencyTraySystem.createTray();
CurrencyTray.fetch();

setInterval(function () {
  CurrencyTray.fetch();
}, REFRESH_TIMER);
