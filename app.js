'use strict';

var path     = require('path');
var request  = require('request');
var fs       = require('fs');
var cheerio  = require('cheerio');
var gui      = require('nw.gui');

var TRAY
    , TRAY_MENU
    , FETCH_CLOCK_START        = 8
    , FETCH_CLOCK_STOP         = 18
    , REFRESH_TIMER            = 60000 // 60s
    , NOTIFICATION_CLOSE_TIMER = 3000
    , FETCH_URL                = 'http://economia.uol.com.br/cotacoes/'
    , CURRENCY_PATH            = "#conteudo > div > section > div.colunas.colunas2 > div:nth-child(1) > div.colunas.colunas3 > div:nth-child(1) > section:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(3)"
    , variationPath            = "#conteudo > div > section > div.colunas.colunas2 > div:nth-child(1) > div.colunas.colunas3 > div:nth-child(1) > section:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(4) > span"
    , DEFAULT_CURRENCY         = 'BRL';

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
        var currency  = parseFloat($(CURRENCY_PATH).text().replace(',', '.'));
        var variation = $(variationPath).text();

        if (currency > CT.currency()) {
          var notificationTitle = 'Dollar getting better!';
          var notificationBody  = currency + ' ' + DEFAULT_CURRENCY + ' (' + variation + ')';

          CTNotifier.notify(notificationTitle, notificationBody);
        }

        CT.currency(currency);
        CT.variation(variation);

        CTSystem.updateTitle(currency);
      }
      else {
        CTSystem.updateTitle(CT.currency());
      }
    });
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
    })

    TRAY_MENU.append(notificationsMenu);
    TRAY_MENU.append(quitMenu);
    TRAY.menu = TRAY_MENU;
  },

  updateTitle: function (title) {
    TRAY.title = title.toString().replace('.', ',').substr(0, 5);
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
      localStorage.setItem(ctNotificationStatus, status)
    }
    else {
      return ((localStorage.getItem(ctNotificationStatus) == "true") || (localStorage.getItem(ctNotificationStatus) == "")) ? true : false;
    }
  }
};

CTSystem.createTray();
CT.fetch();

setInterval(function () {
  CT.fetch();
}, REFRESH_TIMER);
