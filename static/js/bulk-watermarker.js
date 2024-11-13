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
    let watermarkImg = null;
    let imagesData = [];
    let currentPreviewIndex = 0;

    // Debounce function
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Load settings from localStorage
    loadSettings();

    // Update opacity display value
    opacityInput.addEventListener('input', () => {
        opacityValue.textContent = opacityInput.value;
    });

    // Save settings and update live preview
    function saveSettingsAndUpdatePreview() {
        saveSettings();
        updateLivePreview();
    }

    const debouncedReprocessImages = debounce(reprocessImages, 300);

    // Apply debouncing to inputs affecting watermark
    [watermarkText, positionSelect, fontSizeInput, opacityInput, marginXInput, marginYInput].forEach((input) => {
        input.addEventListener('input', () => {
            saveSettingsAndUpdatePreview();
            debouncedReprocessImages();
        });
    });
    colorInput.addEventListener('input', () => {
        saveSettingsAndUpdatePreview();
        debouncedReprocessImages();
    });

    // Handle watermark image upload with localStorage support
    watermarkImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                watermarkImg = new Image();
                watermarkImg.onload = () => {
                    updateLivePreview();
                    saveWatermarkImage(event.target.result);
                    reprocessImages();
                };
                watermarkImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            watermarkImg = null;
            localStorage.removeItem('watermarkImage');
            updateLivePreview();
            reprocessImages();
        }
    });

    // File selection
    selectButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

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
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            imagesData.push({ originalDataURL: e.target.result, filename: file.name });
            if (imagesData.length === 1) {
                currentPreviewIndex = 0;
                updateLivePreview();
            }
        };
    }

    // Reprocess images with current settings
    function reprocessImages() {
        if (imagesData.length === 0) return;
        imagesData.forEach((image, index) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Apply watermark
                applyWatermark(ctx, canvas.width, canvas.height);

                const dataURL = canvas.toDataURL();
                image.dataURL = dataURL;

                if (index === currentPreviewIndex) {
                    updateLivePreview();
                }
            };
            img.src = image.originalDataURL;
        });
    }

    // Apply watermark to canvas context
    function applyWatermark(ctx, canvasWidth, canvasHeight) {
        const opacity = parseFloat(opacityInput.value);
        if (isNaN(opacity) || opacity < 0 || opacity > 1) return;

        ctx.globalAlpha = opacity;
        ctx.fillStyle = colorInput.value;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const fontSize = parseInt(fontSizeInput.value, 10);
        if (isNaN(fontSize) || fontSize <= 0) return;

        ctx.font = `${fontSize}px Arial`;

        const marginX = parseInt(marginXInput.value, 10) || 0;
        const marginY = parseInt(marginYInput.value, 10) || 0;

        let x, y;
        if (watermarkImg) {
            const aspectRatio = watermarkImg.width / watermarkImg.height;
            let wmHeight = fontSize;
            let wmWidth = wmHeight * aspectRatio;

            const maxWidth = Math.max(1, canvasWidth - 2 * marginX);
            const maxHeight = Math.max(1, canvasHeight - 2 * marginY);

            wmWidth = Math.min(wmWidth, maxWidth);
            wmHeight = Math.min(wmHeight, maxHeight);

            ({ x, y } = calculatePosition(canvasWidth, canvasHeight, wmWidth, wmHeight, marginX, marginY));
            ctx.drawImage(watermarkImg, x - wmWidth / 2, y - wmHeight / 2, wmWidth, wmHeight);
        } else {
            const text = watermarkText.value;
            if (text) {
                const textMetrics = ctx.measureText(text);
                const textWidth = textMetrics.width;
                const textHeight = fontSize;
                ({ x, y } = calculatePosition(canvasWidth, canvasHeight, textWidth, textHeight, marginX, marginY));
                ctx.fillText(text, x, y);
            }
        }
        ctx.globalAlpha = 1.0;
    }

    function calculatePosition(canvasWidth, canvasHeight, wmWidth, wmHeight, marginX, marginY) {
        let x, y;
        switch (positionSelect.value) {
            case 'top-left':
                x = wmWidth / 2 + marginX;
                y = wmHeight / 2 + marginY;
                break;
            case 'top-right':
                x = canvasWidth - wmWidth / 2 - marginX;
                y = wmHeight / 2 + marginY;
                break;
            case 'center':
                x = canvasWidth / 2;
                y = canvasHeight / 2;
                break;
            case 'bottom-left':
                x = wmWidth / 2 + marginX;
                y = canvasHeight - wmHeight / 2 - marginY;
                break;
            case 'bottom-right':
                x = canvasWidth - wmWidth / 2 - marginX;
                y = canvasHeight - wmHeight / 2 - marginY;
                break;
            default:
                x = canvasWidth / 2;
                y = canvasHeight / 2;
        }
        return { x, y };
    }

    // Update live preview
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

    // Save settings to localStorage
    function saveSettings() {
        const settings = {
            watermarkText: watermarkText.value,
            position: positionSelect.value,
            fontSize: fontSizeInput.value,
            color: colorInput.value,
            opacity: opacityInput.value,
            marginX: marginXInput.value,
            marginY: marginYInput.value,
        };
        localStorage.setItem('watermarkSettings', JSON.stringify(settings));
    }

    // Save watermark image to localStorage
    function saveWatermarkImage(dataURL) {
        localStorage.setItem('watermarkImage', dataURL);
    }

    // Load settings from localStorage
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('watermarkSettings'));
        if (settings) {
            watermarkText.value = settings.watermarkText;
            positionSelect.value = settings.position;
            fontSizeInput.value = settings.fontSize;
            colorInput.value = settings.color;
            opacityInput.value = settings.opacity;
            opacityValue.textContent = settings.opacity;
            marginXInput.value = settings.marginX;
            marginYInput.value = settings.marginY;
        }

        const savedWatermarkImage = localStorage.getItem('watermarkImage');
        if (savedWatermarkImage) {
            watermarkImg = new Image();
            watermarkImg.onload = () => updateLivePreview();
            watermarkImg.src = savedWatermarkImage;
        }

        updateLivePreview();
    }
});
