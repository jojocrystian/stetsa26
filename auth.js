window.addEventListener("DOMContentLoaded",function(){
setTimeout(function(){
var ls=document.getElementById("loadingScreen");
if(ls){ls.classList.add("hidden");}
},900);
var path=window.location.pathname;
var session=getSession("stetsa_session");
if(path.indexOf("admin")===-1){
if(session&&(path.indexOf("index.html")!==-1||path==="/"||path.endsWith("/"))){
window.location.href="home.html";return;
}
if(!session&&(path.indexOf("home.html")!==-1||path.indexOf("gallery.html")!==-1)){
window.location.href="index.html";return;
}
}
});

function getSession(key){
if(!key){key="stetsa_session";}
try{
var s=localStorage.getItem(key);
if(!s){return null;}
var p=JSON.parse(s);
if(Date.now()>p.expires){localStorage.removeItem(key);return null;}
return p;
}catch(e){return null;}
}

function setSession(data,key){
if(!key){key="stetsa_session";}
var session={};
var keys=Object.keys(data);
for(var i=0;i<keys.length;i++){session[keys[i]]=data[keys[i]];}
session.expires=Date.now()+CONFIG.SESSION_DURATION;
localStorage.setItem(key,JSON.stringify(session));
}

function clearSession(key){
if(!key){key="stetsa_session";}
localStorage.removeItem(key);
}

function handleLogin(e){
e.preventDefault();
var username=document.getElementById("username").value.trim();
var password=document.getElementById("password").value.trim();
var errEl=document.getElementById("errorMsg");
var btn=document.getElementById("loginBtn");
var txt=document.getElementById("loginBtnText");
var ldr=document.getElementById("btnLoader");
txt.style.display="none";
ldr.style.display="block";
btn.disabled=true;
errEl.textContent="";
apiCall("login",{username:username,password:password})
.then(function(result){
txt.style.display="block";
ldr.style.display="none";
btn.disabled=false;
if(result.success){
setSession(result.data,"stetsa_session");
showToast("Login berhasil!","success");
setTimeout(function(){window.location.href="home.html";},900);
}else{
errEl.textContent=result.message||"Username atau password salah.";
var car
