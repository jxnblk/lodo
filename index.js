
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var fm = require('front-matter');
var marked = require('marked');
var toc = require('markdown-toc');

var renderer = require('./lib/marked-renderer');
var read = require('./lib/read');
var extend = require('./lib/extend');
var include = require('./lib/include');

module.exports = function(opts) {

  var opts = opts || {};
  var pages = [];

  opts = _.defaults(opts, {
    layout: fs.readFileSync(path.join(__dirname, './layout.html'), 'utf8'),
    partials: {},
    MD_MATCH: /md|markdown/,
  });


  opts.extend = extend;
  opts.include = include;


  function createFullPaths(routes, newRoutes, prefix) {
    var prefix = prefix || '';
    var newRoutes = newRoutes || [];
    routes.forEach(function(route) {
      if (prefix) {
        route.fullpath = prefix + route.path;
      } else {
        route.fullpath = route.path;
        newRoutes.push(route);
      }
      if (route.routes) {
        createFullPaths(route.routes, newRoutes, route.fullpath);
      }
    });
    return newRoutes;
  }


  opts.routes = createFullPaths(opts.routes);

  function createRouteObj(route, i, arr) {

    var obj;
    var filepath;
    var contents;
    var matter;
    var ext;
    var parent = false;

    if (this.path) {
      parent = {
        name: this.name,
        path: this.path,
        fullpath: this.fullpath,
      };
    }

    filepath = path.join(opts.src, route.fullpath + '/index.md');

    ext = 'md';
    contents = fs.existsSync(filepath) ? fs.readFileSync(filepath, 'utf8') : false;
    if (!contents) {
      filepath = filepath.replace(/\.md$/, '.html');
      ext = 'html';
      contents = fs.existsSync(filepath) ? fs.readFileSync(filepath, 'utf8') : false;
    }
    if (!contents) {
      console.log(('No template found for ' + route.path).red);
      ext = false;
      return false;
    }

    matter = fm(contents);

    obj = {
      name: route.name,
      title: route.title || matter.attributes. title || _.capitalize(route.name),
      path: route.path,
      fullpath: route.fullpath,
      page: matter.attributes,
      body: matter.body,
      ext: ext,
      parent: parent,
    }

    if (route.routes) {
      route.routes = route.routes.map(createRouteObj, route);
      obj.routes = route.routes;
    }

    return obj;

  }

  function addTOC(route) {
    opts.page = route.page;
    if (route.ext.match(opts.MD_MATCH)) {
      route.sections = toc(_.template(route.body)(opts)).json;
    }
    if (route.routes) {
      route.routes = route.routes.map(addTOC);
    }
    return route;
  }

  function renderPage(route) {
    opts.page = route.page;
    opts.body = _.template(route.body)(opts);
    if (route.ext.match(opts.MD_MATCH)) {
      opts.body = marked(opts.body, { renderer: renderer });
    }
    route.body = _.template(opts.layout)(opts);
    if (route.routes) {
      route.routes = route.routes.map(renderPage);
    }
    return route;
  };


  opts.routes = opts.routes.map(createRouteObj);
  opts.routes = opts.routes.map(addTOC);
  pages = opts.routes.map(renderPage);


  return pages;


};

