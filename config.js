var CONFIG={
API_URL:"https://script.google.com/macros/s/AKfycbw1BZPAvPKLHYHWvWYNZQHs3K97Y5DEK7RBgqzHF8nDCo4syfk6Vd_c9Rt9h4IK3G_B/exec",
WA_ADMIN:"6281311719622",
SESSION_DURATION:28800000,
DEFAULT_SLIDES:[
"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920",
"https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920",
"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920"
]
};

function showToast(msg,type){
if(!type){type="info";}
var c=document.getElementById("toastContainer");
if(!c){c=document.createElement("div");c.id="toastContainer";c.className="toast-container";document.body.appendChild(c);}
var icons={success:"fa-check-circle",error:"fa-times-circle",info:"fa-info-circle"};
var colors={success:"#10B981",error:"#EF4444",info:"#6C63FF"};
var t=document.createElement("div");
t.className="toast "+type;
t.innerHTML="<i class='fas "+icons[type]+"' style='color:"+colors[type]+";flex-shrink:0'></i> "+msg;
c.appendChild(t);
setTimeout(function(){t.style.opacity="0";},3200);
setTimeout(function(){t.remove();},3700);
}

function animateCounter(el,target,duration){
if(!el){return;}
if(!duration){duration=1500;}
var start=0;
var step=target/(duration/16);
var timer=setInterval(function(){
start+=step;
if(start>=target){start=target;clearInterval(timer);}
el.textContent=Math.floor(start).toLocaleString("id-ID");
},16);
}

function apiCall(action,data){
if(!data){data={};}
var p=new URLSearchParams();
p.append("action",action);
var keys=Object.keys(data);
for(var i=0;i<keys.length;i++){p.append(keys[i],data[keys[i]]);}
return fetch(CONFIG.API_URL+"?"+p.toString(),{method:"GET"})
.then(function(r){if(!r.ok){throw new Error("HTTP "+r.status);}return r.json();})
.catch(function(e){console.error(e);return{success:false,message:"Koneksi gagal."};});
}

function apiPost(action,data){
if(!data){data={};}
var body={action:action};
var keys=Object.keys(data);
for(var i=0;i<keys.length;i++){body[keys[i]]=data[keys[i]];}
return fetch(CONFIG.API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
.then(function(r){if(!r.ok){throw new Error("HTTP "+r.status);}return r.json();})
.catch(function(e){console.error(e);return{success:false,message:"Koneksi gagal."};});
}
