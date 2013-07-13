
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.set('Content-Type', 'application/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><response><conference>2345</conference></response>').end();
};