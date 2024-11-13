document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const selectButton = document.getElementById('select-button');
    const imagePreview = document.getElementById('image-preview');
    const downloadZipButton = document.getElementById('download-zip');

    const watermarkText = document.getElementById('watermark-text');
    const watermarkImageInput = document.getElementById('watermark-image');
    const positionSelect = document.getElementById('position');
    const fontSizeInput = document.getElementById('size');
    const colorInput = document.getElementById('color');
    const opacityInput = document.getElementById('opacity');
    const opacityValue = document.getElementById('opacity-value');
    const marginXInput = document.getElementById('margin-x');
    const marginYInput = document.getElementById('margin-y');

    const previewCanvas = document.getElementById('preview-canvas');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');

    let watermarkImg = null;
    let imagesData = [];
    let currentPreviewIndex = 0;

    // Event Listeners for file selection and drag/drop
    selectButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('dragover', (e) => e.preventDefault());

    // Debounce function to improve performance
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Set opacity display value and add event listener for watermark settings
    opacityInput.addEventListener('input', () => {
        opacityValue.textContent = opacityInput.value;
    });
    [watermarkText, positionSelect, fontSizeInput, opacityInput, marginXInput, marginYInput].forEach((input) => {
        input.addEventListener('input', debounce(updateLivePreview, 300));
    });
    colorInput.addEventListener('input', debounce(updateLivePreview, 300));

    // Handle watermark image upload
    watermarkImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                watermarkImg = new Image();
                watermarkImg.onload = () => {
                    updateLivePreview();
                    reprocessImages();
                };
                watermarkImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            watermarkImg = null;
            updateLivePreview();
            reprocessImages();
        }
    });

    // Handle file drop for drag-and-drop functionality
    function handleDrop(e) {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    }

    // Read and display selected files
    function handleFiles(files) {
        imagesData = [];
        imagePreview.innerHTML = '';
        [...files].forEach((file, index) => {
            if (file.type.match('image.*')) {
                readImageFile(file, index);
            } else {
                alert(`Unsupported file type: ${file.name}`);
            }
        });
    }

    function readImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagesData.push({ originalDataURL: e.target.result, filename: file.name });
            displayThumbnails();
            if (imagesData.length === 1) updateLivePreview();
        };
        reader.readAsDataURL(file);
    }

    // Display thumbnails in a single-row filmstrip with left/right navigation
    function displayThumbnails() {
        imagePreview.innerHTML = '';
        imagesData.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image.dataURL || image.originalDataURL;
            img.className = 'h-20 w-auto cursor-pointer';
            img.addEventListener('click', () => {
                currentPreviewIndex = index;
                updateLivePreview();
            });
            imagePreview.appendChild(img);
        });
        updateNavigationButtons();
    }

    // Update live preview based on the selected image
    function updateLivePreview() {
        const ctx = previewCanvas.getContext('2d');
        const sampleImage = new Image();
        sampleImage.onload = () => {
            previewCanvas.width = sampleImage.width;
            previewCanvas.height = sampleImage.height;
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            ctx.drawImage(sampleImage, 0, 0);
            applyWatermark(ctx, previewCanvas.width, previewCanvas.height);
        };
        if (imagesData.length > 0) {
            sampleImage.src = imagesData[currentPreviewIndex].originalDataURL;
        } else {
            sampleImage.src = 'static/img/preview.png';
        }
    }

    // Apply watermark to the canvas
    function applyWatermark(ctx, canvasWidth, canvasHeight) {
        ctx.globalAlpha = parseFloat(opacityInput.value) || 1;
        ctx.fillStyle = colorInput.value;
        ctx.font = `${parseInt(fontSizeInput.value, 10)}px Arial`;
        const { x, y } = calculatePosition(canvasWidth, canvasHeight);
        const text = watermarkText.value;

        if (watermarkImg) {
            const aspectRatio = watermarkImg.width / watermarkImg.height;
            const wmHeight = parseInt(fontSizeInput.value, 10);
            const wmWidth = wmHeight * aspectRatio;
            ctx.drawImage(watermarkImg, x - wmWidth / 2, y - wmHeight / 2, wmWidth, wmHeight);
        } else if (text) {
            ctx.fillText(text, x, y);
        }
        ctx.globalAlpha = 1.0;
    }

    function calculatePosition(canvasWidth, canvasHeight) {
        const marginX = parseInt(marginXInput.value, 10) || 0;
        const marginY = parseInt(marginYInput.value, 10) || 0;
        const pos = positionSelect.value;
        const textSize = parseInt(fontSizeInput.value, 10);

        const positions = {
            'top-left': { x: marginX + textSize / 2, y: marginY + textSize / 2 },
            'top-right': { x: canvasWidth - marginX - textSize / 2, y: marginY + textSize / 2 },
            'center': { x: canvasWidth / 2, y: canvasHeight / 2 },
            'bottom-left': { x: marginX + textSize / 2, y: canvasHeight - marginY - textSize / 2 },
            'bottom-right': { x: canvasWidth - marginX - textSize / 2, y: canvasHeight - marginY - textSize / 2 },
        };
        return positions[pos] || positions['center'];
    }

    // Navigation for filmstrip
    function updateNavigationButtons() {
        prevPageButton.style.display = imagePreview.scrollLeft > 0 ? 'inline-block' : 'none';
        nextPageButton.style.display = imagePreview.scrollLeft + imagePreview.clientWidth < imagePreview.scrollWidth ? 'inline-block' : 'none';
    }

    prevPageButton.addEventListener('click', () => {
        imagePreview.scrollBy({ left: -100, behavior: 'smooth' });
        setTimeout(updateNavigationButtons, 300);
    });

    nextPageButton.addEventListener('click', () => {
        imagePreview.scrollBy({ left: 100, behavior: 'smooth' });
        setTimeout(updateNavigationButtons, 300);
    });

    // Zip download for processed images
    downloadZipButton.addEventListener('click', () => {
        if (imagesData.length === 0) return alert('No images to download.');
        const zip = new JSZip();
        imagesData.forEach((image) => {
            zip.file(renameFile(image.filename), image.originalDataURL.split(',')[1], { base64: true });
        });
        zip.generateAsync({ type: 'blob' }).then((content) => saveAs(content, 'watermarked_images.zip'));
    });

    function renameFile(filename) {
        const dotIndex = filename.lastIndexOf('.');
        const name = filename.substring(0, dotIndex);
        const extension = filename.substring(dotIndex);
        return `${name}_marked${extension}`;
    }
});
