const API_URL = "https://script.google.com/macros/s/AKfycbzbvxJhu--zsieahPiBS8-HkUaFQj4GJykOYQi9Agp-skoOHyEY30c8NYRm6Qdujcia/exec";
const html5QrCode = new Html5Qrcode("reader");
const viewportMeta = document.querySelector('meta[name="viewport"]');

let currentData = null;
let torchOn = false;

// OVOZ VA TEBRANISH MANTIG'I
function playSuccessBeep() {
    try {
        if (navigator.vibrate) navigator.vibrate(200); // Tebranish
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) { console.log("Audio API xatosi", e); }
}

// MAHALLIY TARIX (LOCAL STORAGE)
function saveToHistory(data) {
    let history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    history = history.filter(item => item.artikul !== data.artikul);
    history.unshift(data);
    if (history.length > 10) history.pop();
    localStorage.setItem('scanHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const list = document.getElementById('history-list');
    let history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    if (history.length === 0) {
        list.innerHTML = "<p style='color:#7f8c8d; font-size: 14px;'>Hozircha tarix yo'q.</p>";
        return;
    }
    list.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadFromHistory('${item.artikul}')">
            <strong>${item.artikul}</strong>
            <span style="color:#7f8c8d; font-size:20px;">➔</span>
        </div>
    `).join('');
}

function loadFromHistory(artikul) {
    let history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
    let data = history.find(i => i.artikul === artikul);
    if (data) {
        currentData = data;
        enableNavs();
        renderFurnitura();
    }
}

window.onload = loadHistory;

// SAHIFALAR (PAGES) NAVIGATSIYASI
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    if (pageId === 'home') {
        document.getElementById('nav-home').classList.add('active');
        document.getElementById('app-title').textContent = "Aristokrat Mebel";
    }
}

function enableNavs() {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('disabled'));
    document.getElementById('app-title').textContent = `Artikul: ${currentData.artikul}`;
}
// SKANER VA CHIROQ (TORCH) MANTIG'I
function startScan() {
    showPage('scanner');
    document.getElementById('nav-scan').classList.add('active');
    document.getElementById('app-title').textContent = "Skanerlash...";
    
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            html5QrCode.start(devices[devices.length - 1].id, { fps: 15, qrbox: 250 }, onScanSuccess).then(() => {
                document.getElementById('btn-torch').addEventListener('click', toggleTorch);
            });
        }
    }).catch(err => alert("Kamera topilmadi!"));
}

function toggleTorch() {
    torchOn = !torchOn;
    html5QrCode.applyVideoConstraints({ advanced: [{ torch: torchOn }] });
    document.getElementById('btn-torch').style.background = torchOn ? "#f1c40f" : "#2980b9";
}

function stopScanner() {
    html5QrCode.stop().then(() => {
        torchOn = false;
        showPage('home');
    });
}

function onScanSuccess(decodedText) {
    playSuccessBeep();
    html5QrCode.stop().then(() => {
        torchOn = false;
        fetchData(decodedText);
    });
}

// API DAN MA'LUMOT OLISH VA SKELETON
function fetchData(barcode) {
    showPage('content');
    document.getElementById('dynamic-content').innerHTML = "";
    document.getElementById('skeleton-loader').classList.remove('hidden');
    document.getElementById('app-title').textContent = "Qidirilmoqda...";
    
    fetch(`${API_URL}?barcode=${encodeURIComponent(barcode)}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('skeleton-loader').classList.add('hidden');
            if (data.error) {
                document.getElementById('dynamic-content').innerHTML = `<h3 style="color:red; text-align:center; margin-top:20px;">${data.error}</h3>`;
                return;
            }
            currentData = data;
            saveToHistory(data);
            enableNavs();
            renderFurnitura();
        })
        .catch(err => {
            document.getElementById('skeleton-loader').classList.add('hidden');
            document.getElementById('dynamic-content').innerHTML = `<h3 style="color:red; text-align:center; margin-top:20px;">Internet xatoligi!</h3>`;
        });
}
// FURNITURA VA MEDIA RENDERI
function updateNavStyle(type) {
    showPage('content');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`nav-${type === 'furnitura' ? 'fur' : type === 'pdf' ? 'pdf' : 'vid'}`).classList.add('active');
}

window.renderFurnitura = function() {
    if (!currentData) return;
    updateNavStyle('furnitura');
    let html = "";
    if (!currentData.furnituralar || currentData.furnituralar.length === 0) {
        html = "<p style='text-align:center; padding: 20px;'>Bu modul uchun furnitura yo'q.</p>";
    } else {
        currentData.furnituralar.forEach(item => {
            html += `<div class="fur-item"><span>${item.nomi}</span> <strong>${item.soni} ${item.ulchov}</strong></div>`;
        });
    }
    document.getElementById('dynamic-content').innerHTML = html;
};

window.renderIframe = function(type) {
    if (!currentData) return;
    updateNavStyle(type);
    
    let url = type === 'pdf' ? currentData.pdfUrl : currentData.videoUrl;
    if (!url) {
        document.getElementById('dynamic-content').innerHTML = `<p style='text-align:center; padding: 20px;'>Bu qism kiritilmagan.</p>`;
        return;
    }

    let finalUrl = url;
    if (type === "video") {
        if (url.includes("youtu.be/")) finalUrl = `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
        else if (url.includes("youtube.com/watch")) finalUrl = `https://www.youtube.com/embed/${new URL(url).searchParams.get("v")}`;
    } else if (type === "pdf") {
        let fileIdMatch = url.match(/[-\w]{25,}/);
        if (fileIdMatch) {
            finalUrl = `https://docs.google.com/viewer?url=${encodeURIComponent('https://drive.google.com/uc?export=download&id=' + fileIdMatch[0])}&embedded=true`;
        }
    }

    document.getElementById('dynamic-content').innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
            <button class="btn btn-primary" style="padding:10px; font-size:14px; background:#27ae60;" onclick="openNativeFullscreen('${finalUrl}', '${type}')">⛶ To'liq ekran</button>
        </div>
        <div class="iframe-wrapper">
            ${type === "pdf" ? '<div class="anti-leak-shield"></div>' : ''}
            <iframe src="${finalUrl}" class="secure-iframe" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
        </div>
    `;
};

// FULLSCREEN VA ZOOM DINAMIKASI
window.openNativeFullscreen = function(url, type) {
    if (viewportMeta) viewportMeta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes");
    
    document.getElementById("modal-title-text").textContent = type === "pdf" ? "Chizma" : "Video";
    const shield = document.getElementById("anti-leak-shield");
    if (type === "pdf") shield.classList.remove("hidden"); else shield.classList.add("hidden");

    document.getElementById("iframe-container").innerHTML = `<iframe src="${url}" class="secure-iframe" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
    document.getElementById("fullscreen-modal").classList.remove("hidden");
};

window.closeNativeFullscreen = function() {
    if (viewportMeta) viewportMeta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover");
    document.getElementById("iframe-container").innerHTML = "";
    document.getElementById("fullscreen-modal").classList.add("hidden");
};
