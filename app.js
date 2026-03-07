// O'ZINGIZNING WEB APP URL MANZILINGIZNI SHU YERGA QO'YING
const API_URL = "https://script.google.com/macros/s/AKfycbzbvxJhu--zsieahPiBS8-HkUaFQj4GJykOYQi9Agp-skoOHyEY30c8NYRm6Qdujcia/exec";

// Skaner obyekti (standart barcha 1D Barkod va 2D QR kodlarni o'qiydi)
const html5QrCode = new Html5Qrcode("reader");

const btnStartScan = document.getElementById("btn-start-scan");
const readerContainer = document.getElementById("reader-container");
const resultContainer = document.getElementById("result-container");
const contentArea = document.getElementById("content-area");
const btnPdf = document.getElementById("btn-pdf");
const btnVideo = document.getElementById("btn-video");

const fullscreenModal = document.getElementById("fullscreen-modal");
const iframeContainer = document.getElementById("iframe-container");
const antiLeakShield = document.getElementById("anti-leak-shield");
const modalTitleText = document.getElementById("modal-title-text");

let currentData = null;

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
            
            btnPdf.classList.toggle("hidden", !data.pdfUrl);
            btnVideo.classList.toggle("hidden", !data.videoUrl);
            
            renderFurnitura();
        })
        .catch(err => {
            contentArea.innerHTML = `<h3 style="color:red; text-align:center; margin-top:20px;">Internet xatoligi!</h3>`;
        });
}

function renderFurnitura() {
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

// TO'LIQ EKRANLI READER (PDF va Video uchun)
function openFullscreen(url, type) {
    let finalUrl = url;
    modalTitleText.textContent = type === "pdf" ? "Chizmani ko'rish" : "Videoni ko'rish";

    if (type === "video") {
        antiLeakShield.classList.add("hidden"); // Videoda to'siq kerak emas
        if (url.includes("youtu.be/")) finalUrl = `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`;
        else if (url.includes("youtube.com/watch")) finalUrl = `https://www.youtube.com/embed/${new URL(url).searchParams.get("v")}`;
    } else if (type === "pdf") {
        antiLeakShield.classList.remove("hidden"); // PDF da o'g'irlash tugmasini to'samiz
        if (url.includes("drive.google.com/file/d/")) finalUrl = url.replace(/\/view.*/, "/preview");
    }

    iframeContainer.innerHTML = `<iframe src="${finalUrl}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
    fullscreenModal.classList.remove("hidden");
}

function closeFullscreen() {
    iframeContainer.innerHTML = ""; // Yopilganda videoni to'xtatish uchun
    fullscreenModal.classList.add("hidden");
}

btnPdf.addEventListener("click", () => openFullscreen(currentData.pdfUrl, "pdf"));
btnVideo.addEventListener("click", () => openFullscreen(currentData.videoUrl, "video"));

function resetApp() {
    resultContainer.classList.add("hidden");
    btnStartScan.classList.remove("hidden");
    currentData = null;
}
