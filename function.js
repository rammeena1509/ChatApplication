var token=''
var userList=[]
var selectedUserData={};
var decoded;
var socket;
let message=''
$(document).ready(function(){
    $('#action_menu_btn').click(function(){
        $('.action_menu').toggle();
    });

    $("#submitLogin").on('click',()=>{
        login()
    })

    $("#searchBtn").on('click',()=>{
        searchUser($("#search").val())
    })

    $("#send_message").on('click',()=>{
        message=$("#message").val().trim()
        if(message && strip_html_tags(message)){
            message=strip_html_tags(message)
            if(message.length>250){
                swal("Sorry","message having count greater than 250 is not allowed.")
            }
            else{
                socket.emit("message",{
                    message,
                    usercode:selectedUserData.usercode,
                })  
                $('#message').focus()
                $('#send_message').removeClass('active')          
            }
        }
        else if(message && !strip_html_tags(message)){
            swal("Sorry","Pure HTML message is not allowed.").then(()=>{
                $('#message').val('')   
                setTimeout(() => {
                    $('#message').focus()                    
                }, 500);             
            })
        }
        else{
            swal("Sorry","Enter message first...").then(()=>{
                $('#message').val('')
                setTimeout(() => {
                    $('#message').focus()                    
                }, 500);
            })
        }
    })

    $('#message').on('paste', function(e){
        e.preventDefault();
        swal("Sorry","message paste is not allowed.")
    });

    $(window).on('keyup',function(e){
        var code = (e.keyCode ? e.keyCode : e.which);
        if(code==13 && $('#message').is(":focus")){
            $('#message').blur()
            $("#send_message").trigger('click')
        }
    })

    $("#btnLogin").on('click',()=>{
        if(token){
            swal("Invalid!","You are already logged In","info")
        }
        else{
            showModal()
        }
    })

    $("#btnLogout").on('click',()=>{
        if(token){
            $.ajax({
                type: 'POST',
                url: '/api/authentication/logout',
                headers:{'Content-Type': 'application/json','Authorization':token},
                error: function(error) {
                    swal("Oops", error.message, "error");
                },
                success: function(res) {
                    if(res.success){
                        disconnect()
                        token=''
                        userList=[]
                        selectedUserData={}
                        decoded='';
                        socket='';
                        message=''
                        localStorage.removeItem('token')
                        $(`.contacts_card,.chatting_card,.chatting_card [class^="card-"]`).css('display','none')
                        $("#btnLogout").css('display','none')
                        $("#btnLogin").css('display','block')
                    }
                    else{
                        swal("Sorry", res.message, "error");
                    }
                }                
            });
        }
        else{
            swal("Invalid!","You are already logged Out","info")
        }
    })
});

const disconnect = () => {
    socket.disconnect();
}

$(function(){
    //connect()
    token=localStorage.getItem('token')
    if(token){
        $("#btnLogin").css('display','none')
        decoded=parseJwt(token)
        connect()
        // formatTime("2019-11-19T18:11:02.392Z")
    }
    else{
        setTimeout(() => {
            showModal()
            $("#btnLogout").css('display','none')
        }, 10);
    }
})

const connect = ()=>{
    // var socket=io.connect({
    //     query: {
    //       token: 'cde'
    //     }
    // })

    socket=io.connect({
        transportOptions: {
          polling: {
            extraHeaders: {
              'x-clientid': token
            }
          }
        }
    })
    // socket.on('reconnect_attempt', () => {
    //         socket.io.opts.query = {
    //       token: 'fgh'
    //     }
    // });

    socket.on("message_received",(data)=>{
        var audio = new Audio('eventually.mp3');
        audio.play()
        if(selectedUserData.usercode==data.sender){
            let str =`  <div class="d-flex justify-content-start mb-4">
                            <div class="img_cont_msg">
                                <img src="${data.senderImage}" class="rounded-circle user_img_msg">
                            </div>
                            <div class="msg_cotainer">
                                ${data.message}
                                <span class="msg_time">${formatTime(data.timestamp)}</span>
                            </div>
                        </div>`
            $("#chatsBody").append(str)
            socket.emit("user_message_seen",{message:'all messages seen',usercode:selectedUserData.usercode})
        }
        else{
            let tempElem=$(`.contacts li[data-id=${data.sender}] .user_info>.msg_counter`)
            tempElem.css('display','none')
            tempElem.text(parseInt(tempElem.text())+1)
            tempElem.css('display','flex')
            let ind=userList.findIndex(el=>el.usercode==data.sender)
            userList[ind].msg_count=parseInt(tempElem.text())
        }
    })

    socket.on('message_delivered',(data)=>{
        let statusHTML=''
        if(data.isDelivered){
            statusHTML='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" class="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#eaeaea"/></svg>'
        }
        else{
            statusHTML='<span class="checkmark"></span>'
        }
        let str =`  <div class="d-flex justify-content-end mb-4">
                        <div class="msg_cotainer_send">
                            ${message}
                            <span class="msg_time_send">
                                <span class="tick">${statusHTML}</span>
                                ${formatTime(new Date())}
                            </span>
                        </div>
                        <div class="img_cont_msg">
                            <img src="${decoded.image}" class="rounded-circle user_img_msg"/>
                        </div>
                    </div>`
        $("#message").val("")
        message=''
        $("#chatsBody").append(str)
    })

    socket.on('message_failed',(data)=>{
        console.log('failed')
    })

    socket.on("user_connected",(data)=>{
        let index=userList.findIndex(el=>el.usercode==data.usercode)
        if(index!=-1){
            userList[index].online=true
            userList[index]['socketId']=data.socket
        }
        if($("#search").val()){
            searchUser($("#search").val())
        }
        else{
            renderUserData(userList)
        }
        if(selectedUserData.usercode==data.usercode){
            selectedUserData.online?$("#chatImg>span").removeClass('offline'):$("#chatImg>span").addClass('offline')
            selectedUserData.online?$("#chatUser>p").html("Online"):$("#chatUser>p").html("Last Seen "+formatTime(selectedUserData.lastSeen))
        }
    })

    socket.on("user_disconnected",(data)=>{
        let index=userList.findIndex(el=>el.usercode==data.usercode)
        userList[index].online
        if(index!=-1){
            userList[index].online=false
            userList[index].lastSeen=new Date()
            delete userList[index].socketId
        }
        if($("#search").val()){
            searchUser($("#search").val())
        }
        else{
            renderUserData(userList)
        }
        if(selectedUserData.usercode==data.usercode){
            selectedUserData.online?$("#chatImg>span").removeClass('offline'):$("#chatImg>span").addClass('offline')
            selectedUserData.online?$("#chatUser>p").html("Online"):$("#chatUser>p").html("Last Seen "+formatTime(selectedUserData.lastSeen))
        }
    })

    socket.on("message_seen",(data)=>{
        if(data.usercode==selectedUserData.usercode){
            let htmlObj=$( ".msg_cotainer_send .msg_time_send .tick .msg-dblcheck-ack").find("path[fill='#eaeaea']")
            htmlObj.each(function( index ) {
                $( this ).attr('fill','#4fc3f7')
            });
        }
        else{

        }
    })

    socket.on("pending_message_delivered",(data)=>{
        if(data.usercode==selectedUserData.usercode){
            let htmlObj=$( ".msg_cotainer_send .msg_time_send .tick").find(".checkmark")
            htmlObj.each(function( index ) {
                $( this ).parent().html('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" class="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#eaeaea"/></svg>')
            });
        }
        else{

        }
    })

    socket.on("bulk_message_received",(data)=>{
        setTimeout(() => {
            $.each(data, ( index, value ) => {
                let tempElem=$(`.contacts li[data-id=${value._id}] .user_info>.msg_counter`)
                tempElem.css('display','none')
                let ind=userList.findIndex(el=>el.usercode==value._id)
                userList[ind].msg_count=value.message_count
                tempElem.text(value.message_count)
                tempElem.css('display','flex')
            })
        }, 500);
    })

    socket.on('connect',()=>{
        $("#title_name").html(`Welcome ${decoded.name}!`)
        console.log("Connected with server")
        $(".chatting_card,.contacts_card").css('display','flex')
        getUserList()
    })

    socket.on('disconnect',(reason)=>{
        $("#title_name").html('')
        console.log("Disconnected with server due to "+reason)
    })

    socket.on('connect_failed', () => {
        console.log("reason")
    })

    socket.on('error', (reason) => {
        if(reason=='session_expired'){
            swal("Sorry",'Your session expired. Please login again.','error').then(()=>{
                localStorage.removeItem('token')
                location.refresh()
            })
        }
        else if(reason=='duplicate_tab'){
            swal("Sorry",'Duplicate tab is not allowed.Please check opened tab.','error').then(()=>{
                window.open("https://www.google.com/", '_self')
            })
        }
        else{
            swal("Sorry",reason.message || reason ,'error')
            $("#btnLogout").unbind('click')
            $("#btnLogout").css('display','none')
        }
    })
}

const login=()=>{
    let username=$("#username").val()
    let password=$("#password").val()
    if(!username){
        swal("Oops", "Enter username!", "error");
    }
    else if(!password){
        swal("Oops", "Enter password!", "error");
    }
    else{
        $.ajax({
            type: 'POST',
            url: '/api/authentication/login',
            headers:{'Content-Type': 'application/json'},
            data: JSON.stringify({username,password}),
            error: function(error) {
                swal("Oops", error.message, "error");
            },
            success: function(data) {
                if(data.success){
                    $("#btnLogin").css('display','none')
                    $("#btnLogout").css('display','block')
                    swal("Done", data.message, "success");
                    token=data.token
                    decoded=parseJwt(token)
                    localStorage.setItem('token',data.token)
                    $("#loginModal").modal('hide')
                    connect()
                }
                else{
                    swal("Sorry", data.message, "error");
                }
            }                
        });            
    }
}

const getUserList = () =>{
    $.ajax({
        type: 'POST',
        url: '/api/authentication/userList',
        headers:{'Content-Type': 'application/json','Authorization':token},
        //data: JSON.stringify({username,password}),
        error: function(error) {
            swal("Oops", error.message, "error");
        },
        success: function(res) {
            if(res.success){
                userList=res.data
                renderUserData(res.data)
            }
            else{
                swal("Sorry", res.message, "error");
            }
        }                
    }); 
}

const searchUser = (key) => {
    let regex = new RegExp(key, 'gi');
    let newData=userList.filter(item=>item.name.match(regex))
    renderUserData(newData)
}

const showModal=()=>{
    $("#loginModal").modal({backdrop:"static"})
}

const formatTime = (date) => { 
    let str=''
    str+=moment().format('h:mm A')
    let dayDiff=moment().format('D')-moment(date).format('D')
    if(!(moment().isSame(date, 'month')) || !(moment().isSame(date, 'year'))){
        dayDiff=0
        let year=moment(date).toDate().getFullYear()
        let month=moment(date).toDate().getMonth()
        let sDate=moment(date).toDate().getDate()
        var startDate = moment([year, month,sDate]);
        var endDate = moment(startDate).endOf('month');
        while(year!=moment().toDate().getFullYear() || month!=moment().toDate().getMonth()){
            dayDiff+=endDate.format('D')-startDate.format('D')+1
            if(month==11){
                year++
                month=0
            }
            else{
                month++
            } 
            startDate = moment([year, month]);
            endDate = moment(startDate).endOf('month');
        }
        sDate=moment().toDate().getDate()
        endDate = moment([year, month,sDate]);
        dayDiff+=endDate.format('D')-startDate.format('D')
    }
    str=moment(date).format('h:mm A')
    if(dayDiff==0){
        str+=", Today"
    }
    else if(dayDiff==1){
        str+=", Yesterday"
    }
    else if(dayDiff<7){
        str+=", "+moment(date).format('dddd')
    }
    else if(moment().isSame(date, 'year')){
        str+=", "+moment(date).format('Do MMMM')
    }
    else{
        str+=", "+moment(date).format('Do MMMM YYYY')
    }
    return str
}

function openChat(){
    $(".contacts li").removeClass('active')
    $(this).addClass('active')
    let tempId=$(this).data('id')
    let ind=userList.findIndex(el=>el.usercode==tempId)
    userList[ind].msg_count=0
    selectedUserData=userList[ind]
    let tempElem=$(`.contacts li[data-id=${tempId}] .user_info>.msg_counter`)
    tempElem.css('display','none')
    tempElem.text(0)
    getChats(selectedUserData.usercode)
}

const renderUserData = (data) =>{
    $(".contacts").html('')
    $.each(data, ( index, value ) => {
        let msg_count=value.msg_count || 0
        var li = document.createElement('li');
        //li.addEventListener("click", openChat)
        li.onclick=this.openChat
        li.setAttribute('data-id',value.usercode)
        if(selectedUserData.usercode && value.usercode==selectedUserData.usercode){
            li.className='active'
        }
        li.innerHTML=`
                    <div class="d-flex bd-highlight">
                        <div class="img_cont">
                            <img src="${value.image}" class="rounded-circle user_img">
                            <span class="online_icon ${value.online?'':"offline"}"></span>
                        </div>
                        <div class="user_info">
                            <div class="msg_counter">${msg_count}</div>
                            <span>${value.name}</span>
                            <p>${value.online?"online":value.lastSeen?"Last Seen "+formatTime(value.lastSeen):'Offline'}</p>
                        </div>
                    </div>`
        $('.contacts')[0].appendChild(li);
        if(msg_count){
            $(`.contacts li[data-id=${value.usercode}] .user_info>.msg_counter`).css('display','flex')
        }
        // str+=`<li class="ulist${index==0?' active':''}" data-id="${value.usercode}">
                
        //     </li>`
    });
    // $(".contacts").html(str)
}

const getChats = (usercode) =>{
    $.ajax({
        type: 'POST',
        url: '/api/authentication/chatsList',
        headers:{'Content-Type': 'application/json','Authorization':token},
        data: JSON.stringify({usercode}),
        error: function(error) {
            swal("Oops", error.message, "error");
        },
        success: function(res) {
            if(res.success){
                socket.emit("user_message_seen",{message:'all messages seen',usercode:usercode})
                $("#chatImg").html(`
                <img src="${selectedUserData.image}" class="rounded-circle user_img">
                <span class="online_icon${selectedUserData.online?'':" offline"}"></span>`)
                $("#chatUser").html(`
                <span>Chat with ${selectedUserData.name}</span>
                <p>${selectedUserData.online?"Online":selectedUserData.lastSeen?"Last Seen "+formatTime(selectedUserData.lastSeen):"Offline"}</p>`)
                $('.chatting_card [class^="card-"]').css('display','block')
                $(".no_chat").css('display','none') 
                if(res.data.length){
                    renderChatData(res.data)
                } 
                else{
                    $("#chatsBody").html('')
                }          
            }
            else{
                swal("Sorry", data.message, "error");
            }
        }                
    });
}

const renderChatData = (data) =>{
    $("#chatsBody").html('')
    let str=''
    $.each(data, ( index, value ) => {
        if(value.sender==selectedUserData.usercode){
            str+=`  <div class="d-flex justify-content-start mb-4">
                        <div class="img_cont_msg">
                            <img src="${selectedUserData.image}" class="rounded-circle user_img_msg">
                        </div>
                        <div class="msg_cotainer">
                            ${value.message}
                            <span class="msg_time">${formatTime(value.timestamp)}</span>
                        </div>
                    </div>`
        }
        else{
            let statusHTML=''
            if(value.isSeen){
                statusHTML='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" class="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#4fc3f7"/></svg>'
            }
            else if(value.isDelivered){
                statusHTML='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" class="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#eaeaea"/></svg>'
            }
            else{
                statusHTML='<span class="checkmark"></span>'
            }
            str+=`  <div class="d-flex justify-content-end mb-4">
                        <div class="msg_cotainer_send">
                            ${value.message}
                            <span class="msg_time_send">
                            <span class="tick">${statusHTML}</span>
                            ${formatTime(value.timestamp)}
                            </span>
                        </div>
                        <div class="img_cont_msg">
                            <img src="${decoded.image}" class="rounded-circle user_img_msg"/>
                        </div>
                    </div>`
        }
    });
    $("#chatsBody").html(str)
}

const parseJwt = (token) => {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};


const strip_html_tags = (str) =>{
   if ((str===null) || (str===''))
       return "";
  else
   str = str.toString();
  return str.replace(/<[^>]*>/g, '');
}