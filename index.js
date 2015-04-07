
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var fm = require('front-matter');
var marked = require('marked');
//var readdir = require('fs-readdir-recursive');

var renderer = require('./lib/marked-renderer');
var read = require('./lib/read');
var extend = require('./lib/extend');
var include = require('./lib/include');

module.exports = function(opts) {

  var opts = opts || {};
  var pages = [];

  opts = _.defaults(opts, {
    layout: fs.readFileSync('layout.html', 'utf8'),
    partials: {},
    MD_MATCH: /md|markdown/,
  });


  opts.extend = extend;
  opts.include = include;


  function createRouteObj(route, i, arr) {

    var obj;
    var filepath;
    var contents;
    var matter;
    var ext;
    var parent = false;
    var fullpath = false;

    if (this.path) {
      parent = {
        name: this.name,
        path: this.path,
        // Currently this won't get fullpath because it doesn't exist yet
        fullpath: this.fullpath || this.path,
      };
      fullpath = parent.fullpath + route.path;
      filepath = path.join(opts.src, fullpath + '/index.md');
    } else {
      fullpath = route.path;
      filepath = path.join(opts.src, fullpath + '/index.md');
    }

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
      fullpath: fullpath,
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
  pages = opts.routes.map(renderPage);


  return pages;


};

