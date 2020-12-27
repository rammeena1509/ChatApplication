const valid_mobile=(mobile)=>{
    var phoneno = /^\d{10}$/;
    if(!mobile.match(phoneno)){
        return false;
    }
    else{
        return true;
    }
}

const valid_age = (dateStr)=>{
    var dateParts = dateStr.split("-");
    var currentDate=new Date();
    var age=currentDate.getFullYear()-dateParts[0];
    if(age>=18){
        return true;
    }
    else{
        return false;
    }
}

const valid_cost=(cost)=>{
    var regex = /[0-9]|\./;
    if( !regex.test(cost) ) {
        return false;
    }
    else{
        return true;
    }
}

const valid_pan=(pan)=>{
    var letterNumber = /^[0-9A-Z]+$/;
    if(!pan.match(letterNumber)||pan.length!=10) 
              {
               return false;
              }
    else{
        return true;
    }
}

const valid_adhaar=(adhaar)=>{
    var adhar = /^\d{12}$/;
    if(!adhaar.match(adhar)){
        return false;
    }
    else{
        return true;
    }
}

const valid_pincode=(pincode)=>{
    var pin = /^\d{6}$/; 
    if(!pincode.match(pin)){
        return false;
    }
    else{
        return true;
    }
}

const valid_time=(time)=>{
    var timeformat=/^([01]?[0-9]|2[0-3])(:[0-5][0-9])/;
    if (!timeformat.test(time)) { 
                return false;
    }
    else{
        return true;
    }
}

const valid_email=(email)=>{
if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
  {
    return true;
  }
    else{
         return false; 
    }
    
}

const valid_name=(name)=>{
    return /^[A-Za-z\s]+$/.test(name);
}



const valid_url=(website)=>{
    var urlformat = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
    if (!urlformat.test(website)) { 
                return false;
    }
    else{
        return true;
    }
}

module.exports={
    mobileValidity:valid_mobile,
    emailValidity:valid_email,
    nameValidity:valid_name,
    ageValidity:valid_age,
    panValidity:valid_pan,
    aadhaarValidity:valid_adhaar,
    urlValidity:valid_url,
    timeValidity:valid_time,
    pincodeValidity:valid_pincode,
    costValidity:valid_cost
}