document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const selectButton = document.getElementById('select-button');
    const previewCanvas = document.getElementById('preview-canvas');
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

    const prevPreviewButton = document.getElementById('prev-preview');
    const nextPreviewButton = document.getElementById('next-preview');
    const prevThumbnailButton = document.getElementById('prev-thumbnail');
    const nextThumbnailButton = document.getElementById('next-thumbnail');

    let watermarkImg = null;
    let imagesData = [];
    let currentPreviewIndex = 0;
    const imagesPerPage = 6;
    let thumbnailPageStartIndex = 0;

    // Load settings from localStorage
    loadSettings();

    // Update opacity value display
    opacityInput.addEventListener('input', () => {
        opacityValue.textContent = opacityInput.value;
    });

    // Save settings and update live preview
    function saveSettingsAndUpdatePreview() {
        saveSettings();
        updateLivePreview();
    }

    // Save settings when they change and reprocess images
    [watermarkText, positionSelect, fontSizeInput, opacityInput, marginXInput, marginYInput].forEach((input) => {
        input.addEventListener('input', () => {
            saveSettingsAndUpdatePreview();
            reprocessImages();
        });
    });

    // Handle watermark image upload with localStorage
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

    // Handle file selection
    selectButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    // Handle drag and drop
    uploadArea.addEventListener('drop', handleDrop, false);
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle files
    function handleFiles(files) {
        // Hide the placeholder when images are uploaded
        if (files.length > 0) {
            uploadPlaceholder.style.display = 'none';
        }

        [...files].forEach((file) => {
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    imagesData.push({ originalDataURL: e.target.result, filename: file.name });
                    if (imagesData.length === 1) currentPreviewIndex = 0;
                    displayThumbnails();
                    updateLivePreview();
                };
            } else {
                alert(`Unsupported file type: ${file.name}`);
            }
        });
    }

    // Hide placeholder on file select or drop
    selectButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFiles(e.dataTransfer.files);
    });

    // Update live preview
    function updateLivePreview() {
        if (imagesData.length === 0) return;
        const ctx = previewCanvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            previewCanvas.width = img.width;
            previewCanvas.height = img.height;
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            ctx.drawImage(img, 0, 0);
            applyWatermark(ctx, previewCanvas.width, previewCanvas.height);
        };
        img.src = imagesData[currentPreviewIndex].originalDataURL;
    }

    // Display thumbnails with dynamic pagination
    function displayThumbnails() {
        const thumbnails = imagesData.slice(thumbnailPageStartIndex, thumbnailPageStartIndex + imagesPerPage);
        imagePreview.innerHTML = thumbnails.map((image, index) => {
            return `<img src="${image.originalDataURL}" data-index="${thumbnailPageStartIndex + index}" class="thumbnail">`;
        }).join('');

        document.querySelectorAll('.thumbnail').forEach((img) => {
            img.addEventListener('click', () => {
                currentPreviewIndex = parseInt(img.dataset.index, 10);
                updateLivePreview();
            });
        });

        prevThumbnailButton.style.visibility = thumbnailPageStartIndex > 0 ? 'visible' : 'hidden';
        nextThumbnailButton.style.visibility = thumbnailPageStartIndex + imagesPerPage < imagesData.length ? 'visible' : 'hidden';
    }

    // Thumbnail navigation
    prevThumbnailButton.addEventListener('click', () => {
        thumbnailPageStartIndex = Math.max(0, thumbnailPageStartIndex - imagesPerPage);
        displayThumbnails();
    });

    nextThumbnailButton.addEventListener('click', () => {
        if (thumbnailPageStartIndex + imagesPerPage < imagesData.length) {
            thumbnailPageStartIndex += imagesPerPage;
            displayThumbnails();
        }
    });

    // Preview navigation
    prevPreviewButton.addEventListener('click', () => {
        currentPreviewIndex = (currentPreviewIndex > 0) ? currentPreviewIndex - 1 : imagesData.length - 1;
        updateLivePreview();
    });

    nextPreviewButton.addEventListener('click', () => {
        currentPreviewIndex = (currentPreviewIndex + 1) % imagesData.length;
        updateLivePreview();
    });

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
            // Calculate desired size for the watermark image based on font size
            const aspectRatio = watermarkImg.width / watermarkImg.height;
            let wmHeight = fontSize; // Set height based on font size
            let wmWidth = wmHeight * aspectRatio; // Calculate width to maintain aspect ratio

            // Ensure the maximum dimensions are at least 1
            const maxWidth = Math.max(1, canvasWidth - 2 * marginX);
            const maxHeight = Math.max(1, canvasHeight - 2 * marginY);

            wmWidth = Math.min(wmWidth, maxWidth);
            wmHeight = Math.min(wmHeight, maxHeight);

            ({ x, y } = calculatePosition(canvasWidth, canvasHeight, wmWidth, wmHeight, marginX, marginY));
            ctx.drawImage(watermarkImg, x - wmWidth / 2, y - wmHeight / 2, wmWidth, wmHeight);
        } else {
            const text = watermarkText.value;
            if (text) {
                const textWidth = ctx.measureText(text).width;
                const textHeight = fontSize;
                ({ x, y } = calculatePosition(canvasWidth, canvasHeight, textWidth, textHeight, marginX, marginY));
                ctx.fillText(text, x, y);
            } else {
                // No watermark text or image; skip watermarking
                return;
            }
        }
        ctx.globalAlpha = 1.0;
    }

    // Calculate watermark position
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

    // Download all images as a ZIP
    downloadZipButton.addEventListener('click', () => {
        const zip = new JSZip();
        if (imagesData.length === 0) {
            alert('No images to download.');
            return;
        }
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

                canvas.toBlob((blob) => {
                    const newFilename = renameFile(image.filename);
                    zip.file(newFilename, blob);
                    if (index === imagesData.length - 1) {
                        zip.generateAsync({ type: 'blob' }).then((content) => {
                            saveAs(content, 'watermarked_images.zip');
                        });
                    }
                });
            };
            img.src = image.originalDataURL;
        });
    });

    // Rename file
    function renameFile(filename) {
        const dotIndex = filename.lastIndexOf('.');
        const name = filename.substring(0, dotIndex);
        const extension = filename.substring(dotIndex);
        return `${name}_marked${extension}`;
    }

    // Download individual preview image when canvas is clicked
    previewCanvas.addEventListener('click', () => {
        if (imagesData.length === 0) return;
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            applyWatermark(ctx, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const filename = renameFile(imagesData[currentPreviewIndex].filename);
                saveAs(blob, filename);
            });
        };
        img.src = imagesData[currentPreviewIndex].originalDataURL;
    });

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

        // Load watermark image if saved
        const savedWatermarkImage = localStorage.getItem('watermarkImage');
        if (savedWatermarkImage) {
            watermarkImg = new Image();
            watermarkImg.onload = updateLivePreview;
            watermarkImg.src = savedWatermarkImage;
        }

        updateLivePreview();
        displayThumbnails();
    }
});
