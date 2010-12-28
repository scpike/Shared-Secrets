function populateMemberBar(members, divToPopulate){
    $(divToPopulate).html("");
    for (m=0; m < members.length; m++){
        child = document.createElement("li");
        child.innerHTML = members[m];
        $(divToPopulate).append(child);
    }
}

function sendAnswer(){
    var answer = $("#amountInput").val();
    var msg = {sendAnswer : answer };
    socket.send(msg);
}