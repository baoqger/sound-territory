const express = require('express')
const app = express()

app.get('*', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

app.listen(8080, () => console.log('Example app listening on port 8080!'))