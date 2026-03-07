// DIQQAT: O'ZINGIZNING WEB APP URL MANZILINGIZNI SHU YERGA QO'YING
const API_URL = "https://script.google.com/macros/s/AKfycbzbvxJhu--zsieahPiBS8-HkUaFQj4GJykOYQi9Agp-skoOHyEY30c8NYRm6Qdujcia/exec";

const html5QrCode = new Html5Qrcode("reader");
const btnStartScan = document.getElementById("btn-start-scan");
const readerContainer = document.getElementById("reader-container");
const resultContainer = document.getElementById("result-container");
const contentArea = document.getElementById("content-area");
const tabs = document.querySelectorAll(".btn-tab");
const viewportMeta = document.querySelector('meta[name="viewport"]');

let currentData = null;

window.onload = () => {
    let instructionModal = document.getElementById('instruction-modal');
    if (instructionModal && localStorage.getItem('hideInstructions') !== 'true') {
        instructionModal.classList.remove('hidden');
    }
};

window.closeInstructions = function() {
    let cb = document.getElementById('dont-show-again');
    if (cb && cb.checked) {
        localStorage.setItem('hideInstructions', 'true');
    }
    let instructionModal = document.getElementById('instruction-modal');
    if(instructionModal) instructionModal.classList.add('hidden');
};

btnStartScan.addEventListener("click", () => {
    btnStartScan.classList.add("hidden");
    resultContainer.classList.add("hidden");
    readerContainer.classList.remove("hidden");
    
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            let cameraId = devices[devices.length - 1].id;
            html5QrCode.start(cameraId, { fps: 15, qrbox: { width: 250, height: 250 } }, onScanSuccess);
        }
    }).catch(err => alert("Kamera topilmadi!"));
});

window.stopScanner = function() {
    html5QrCode.stop().then(() => {
        readerContainer.classList.add("hidden");
        btnStartScan.classList.remove("hidden");
    }).catch(err => console.log(err));
};

function onScanSuccess(decodedText) {
    html5QrCode.stop().then(() => {
        readerContainer.classList.add("hidden");
        fetchData(decodedText);
    }).catch(err => console.log(err));
}

function fetchData(barcode) {
    resultContainer.classList.remove("hidden");
    contentArea.innerHTML = "<h3 style='text-align:center; margin-top:20px;'>Ma'lumot qidirilmoqda...</h3>";
    
    fetch(`${API_URL}?barcode=${encodeURIComponent(barcode)}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                contentArea.innerHTML = `<h3 style="color:red; text-align:center; margin-top:20px;">${data.error}</h3>`;
                return;
            }
            currentData = data;
            document.getElementById("modul-title").textContent = `Artikul: ${data.artikul}`;
            
            document.getElementById("btn-pdf").classList.toggle("hidden", !data.pdfUrl);
            document.getElementById("btn-video").classList.toggle("hidden", !data.videoUrl);
            
            renderFurnitura();
        })
        .catch(err => {
            contentArea.innerHTML = `<h3 style="color:red; text-align:center; margin-top:20px;">Internet xatoligi!</h3>`;
        });
}

function updateTabStyles(activeId) {
    tabs.forEach(tab => tab.classList.remove("active"));
    if(activeId) {
        let activeTab = document.getElementById(activeId);
        if(activeTab) activeTab.classList.add("active");
    }
}

function renderFurnitura() {
    updateTabStyles("btn-furnitura");
    if (!currentData || !currentData.furnituralar) return;
    
    if (currentData.furnituralar.length === 0) {
        contentArea.innerHTML = "<p style='text-align:center; padding: 20px;'>Bu modul uchun furnitura yo'q.</p>";
        return;
    }
    
    let html = "";
    currentData.furnituralar.forEach(item => {
        html += `<div class="fur-item"><span>${item.nomi}</span> <strong>${item.soni} ${item.ulchov}</strong></div>`;
    });
    contentArea.innerHTML = html;
}

// VIDEO VA CHIZMA (GOOGLE DOCS VIEWER + ZOOM) MANTIG'I
function renderIframe(url, tabId, type) {
    updateTabStyles(tabId);
    let finalUrl = url;

    if (type === "video") {
        if (url.includes("youtu.be/")) finalUrl = `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
        else if (url.includes("youtube.com/watch")) finalUrl = `https://www.youtube.com/embed/${new URL(url).searchParams.get("v")}`;
    } else if (type === "pdf") {
        // Drive silkasidan ID ni qirqib olib toza Google Docs Viewer ga yuborish
        let fileIdMatch = url.match(/[-\w]{25,}/);
        if (fileIdMatch) {
            let fileId = fileIdMatch[0];
            finalUrl = `https://docs.google.com/viewer?url=${encodeURIComponent('https://drive.google.com/uc?export=download&id=' + fileId)}&embedded=true`;
        }
    }

    contentArea.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
            <button class="btn btn-primary" style="padding:10px; font-size:14px; background:#27ae60;" onclick="openNativeFullscreen('${finalUrl}', '${type}')">⛶ Katta ekranda ochish</button>
        </div>
        <div class="iframe-wrapper">
            ${type === "pdf" ? '<div class="anti-leak-shield"></div>' : ''}
            <iframe src="${finalUrl}" class="secure-iframe" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
        </div>
    `;
}

// TO'LIQ EKRANLI MODAL (ZOOM VA ANTI-DOWNLOAD)
window.openNativeFullscreen = function(url, type) {
    // 2 barmoqli Zoom ni yoqish (Faqat Chizma ochilganda)
    if (viewportMeta) {
        viewportMeta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes");
    }

    let overlay = document.createElement("div");
    overlay.id = "dynamic-fullscreen-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "#000";
    overlay.style.zIndex = "99999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";

    overlay.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#2c3e50;">
            <span style="color:white; font-weight:bold; font-size:18px;">${type === 'pdf' ? 'Chizma' : 'Video'}</span>
            <button style="background:#e74c3c; color:white; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:16px;" onclick="closeNativeFullscreen()">Yopish (X)</button>
        </div>
        <div class="iframe-wrapper" style="flex-grow:1; height:100%; border-radius:0;">
            ${type === "pdf" ? '<div class="anti-leak-shield"></div>' : ''}
            <iframe src="${url}" class="secure-iframe" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.closeNativeFullscreen = function() {
    // Zoom ni bloklash (Eski holatga qaytarish)
    if (viewportMeta) {
        viewportMeta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
    }
    let overlay = document.getElementById('dynamic-fullscreen-overlay');
    if (overlay) overlay.remove();
};

document.getElementById("btn-furnitura").addEventListener("click", renderFurnitura);
document.getElementById("btn-pdf").addEventListener("click", () => renderIframe(currentData.pdfUrl, "btn-pdf", "pdf"));
document.getElementById("btn-video").addEventListener("click", () => renderIframe(currentData.videoUrl, "btn-video", "video"));

window.resetApp = function() {
    resultContainer.classList.add("hidden");
    btnStartScan.classList.remove("hidden");
    currentData = null;
};
