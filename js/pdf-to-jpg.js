const pdfInput = document.getElementById('pdfInput');
const convertBtn = document.getElementById('convertBtn');
const preview = document.getElementById('preview');
const downloadBtn = document.getElementById('downloadBtn');

let jpgUrls = [];

convertBtn.addEventListener('click', async () => {
    const file = pdfInput.files[0];
    if (!file || !file.type.includes('pdf')) {
        alert('Please upload a valid PDF file.');
        return;
    }

    preview.innerHTML = '';
    jpgUrls = [];
    downloadBtn.classList.add('hidden');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const imgDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            jpgUrls.push(imgDataUrl);

            const img = document.createElement('img');
            img.src = imgDataUrl;
            img.className = 'preview-canvas';
            preview.appendChild(img);
        }

        downloadBtn.classList.remove('hidden');
    } catch (error) {
        console.error('Error converting PDF to JPG:', error);
        alert('An error occurred while converting the PDF. Please try again.');
    }
});

downloadBtn.addEventListener('click', () => {
    const zip = new JSZip();
    jpgUrls.forEach((url, index) => {
        const byteString = atob(url.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        zip.file(`page_${index + 1}.jpg`, ab);
    });

    zip.generateAsync({ type: 'blob' }).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'pdf_pages.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    });
});