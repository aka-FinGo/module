// O'ZINGIZNING WEB APP URL MANZILINGIZNI SHU YERGA QO'YING
const API_URL = "https://script.google.com/macros/s/AKfycbzbvxJhu--zsieahPiBS8-HkUaFQj4GJykOYQi9Agp-skoOHyEY30c8NYRm6Qdujcia/exec";

const html5QrCode = new Html5Qrcode("reader");
const btnStartScan = document.getElementById("btn-start-scan");
const readerContainer = document.getElementById("reader-container");
const resultContainer = document.getElementById("result-container");
const contentArea = document.getElementById("content-area");
const tabs = document.querySelectorAll(".btn-tab");

let currentData = null;

window.onload = () => {
    if (localStorage.getItem('hideInstructions') !== 'true') {
        document.getElementById('instruction-modal').classList.remove('hidden');
    }
};

function closeInstructions() {
    if (document.getElementById('dont-show-again').checked) {
        localStorage.setItem('hideInstructions', 'true');
    }
    document.getElementById('instruction-modal').classList.add('hidden');
}

btnStartScan.addEventListener("click", () => {
    btnStartScan.classList.add("hidden");
    resultContainer.classList.add("hidden");
    readerContainer.classList.remove("hidden");
    
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            let cameraId = devices[devices.length - 1].id;
            html5QrCode.start(cameraId, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess);
        }
    }).catch(err => alert("Kamera topilmadi!"));
});

function stopScanner() {
    html5QrCode.stop().then(() => {
        readerContainer.classList.add("hidden");
        btnStartScan.classList.remove("hidden");
    }).catch(err => console.log(err));
}

function onScanSuccess(decodedText) {
    html5QrCode.stop().then(() => {
        readerContainer.classList.add("hidden");
        fetchData(decodedText);
    }).catch(err => console.log(err));
}

function fetchData(barcode) {
    resultContainer.classList.remove("hidden");
    contentArea.innerHTML = "<h3 style='text-align:center;'>Ma'lumot qidirilmoqda...</h3>";
    
    fetch(`${API_URL}?barcode=${encodeURIComponent(barcode)}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                contentArea.innerHTML = `<h3 style="color:red; text-align:center;">${data.error}</h3>`;
                return;
            }
            currentData = data;
            document.getElementById("modul-title").textContent = `Artikul: ${data.artikul}`;
            
            document.getElementById("btn-pdf").classList.toggle("hidden", !data.pdfUrl);
            document.getElementById("btn-video").classList.toggle("hidden", !data.videoUrl);
            
            renderFurnitura();
        })
        .catch(err => {
            contentArea.innerHTML = `<h3 style="color:red; text-align:center;">Internet xatoligi!</h3>`;
        });
}

function updateTabStyles(activeId) {
    tabs.forEach(tab => tab.classList.remove("active"));
    if(activeId) document.getElementById(activeId).classList.add("active");
}

function renderFurnitura() {
    updateTabStyles("btn-furnitura");
    if (!currentData || !currentData.furnituralar) return;
    
    if (currentData.furnituralar.length === 0) {
        contentArea.innerHTML = "<p style='text-align:center; padding: 20px;'>Bu modul uchun furnitura ro'yxati kiritilmagan.</p>";
        return;
    }
    
    let html = "";
    currentData.furnituralar.forEach(item => {
        html += `<div class="fur-item"><span>${item.nomi}</span> <strong>${item.soni} ${item.ulchov}</strong></div>`;
    });
    contentArea.innerHTML = html;
}

// YOUTUBE VA DRIVE SILKALARINI AVTOMATIK MOSLASHTIRUVCHI FUNKSIYA
function renderIframe(url, tabId) {
    updateTabStyles(tabId);
    let finalUrl = url;

    // YouTube konvertatsiyasi
    if (url.includes("youtu.be/")) {
        let videoId = url.split("youtu.be/")[1].split("?")[0];
        finalUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes("youtube.com/watch")) {
        let videoId = new URL(url).searchParams.get("v");
        finalUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    // Google Drive konvertatsiyasi (view ni preview ga o'zgartirish)
    if (url.includes("drive.google.com/file/d/")) {
        finalUrl = url.replace(/\/view.*/, "/preview");
    }

    contentArea.innerHTML = `<iframe src="${finalUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
}

document.getElementById("btn-furnitura").addEventListener("click", renderFurnitura);
document.getElementById("btn-pdf").addEventListener("click", () => renderIframe(currentData.pdfUrl, "btn-pdf"));
document.getElementById("btn-video").addEventListener("click", () => renderIframe(currentData.videoUrl, "btn-video"));

function resetApp() {
    resultContainer.classList.add("hidden");
    btnStartScan.classList.remove("hidden");
    currentData = null;
}
