var notifier      = require('node-notifier');
var path          = require('path');
var request       = require('request');
var fs            = require('fs');
var cheerio       = require('cheerio');
var open          = require('open');

var CACHE         = false;
var TIMER         = 10000;
var dollarPath    = "#conteudo > div > section > div.colunas.colunas2 > div:nth-child(1) > div.colunas.colunas3 > div:nth-child(1) > section:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(3)";
var variationPath = "#conteudo > div > section > div.colunas.colunas2 > div:nth-child(1) > div.colunas.colunas3 > div:nth-child(1) > section:nth-child(1) > table > tbody > tr:nth-child(1) > td:nth-child(4) > span";

var notify = function (dollar, variacao) {
  notifier.notify({
    title: 'Ói o dóla!',
    message: '1 USD = R$' + dollar + ' (' + variacao + ')',
    icon: path.join(__dirname, 'icon.png')
  });

  notifier.on('click', function (notifierObject, options) {
    open("http://economia.uol.com.br/cotacoes/");
  });
}

var me = function () {
  request('http://economia.uol.com.br/cotacoes/', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var $         = cheerio.load(body);
      var dollar    = parseFloat($(dollarPath).text().replace(',', '.'));
      var variation = $(variationPath).text();

      console.log('Cotação atual: ' + dollar + ' ' + variation);

      if (!CACHE || (CACHE < dollar)) {
        CACHE = dollar;
        notify(dollar, variation);
      }
    }
  });
}

setInterval(function () {
  me();
}, TIMER);
