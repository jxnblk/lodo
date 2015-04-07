
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
  routes: [
    { name: 'Home', path: '/' },
    { name: 'Docs', path: '/docs',
      routes: [
        { name: 'Grid', path: '/grid' },
        { name: 'Typography', path: '/typography' },
        { name: 'Tables', path: '/tables' },
      ]
    },
  ],
};

pages = lodo(opts);

// Only two levels deep?
function writePage(page) {
  var pagePath;
  var parents = [];
  var parentpath;
  console.log('Writing', page.path);
  if (page.parent) { parents.push(page.parent) }
  parentpath = parents.map(function(p) {
    return p.path;
  }).join('');
  pagePath = path.join(__dirname, parentpath + page.path);
  console.log(pagePath);
  fs.ensureDirSync(pagePath);
  fs.writeFileSync(pagePath + '/index.html', page.body);
  if (page.routes) {
    page.routes.forEach(writePage);
  }
}

pages.forEach(writePage);


