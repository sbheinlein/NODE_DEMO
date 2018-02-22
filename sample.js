var http = require('http');
var fs = require('fs'); 
var url = require('url'); 
var db = require('/QOpenSys/QIBM/ProdData/OPS/Node6/os400/db2i/lib/db2a');
var xt = require('/QOpenSys/QIBM/ProdData/OPS/Node6/os400/xstoolkit/lib/itoolkit');
  
var DBname = "ARCUSA01"; 
var userId = "sheinlein";
var passwd = "irulu7";
var ip = "192.168.3.43"; 
var port = 8080; 
                          
var webserver = http.createServer((req,res) => { 
  var realPath = __dirname + url.parse(req.url).pathname; 
  fs.exists(realPath, (exists) => { 
    if(!exists){ 
      var sql = url.parse(req.url, true).query.sql;
      var cl = url.parse(req.url, true).query.cl;
      if(sql && sql.length > 0) {
        console.log("SQL statement : " + sql);
        var dbconn = new db.dbconn();
        dbconn.conn(DBname, userId, passwd);  // Connect to the DB 
        var stmt = new db.dbstmt(dbconn);
        stmt.exec(sql, (rs) => { // Query the statement
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(JSON.stringify(rs));
          stmt.close();  
          dbconn.disconn(); 
          dbconn.close(); 
        });
      }
      if(cl && cl.length > 0) {
        console.log("CL statement : " + cl); 
        var conn = new xt.iConn(DBname, userId, passwd);
        conn.add(xt.iSh("system -i " + cl)); 
        conn.run((rs) => {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(xt.xmlToJson(rs)[0].data);
        }); 
      } 
    } else { 
      var file = fs.createReadStream(realPath); 
      res.writeHead(200, {'Content-Type':'text/html'}); 
      file.on('data', res.write.bind(res)); 
      file.on('close', res.end.bind(res));  
      file.on('error', (err) => { 
        res.writeHead(500, {'Content-Type':'text/plain'}); 
        res.end("500 Internal Server Error"); 
      }); 
    }  
  }); 
}); 
webserver.listen(port, ip); 
console.log('Server running at http://' + ip + ':' + port);
