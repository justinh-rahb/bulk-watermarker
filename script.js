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
    const marginXInput = document.getElementById('margin-x');
    const marginYInput = document.getElementById('margin-y');

    const previewCanvas = document.getElementById('preview-canvas');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    let watermarkImg = null;
    let imagesData = [];
    let currentPage = 1;
    const imagesPerPage = 8; // Adjusted to match 4x2 grid
    let currentPreviewIndex = 0; // Index of the image currently in the live preview

    // Load settings from localStorage
    loadSettings();

    // Save settings when they change and reprocess images
    [watermarkText, positionSelect, fontSizeInput, colorInput, opacityInput, marginXInput, marginYInput].forEach(input => {
        input.addEventListener('input', () => {
            saveSettings();
            updateLivePreview();
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
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    uploadArea.addEventListener('drop', handleDrop, false);

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
        imagesData = []; // Reset images data
        currentPage = 1;
        imagePreview.innerHTML = '';
        [...files].forEach((file, index) => {
            if (file.type.match('image.*')) {
                readImageFile(file, index);
            } else {
                alert(`Unsupported file type: ${file.name}`);
            }
        });
    }

    // Read image file and store original data
    function readImageFile(file, index) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            imagesData.push({ originalDataURL: e.target.result, filename: file.name });
            if (imagesData.length === 1) {
                // Update live preview with the first image
                currentPreviewIndex = 0;
                updateLivePreview();
            }
            displayImages();
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
                image.dataURL = dataURL; // Update watermarked dataURL

                // If this image is currently in live preview, update it
                if (index === currentPreviewIndex) {
                    updateLivePreview();
                }

                displayImages();
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
            const wmWidth = watermarkImg.width;
            const wmHeight = watermarkImg.height;
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

    // Display images with pagination and add click event to thumbnails
    function displayImages() {
        const totalPages = Math.ceil(imagesData.length / imagesPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // Clear the image preview area
        imagePreview.innerHTML = '';

        // If there are no images, update pagination info and disable buttons
        if (imagesData.length === 0) {
            pageInfo.textContent = `Page 0 of 0`;
            prevPageButton.disabled = true;
            nextPageButton.disabled = true;
            return;
        }

        // Calculate the images to show on the current page
        const start = (currentPage - 1) * imagesPerPage;
        const end = start + imagesPerPage;
        const imagesToShow = imagesData.slice(start, end);

        imagesToShow.forEach((image, index) => {
            const container = document.createElement('div');
            container.className = 'image-container';

            const img = document.createElement('img');
            img.src = image.dataURL || image.originalDataURL;
            img.dataset.index = start + index; // Store the index of the image
            img.addEventListener('click', () => {
                currentPreviewIndex = parseInt(img.dataset.index, 10);
                updateLivePreview();
            });

            const link = document.createElement('a');
            link.href = image.dataURL || image.originalDataURL;
            link.download = renameFile(image.filename);
            link.textContent = 'Download';

            container.appendChild(img);
            container.appendChild(link);
            imagePreview.appendChild(container);
        });

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

        // Disable buttons if on first or last page
        prevPageButton.disabled = currentPage <= 1;
        nextPageButton.disabled = currentPage >= totalPages;
    }

    // Pagination controls
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayImages();
        }
    });

    nextPageButton.addEventListener('click', () => {
        const totalPages = Math.ceil(imagesData.length / imagesPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayImages();
        }
    });

    // Rename file
    function renameFile(filename) {
        const dotIndex = filename.lastIndexOf('.');
        const name = filename.substring(0, dotIndex);
        const extension = filename.substring(dotIndex);
        return `${name}_marked${extension}`;
    }

    // Download all as ZIP
    downloadZipButton.addEventListener('click', () => {
        const zip = new JSZip();
        if (imagesData.length === 0) {
            alert('No images to download.');
            return;
        }
        let processedCount = 0;
        imagesData.forEach((image) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Apply watermark
                applyWatermark(ctx, canvas.width, canvas.height);

                canvas.toBlob(blob => {
                    const newFilename = renameFile(image.filename);
                    zip.file(newFilename, blob);
                    processedCount++;
                    if (processedCount === imagesData.length) {
                        zip.generateAsync({ type: 'blob' }).then(content => {
                            saveAs(content, 'watermarked_images.zip');
                        });
                    }
                });
            };
            img.src = image.originalDataURL;
        });
    });

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
            sampleImage.src = 'https://via.placeholder.com/600x400?text=Live+Preview';
        }
    }

    // Download the image when live preview is clicked
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

    // Initialize live preview
    updateLivePreview();

    // Save settings to localStorage
    function saveSettings() {
        const settings = {
            watermarkText: watermarkText.value,
            position: positionSelect.value,
            fontSize: fontSizeInput.value,
            color: colorInput.value,
            opacity: opacityInput.value,
            marginX: marginXInput.value,
            marginY: marginYInput.value
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
            marginXInput.value = settings.marginX;
            marginYInput.value = settings.marginY;
        }

        // Load watermark image if saved
        const savedWatermarkImage = localStorage.getItem('watermarkImage');
        if (savedWatermarkImage) {
            watermarkImg = new Image();
            watermarkImg.onload = () => updateLivePreview();
            watermarkImg.src = savedWatermarkImage;
        }

        updateLivePreview();
    }
});
