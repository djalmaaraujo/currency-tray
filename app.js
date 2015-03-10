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
    , dollarPath       = "#conteudo > div > section > div.colunas.colunas2 > div:nth-child(1) > div.colunas.colunas3 > div:nth-child(1) > section:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(3)"
    , variationPath    = "#conteudo > div > section > div.colunas.colunas2 > div:nth-child(1) > div.colunas.colunas3 > div:nth-child(1) > section:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(4) > span"
    , DEFAULT_CURRENCY = 'BRL';

var CurrencyTray = {
  fetch: function () {
    request(FETCH_URL, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $         = cheerio.load(body);
        var dollar    = parseFloat($(dollarPath).text().replace(',', '.'));
        var variation = $(variationPath).text();

        CurrencyTray.currency(dollar);
        CurrencyTray.variation(variation);

        CurrencyTraySystem.updateTitle(dollar + ' ' + DEFAULT_CURRENCY);
        CurrencyTraySystem.updateTooltip(dollar, variation);
      }
      else {
        CurrencyTraySystem.updateTitle(CurrencyTray.currency() + ' ' + DEFAULT_CURRENCY);
        CurrencyTraySystem.updateTooltip(CurrencyTray.currency(), CurrencyTray.variation());
      }
    });
  },

  currency: function (currency) {
    var ctCurrenty = 'ct_currency';

    if (currency) {
      localStorage.setItem(ctCurrenty, currency)
    }
    else {
      localStorage.getItem(ctCurrenty);
    }
  },

  variation: function (variation) {
    var ctVariation = 'ct_variation';

    if (variation) {
      localStorage.setItem(ctVariation, variation)
    }
    else {
      localStorage.getItem(ctVariation);
    }
  }
};

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
    })

    TRAY_MENU.append(quitMenu);
    TRAY.menu = TRAY_MENU;
  },

  updateTitle: function (title) {
    TRAY.title = title.replace('.', ',');
  },

  updateTooltip: function (dollar, variation) {
    TRAY.tooltip = '1 USD = ' + dollar + ' ' + DEFAULT_CURRENCY + ' (' + variation + ')';
  }
};

CurrencyTraySystem.createTray();
CurrencyTray.fetch();

setInterval(function () {
  CurrencyTray.fetch();
}, REFRESH_TIMER);
