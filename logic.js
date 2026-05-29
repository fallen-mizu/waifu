const randomWaifus = ["Arisu Sakayanagi", "Kamisato Ayaka", "Hu Tao", "Raiden Shogun", "Makima", "Kafka Honkai", "Yae Miko", "Kafuu Chino", "Ganyu Genshin", "Rem Re Zero", "Asuka Langley", "Zero Two", "Kurumi Tokisaki", "Chizuru Mizuhara", "Yor Forger"];

// Selectors
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const randomBtn = document.getElementById('random-btn');
const downloadBtn = document.getElementById('download-btn');
const placeholderView = document.getElementById('placeholder-view');
const loadingView = document.getElementById('loading-view');
const resultImage = document.getElementById('result-image');
const galleryTitle = document.getElementById('gallery-title');

const chatWindow = document.getElementById('chat-window');
const toggleChatBtn = document.getElementById('toggle-chat-btn');
const toggleIcon = document.getElementById('toggle-icon');
const closeChatBtn = document.getElementById('close-chat-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const chatArea = document.getElementById('chat-area');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');

// Modal Elements
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalIcon = document.getElementById('modal-icon');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');

let chatMemory = JSON.parse(localStorage.getItem('mizu_ai_memory')) || [];
let isTyping = false;

function getUserTime() {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Set initial time on welcome message
const systemTimeEl = document.querySelector('.system-time');
if (systemTimeEl) systemTimeEl.innerText = getUserTime();

// ================= INTERNAL CUSTOM MODAL ENGINE =================
function showCustomModal({ title, text, icon, showCancel = true, onConfirm }) {
    modalTitle.innerText = title || "System Action";
    modalText.innerText = text || "";
    modalIcon.className = icon || "fa-solid fa-triangle-exclamation";
    
    if (showCancel) {
        modalCancelBtn.classList.remove('hidden');
    } else {
        modalCancelBtn.classList.add('hidden');
    }

    customModal.classList.remove('hidden');

    // Reset Event Listeners dengan kloning elemen agar tidak terjadi stacking trigger
    const newConfirm = modalConfirmBtn.cloneNode(true);
    modalConfirmBtn.parentNode.replaceChild(newConfirm, modalConfirmBtn);
    
    newConfirm.addEventListener('click', () => {
        customModal.classList.add('hidden');
        if (onConfirm) onConfirm();
    });

    modalCancelBtn.onclick = () => {
        customModal.classList.add('hidden');
    };
}

// ================= IMAGE SEARCH & REDIRECT LOGIC =================
async function loadWaifu(query) {
    placeholderView.classList.add('hidden');
    resultImage.classList.add('hidden');
    loadingView.classList.remove('hidden');
    downloadBtn.disabled = true;
    galleryTitle.innerText = `FETCHING: ${query.toUpperCase()}`;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'search', query: query + " anime icons highres" })
        });
        const resData = await response.json();

        if (resData.status && resData.data && resData.data.length > 0) {
            const randomImgUrl = resData.data[Math.floor(Math.random() * resData.data.length)];
            resultImage.src = randomImgUrl;
            resultImage.onload = () => {
                loadingView.classList.add('hidden');
                resultImage.classList.remove('hidden');
                downloadBtn.disabled = false;
                galleryTitle.innerText = `READY: ${query.toUpperCase()}`;
            };
        } else { throw new Error(); }
    } catch (err) {
        loadingView.classList.add('hidden');
        placeholderView.classList.remove('hidden');
        galleryTitle.innerText = "NODE_DATABASE_ERROR";
    }
}

if (searchBtn) searchBtn.addEventListener('click', () => { const val = searchInput.value.trim(); if(val) loadWaifu(val); });
if (searchInput) searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') { const val = searchInput.value.trim(); if(val) loadWaifu(val); } });
if (randomBtn) randomBtn.addEventListener('click', () => { const rc = randomWaifus[Math.floor(Math.random() * randomWaifus.length)]; searchInput.value = rc; loadWaifu(rc); });

// Trigger modal konfirmasi download yang terisolasi
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!resultImage.src) return;

        showCustomModal({
            title: "Download Stream",
            text: "Ingin mengunduh aset visual waifu terpilih langsung ke penyimpanan perangkat lokal kamu? Silakan klik Konfirmasi dan kamu akan diarahkan ke Original Image dan tahan image lalu klik download Image.",
            icon: "fa-solid fa-cloud-arrow-down text-emerald-500",
            showCancel: true,
            onConfirm: () => {
                const downloadLink = document.createElement('a');
                downloadLink.href = resultImage.src;
                downloadLink.download = `waifu_${Date.now()}.jpg`;
                downloadLink.target = '_blank'; 
                downloadLink.rel = 'noopener noreferrer';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        });
    });
}

// ================= AI CHAT (STREAM TYPING EFFECT) LOGIC =================
if(chatMemory.length > 0) {
    chatMemory.forEach(msg => {
        appendMessageToUI(msg.role === 'user' ? 'user' : 'ai', msg.content, msg.time || getUserTime());
    });
}

if (toggleChatBtn) toggleChatBtn.addEventListener('click', toggleChatBox);
if (closeChatBtn) closeChatBtn.addEventListener('click', toggleChatBox);

function toggleChatBox() {
    if(chatWindow.classList.contains('hidden')) {
        chatWindow.classList.remove('hidden');
        toggleIcon.className = "fa-solid fa-chevron-down text-lg";
        chatArea.scrollTop = chatArea.scrollHeight;
    } else {
        chatWindow.classList.add('hidden');
        toggleIcon.className = "fa-solid fa-comments text-lg";
    }
}

// Trigger modal konfirmasi reset memory chat
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        if(isTyping) return;
        
        showCustomModal({
            title: "Wipe Assistant Memory",
            text: "Apakah kamu yakin ingin menghapus seluruh riwayat ingatan chat enkripsi dengan Mizu AI?",
            icon: "fa-solid fa-rotate-left text-red-500",
            showCancel: true,
            onConfirm: () => {
                chatMemory = [];
                localStorage.removeItem('mizu_ai_memory');
                chatArea.innerHTML = `
                    <div class="flex flex-col items-start max-w-[85%]">
                        <div class="bg-gray-900 text-gray-300 rounded-2xl rounded-tl-none p-3 border border-gray-800/40">
                            Memori direset. Halo lagi! Ada waifu baru yang mau kita bahas secara singkat? 🌸
                        </div>
                        <span class="text-[9px] text-gray-600 font-mono mt-1">${getUserTime()}</span>
                    </div>
                `;
            }
        });
    });
}

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if(!text || isTyping) return;

    const timeStamp = getUserTime();
    chatInput.value = '';

    appendMessageToUI('user', text, timeStamp);
    chatMemory.push({ role: 'user', content: text, time: timeStamp });
    localStorage.setItem('mizu_ai_memory', JSON.stringify(chatMemory));

    const typingId = appendTypingIndicator();

    try {
        const customSystemInstruction = {
            role: "system",
            content: "PENTING: Jawablah dengan sangat singkat, ringkas, dan langsung ke poin utama (maksimal 2 kalimat pendek). Gaya santai. Jika ditanya mengenai siapa penciptamu, pembuatmu, atau developermu, jawablah dengan tegas bahwa kamu diciptakan oleh Fallen."
        };

        const sanitizedMessages = chatMemory.map(({role, content}) => ({role, content}));
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type: 'chat', 
                messages: [customSystemInstruction, ...sanitizedMessages] 
            })
        });

        const data = await response.json();
        
        const indicator = document.getElementById(typingId);
        if (indicator) indicator.remove();

                if(data.status && data.data) {
            const aiReply = data.data;
            const aiTime = getUserTime();
            
            await appendMessageWithTypingEffect(aiReply, aiTime);
            
            chatMemory.push({ role: 'assistant', content: aiReply, time: aiTime });
            localStorage.setItem('mizu_ai_memory', JSON.stringify(chatMemory));
        } else { throw new Error(); }

    } catch (error) {
        const indicator = document.getElementById(typingId);
        if (indicator) indicator.remove();
        appendMessageToUI('ai', "Maaf, koneksi otak syarafku terputus. Coba kirim pesan lagi ya...", getUserTime());
    }
}

if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);
if (chatInput) chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendChatMessage(); });

function appendMessageToUI(sender, text, time) {
    const wrapper = document.createElement('div');
    wrapper.className = sender === 'user' ? "flex flex-col items-end w-full ml-auto max-w-[85%]" : "flex flex-col items-start max-w-[85%]";
    
    const styleClass = sender === 'user' 
        ? "bg-crimson text-white rounded-2xl rounded-tr-none p-3 shadow-md" 
        : "bg-gray-900 text-gray-200 rounded-2xl rounded-tl-none p-3 border border-gray-800/50";

    wrapper.innerHTML = `
        <div class="${styleClass} break-words whitespace-pre-line">${text}</div>
        <span class="text-[9px] text-gray-600 font-mono mt-1">${time}</span>
    `;
    chatArea.appendChild(wrapper);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function appendMessageWithTypingEffect(fullText, time) {
    return new Promise((resolve) => {
        isTyping = true;
        const wrapper = document.createElement('div');
        wrapper.className = "flex flex-col items-start max-w-[85%]";
        
        wrapper.innerHTML = `
            <div class="chat-bubble-ai bg-gray-900 text-gray-200 rounded-2xl rounded-tl-none p-3 border border-gray-800/50 break-words whitespace-pre-line"></div>
            <span class="text-[9px] text-gray-600 font-mono mt-1">${time}</span>
        `;
        chatArea.appendChild(wrapper);
        
        const bubbleElement = wrapper.querySelector('.chat-bubble-ai');
        let currentIdx = 0;
        
        const typingInterval = setInterval(() => {
            if (currentIdx < fullText.length) {
                bubbleElement.textContent += fullText.charAt(currentIdx);
                currentIdx++;
                chatArea.scrollTop = chatArea.scrollHeight;
            } else {
                clearInterval(typingInterval);
                isTyping = false;
                resolve();
            }
        }, 25);
    });
}

function appendTypingIndicator() {
    const id = 'typing-' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = "flex flex-col items-start max-w-[85%]";
    wrapper.innerHTML = `
        <div class="bg-gray-900 text-gray-500 rounded-2xl rounded-tl-none px-4 py-2.5 border border-gray-800 flex gap-1 items-center">
            <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
            <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
    `;
    chatArea.appendChild(wrapper);
    chatArea.scrollTop = chatArea.scrollHeight;
    return id;
}
