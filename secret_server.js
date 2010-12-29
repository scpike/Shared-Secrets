var http = require('http')  , 
    url = require('url'), 
    fs = require('fs'),
    MemoryStore = require('connect/middleware/session/memory');

var db = require('dirty')('user.db');

var io = require('socket.io'); // socket.io


var host="192.168.0.134";
var port = "8124";
var express = require('express');
app = express.createServer();

app.use(express.bodyDecoder());
app.use(express.cookieDecoder());
app.use(express.session());


app.get("/secret/:id",function(req,res){
    console.log(req.params.id);
    fs.readFile(__dirname + "/secret.html", function(err, data){
     res.writeHead(200, {'Content-Type': 'text/html','Set-Cookie': 'roomId='+req.params.id});
     res.write(data, 'utf8');
     res.end();
   }); 
    
});



app.get("/media/:type/*",function(req,res){
      var path = url.parse(req.url).pathname;
    
    fs.readFile(__dirname + path, function(err, data){
    if (err) return send404(res);
    if (req.params.type == "css"){
        res.writeHead(200, {'Content-Type': 'text/css'})
       
   }
   else if (req.params.type=="js"){
        res.writeHead(200, {'Content-Type': 'text/javascript'})
   }
   res.write(data, 'utf8');
   res.end(); 
    });
});



app.get("/",function(req,res){
    fs.readFile(__dirname + "/new_secret.html", function(err, data){
     res.writeHead(200, {'Content-Type': 'text/html'});
     res.write(data, 'utf8');
     res.end();
   }); 
    
});




app.post("/new/", function(req,res){
    var room = req.body.description;
    var num = req.body.numPeople;
    console.log("Someone is creating a room for " + room + " for " + num);
    newRoomId(db,function(result){
        newRoom = new secretRoom(room,num);
       db.set(result, newRoom);
       rooms[result] = newRoom;
       console.log("Created a room " + result);
       res.redirect('/secret/' + result);
       
    });
    
    
});

function secretRoom(description, numPeople){
this.description = description;
this.numPeople=numPeople;
this.members = [];
this.clientAssignments = {};
    
    this.answers = function(){
        var tmp = [];
        for (m =0; m < this.members.length;m++){
            if(this.members[m].answer){
                tmp.push(this.members[m].answer);
                }
                
        }
        return tmp;
    }
    
    this.averageAnswer = function(){        
      return this.answers().avg();
    }
    
    this.addMember = function(client){
        console.log(client);
        var m = new member(client);
        this.clientAssignments[client.sessionId] = m;
        this.members.push(m);
    }
    
    this.getMemberArray = function(){
        return this.members;   
    }
    
    this.getMemberStatus = function(){
        var tmp = [];
        for (m = 0 ; m < this.members.length; m++){
            for (c = 0; c < this.members[m].clients.length; c++){
                tmp.push({memberid : this.members[m].clients[c].sessionId , answer : this.members[m].answer});
            }
        }
        return tmp;
        
    }
    
    this.getMemberIDs = function(){
        var tmp = [];
        for (m=0; m < this.members.length;m++){
            tmp = tmp.concat(tmp, this.members[m].getSessionIDs());   
        }
        return tmp;
    }
    
    this.getOtherMembers = function(member){
           var arcopy = this.members.slice();
           if (arcopy.indexOf(member) != -1){
           arcopy.splice(arcopy.indexOf(member));
           }
           return arcopy;
    }

    
    this.sendMembersMsg = function(msg){
        for (m= 0; m < this.members.length; m++){
            for (c = 0; c < this.members[m].clients.length;c++){
                console.log("sending message");
                console.log(c);
                this.members[m].clients[c].send(msg);
            }
        }
    }
    
    this.readyForAnswer = function(){
        return (this.answers().length >= this.numPeople);
    }
    
    
}

function member(client){
    this.clients = [];
    this.clients.push(client);
    this.answer = null;
    this.equals = function(other){
        var mySort = this.getSessionIDs().sort();
        var otherSort = other.getSessionIDs().sort();
        for (x = 0; x < mySort.length; x++){
         if (x >= otherSort.length || mySort[x] != otherSort[x]){
            return false;   
         }
        }
        return true;
    }

    this.addClient = function(client){
     this.clients.push(client);   
     this.cleanupClients();
    }
    
    this.getSessionIDs = function(){
        var tmp = [];
        for (c = 0 ; c< this.clients.length; c++){
         tmp.push(this.clients[c].sessionId);   
        }
        return tmp;
    }
    
    this.cleanupClients = function(){
     //remove disconnected clients
        var tmpArray = [];
        for (c= 0; c < this.clients.length; c++){
            if (this.clients[c].connected){
             tmpArray.push(this.clients[c]);   
            }
        }
        this.clients = tmpArray;
    }
    

    
}



app.listen(port, host);
console.log('Server running at ' + host  + ':' + port);

var socket = io.listen(app);
var roomAssignments = {};
var clientAssignments = {};


socket.on('connection',  function(client){ 
  console.log("someone connected to socket");
  console.log(client.sessionId);
  var room;

  client.on('message', function(message){ 
      console.log("got a message");
      console.log(message);
      if (message.initializeMember){
        console.log("initializing Member for room  " + message.initializeMember);   
        var roomId = message.initializeMember;
        room = rooms[roomId];
        
        var descr = null, numPeople = null, roomMembers=null;
        if (room){
            console.log(room);
            
            room.addMember(client);
            console.log("found room information" + room)
            descr = room.description;
            numPeople = room.numPeople;
            roomAssignments[client.sessionId] = room;
            roomMembers = room.getMemberStatus();

            console.log(roomMembers);
            room.sendMembersMsg( {clientRefresh : {members: roomMembers}});
            
        }
        var data = {roomInfo : {description : descr , numPeople : numPeople}};
        client.send(data);
      }
     else{
        room = roomAssignments[client.sessionId];
        if (message.sendAnswer){
            console.log("got an answer");
            m = room.clientAssignments[client.sessionId];
            m.answer = message.sendAnswer;
            console.log(room);
            
            room.sendMembersMsg({ answerReceived : {client : client.sessionId, answer : message.sendAnswer}});
        }
     }
     console.log("checkign if resutls are ready");
     console.log(room.readyForAnswer());
     console.log(room.numPeople);
     console.log(room.answers().length);
     if (room.readyForAnswer()){
         var res = {resultsIn : {average : room.averageAnswer()} };
         room.sendMembersMsg(res);
     }
     
    }); 
  client.on('disconnect', function(){ 
        var room = roomAssignments[client.sessionId];
        room.clientAssignments[client.sessionId].cleanupClients();
        room.sendMembersMsg( {clientRefresh : {members: room.getMemberStatus()}});
        
      }) ;
}); 


app.get("/ajax/roomInfo/:id",function(req,res){
   res.writeHead(200,  {'Content-Type': 'text/html'});
   console.log(req.params.id);
   console.log(rooms);
   res.write( data );
    res.end();
});

Array.prototype.avg = function() {
var av = 0;
var cnt = 0;
var len = this.length;
for (var i = 0; i < len; i++) {
var e = +this[i];
if(!e && this[i] !== 0 && this[i] !== '0') e--;
if (this[i] == e) {av += e; cnt++;}
}
return av/cnt;
}


send404 = function(res){ 
        res.writeHead(404); 
        res.write('404'); 
        res.end(); 
}; 

function newRoomId(db, callback){
    var tryId=0;
    found = false;
    while (!found){
    if (!db.get(tryId)){
     found = true;
     callback(tryId);
    }
    tryId++;
    }
}

var rooms = {};
db.on('load', function() {
    console.log("Database Loaded, initializing rooms");
    db.forEach(function(key,val){
        rooms[key] = new secretRoom(val.description,val.numPeople);
    });
});
