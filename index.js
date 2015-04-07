
var _ = require('lodash');
var fs = require('fs');
var fm = require('front-matter');
var marked = require('marked');
var readdir = require('fs-readdir-recursive');

var renderer = require('./lib/marked-renderer');
var read = require('./lib/read');
var extend = require('./lib/extend');
var include = require('./lib/include');

module.exports = function(opts) {

  var opts = opts || {};
  var pages = [];
  var filenames = [];

  opts = _.defaults(opts, {
    layout: fs.readFileSync('layout.html', 'utf8'),
    partials: {},
    match: /\.html$|\.md$/,
    mdMatch: /\.md$/
  });

  opts.extend = extend;
  opts.include = include;

  filenames = readdir(opts.src, function (x) {
    return (x[0] !== '.' && !x.match(/layouts|partials/));
  });
 

  pages = filenames.map(function(filename) {

    var dirs = filename.split('/');
    var file = dirs[dirs.length-1];
    var filepath = '/';
    var contents;
    var matter;
    var body;

    if (!file.match(opts.match)) { return false }
    contents = fs.readFileSync(opts.src + '/' + filename, 'utf8');
    matter = fm(contents);
    //opts.page = matter.attributes;
    if (dirs.length > 1) {
      dirs.pop();
      filepath = '/' + dirs.join('/');
    }
    return {
      path: filepath,
      depth: dirs.length,
      filename: file,
      title: matter.attributes.title || filepath,
      page: matter.attributes,
      body: matter.body,
    }
  });

  pages.reverse();

  pages.sort(function(a, b) {
    return a.depth - b.depth;
  });

  // for in-template routing
  opts.pages = pages;

  // Render pages
  pages = pages.map(function(page) {
    opts.page = page.page;
    opts.body = _.template(page.body)(opts);
    if (page.filename.match(opts.mdMatch)) {
      opts.body = marked(opts.body, { renderer: renderer });
    }
    page.body = _.template(opts.layout)(opts);
    return page;
  });

  // Convert markdown to HTML
  //pages = pages.map(function(page) {
  //  var obj = page;
  //  if (page.filename.match(opts.mdMatch)) {
  //    obj.html = marked(page.body, { renderer: renderer });
  //  }
  //  return obj;
  //});


  return pages;

};

