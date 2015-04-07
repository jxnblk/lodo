
var fs = require('fs-extra');
var path = require('path');
var lodo = require('..');
var pkg = require('../package.json');

var pages;
var opts = {
  src: __dirname + '/src',
  title: pkg.name,
  description: pkg.description,
  layout: fs.readFileSync(path.join(__dirname, './src/layouts/default.html'), 'utf8'),
  partials: {
    header: fs.readFileSync(path.join(__dirname, './src/partials/header.html'), 'utf8'),
  },
  stylesheets: [
    'http://d2v52k3cl9vedd.cloudfront.net/bassdock/1.3.0/bassdock.min.css'
  ],
};

pages = lodo(opts);


pages.forEach(function(page) {
  console.log(page.path);
  console.log(page);
  var pagePath = path.join(__dirname, page.path);
  fs.ensureDirSync(pagePath);
  fs.writeFileSync(pagePath + '/index.html', page.body);
});

