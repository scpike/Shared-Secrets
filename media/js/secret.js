function populateMemberBar(members, divToPopulate){
    $(divToPopulate).html("");
    var numAnswers = 0;
    for (m=0; m < members.length; m++){
        child = document.createElement("li");
        child.id = members[m].memberid+"_status";
        child.innerHTML = members[m].memberid;
        $(divToPopulate).append(child);
        if ( members[m].answer){
         numAnswers++;   
        }
        updateMember(members[m].memberid, members[m].answer);
    }
    $("#membersIn").html(members.length);
   countAnswers();
}

function sendAnswer(){
    var answer = $("#amountInput").val();
    var msg = {sendAnswer : answer };
    socket.send(msg);
}

function updateMember(member,  answer){
    var mid = "#" + member + "_status";
    if (answer){
        $(mid).removeClass("unanswered");
        $(mid).addClass("answered");
        //var sp = document.createElement("span");
        //sp.innerHTML=answer;
        //$(mid).append(sp);
    }
    else{
     $(mid).removeClass("answered");
     $(mid).addClass("unanswered");
    }
}

function countAnswers(){
    $("#numAnswers").html($(".answered").length);
    
}


function populateResults(results){
 $("#inputPane").hide();
 var res = "The Average is " + results.average;
 $("#resultPane").html(res);
 $("#resultPane").show();
 
    
}