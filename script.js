// 全局变量
let currentFile = null;
let originalArrayBuffer = null; // 保存原始的ArrayBuffer
let originalText = '';
let convertedText = '';

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const encodingSection = document.getElementById('encodingSection');
const previewSection = document.getElementById('previewSection');
const sourceEncoding = document.getElementById('sourceEncoding');
const convertBtn = document.getElementById('convertBtn');
const originalPreview = document.getElementById('originalPreview');
const convertedPreview = document.getElementById('convertedPreview');
const originalInfo = document.getElementById('originalInfo');
const convertedInfo = document.getElementById('convertedInfo');
const downloadBtn = document.getElementById('downloadBtn');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化');
    initializeEventListeners();
    
    // 移动设备兼容性检查
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        console.log('检测到移动设备');
        // 确保文件输入框在移动设备上正常工作
        fileInput.addEventListener('touchstart', function(e) {
            console.log('触摸事件触发');
        });
    }
});

// 初始化事件监听器
function initializeEventListeners() {
    console.log('初始化事件监听器');
    
    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);
    console.log('文件选择事件监听器已添加');
    
    // 拖拽事件
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    console.log('拖拽事件监听器已添加');
    
    // 编码选择变化事件
    sourceEncoding.addEventListener('change', handleEncodingChange);
    
    // 转换按钮事件
    convertBtn.addEventListener('click', handleConvert);
    
    // 下载按钮事件
    downloadBtn.addEventListener('click', handleDownload);
    
    console.log('所有事件监听器初始化完成');
}

// 处理文件选择
function handleFileSelect(event) {
    console.log('文件选择事件触发', event);
    const file = event.target.files[0];
    if (file) {
        console.log('选择的文件:', file.name, file.size, file.type);
        processFile(file);
    } else {
        console.log('没有选择文件');
    }
}

// 处理拖拽悬停
function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

// 处理拖拽离开
function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

// 处理文件拖拽
function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// 处理文件
function processFile(file) {
    console.log('开始处理文件:', file.name);
    
    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.txt')) {
        console.log('文件类型不匹配:', file.type);
        showMessage('请选择 .txt 文件', 'error');
        return;
    }
    
    // 检查文件大小 (50MB = 50 * 1024 * 1024 bytes)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        console.log('文件过大:', file.size);
        showMessage('文件大小不能超过 50MB', 'error');
        return;
    }
    
    console.log('文件验证通过，开始读取');
    currentFile = file;
    
    // 读取文件内容
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('文件读取完成，开始处理');
        try {
            // 保存原始的ArrayBuffer
            originalArrayBuffer = e.target.result;
            console.log('ArrayBuffer大小:', originalArrayBuffer.byteLength);
            
            // 尝试检测编码
            const detectedEncoding = detectEncoding(originalArrayBuffer);
            console.log('检测到的编码:', detectedEncoding);
            
            // 如果检测到的是UTF-8，但用户希望默认用GBK，则设置为GBK
            // 否则使用检测到的编码
            const defaultEncoding = detectedEncoding === 'utf-8' ? 'gbk' : detectedEncoding;
            console.log('使用的默认编码:', defaultEncoding);
            sourceEncoding.value = defaultEncoding;
            
            // 显示编码选择区域
            encodingSection.style.display = 'block';
            
            // 显示原始内容预览
            showOriginalPreview(originalArrayBuffer, defaultEncoding);
            
            showMessage(`文件 "${file.name}" 上传成功！检测到编码: ${detectedEncoding}`, 'success');
            
        } catch (error) {
            console.error('文件处理错误:', error);
            showMessage('文件读取失败: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        console.error('FileReader错误:', reader.error);
        showMessage('文件读取失败', 'error');
    };
    
    reader.readAsArrayBuffer(file);
}

// 显示原始内容预览
function showOriginalPreview(arrayBuffer, encoding) {
    try {
        // 使用指定编码解码
        const decoder = new TextDecoder(encoding);
        originalText = decoder.decode(arrayBuffer);
        
        // 显示前500个字符的预览
        const preview = originalText.substring(0, 500);
        originalPreview.textContent = preview;
        
        // 显示文件信息
        const fileSize = formatFileSize(currentFile.size);
        const charCount = originalText.length;
        originalInfo.textContent = `文件大小: ${fileSize} | 字符数: ${charCount} | 编码: ${encoding}`;
        
        // 显示预览区域
        previewSection.style.display = 'block';
        
    } catch (error) {
        showMessage('编码预览失败: ' + error.message, 'error');
    }
}

// 处理编码选择变化
function handleEncodingChange() {
    if (!originalArrayBuffer) return;
    
    const selectedEncoding = sourceEncoding.value;
    
    try {
        // 使用新选择的编码重新预览
        const decoder = new TextDecoder(selectedEncoding);
        const decodedText = decoder.decode(originalArrayBuffer);
        
        // 显示前500个字符的预览
        const preview = decodedText.substring(0, 500);
        originalPreview.textContent = preview;
        
        // 更新文件信息
        const fileSize = formatFileSize(currentFile.size);
        const charCount = decodedText.length;
        originalInfo.textContent = `文件大小: ${fileSize} | 字符数: ${charCount} | 编码: ${selectedEncoding}`;
        
        // 更新原始文本
        originalText = decodedText;
        
    } catch (error) {
        showMessage('编码预览失败: ' + error.message, 'error');
    }
}

// 处理转换
function handleConvert() {
    if (!currentFile || !originalArrayBuffer) {
        showMessage('请先选择文件', 'error');
        return;
    }
    
    const selectedEncoding = sourceEncoding.value;
    
    try {
        // 使用选择的编码重新解码原始内容
        const decoder = new TextDecoder(selectedEncoding);
        const decodedText = decoder.decode(originalArrayBuffer);
        
        // 转换为UTF-8
        const encoder = new TextEncoder();
        const utf8Bytes = encoder.encode(decodedText);
        convertedText = new TextDecoder('utf-8').decode(utf8Bytes);
        
        // 显示转换后的预览
        const preview = convertedText.substring(0, 500);
        convertedPreview.textContent = preview;
        
        // 显示转换后的文件信息
        const charCount = convertedText.length;
        convertedInfo.textContent = `字符数: ${charCount} | 编码: UTF-8`;
        
        // 显示下载按钮
        downloadBtn.style.display = 'inline-block';
        
        showMessage('编码转换成功！', 'success');
        
    } catch (error) {
        showMessage('编码转换失败: ' + error.message, 'error');
    }
}

// 处理下载
function handleDownload() {
    if (!convertedText) {
        showMessage('没有可下载的内容', 'error');
        return;
    }
    
    try {
        // 创建Blob对象
        const blob = new Blob([convertedText], { type: 'text/plain;charset=utf-8' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile.name.replace('.txt', '_utf8.txt');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 释放URL对象
        URL.revokeObjectURL(url);
        
        showMessage('文件下载成功！', 'success');
        
    } catch (error) {
        showMessage('文件下载失败: ' + error.message, 'error');
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    // 移除之前的消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建新消息
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    
    // 插入到主内容区域的顶部
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageDiv, mainContent.firstChild);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 编码检测函数（更准确的检测）
function detectEncoding(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    
    // 检查BOM
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        return 'utf-8';
    }
    
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
        return 'utf-16le';
    }
    
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
        return 'utf-16be';
    }
    
    // 尝试不同的编码来检测
    const encodings = ['utf-8', 'gbk', 'gb2312', 'big5', 'shift_jis', 'euc-jp', 'euc-kr', 'iso-8859-1', 'windows-1252'];
    
    for (let encoding of encodings) {
        try {
            const decoder = new TextDecoder(encoding);
            const decoded = decoder.decode(arrayBuffer);
            
            // 检查解码结果是否包含乱码字符
            if (decoded && !decoded.includes('') && !decoded.includes('')) {
                // 对于GBK等编码，检查是否包含有效的中文字符
                if (encoding === 'gbk' || encoding === 'gb2312') {
                    // 检查是否包含中文字符范围
                    const hasChinese = /[\u4e00-\u9fa5]/.test(decoded);
                    if (hasChinese) {
                        return encoding;
                    }
                } else if (encoding === 'utf-8') {
                    // UTF-8检查
                    const isValidUtf8 = isValidUTF8(bytes);
                    if (isValidUtf8) {
                        return encoding;
                    }
                } else {
                    return encoding;
                }
            }
        } catch (err) {
            continue;
        }
    }
    
    // 默认返回UTF-8
    return 'utf-8';
}

// 检查是否为有效的UTF-8
function isValidUTF8(bytes) {
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        
        if (byte < 0x80) {
            // 单字节字符
            continue;
        } else if (byte >= 0xC2 && byte <= 0xDF) {
            // 双字节字符
            if (i + 1 >= bytes.length) return false;
            const nextByte = bytes[i + 1];
            if (nextByte < 0x80 || nextByte > 0xBF) return false;
            i++;
        } else if (byte >= 0xE0 && byte <= 0xEF) {
            // 三字节字符
            if (i + 2 >= bytes.length) return false;
            const nextByte1 = bytes[i + 1];
            const nextByte2 = bytes[i + 2];
            if (nextByte1 < 0x80 || nextByte1 > 0xBF || nextByte2 < 0x80 || nextByte2 > 0xBF) return false;
            i += 2;
        } else if (byte >= 0xF0 && byte <= 0xF4) {
            // 四字节字符
            if (i + 3 >= bytes.length) return false;
            const nextByte1 = bytes[i + 1];
            const nextByte2 = bytes[i + 2];
            const nextByte3 = bytes[i + 3];
            if (nextByte1 < 0x80 || nextByte1 > 0xBF || nextByte2 < 0x80 || nextByte2 > 0xBF || nextByte3 < 0x80 || nextByte3 > 0xBF) return false;
            i += 3;
        } else {
            return false;
        }
    }
    return true;
} 