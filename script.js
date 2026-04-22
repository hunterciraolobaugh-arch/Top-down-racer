window.onload = function() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800; canvas.height = 600;

    // --- STATE ---
    let currentUser = null;
    let currentSlot = null;
    let cash = 0;
    let isPaused = true;
    let isStealth = false;
    let collectibles = [], obstacles = [], cops = [];
    
    const car = { worldX: 400, worldY: 300, angle: 0, speed: 0, accel: 0.2, maxSpeed: 7, fric: 0.96, steer: 0.06, color: "red" };
    const camera = { x: 0, y: 0 };
    const keys = {};

    // --- AUTH & SAVING ---
    window.login = function() {
        const email = document.getElementById("emailInput").value.trim();
        if (!email.includes("@")) return alert("Enter a valid email!");
        currentUser = email;
        document.getElementById("authScreen").style.display = "none";
        document.getElementById("saveScreen").style.display = "flex";
        document.getElementById("userWelcome").innerText = `Account: ${email}`;
        renderSlots();
    };

    function renderSlots() {
        const container = document.getElementById("slotContainer");
        container.innerHTML = "";
        const userData = JSON.parse(localStorage.getItem(currentUser)) || {};

        for (let i = 1; i <= 3; i++) {
            const slotData = userData[`slot${i}`];
            const div = document.createElement("div");
            div.className = "slot-card";
            if (slotData) {
                div.innerHTML = `
                    <div style="text-align:left"><b>Slot ${i}</b><br><small>$${slotData.cash} | ${slotData.color}</small></div>
                    <div>
                        <button class="main-btn" style="background:#2ecc71; padding: 5px 10px;" onclick="startGame(${i})">Load</button>
                        <button class="delete-btn" onclick="deleteSlot(${i})">Wipe</button>
                    </div>`;
            } else {
                div.innerHTML = `<b>Slot ${i}</b> <span style="color:#777">Empty</span> <button class="main-btn" style="padding: 5px 10px;" onclick="startGame(${i})">Start</button>`;
            }
            container.appendChild(div);
        }
    }

    window.deleteSlot = function(n) {
        if (!confirm("Wipe Slot " + n + "?")) return;
        let data = JSON.parse(localStorage.getItem(currentUser));
        delete data[`slot${n}`];
        localStorage.setItem(currentUser, JSON.stringify(data));
        renderSlots();
    };

    window.startGame = function(n) {
        currentSlot = n;
        let data = JSON.parse(localStorage.getItem(currentUser)) || {};
        let s = data[`slot${n}`];
        if (s) { cash = s.cash; car.color = s.color; car.maxSpeed = s.maxSpeed; car.accel = s.accel; }
        else { cash = 0; car.color = "red"; car.maxSpeed = 7; car.accel = 0.2; }

        document.getElementById("saveScreen").style.display = "none";
        document.getElementById("gameCanvas").style.display = "block";
        document.getElementById("hud").style.display = "block";
        document.getElementById("uiContainer").style.display = "flex";
        isPaused = false;
        updateCashUI();
        loop();
    };

    function autoSave() {
        if (!currentUser || !currentSlot) return;
        let data = JSON.parse(localStorage.getItem(currentUser)) || {};
        data[`slot${currentSlot}`] = { cash, color: car.color, maxSpeed: car.maxSpeed, accel: car.accel };
        localStorage.setItem(currentUser, JSON.stringify(data));
    }

    // --- LOGIC ---
    function updateCashUI() {
        document.getElementById("hudCash").innerText = Math.floor(cash);
        document.querySelectorAll(".cashDisplay").forEach(el => el.innerText = Math.floor(cash));
    }

    window.buyUpgrade = function(t) {
        if (cash >= 50) { cash -= 50; if (t==='speed') car.maxSpeed += 2; else car.accel += 0.1; updateCashUI(); autoSave(); }
    };

    window.buyCar = function(c, p, ts, ac) {
        if (cash >= p) { cash -= p; car.color = c; car.maxSpeed = ts; car.accel = ac; updateCashUI(); autoSave(); closeMenus(); }
    };

    window.closeMenus = function() { 
        document.getElementById("shopMenu").style.display="none"; 
        document.getElementById("dealershipMenu").style.display="none"; 
        isPaused=false; 
    };

    window.resetGame = function() {
        cash = Math.max(0, cash - 100);
        car.worldX = 400; car.worldY = 300; car.speed = 0;
        cops = []; obstacles = []; collectibles = [];
        document.getElementById("bustedScreen").style.display = "none";
        isPaused = false; updateCashUI(); autoSave();
    };

    // --- KEYBOARD & PANIC ---
    window.addEventListener("keydown", e => {
        const key = e.key.toLowerCase();
        
        // Prevent Panic T while typing in the email box
        const isTyping = document.activeElement.tagName === "INPUT";

        if (key === "escape") {
            isStealth = !isStealth;
            document.getElementById("stealthScreen").style.display = isStealth ? "flex" : "none";
        }

        if (key === "t" && !isTyping) {
            window.location.href = "https://classroom.google.com";
        }

        keys[key] = true;
    });
    window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

    // --- ENGINE ---
    function update() {
        if (isPaused || isStealth) return;
        if (keys["w"]) car.speed += car.accel;
        if (keys["s"]) car.speed -= car.accel;
        car.speed *= car.fric;
        car.worldX += Math.cos(car.angle) * car.speed;
        car.worldY += Math.sin(car.angle) * car.speed;
        if (Math.abs(car.speed) > 0.1) car.angle += (keys["a"] ? -car.steer : (keys["d"] ? car.steer : 0));
        camera.x = car.worldX - 400; camera.y = car.worldY - 300;

        if (Math.random() < 0.015) collectibles.push({x: car.worldX + (Math.random()-0.5)*1200, y: car.worldY + (Math.random()-0.5)*1200});
        
        collectibles = collectibles.filter(m => {
            if (Math.hypot(car.worldX-m.x, car.worldY-m.y) < 40) { cash += 25; updateCashUI(); autoSave(); return false; }
            return true;
        });
    }

    function draw() {
        ctx.clearRect(0, 0, 800, 600);
        if (isStealth) return;
        ctx.strokeStyle = "#333";
        for (let x = -camera.x % 100; x < 800; x += 100) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,600); ctx.stroke(); }
        for (let y = -camera.y % 100; y < 600; y += 100) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(800,y); ctx.stroke(); }
        
        collectibles.forEach(m => { 
            ctx.fillStyle="#2ecc71"; ctx.beginPath(); ctx.arc(m.x-camera.x, m.y-camera.y, 12, 0, 7); ctx.fill(); 
            ctx.fillStyle="white"; ctx.font="bold 12px Arial"; ctx.textAlign="center"; ctx.fillText("$", m.x-camera.x, m.y-camera.y+4);
        });
        
        ctx.save();
        ctx.translate(car.worldX-camera.x, car.worldY-camera.y); ctx.rotate(car.angle);
        ctx.fillStyle = car.color; ctx.fillRect(-25,-15,50,30);
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(5,-12,12,24); // Windshield
        ctx.restore();
    }

    function loop() { update(); draw(); requestAnimationFrame(loop); }
};
