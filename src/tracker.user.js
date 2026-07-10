// ==UserScript==
// @name         WorkTracker Pro
// @namespace    https://github.com/dharanscnp/WorkTracker-Pro
// @version      3.0.001
// @description  Professional Productivity Tracker
// @match        *://*.teletype.team/*
// @grant        none
// ==/UserScript==

(function () {

'use strict';

/* ===========================================================
   WorkTracker Pro
   Version : 3.0.001
=========================================================== */

const WT = {};

/* ===========================================================
   Configuration
=========================================================== */

WT.Config = {

    AppName: "WorkTracker Pro",

    Version: "3.0.001",

    Debug: true,

    StorageKey: "WTPRO_DATABASE",

    RefreshRate: 1000

};

/* ===========================================================
   Default Database
=========================================================== */

WT.DefaultData = {

    user:{

        name:""

    },

    counters:{

    accept:0,

    update:0,

    reject:0,

    total:0

},

    widget:{

        top:"100px",

        left:"20px"

    },

    session:{

        start:Date.now()

    },

    debug:{

        lastAction:"",

        lastSaved:""

    }

};

/* ===========================================================
   Database
=========================================================== */

WT.DB = {};

/* ===========================================================
   Runtime State
=========================================================== */

WT.State = {

    modified: false,

    lastAction: "",

    processing: false

};
/* ===========================================================
   Storage
=========================================================== */

WT.Storage = {

    load(){

        try{

            const data =
            localStorage.getItem(
                WT.Config.StorageKey
            );

            if(data){

                WT.DB=JSON.parse(data);

            }else{

                WT.DB=
                structuredClone(
                    WT.DefaultData
                );

            }

        }
        catch(e){

            WT.DB=
            structuredClone(
                WT.DefaultData
            );

        }

    },

    save(){

        WT.DB.debug.lastSaved=
        new Date().toLocaleTimeString();

        localStorage.setItem(

            WT.Config.StorageKey,

            JSON.stringify(WT.DB)

        );

    },

    reset(){

        WT.DB=
        structuredClone(
            WT.DefaultData
        );

        this.save();

    }

};

/* ===========================================================
   User
=========================================================== */

WT.User={

    init(){

        if(
            !WT.DB.user.name
        ){

            let name=
            prompt(
                "Enter Your Name"
            );

            if(!name){

                name="User";

            }

            WT.DB.user.name=
            name.trim();

            WT.Storage.save();

        }

    },

    change(){

        let name=
        prompt(

            "Enter Name",

            WT.DB.user.name

        );

        if(!name)
            return;

        WT.DB.user.name=
        name.trim();

        WT.Storage.save();

    }

};

/* ===========================================================
   Session
=========================================================== */

WT.Session={

    start(){

        if(
            !WT.DB.session.start
        ){

            WT.DB.session.start=
            Date.now();

            WT.Storage.save();

        }

    },

    getElapsed(){

        const sec=
        Math.floor(

            (
                Date.now()-
                WT.DB.session.start
            )/1000

        );

        const h=
        String(
            Math.floor(sec/3600)
        ).padStart(2,"0");

        const m=
        String(
            Math.floor(
                (sec%3600)/60
            )
        ).padStart(2,"0");

        const s=
        String(sec%60)
        .padStart(2,"0");

        return `${h}:${m}:${s}`;

    }

};
/* ===========================================================
   Widget
=========================================================== */

WT.Widget = {

    box: null,

    create() {

        if (document.getElementById("wtpro"))
            return;

        const div = document.createElement("div");

        div.id = "wtpro";

        div.style.cssText = `
position:fixed;
top:${WT.DB.widget.top};
left:${WT.DB.widget.left};
width:270px;
background:#1f2937;
color:white;
padding:12px;
border-radius:10px;
box-shadow:0 5px 20px rgba(0,0,0,.4);
font-family:Arial;
font-size:13px;
z-index:999999;
user-select:none;
cursor:move;
`;

        div.innerHTML = `
<div style="font-size:18px;font-weight:bold">
📊 ${WT.Config.AppName}
</div>

<div style="font-size:11px;color:#ccc">
Version ${WT.Config.Version}
</div>

<hr>

<div>
👤 <span id="wtUser"></span>
</div>

<div>
🟢 Ready
</div>

<hr>

<div>✔ Accept :
<span id="wtAccept">0</span></div>

<div>✏ Update :
<span id="wtUpdate">0</span></div>

<div>✖ Reject :
<span id="wtReject">0</span></div>

<div style="margin-top:8px">

<b>Total :
<span id="wtTotal">0</span></b>

</div>

<hr>

<div>

⏱

<span id="wtTimer">

00:00:00

</span>

</div>

<hr>

<div style="display:flex;gap:5px;flex-wrap:wrap;">

<button id="btnAccept">

+ Accept

</button>

<button id="btnUpdate">

+ Update

</button>

<button id="btnReject">

+ Reject

</button>

<button id="wtReset">

Reset

</button>

</div>

`;

        document.body.appendChild(div);

        WT.Widget.box = div;

        WT.Widget.enableDrag();

        document.getElementById("wtReset").onclick = function(){

    if(confirm("Reset today's counters?")){

        WT.Tracker.reset();

    }

};
        document.getElementById("btnAccept").onclick=function(){

    WT.Tracker.record("accept");

};

document.getElementById("btnUpdate").onclick=function(){

    WT.Tracker.record("update");

};

document.getElementById("btnReject").onclick=function(){

    WT.Tracker.record("reject");

};

        WT.Widget.refresh();

    },

    refresh(){

        if(!WT.Widget.box)
            return;

        document.getElementById("wtUser").textContent =
        WT.DB.user.name;

        document.getElementById("wtAccept").textContent =
        WT.DB.counters.accept;

        document.getElementById("wtUpdate").textContent =
        WT.DB.counters.update;

        document.getElementById("wtReject").textContent =
        WT.DB.counters.reject;

        document.getElementById("wtTotal").textContent =
WT.DB.counters.total;

        document.getElementById("wtTimer").textContent =
        WT.Session.getElapsed();

    },

    enableDrag(){

        let drag=false;

        let ox=0;

        let oy=0;

        WT.Widget.box.onmousedown=function(e){

            drag=true;

            ox=e.clientX-WT.Widget.box.offsetLeft;

            oy=e.clientY-WT.Widget.box.offsetTop;

        };

        document.onmousemove=function(e){

            if(!drag)
                return;

            WT.Widget.box.style.left=
            (e.clientX-ox)+"px";

            WT.Widget.box.style.top=
            (e.clientY-oy)+"px";

        };

        document.onmouseup=function(){

            if(!drag)
                return;

            drag=false;

            WT.DB.widget.left=
            WT.Widget.box.style.left;

            WT.DB.widget.top=
            WT.Widget.box.style.top;

            WT.Storage.save();

        };

    }

};
/* ===========================================================
   Detector Engine
=========================================================== */

WT.Detector = {

    init() {

    // Detect field modifications
    document.addEventListener("input", function (e) {

        const tag = e.target.tagName;

        if (tag === "INPUT" || tag === "TEXTAREA") {

            WT.State.modified = true;

        }

    }, true);

   // Detect button clicks
document.addEventListener("click", function (e) {

    const btn = e.target.closest("button");

    if (!btn) return;

    const text = btn.textContent.trim().toLowerCase();

    console.log("[Detector]", text);

    switch(text){

        case "accept":
            WT.Tracker.record("accept");
            break;

        case "reject":
            WT.Tracker.record("reject");
            break;

    }

}, true);

}

};
/* ===========================================================
   Tracker Engine
=========================================================== */

WT.Tracker = {

   record(type){

    // If user modified any field before clicking Accept,
    // count it as Update instead of Accept
    if(type === "accept" && WT.State.modified){

        type = "update";

    }

    if(!WT.DB.counters.hasOwnProperty(type))
        return;

    WT.DB.counters[type]++;

    WT.DB.counters.total =
        WT.DB.counters.accept +
        WT.DB.counters.update +
        WT.DB.counters.reject;

    WT.DB.debug.lastAction = type;

    // Reset modification flag for next record
    WT.State.modified = false;

    WT.Storage.save();

    WT.Widget.refresh();

},

    reset(){

    WT.DB.counters.accept = 0;
    WT.DB.counters.update = 0;
    WT.DB.counters.reject = 0;
    WT.DB.counters.total = 0;

    WT.State.modified = false;
    WT.State.lastAction = "";
    WT.State.processing = false;

    WT.DB.debug.lastAction = "reset";

    WT.Storage.save();

    WT.Widget.refresh();

},

    getTotal(){

        return WT.DB.counters.total;

    }

};
/* ===========================================================
   Bootstrap
=========================================================== */

WT.start=function(){

    WT.Storage.load();

WT.User.init();

WT.Session.start();

WT.Detector.init();

WT.Widget.create();

    setInterval(function(){

        WT.Widget.refresh();

    },1000);

    console.log(

        WT.Config.AppName,

        WT.Config.Version,

        WT.DB.user.name

    );

};

WT.start();


})();