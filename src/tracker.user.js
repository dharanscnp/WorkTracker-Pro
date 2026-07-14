// ==UserScript==
// @name         WorkTracker Pro
// @namespace    https://github.com/dharanscnp/WorkTracker-Pro
// @version      6.1.100
// @description  Professional Productivity Tracker
// @match        *://*.teletype.team/*
// @grant        GM_xmlhttpRequest
// @grant GM_getValue
// @grant GM_setValue
// @connect      script.google.com
// @connect      script.googleusercontent.com
// ==/UserScript==

(function () {

'use strict';

/* ===========================================================
   WorkTracker Pro
   Version : 6.1.100
=========================================================== */

const WT = {};

/* ===========================================================
   Configuration
=========================================================== */

WT.Config = {

    AppName: "WorkTracker Pro",

    Version: "6.1.100",

    Debug: true,

    StorageKey: "WTPRO_DATABASE",

    RefreshRate: 1000,

    SyncInterval: 30000,

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

history:{},

lastDate:"",

widget:{

        top:"100px",

        left:"20px"

    },

    session:{

        start:Date.now()

    },

    debug:{

    lastAction:"",

    lastSaved:"",

    lastSync:"",

    syncStatus:"Ready"

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

    processing: false,

    lastClickTime: 0,

    clickDelay: 500,

    ignoreMouseUntil: 0,

    syncPending: false,

    isSyncing: false,

};
/* ===========================================================
   Storage
=========================================================== */

WT.Storage = {

    load(){

        try{

            const data = GM_getValue(WT.Config.StorageKey, "");

            if(data){

    WT.DB = JSON.parse(data);

    // Upgrade older databases
    if(!WT.DB.history){
        WT.DB.history = {};
    }

    if(!WT.DB.lastDate){
        WT.DB.lastDate = "";
    }

}else{

    WT.DB =
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

        GM_setValue(
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

<hr>

<div style="
    font-size:15px;
    font-weight:bold;
    color:#d6d6d6;
    margin-bottom:10px;
">
Today's Production
</div>

<div>✔ Accept :
<span id="wtAccept">0</span></div>
<div>✏ Update :
<span id="wtUpdate">0</span></div>

<div>✖ Reject :
<span id="wtReject">0</span></div>

<div style="margin-top:8px">

<b>Total :
<span id="wtTotal">0</span></b>
<hr>

<div>
☁ Sync :
<span id="wtSyncStatus">Ready</span>
</div>

<div style="font-size:11px;color:#bdbdbd">
Last :
<span id="wtLastSync">--</span>
</div>
`;

        document.body.appendChild(div);

        WT.Widget.box = div;

        WT.Widget.enableDrag();

        WT.Widget.refresh();

    },

   refresh(){

    if(!WT.Widget.box)
        return;

    const accept = WT.DB.counters.accept;
    const update = WT.DB.counters.update;
    const reject = WT.DB.counters.reject;
    const total  = WT.DB.counters.total;

    const acceptPct = total > 0 ? ((accept / total) * 100).toFixed(1) : "0.0";
    const updatePct = total > 0 ? ((update / total) * 100).toFixed(1) : "0.0";
    const rejectPct = total > 0 ? ((reject / total) * 100).toFixed(1) : "0.0";

    document.getElementById("wtUser").textContent =
        WT.DB.user.name;

  document.getElementById("wtAccept").textContent =
    `${accept} (${acceptPct}%)`;

document.getElementById("wtUpdate").textContent =
    `${update} (${updatePct}%)`;

document.getElementById("wtReject").textContent =
    `${reject} (${rejectPct}%)`;
    document.getElementById("wtTotal").textContent =
        total;
        document.getElementById("wtSyncStatus").textContent =
    WT.DB.debug.syncStatus;

document.getElementById("wtLastSync").textContent =
    WT.DB.debug.lastSync || "--";

       
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
getActiveSubmitButton() {

    const buttons = document.querySelectorAll("button");

    for (const btn of buttons) {

        const text = btn.textContent.trim().toLowerCase();

        if (btn.offsetParent === null) continue; // Ignore hidden buttons

        if (
            text === "accept" ||
            text === "complete" ||
            text === "refresh" ||
            text === "continue"
        ) {
            return text;
        }
    }

    return "";

},
    init() {

        // Detect field modifications
        document.addEventListener("input", function (e) {

            const tag = e.target.tagName;

            if (tag === "INPUT" || tag === "TEXTAREA") {

                WT.State.modified = true;

            }

        }, true);

        // Mouse detection
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

                case "complete":
                case "complete & logout":
                case "continue":
                case "refresh":
                    console.log("[Detector] Ignored:", text);
                    break;

            }

        }, true);

        // Keyboard detection
        document.addEventListener("keydown", function(e){

            if (e.key !== "Enter") return;

            if (e.ctrlKey && e.shiftKey){

                console.log("[Keyboard] Reject Remaining");
                WT.Tracker.record("reject");
                return;

            }

            if (e.ctrlKey){

                console.log("[Keyboard] Reject");
                WT.Tracker.record("reject");
                return;

            }

            if (e.altKey){

                console.log("[Keyboard] Accept Remaining");
                WT.Tracker.record("accept");
                return;

            }

            const action = WT.Detector.getActiveSubmitButton();

console.log("[Keyboard] Active Button:", action);

switch (action) {

    case "accept":
        WT.Tracker.record("accept");
        break;

    case "complete":
    case "refresh":
    case "continue":
        console.log("[Keyboard] Ignored:", action);
        break;

    default:
        console.log("[Keyboard] No active action");
}

        }, true);

    }

};

/* ===========================================================
   History
=========================================================== */

WT.History = {

    today() {

        return new Date().toISOString().split("T")[0];

    },

    init() {

        const today = WT.History.today();

        // Create today's history if not present
        if (!WT.DB.history[today]) {

            WT.DB.history[today] = {

                user: WT.DB.user.name,

                accept: 0,

                update: 0,

                reject: 0,

                total: 0

            };

            WT.DB.lastDate = today;

        }

        // ******** NEW ********
        // Restore today's counters
        WT.DB.counters.accept =
            WT.DB.history[today].accept || 0;

        WT.DB.counters.update =
            WT.DB.history[today].update || 0;

        WT.DB.counters.reject =
            WT.DB.history[today].reject || 0;

        WT.DB.counters.total =
            WT.DB.history[today].total || 0;

        WT.Storage.save();

    },

    checkDate() {

        const today = WT.History.today();

        if (WT.DB.lastDate === today)
            return;

        console.log("[History] New Day:", today);

        WT.DB.counters.accept = 0;
        WT.DB.counters.update = 0;
        WT.DB.counters.reject = 0;
        WT.DB.counters.total = 0;

        WT.DB.history[today] = {

            user: WT.DB.user.name,

            accept: 0,

            update: 0,

            reject: 0,

            total: 0

        };

        WT.DB.lastDate = today;

        WT.Storage.save();

    }

};

/* ===========================================================
   Tracker Engine
=========================================================== */

WT.Tracker = {

   record(type){

    WT.History.checkDate();

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
        
const today = WT.History.today();

WT.DB.history[today].accept = WT.DB.counters.accept;
WT.DB.history[today].update = WT.DB.counters.update;
WT.DB.history[today].reject = WT.DB.counters.reject;
WT.DB.history[today].total  = WT.DB.counters.total;
console.log("===== HISTORY AFTER RECORD =====");
console.log(JSON.stringify(WT.DB.history[today], null, 2));

    WT.DB.debug.lastAction = type;

    // Reset modification flag for next record
    WT.State.modified = false;

 WT.State.syncPending = true;

// Show that local changes are waiting to be uploaded
WT.DB.debug.syncStatus = "Pending";

WT.Storage.save();
console.log("===== DATABASE AFTER SAVE =====");
console.log(JSON.stringify(WT.DB, null, 2));

console.log("===== LOCAL STORAGE =====");
console.log(localStorage.getItem(WT.Config.StorageKey));

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
   API
=========================================================== */

WT.API = {

    url: "https://script.google.com/macros/s/AKfycby5ZDjB3g_zZy-rfFitlmYVriHHt6TbB1v0Pd8MayXRCKbZf3_A6wt1w7OOamTmzp-7oQ/exec",

    sync() {
if(WT.State.isSyncing)
    return;

WT.State.isSyncing = true;
    
    console.log("[SYNC] Uploading...");

    WT.DB.debug.syncStatus = "Uploading...";

    WT.Storage.save();

    WT.Widget.refresh();

    GM_xmlhttpRequest({

        method: "POST",

        url: this.url,

        headers: {

            "Content-Type": "application/json"

        },

        data: JSON.stringify({
            key: WT.History.today() + "_" + WT.DB.user.name.trim().toUpperCase(),

            date: WT.History.today(),

            user: WT.DB.user.name,

            accept: WT.DB.counters.accept,

            update: WT.DB.counters.update,

            reject: WT.DB.counters.reject,

            total: WT.DB.counters.total,

            version: WT.Config.Version,

            computer: navigator.platform

        }),

        onload: function(response){

    WT.State.syncPending = false;

    WT.State.isSyncing = false;

    WT.DB.debug.syncStatus = "Online";

    WT.DB.debug.lastSync = new Date().toLocaleTimeString();

    WT.Storage.save();

    WT.Widget.refresh();

    console.log("[SYNC COMPLETE]", response.responseText);

},

      onerror: function(error){

    WT.State.syncPending = true;

    WT.State.isSyncing = false;

    WT.DB.debug.syncStatus = "Failed";

    WT.Storage.save();

    WT.Widget.refresh();

    console.error("[API ERROR]", error.status);

    console.error(error);

}

    });

}

};
/* ===========================================================
   Bootstrap
=========================================================== */

WT.start=function(){

WT.Storage.load();
console.log("===== DATABASE AFTER LOAD =====");
console.log(JSON.stringify(WT.DB, null, 2));

WT.History.checkDate();

WT.User.init();

WT.History.init();

WT.Session.start();

WT.Detector.init();

WT.Widget.create();

WT.Widget.refresh();

setInterval(function(){

    if(!WT.State.syncPending)
        return;

    if(WT.State.isSyncing)
        return;

    WT.API.sync();

}, WT.Config.SyncInterval);

    console.log(

        WT.Config.AppName,

        WT.Config.Version,

        WT.DB.user.name

    );

};

window.WT = WT;

WT.start();

})();