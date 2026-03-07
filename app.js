// GitHub Actions bu yozuvni haqiqiy manzilga almashtiradi
const API_URL = "https://script.google.com/macros/s/AKfycbx9BkY8WxNcy94dHwCltpe9KOkEQqYOXnt1ybflaCUxct3Fltp3EC2NCDhIpehz4ZIo/exec";

const html5QrCode = new Html5Qrcode("reader");
const resultContainer = document.getElementById("result-container");
const modulTitle = document.getElementById("modul-title");
const btnFurnitura = document.getElementById("btn-furnitura");
const btnPdf = document.getElementById("btn-pdf");
const btnVideo = document.getElementById("btn-video");
const contentArea = document.getElementById("content-area");

let currentData = null;

function onScanSuccess(decodedText, decodedResult) {
    html5QrCode.pause(true); 
    fetchData(decodedText);
}

function fetchData(barcode) {
    contentArea.innerHTML = "<p>Baza bilan bog'lanilmoqda...</p>";
    resultContainer.classList.remove("hidden");

    fetch(`${API_URL}?barcode=${encodeURIComponent(barcode)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                contentArea.innerHTML = `<p style="color:red;">${data.error}</p>`;
                setTimeout(() => html5QrCode.resume(), 2500);
                return;
            }
            
            currentData = data;
            modulTitle.textContent = `Artikul: ${data.artikul}`;
            
            btnPdf.classList.toggle("hidden", !data.pdfUrl);
            btnVideo.classList.toggle("hidden", !data.videoUrl);
            
            renderFurnitura(); 
        })
        .catch(err => {
            contentArea.innerHTML = `<p style="color:red;">Ulanishda xatolik yuz berdi!</p>`;
            setTimeout(() => html5QrCode.resume(), 2500);
        });
}

function renderFurnitura() {
    if (!currentData || !currentData.furnituralar) return;
    let html = "<h3>Kerakli furnituralar:</h3><br>";
    if (currentData.furnituralar.length === 0) {
        html += "<p>Bu modul uchun furnitura topilmadi.</p>";
    } else {
        currentData.furnituralar.forEach(item => {
            html += `<div class="fur-item"><span>${item.nomi}</span> <strong>${item.soni} ${item.ulchov}</strong></div>`;
        });
    }
    contentArea.innerHTML = html;
}

function renderIframe(url) {
    contentArea.innerHTML = `<iframe src="${url}" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                             <br><button class="btn" style="background:#e74c3c; width:100%; margin-top:10px;" onclick="renderFurnitura()">Orqaga (Furnituralar)</button>`;
}

btnFurnitura.addEventListener("click", renderFurnitura);
btnPdf.addEventListener("click", () => renderIframe(currentData.pdfUrl));
btnVideo.addEventListener("click", () => renderIframe(currentData.videoUrl));

Html5Qrcode.getCameras().then(devices => {
    if (devices && devices.length) {
        let cameraId = devices[devices.length - 1].id;
        html5QrCode.start(
            cameraId, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess
        );
    }
}).catch(err => {
    contentArea.innerHTML = `<p>Kameraga ruxsat berilmadi yoki topilmadi.</p>`;
});
