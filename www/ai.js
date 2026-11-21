
const API_KEY_HARDCODE = "";
let GROQ_API_KEY = "";
let GROQ_MODEL = localStorage.getItem("groq_model") || "openai/gpt-oss-120b";

const VISION_MODEL = "qwen/qwen3.8-27b";
const CAMERA_VISION_MODEL = "qwen/qwen3.8-27b";
const WHISPER_MODEL = "whisper-large-v3";
const SELF_CHECK_MODEL = "llama-3.1-8b-instant";

const WHISPER_PROMPT_VI = "Đây là cuộc trò chuyện tiếng Việt hàng ngày. Người nói có thể dùng từ ngữ thông thường, tên riêng, địa danh Việt Nam.";

let CALL_MODEL = localStorage.getItem("call_model") || "openai/gpt-oss-120b";
let CALL_WEB_SEARCH_ENABLED = localStorage.getItem("call_web_search_enabled") !== "false";

let MURF_API_KEY = localStorage.getItem("murf_api_key") || "";
let CALL_TTS_MODEL = localStorage.getItem("call_tts_model") || "";

let TAVILY_API_KEY = localStorage.getItem("tavily_key") || "";
const TAVILY_ENDPOINT = "https://api.tavily.com/search";


const AGNES_API_BASE = "https://apihub.agnes-ai.com/v1";
const AGNES_IMAGE_MODEL = "agnes-image-2.0-flash";
const AGNES_VIDEO_MODEL = "agnes-video-2.5-flash";

let AGNES_API_KEY = localStorage.getItem("agnes_api_key") || "";
let IMAGE_MODE_ENABLED = localStorage.getItem("image_mode_enabled") === "true";
let VIDEO_MODE_ENABLED = localStorage.getItem("video_mode_enabled") === "true";

let IMAGE_DEFAULT_SIZE = localStorage.getItem("image_default_size") || "1024x768";
let VIDEO_DEFAULT_SECONDS = localStorage.getItem("video_default_seconds") || "5";
let VIDEO_DEFAULT_ASPECT = localStorage.getItem("video_default_aspect") || "16:9";

const IMAGE_INTENT_PATTERNS = [
  /tạo\s+(cho\s+(tôi|mình|tớ)\s+)?(\d+\s+)?(bức\s+)?ảnh/i,
  /vẽ\s+(cho\s+(tôi|mình|tớ)\s+)?(một\s+|1\s+)?(bức\s+)?(tranh|ảnh|hình)/i,
  /generate\s+(an?\s+)?image/i,
  /make\s+(an?\s+)?image/i,
  /tạo\s+hình\s+ảnh/i,
  /cho\s+(tôi|mình)\s+(một\s+|1\s+)?(bức\s+)?ảnh/i,
];

const VIDEO_INTENT_PATTERNS = [
  /tạo\s+(cho\s+(tôi|mình|tớ)\s+)?(\d+\s+)?(cái\s+|clip\s+|đoạn\s+)?video/i,
  /làm\s+(cho\s+(tôi|mình|tớ)\s+)?(một\s+|1\s+)?(cái\s+|clip\s+|đoạn\s+)?video/i,
  /generate\s+(a\s+)?video/i,
  /make\s+(a\s+)?video/i,
  /tạo\s+clip/i,
  /cho\s+(tôi|mình)\s+(một\s+|1\s+)?(cái\s+|đoạn\s+)?video/i,
];

function detectImageIntent(text) {
  if (!text || typeof text !== 'string') return false;
  return IMAGE_INTENT_PATTERNS.some(re => re.test(text));
}

function detectVideoIntent(text) {
  if (!text || typeof text !== 'string') return false;
  return VIDEO_INTENT_PATTERNS.some(re => re.test(text));
}

function extractImagePrompt(text) {
  return text
    .replace(/tạo\s+(cho\s+(tôi|mình|tớ)\s+)?(\d+\s+)?(bức\s+)?ảnh\s*(về|với|mô\s+tả|:)?\s*/gi, '')
    .replace(/vẽ\s+(cho\s+(tôi|mình|tớ)\s+)?(một\s+|1\s+)?(bức\s+)?(tranh|ảnh|hình)\s*(về|với|mô\s+tả|:)?\s*/gi, '')
    .replace(/generate\s+(an?\s+)?image\s*(of|about|:)?\s*/gi, '')
    .replace(/make\s+(an?\s+)?image\s*(of|about|:)?\s*/gi, '')
    .replace(/cho\s+(tôi|mình)\s+(một\s+|1\s+)?(bức\s+)?ảnh\s*(về|với|mô\s+tả|:)?\s*/gi, '')
    .trim() || text.trim();
}

function extractVideoPrompt(text) {
  return text
    .replace(/tạo\s+(cho\s+(tôi|mình|tớ)\s+)?(\d+\s+)?(cái\s+|clip\s+|đoạn\s+)?video\s*(về|với|mô\s+tả|:)?\s*/gi, '')
    .replace(/làm\s+(cho\s+(tôi|mình|tớ)\s+)?(một\s+|1\s+)?(cái\s+|clip\s+|đoạn\s+)?video\s*(về|với|mô\s+tả|:)?\s*/gi, '')
    .replace(/generate\s+(a\s+)?video\s*(of|about|:)?\s*/gi, '')
    .replace(/make\s+(a\s+)?video\s*(of|about|:)?\s*/gi, '')
    .replace(/tạo\s+clip\s*(về|với|:)?\s*/gi, '')
    .replace(/cho\s+(tôi|mình)\s+(một\s+|1\s+)?(cái\s+|đoạn\s+)?video\s*(về|với|mô\s+tả|:)?\s*/gi, '')
    .trim() || text.trim();
}

async function agnesGenerateImage(prompt, options = {}) {
  if (!AGNES_API_KEY || AGNES_API_KEY.length < 10) {
    throw new Error('Chưa có Agnes API key. Gõ /apiimg sk-... để nhập.');
  }
  const size = options.size || IMAGE_DEFAULT_SIZE;
  const res = await fetch(`${AGNES_API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AGNES_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AGNES_IMAGE_MODEL,
      prompt: prompt,
      size: size,
      extra_body: { response_format: 'url' }
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || `Agnes Image HTTP ${res.status}`);
  }
  const imgUrl = data?.data?.[0]?.url;
  if (!imgUrl) throw new Error('Agnes không trả về URL ảnh: ' + JSON.stringify(data));
  return { url: imgUrl, prompt, size };
}

async function agnesGenerateVideo(prompt, options = {}, onProgress) {
  if (!AGNES_API_KEY || AGNES_API_KEY.length < 10) {
    throw new Error('Chưa có Agnes API key. Gõ /apiimg sk-... để nhập.');
  }
  const seconds = options.seconds || VIDEO_DEFAULT_SECONDS;
  const aspect = options.aspect || VIDEO_DEFAULT_ASPECT;

  const createRes = await fetch(`${AGNES_API_BASE}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AGNES_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AGNES_VIDEO_MODEL,
      prompt,
      seconds: String(seconds),
      mode: 'text',
      size: '720P',
      aspect_ratio: aspect
    })
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createData?.error?.message || createData?.message || `Agnes Video HTTP ${createRes.status}`);
  }
  const videoId = createData.video_id || createData.id || createData.task_id;
  if (!videoId) throw new Error('Không nhận được video_id: ' + JSON.stringify(createData));

  const maxAttempts = 120;
  const interval = 1500;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, interval));

    const url = `${AGNES_API_BASE}/agnesapi?video_id=${encodeURIComponent(videoId)}&model_name=${AGNES_VIDEO_MODEL}`;
    const pollRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AGNES_API_KEY}` }
    });
    const pollData = await pollRes.json();

    if (!pollRes.ok) {
      if (pollRes.status === 429) {
        if (onProgress) onProgress(Math.min(90, (i / maxAttempts) * 100), 'Đang bị giới hạn, chờ thêm...');
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw new Error(pollData?.error?.message || `Poll HTTP ${pollRes.status}`);
    }

    const status = pollData.status;
    const progress = pollData.progress || 0;

    if (onProgress) onProgress(Math.min(95, progress || (i / maxAttempts) * 100), `Đang render... ${progress || '?'}%`);

    if (status === 'completed') {
      const videoUrl = pollData.url;
      if (!videoUrl) throw new Error('Task xong nhưng không có URL video');
      return { url: videoUrl, prompt, seconds, aspect };
    }
    if (status === 'failed') {
      const errMsg = pollData?.error?.message || pollData?.error || 'Tạo video thất bại';
      throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    }
  }
  throw new Error('Hết thời gian chờ tạo video.');
}


if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const FILE_MAX_TEXT_LENGTH = 30000;

async function ensureLib(name) {
  const libs = {
    pdf: {
      check: () => window.pdfjsLib,
      url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      after: () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    },
    docx: {
      check: () => window.mammoth,
      url: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
    },
    xlsx: {
      check: () => window.XLSX,
      url: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    },
    jspdf: {
      check: () => window.jspdf,
      url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    },
    docxgen: {
      check: () => window.docx,
      url: 'https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.js'
    }
  };
  const cfg = libs[name];
  if (!cfg) return;
  if (cfg.check()) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = cfg.url;
    s.onload = () => { if (cfg.after) cfg.after(); resolve(); };
    s.onerror = () => reject(new Error(`Không tải được thư viện ${name}`));
    document.head.appendChild(s);
  });
}

async function extractPdfText(file) {
  await ensureLib('pdf');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 50);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += `\n--- Trang ${i} ---\n${pageText}\n`;
  }
  if (pdf.numPages > maxPages) {
    fullText += `\n[... còn ${pdf.numPages - maxPages} trang nữa, đã cắt bớt]`;
  }
  return fullText.trim();
}

async function extractDocxText(file) {
  await ensureLib('docx');
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function extractExcelText(file) {
  await ensureLib('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
  let fullText = '';
  const maxSheets = Math.min(workbook.SheetNames.length, 10);
  for (let i = 0; i < maxSheets; i++) {
    const name = workbook.SheetNames[i];
    const sheet = workbook.Sheets[name];
    const csv = window.XLSX.utils.sheet_to_csv(sheet);
    fullText += `\n--- Sheet: ${name} ---\n${csv}\n`;
  }
  return fullText.trim();
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadTextFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  downloadBlob(filename, blob);
}
window.downloadTextFile = downloadTextFile;

function generateFilename(baseName, ext) {
  const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '_');
  const safe = (baseName || 'output').replace(/[^\w\d\u00C0-\u024F-]/g, '_').slice(0, 40);
  return `${safe}_${ts}.${ext}`;
}

async function createPdfBlob(content) {
  await ensureLib('jspdf');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const lines = String(content).split('\n');
  let y = 15;
  const pageH = 280;
  const lineH = 7;
  doc.setFontSize(11);
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line || ' ', 180);
    for (const w of wrapped) {
      if (y + lineH > pageH) { doc.addPage(); y = 15; }
      doc.text(w, 15, y);
      y += lineH;
    }
  }
  return doc.output('blob');
}

async function createDocxBlob(content) {
  await ensureLib('docxgen');
  const { Document, Packer, Paragraph, TextRun } = window.docx;
  const paragraphs = String(content).split('\n').map(line =>
    new Paragraph({ children: [new TextRun(line)] })
  );
  const doc = new Document({ sections: [{ children: paragraphs }] });
  return await Packer.toBlob(doc);
}

async function createXlsxBlob(content) {
  await ensureLib('xlsx');
  const rows = String(content).split('\n').map(row =>
    row.split(',').map(cell => cell.trim())
  );
  const ws = window.XLSX.utils.aoa_to_sheet(rows);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

const FILE_INTENT_PATTERNS = [
  { regex: /tạo\s+(file|tệp)\s+(txt|text|văn bản)/i, type: 'txt' },
  { regex: /tạo\s+(file|tệp)\s+(md|markdown)/i, type: 'md' },
  { regex: /tạo\s+(file|tệp)\s+(json)/i, type: 'json' },
  { regex: /tạo\s+(file|tệp)\s+(csv|bảng)/i, type: 'csv' },
  { regex: /tạo\s+(file|tệp)\s+(html|web)/i, type: 'html' },
  { regex: /tạo\s+(file|tệp)\s+(js|javascript)/i, type: 'js' },
  { regex: /tạo\s+(file|tệp)\s+(py|python)/i, type: 'py' },
  { regex: /tạo\s+(file|tệp)\s+(pdf)/i, type: 'pdf' },
  { regex: /tạo\s+(file|tệp)\s+(word|docx)/i, type: 'docx' },
  { regex: /tạo\s+(file|tệp)\s+(excel|xlsx|xls)/i, type: 'xlsx' },
  { regex: /tạo\s+(file|tệp)\s+(sql)/i, type: 'sql' },
  { regex: /tạo\s+(file|tệp)\s+(xml)/i, type: 'xml' },
  { regex: /tạo\s+(file|tệp)\s+(yml|yaml)/i, type: 'yml' },
  { regex: /xuất\s+(file|tệp)/i, type: 'txt' },
  { regex: /export\s+(file|to)/i, type: 'txt' },
];

function detectFileIntent(text) {
  if (!text || typeof text !== 'string') return null;
  for (const p of FILE_INTENT_PATTERNS) {
    if (p.regex.test(text)) return { wantsFile: true, fileType: p.type };
  }
  return null;
}

function buildFileCreatePrompt(userText, ext) {
  return `${userText}

[YÊU CẦU ĐẶC BIỆT]: Chỉ trả về NỘI DUNG của file ${ext.toUpperCase()}. KHÔNG giải thích, KHÔNG mở đầu kiểu "Đây là...", KHÔNG markdown code fence. Chỉ trả về nội dung thuần để tôi lưu vào file .${ext}`;
}

function extractFileContent(replyText) {
  let content = String(replyText || '').trim();
  const fenceMatch = content.match(/^```[\w]*\n([\s\S]*?)```\s*$/);
  if (fenceMatch) return fenceMatch[1].trim();
  content = content.replace(/^(Đây là|Dưới đây là|Here is|Here's)[^\n]*\n+/i, '');
  return content.trim();
}

async function createAndDownloadFile(ext, content, baseName = 'output') {
  const filename = generateFilename(baseName, ext);
  const mimeMap = {
    txt: 'text/plain', md: 'text/markdown', json: 'application/json',
    csv: 'text/csv', html: 'text/html', js: 'text/javascript',
    py: 'text/x-python', sql: 'text/plain', xml: 'application/xml',
    yml: 'text/yaml', yaml: 'text/yaml'
  };

  try {
    if (ext === 'pdf') {
      const blob = await createPdfBlob(content);
      downloadBlob(filename, blob);
      return { filename, method: 'pdf' };
    }
    if (ext === 'docx' || ext === 'doc') {
      const blob = await createDocxBlob(content);
      downloadBlob(filename, blob);
      return { filename, method: 'docx' };
    }
    if (ext === 'xlsx' || ext === 'xls') {
      const blob = await createXlsxBlob(content);
      downloadBlob(filename, blob);
      return { filename, method: 'xlsx' };
    }
    downloadTextFile(filename, content, mimeMap[ext] || 'text/plain');
    return { filename, method: 'text' };
  } catch (e) {
    console.error('Create file error:', e);
    const fallbackName = generateFilename(baseName, 'txt');
    downloadTextFile(fallbackName, content, 'text/plain');
    return { filename: fallbackName, method: 'fallback-txt', error: e.message };
  }
}

function updateComposerHint() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  if (IMAGE_MODE_ENABLED) {
    input.placeholder = 'Mô tả ảnh bạn muốn tạo...';
  } else if (VIDEO_MODE_ENABLED) {
    input.placeholder = 'Mô tả video bạn muốn tạo...';
  } else {
    input.placeholder = 'Nhập tin nhắn...';
  }
}


let ACTIVE_PROVIDER = localStorage.getItem("active_provider") || "groq";
if (!['groq','gemini','kira','cohere','chatanywhere'].includes(ACTIVE_PROVIDER)) {
  ACTIVE_PROVIDER = 'groq';
  localStorage.setItem('active_provider', 'groq');
}

const PROVIDER_CHAIN = ['groq', 'gemini', 'kira', 'cohere', 'chatanywhere'];
const PROVIDER_LABELS = {
  groq: '💬 Groq',
  gemini: '✨ Gemini',
  kira: '🐰 Kira',
  cohere: '🧠 Cohere',
  chatanywhere: '🌐 ChatAnywhere'
};


let GEMINI_API_KEY = localStorage.getItem("gemini_key") || "";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
let GEMINI_MODEL = localStorage.getItem("gemini_model") || "";
let GEMINI_MODELS_CACHE = null;

let KIRA_API_KEY = localStorage.getItem("kira_api_key") || "";
const KIRA_BASE_URL = "https://kiraai.vn/api/v1";
const KIRA_FREE_MODELS = [
  'space-bunny-alpha',
  'laguna-s2.1-free',
  'laguna-xs-2.1-free',
  'kira-mini-1.0'
];
let KIRA_MODEL = localStorage.getItem("kira_model") || KIRA_FREE_MODELS[0];
let KIRA_MODELS_WORKING = JSON.parse(localStorage.getItem('kira_working_models') || '[]');

let COHERE_API_KEY = localStorage.getItem("cohere_api_key") || "";
const COHERE_BASE_URL = "https://api.cohere.com/v2";
let COHERE_MODEL = localStorage.getItem("cohere_model") || "";
let COHERE_MODELS_CACHE = null;

let CHATANYWHERE_API_KEY = localStorage.getItem("chatanywhere_key") || "";
const CHATANYWHERE_BASE_URL = "https://api.chatanywhere.tech/v1";
let CHATANYWHERE_MODEL = localStorage.getItem("chatanywhere_model") || "";
let CHATANYWHERE_MODELS_CACHE = null;

const CHATANYWHERE_FIXED_MODELS = [
  { id: "gpt-5.2",       owned_by: "chatanywhere", type: "chat" },
  { id: "gpt-5.1",       owned_by: "chatanywhere", type: "chat" },
  { id: "gpt-4o",        owned_by: "chatanywhere", type: "chat" },
  { id: "gpt-4o-mini",   owned_by: "chatanywhere", type: "chat" },
  { id: "gpt-3.5-turbo", owned_by: "chatanywhere", type: "chat" },
  { id: "deepseek-chat", owned_by: "chatanywhere", type: "chat" },
];

const CHATANYWHERE_DEFAULT_MODEL = "gpt-5.2";

function fetchChatAnywhereModels() {
  CHATANYWHERE_MODELS_CACHE = CHATANYWHERE_FIXED_MODELS;
  if (!CHATANYWHERE_MODEL || !CHATANYWHERE_FIXED_MODELS.some(m => m.id === CHATANYWHERE_MODEL)) {
    CHATANYWHERE_MODEL = CHATANYWHERE_DEFAULT_MODEL;
    localStorage.setItem('chatanywhere_model', CHATANYWHERE_MODEL);
  }
  return CHATANYWHERE_FIXED_MODELS;
}


let webSearchEnabled = false;
let attachedFile = null;
let fileContent = null;
let attachedImageDataUrl = null;

let chats = JSON.parse(localStorage.getItem("ai_chats")) || [];
let currentChatId = localStorage.getItem("ai_current_chat") || null;
let isSending = false;
let currentTab = 'ai';

let GROQ_MODELS_CACHE = null;
let MODEL_PICKER_FILTER = 'all';
let CHAT_THEME = localStorage.getItem('chat_theme') || 'chat1';

let callActive = false;
let callIsListening = false;
let callIsSpeaking = false;
let callIsProcessing = false;
let callIsMuted = false;
let callIsTTSEnabled = true;
let callStartTime = 0;
let callTimerInterval = null;
let callTTSAudio = null;
let callTTSAudioContext = null;
let callTTSGainNode = null;
let callTTSMediaSource = null;
let callIsTTSPlaying = false;
let callChatHistory = [];

let callWhisperRecording = false;
let callWhisperRecorder = null;
let callWhisperChunks = [];

let _currentSpeakerBtn = null;

let MURF_VOICES_CACHE = null;
const MURF_WORKING_VOICES = JSON.parse(localStorage.getItem('murf_working_voices') || '[]');

const GROQ_FREE_TIER_MODELS = new Set([
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-safeguard-20b",
  "groq/compound",
  "groq/compound-mini",
  "qwen/qwen3.8-27b",
  "qwen/qwen3-32b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "allam-2-7b",
  "deepseek-r1-distill-llama-70b",
  "gemma2-9b-it",
  "llama-guard-4-12b",
  "whisper-large-v3",
  "whisper-large-v3-turbo",
  "playai-tts",
  "playai-tts-arabic",
  "moonshotai/kimi-k2-instruct"
]);

const MURF_FALLBACK_VOICES = [
  { id: "vi-VN-Natalie", name: "Natalie (VI)", gender: "female", locale: "vi-VN", language: "vi", flag: "🇻🇳" },
  { id: "vi-VN-Ken", name: "Ken (VI)", gender: "male", locale: "vi-VN", language: "vi", flag: "🇻🇳" },
  { id: "en-US-Natalie", name: "Natalie (US)", gender: "female", locale: "en-US", language: "en", flag: "🇺🇸" },
  { id: "en-US-Aria", name: "Aria (US)", gender: "female", locale: "en-US", language: "en", flag: "🇺🇸" },
  { id: "en-US-Andrew", name: "Andrew (US)", gender: "male", locale: "en-US", language: "en", flag: "🇺🇸" },
  { id: "en-UK-Ruby", name: "Ruby (UK)", gender: "female", locale: "en-GB", language: "en", flag: "🇬🇧" },
];

const MURF_FALLBACK_VI = ['vi-VN-Natalie', 'vi-VN-Ken'];
const MURF_FALLBACK_EN = ['en-US-Natalie', 'en-US-Aria', 'en-US-Andrew', 'en-UK-Ruby'];


function repairMojibake(text) {
  if (!text || typeof text !== 'string') return text;
  const markerPattern = /(?:Ã.|Â.|áº|á»|Ä.|Å.|Æ.|â.|ðŸ|\uFFFD)/g;
  const score = v => (v.match(markerPattern) || []).length;
  const decodeUtf8 = value => {
    if (!value || /[\u0100-\uFFFF]/.test(value)) return value;
    try { return decodeURIComponent(escape(value)) || value; }
    catch (_) {
      try {
        const bytes = new Uint8Array(value.length);
        for (let i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i) & 0xFF;
        return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      } catch (_) { return value; }
    }
  };
  let current = text;
  for (let pass = 0; pass < 8; pass++) {
    const beforeScore = score(current);
    if (beforeScore === 0) break;
    let candidate = current;
    if (!/[\u0100-\uFFFF]/.test(current)) {
      const decoded = decodeUtf8(current);
      if (score(decoded) < score(candidate)) candidate = decoded;
    } else {
      const parts = current.split(/([\u0000-\u00FF]+)/);
      let repaired = '';
      for (const part of parts) {
        if (!part) continue;
        if (/[\u0100-\uFFFF]/.test(part)) { repaired += part; continue; }
        const decoded = decodeUtf8(part);
        repaired += score(decoded) < score(part) ? decoded : part;
      }
      if (score(repaired) < score(candidate)) candidate = repaired;
    }
    if (score(candidate) >= beforeScore) break;
    current = candidate;
  }
  return current;
}

function repairHtmlCode(code) {
  if (!code || typeof code !== 'string') return code;
  let repaired = repairMojibake(code);
  for (let i = 0; i < 3; i++) {
    const next = repairMojibake(repaired);
    if (next === repaired) break;
    repaired = next;
  }
  return repaired;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function decodeBase64Utf8(base64) {
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) { return ""; }
}
window.decodeBase64Utf8 = decodeBase64Utf8;

function showToast(title, message, type = 'info', duration = 3000) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'success' ? 'ok' : type === 'error' ? 'err' : '');
  toast.innerHTML = `<strong>${icons[type] || 'ℹ️'} ${escapeHtml(title)}</strong><div style="color:var(--text-3);margin-top:4px;">${escapeHtml(message)}</div>`;
  stack.appendChild(toast);
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 250); }, duration);
}

function confirmModal(title, msg) {
  return new Promise(resolve => {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMsg').textContent = msg;
    overlay.classList.add('open');
    const okBtn = document.getElementById('modalOk');
    const cancelBtn = document.getElementById('modalCancel');
    const cleanup = () => {
      overlay.classList.remove('open');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}


const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

function _ensureSharedAudio() {
  if (!callTTSAudio) {
    callTTSAudio = document.createElement('audio');
    callTTSAudio.preload = 'auto';
    callTTSAudio.playsInline = true;
    callTTSAudio.style.display = 'none';
    document.body.appendChild(callTTSAudio);
  }
  return callTTSAudio;
}

function _unlockAudioContextSync() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!callTTSAudioContext) callTTSAudioContext = new Ctx();
    if (callTTSAudioContext.state === 'suspended') {
      callTTSAudioContext.resume().catch(() => {});
    }
  } catch (e) { console.warn('unlock ctx:', e); }
}

function unlockAudioSync() {
  _unlockAudioContextSync();
  const audio = _ensureSharedAudio();
  try {
    audio.src = SILENT_WAV;
    audio.volume = 0.001;
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
window.unlockAudioSync = unlockAudioSync;

function setupGainOnce(audio) {
  if (!audio || audio.__gainSetup) return;
  audio.__gainSetup = true;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!callTTSAudioContext) callTTSAudioContext = new Ctx();
    if (!callTTSMediaSource) {
      callTTSMediaSource = callTTSAudioContext.createMediaElementSource(audio);
      callTTSGainNode = callTTSAudioContext.createGain();
      callTTSGainNode.gain.value = 2.5;
      callTTSMediaSource.connect(callTTSGainNode);
      callTTSGainNode.connect(callTTSAudioContext.destination);
    }
  } catch (e) { console.warn('gain setup:', e); }
}


function isProviderReady(provider) {
  switch (provider) {
    case 'groq': return !!(GROQ_API_KEY && GROQ_API_KEY.length > 10);
    case 'gemini': return !!(GEMINI_API_KEY && GEMINI_API_KEY.length > 10);
    case 'kira': return !!(KIRA_API_KEY && KIRA_API_KEY.length > 10);
    case 'cohere': return !!(COHERE_API_KEY && COHERE_API_KEY.length > 10);
    case 'chatanywhere': return !!(CHATANYWHERE_API_KEY && CHATANYWHERE_API_KEY.length > 10);
    default: return false;
  }
}

function getNextProvider(currentProvider, triedProviders = []) {
  const startIdx = PROVIDER_CHAIN.indexOf(currentProvider);
  for (let i = 1; i <= PROVIDER_CHAIN.length; i++) {
    const idx = (startIdx + i) % PROVIDER_CHAIN.length;
    const p = PROVIDER_CHAIN[idx];
    if (p !== currentProvider && !triedProviders.includes(p) && isProviderReady(p)) {
      return p;
    }
  }
  return null;
}

function isQuotaError(status, errorText) {
  if (status === 429) return true;
  if (status === 402) return true;
  if (status === 403 && /quota|limit|exceed/i.test(errorText || '')) return true;
  const text = (errorText || '').toLowerCase();
  if (/does not support|not support|invalid.*(image|content|type|format)/i.test(text)) return false;
  if (/unsupported.*(image|content|modality)/i.test(text)) return false;
  if (/vision.*not|image.*not/i.test(text)) return false;
  if (/invalid_request_error/i.test(text) && !/quota|limit/i.test(text)) return false;
  if (/rate.?limit|too many requests/i.test(text)) return true;
  if (/quota.*exceed|exceed.*quota/i.test(text)) return true;
  if (/out of.*(token|credit|budget)/i.test(text)) return true;
  if (/daily.*limit|monthly.*limit/i.test(text)) return true;
  return false;
}

function isModelUnsupportedError(status, errorText) {
  const text = (errorText || '').toLowerCase();
  if (/does not support|not support/i.test(text)) return true;
  if (/unsupported.*(image|content|modality|type)/i.test(text)) return true;
  if (/vision.*not.*(support|avail)/i.test(text)) return true;
  if (/invalid.*(image|content).*(type|format|url)/i.test(text)) return true;
  if (status === 400 && /model|vision|image/i.test(text)) return true;
  return false;
}



const firebaseConfig = {
  apiKey: "AIzaSyAG_VBj17H7OFd_fUgqzsrBhNm9nHgk8lI",
  authDomain: "api-ai-editor.firebaseapp.com",
  databaseURL: "https://api-ai-editor-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "api-ai-editor",
  storageBucket: "api-ai-editor.firebasestorage.app",
  messagingSenderId: "92583827628",
  appId: "1:92583827628:web:b574d8ad90c564f00d2709"
};

window.firebaseApiReady = (async () => {
  const loadScript = src => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.firebase) resolve();
      else {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src; script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Không tải được Firebase SDK"));
    document.head.appendChild(script);
  });
  const appUrl = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js";
  const dbUrl = "https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js";
  if (!window.firebase || !window.firebase.initializeApp) await loadScript(appUrl);
  if (!window.firebase.database) await loadScript(dbUrl);
  const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(firebaseConfig);
  const database = window.firebase.database(app);
  const apiRef = database.ref("apiKeys");

  window.firebaseApiStore = {
    async savePartial(updates = {}) {
      const snapshot = await apiRef.once("value");
      const current = snapshot.exists() ? snapshot.val() : {};
      const merged = {
        ai: updates.ai !== undefined ? updates.ai : (current.ai || ""),
        tts: updates.tts !== undefined ? updates.tts : (current.tts || ""),
        gemini: updates.gemini !== undefined ? updates.gemini : (current.gemini || ""),
        kira: updates.kira !== undefined ? updates.kira : (current.kira || ""),
        cohere: updates.cohere !== undefined ? updates.cohere : (current.cohere || ""),
        chatanywhere: updates.chatanywhere !== undefined ? updates.chatanywhere : (current.chatanywhere || ""),
        agnes: updates.agnes !== undefined ? updates.agnes : (current.agnes || ""),
        tavily: updates.tavily !== undefined ? updates.tavily : (current.tavily || ""),
        activeProvider: updates.activeProvider !== undefined ? updates.activeProvider : (current.activeProvider || "groq"),
        updatedAt: Date.now()
      };
      await apiRef.set(merged);
    },
    async load() {
      const snapshot = await apiRef.once("value");
      return snapshot.exists() ? snapshot.val() : {};
    }
  };
  return window.firebaseApiStore;
})().catch(error => {
  console.error("Firebase init error:", error);
  window.firebaseApiStore = null;
  throw error;
});


async function loadTavilyKey() {
  if (TAVILY_API_KEY && TAVILY_API_KEY.length > 10) return TAVILY_API_KEY;
  try {
    const res = await fetch('tavily.txt?' + Date.now());
    if (res.ok) {
      const key = (await res.text()).trim();
      if (key && key.length > 10) {
        TAVILY_API_KEY = key;
        localStorage.setItem('tavily_key', key);
        return key;
      }
    }
  } catch (e) { console.warn('Không load tavily.txt:', e); }
  return null;
}

async function loadMurfKey() {
  if (MURF_API_KEY && MURF_API_KEY.length > 10) return MURF_API_KEY;
  const savedKey = localStorage.getItem('murf_api_key');
  if (savedKey && savedKey.length > 10) {
    MURF_API_KEY = savedKey;
    return MURF_API_KEY;
  }
  try {
    const res = await fetch('apitts.txt?' + Date.now());
    if (res.ok) {
      const key = (await res.text()).trim();
      if (key && key.length > 10 && !key.includes('\n')) {
        MURF_API_KEY = key;
        localStorage.setItem('murf_api_key', key);
        return MURF_API_KEY;
      }
    }
  } catch (e) { console.warn('Không load apitts.txt:', e); }
  return null;
}

async function loadFirebaseApiKeys() {
  try {
    if (window.firebaseApiReady) await window.firebaseApiReady;
    if (!window.firebaseApiStore) return false;
    const data = await window.firebaseApiStore.load();
    let loaded = false;

    if (data.ai && data.ai.length > 10) {
      GROQ_API_KEY = data.ai;
      localStorage.setItem('groq_key', data.ai);
      loaded = true;
    }
    if (data.tts && data.tts.length > 10) {
      MURF_API_KEY = data.tts;
      localStorage.setItem('murf_api_key', data.tts);
      loaded = true;
    }
    if (data.gemini && data.gemini.length > 10) {
      GEMINI_API_KEY = data.gemini;
      localStorage.setItem('gemini_key', data.gemini);
      loaded = true;
    }
    if (data.kira && data.kira.length > 10) {
      KIRA_API_KEY = data.kira;
      localStorage.setItem('kira_api_key', data.kira);
      loaded = true;
    }
    if (data.cohere && data.cohere.length > 10) {
      COHERE_API_KEY = data.cohere;
      localStorage.setItem('cohere_api_key', data.cohere);
      loaded = true;
    }
    if (data.chatanywhere && data.chatanywhere.length > 10) {
      CHATANYWHERE_API_KEY = data.chatanywhere;
      localStorage.setItem('chatanywhere_key', data.chatanywhere);
      loaded = true;
    }
    if (data.agnes && data.agnes.length > 10) {
      AGNES_API_KEY = data.agnes;
      localStorage.setItem('agnes_api_key', data.agnes);
      loaded = true;
    }
    if (data.tavily && data.tavily.length > 10) {
      TAVILY_API_KEY = data.tavily;
      localStorage.setItem('tavily_key', data.tavily);
      loaded = true;
    }
    if (data.activeProvider && PROVIDER_CHAIN.includes(data.activeProvider)) {
      ACTIVE_PROVIDER = data.activeProvider;
      localStorage.setItem('active_provider', data.activeProvider);
    }
    return loaded;
  } catch (e) {
    console.warn('Load Firebase keys error:', e);
    return false;
  }
}


function getFlagForLocale(locale) {
  if (!locale) return '🌐';
  const lang = locale.split('-')[0].toLowerCase();
  const flags = {
    'vi': '🇻🇳', 'en': '🇺🇸', 'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷',
    'fr': '🇫🇷', 'de': '🇩🇪', 'es': '🇪🇸', 'it': '🇮🇹', 'pt': '🇵🇹',
    'ru': '🇷🇺', 'ar': '🇸🇦', 'hi': '🇮🇳', 'th': '🇹🇭', 'id': '🇮🇩',
    'ms': '🇲🇾', 'nl': '🇳🇱', 'pl': '🇵🇱', 'tr': '🇹🇷', 'sv': '🇸🇪'
  };
  return flags[lang] || '🌐';
}

async function fetchMurfVoices(force = false) {
  if (MURF_VOICES_CACHE && !force) return MURF_VOICES_CACHE;
  if (!MURF_API_KEY || MURF_API_KEY.length < 10) {
    MURF_VOICES_CACHE = MURF_FALLBACK_VOICES;
    return MURF_VOICES_CACHE;
  }
  try {
    const res = await fetch('https://api.murf.ai/v1/speech/voices', {
      headers: { 'api-key': MURF_API_KEY, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const allVoices = (data.voices || data || []);
    const voices = allVoices.map(v => {
      const voiceId = v.voiceId || v.id || v.voice_id;
      const name = v.displayName || v.name || voiceId;
      const locale = v.locale || 'vi-VN';
      const language = (v.language || locale.split('-')[0] || 'vi').toLowerCase();
      const gender = (v.gender || '').toLowerCase() === 'male' ? 'male' : 'female';
      return {
        id: voiceId, name, gender, locale, language,
        flag: getFlagForLocale(locale),
        tested: MURF_WORKING_VOICES.includes(voiceId)
      };
    }).filter(v => v.id);
    voices.sort((a, b) => {
      if (a.tested && !b.tested) return -1;
      if (!a.tested && b.tested) return 1;
      if (a.language === 'vi' && b.language !== 'vi') return -1;
      if (a.language !== 'vi' && b.language === 'vi') return 1;
      return a.name.localeCompare(b.name);
    });
    MURF_VOICES_CACHE = voices.length ? voices : MURF_FALLBACK_VOICES;
    localStorage.setItem('murf_voices_cache', JSON.stringify(MURF_VOICES_CACHE));
    return MURF_VOICES_CACHE;
  } catch (e) {
    console.warn('Không fetch được Murf voices:', e);
    try {
      const cached = JSON.parse(localStorage.getItem('murf_voices_cache') || 'null');
      if (cached && cached.length) {
        MURF_VOICES_CACHE = cached;
        return cached;
      }
    } catch (_) {}
    MURF_VOICES_CACHE = MURF_FALLBACK_VOICES;
    return MURF_VOICES_CACHE;
  }
}

function ensureDefaultVoice() {
  if (CALL_TTS_MODEL && CALL_TTS_MODEL.length > 0) return;
  CALL_TTS_MODEL = 'vi-VN-Natalie';
  localStorage.setItem('call_tts_model', CALL_TTS_MODEL);
}

function markVoiceWorking(voiceId) {
  if (!MURF_WORKING_VOICES.includes(voiceId)) {
    MURF_WORKING_VOICES.push(voiceId);
    localStorage.setItem('murf_working_voices', JSON.stringify(MURF_WORKING_VOICES));
  }
}
function markVoiceFailed(voiceId) {
  const idx = MURF_WORKING_VOICES.indexOf(voiceId);
  if (idx !== -1) {
    MURF_WORKING_VOICES.splice(idx, 1);
    localStorage.setItem('murf_working_voices', JSON.stringify(MURF_WORKING_VOICES));
  }
}


async function processAudioForWhisper(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    const highPass = audioCtx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 80;
    highPass.Q.value = 0.7;
    const lowPass = audioCtx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 8000;
    lowPass.Q.value = 0.7;
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    const gain = audioCtx.createGain();
    gain.gain.value = 1.6;
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(highPass);
    highPass.connect(lowPass);
    lowPass.connect(compressor);
    compressor.connect(gain);
    gain.connect(dest);
    source.start(0);
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm';
    const processedRecorder = new MediaRecorder(dest.stream, {
      mimeType,
      audioBitsPerSecond: 128000
    });
    const processedChunks = [];
    processedRecorder.ondataavailable = (e) => { if (e.data.size > 0) processedChunks.push(e.data); };
    return new Promise((resolve) => {
      processedRecorder.onstop = () => {
        try { audioCtx.close(); } catch (e) {}
        resolve(new Blob(processedChunks, { type: 'audio/webm' }));
      };
      processedRecorder.start();
      setTimeout(() => {
        try { source.stop(); } catch (e) {}
        try { processedRecorder.stop(); } catch (e) {}
      }, audioBuffer.duration * 1000 + 100);
    });
  } catch (e) {
    console.warn('Process audio error:', e);
    return blob;
  }
}

let _whisperStop = null;

async function whisperTranscribe(opts = {}) {
  const lang = opts.lang || 'vi';
  const model = opts.model || WHISPER_MODEL;
  const maxMs = opts.maxMs || 15000;
  const prompt = opts.prompt || WHISPER_PROMPT_VI;

  const apiKey = GROQ_API_KEY || localStorage.getItem('groq_key');
  if (!apiKey || apiKey.length < 10) throw new Error('Chưa có API AI. Gõ /api gsk_... để nhập.');
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Thiết bị không hỗ trợ mic');
  if (!window.MediaRecorder) throw new Error('Trình duyệt không hỗ trợ ghi âm');

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: 48000,
      sampleSize: 16
    }
  });

  let mimeType = '';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
  else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
  else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';

  const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      try { recorder.stop(); } catch (e) {}
    };
    _whisperStop = stop;
    recorder.onstart = () => setTimeout(stop, maxMs);
    recorder.onstop = async () => {
      _whisperStop = null;
      stream.getTracks().forEach(t => t.stop());
      try {
        let blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 800) { resolve(''); return; }
        blob = await processAudioForWhisper(blob);
        const file = new File([blob], 'voice.webm', { type: blob.type });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', model);
        formData.append('language', lang);
        formData.append('response_format', 'json');
        formData.append('temperature', '0');
        formData.append('prompt', prompt);
        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + apiKey },
          body: formData
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Whisper ${res.status}: ${errText}`);
        }
        const data = await res.json();
        resolve((data.text || '').trim());
      } catch (err) { reject(err); }
    };
    recorder.onerror = (e) => {
      _whisperStop = null;
      stream.getTracks().forEach(t => t.stop());
      reject(e);
    };
    recorder.start();
  });
}

function whisperStop() {
  if (typeof _whisperStop === 'function') _whisperStop();
}


function isFreeModel(id) {
  if (!id) return false;
  if (GROQ_FREE_TIER_MODELS.has(id)) return true;
  const l = id.toLowerCase();
  if (l.includes('whisper') || l.includes('playai') || l.endsWith('-tts')) return true;
  return false;
}

function classifyModelId(id) {
  const l = (id || '').toLowerCase();
  if (l.includes('whisper') || l.includes('tts') || l.includes('orpheus') || l.includes('playai')) return 'audio';
  if (l.includes('guard') || l.includes('safeguard')) return 'guard';
  if (l.includes('compound')) return 'compound';
  if (l.includes('deepseek-r1') || l.includes('qwq') || l.includes('reasoning') || l.includes('thinking')) return 'reasoning';
  if (l.includes('vision') || l.includes('qwen3') || l.includes('qwen-3') || l.includes('qwen3.8') ||
      l.includes('llava') || l.includes('pixtral') || l.includes('scout') || l.includes('maverick')) return 'vision';
  return 'chat';
}

function modelEmoji(type) {
  return { chat:'💬', vision:'👁️', audio:'🎤', guard:'🛡️', compound:'⚡', reasoning:'🧠' }[type] || '📦';
}
function modelTypeLabel(type) {
  return { chat:'Chat', vision:'Vision', audio:'Audio', guard:'Guard', compound:'Compound', reasoning:'Reasoning' }[type] || 'Khác';
}

async function fetchGroqModels(apiKey, force = false) {
  if (GROQ_MODELS_CACHE && !force) return GROQ_MODELS_CACHE;
  if (!apiKey || apiKey.length < 10) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': 'Bearer ' + apiKey }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const all = data.data || [];
    const free = all.filter(m => isFreeModel(m.id));
    const priority = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "openai/gpt-oss-safeguard-20b"];
    free.sort((a, b) => {
      const ia = priority.indexOf(a.id);
      const ib = priority.indexOf(b.id);
      const pa = ia === -1 ? 999 : ia;
      const pb = ib === -1 ? 999 : ib;
      if (pa !== pb) return pa - pb;
      return a.id.localeCompare(b.id);
    });
    GROQ_MODELS_CACHE = free;
    return free;
  } catch (e) {
    console.warn('Cannot fetch models:', e);
    return null;
  }
}

async function fetchGeminiModels(force = false) {
  if (GEMINI_MODELS_CACHE && !force) return GEMINI_MODELS_CACHE;
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) return null;
  try {
    const res = await fetch(`${GEMINI_API_BASE}/models`, {
      method: 'GET',
      headers: { 'x-goog-api-key': GEMINI_API_KEY, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const all = data.models || [];
    const chatModels = all
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => {
        const id = (m.name || '').replace('models/', '');
        return { id, displayName: m.displayName || id, description: m.description || '' };
      })
      .filter(m => m.id);
    chatModels.sort((a, b) => {
      const extractVer = (id) => {
        const m = id.match(/gemini-(\d+(?:\.\d+)?)/);
        return m ? parseFloat(m[1]) : 0;
      };
      const va = extractVer(a.id), vb = extractVer(b.id);
      if (va !== vb) return vb - va;
      const score = (id) => {
        if (id.includes('flash-lite')) return 1;
        if (id.includes('flash')) return 2;
        if (id.includes('pro')) return 3;
        return 0;
      };
      return score(b.id) - score(a.id);
    });
    GEMINI_MODELS_CACHE = chatModels;
    if (!GEMINI_MODEL && chatModels.length > 0) {
      GEMINI_MODEL = chatModels[0].id;
      localStorage.setItem('gemini_model', GEMINI_MODEL);
    }
    return chatModels;
  } catch (e) {
    console.warn('Không quét được Gemini models:', e);
    return null;
  }
}

function markKiraWorking(model) {
  if (!KIRA_MODELS_WORKING.includes(model)) {
    KIRA_MODELS_WORKING.push(model);
    localStorage.setItem('kira_working_models', JSON.stringify(KIRA_MODELS_WORKING));
  }
}
function markKiraFailed(model) {
  const idx = KIRA_MODELS_WORKING.indexOf(model);
  if (idx !== -1) {
    KIRA_MODELS_WORKING.splice(idx, 1);
    localStorage.setItem('kira_working_models', JSON.stringify(KIRA_MODELS_WORKING));
  }
}

async function detectKiraModel(onProgress) {
  if (!KIRA_API_KEY || KIRA_API_KEY.length < 10) return null;
  if (KIRA_MODELS_WORKING.length > 0) return KIRA_MODELS_WORKING[0];
  for (const model of KIRA_FREE_MODELS) {
    if (onProgress) onProgress(model);
    try {
      const res = await fetch(`${KIRA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + KIRA_API_KEY
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 10
        })
      });
      if (res.ok) {
        markKiraWorking(model);
        return model;
      }
    } catch (e) {
      console.warn(`Kira model ${model} fail:`, e.message);
      markKiraFailed(model);
    }
  }
  return null;
}

async function fetchCohereModels(force = false) {
  if (COHERE_MODELS_CACHE && !force) return COHERE_MODELS_CACHE;
  if (!COHERE_API_KEY || COHERE_API_KEY.length < 10) return null;
  try {
    const res = await fetch(`${COHERE_BASE_URL}/models`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + COHERE_API_KEY, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const all = data.models || [];
    const chatModels = all
      .filter(m => {
        const endpoints = m.endpoints || [];
        return endpoints.includes('chat') || endpoints.includes('chat-v2');
      })
      .map(m => ({ id: m.name, contextLength: m.context_length || 0, endpoints: m.endpoints || [] }))
      .filter(m => m.id);
    chatModels.sort((a, b) => {
      const score = (id) => {
        if (id === 'command-a-plus-05-2026') return 0;
        if (id.includes('command-a-plus')) return 1;
        if (id.includes('command-a')) return 2;
        if (id.includes('command-r-plus')) return 3;
        if (id.includes('command-r')) return 4;
        if (id.includes('command')) return 5;
        return 9;
      };
      return score(a.id) - score(b.id);
    });
    COHERE_MODELS_CACHE = chatModels;
    if (!COHERE_MODEL && chatModels.length > 0) {
      COHERE_MODEL = 'command-a-plus-05-2026';
      if (!chatModels.some(m => m.id === COHERE_MODEL)) {
        COHERE_MODEL = chatModels[0].id;
      }
      localStorage.setItem('cohere_model', COHERE_MODEL);
    }
    return chatModels;
  } catch (e) {
    console.warn('Không quét được Cohere models:', e);
    return null;
  }
}


async function askGroq(prompt, fileContentArg, attachedImageDataUrlArg = null, _triedModels = []) {
  const apiKey = GROQ_API_KEY || localStorage.getItem("groq_key");
  if (!apiKey || apiKey.length < 10) throw new Error("Groq (no key)");

  const needsVision = !!attachedImageDataUrlArg;
  let model = needsVision ? VISION_MODEL : await pickModelForRequest(apiKey, needsVision);

  if (_triedModels.includes(model)) {
    const models = await fetchGroqModels(apiKey);
    const next = models?.find(m => !_triedModels.includes(m.id));
    if (!next) throw new Error(`Groq: đã thử hết model. Đã thử: ${_triedModels.join(', ')}`);
    model = next.id;
  }

  let userContent;
  if (needsVision) {
    let textPrompt = prompt || 'Phân tích ảnh này giúp tôi.';
    if (fileContentArg) {
      textPrompt = `Nội dung file đính kèm:\n\`\`\`\n${fileContentArg}\n\`\`\`\n\nYêu cầu: ${prompt || 'Phân tích ảnh và file trên.'}`;
    }
    userContent = [
      { type: 'text', text: textPrompt },
      { type: 'image_url', image_url: { url: attachedImageDataUrlArg } }
    ];
  } else {
    let fullPrompt = prompt;
    if (fileContentArg) {
      let safe = fileContentArg;
      if (safe.length > 25000) {
        safe = safe.substring(0, 25000) + `\n\n[... file dài ${fileContentArg.length} ký tự, đã cắt bớt]`;
      }
      fullPrompt = `Nội dung file:\n\`\`\`\n${safe}\n\`\`\`\n\nYêu cầu: ${prompt || "Phân tích và tóm tắt nội dung file trên"}`;
    }
    userContent = fullPrompt;
  }

  const systemMsg = `Bạn là NPN - GPT trợ lý AI của Nguyễn Phi Nhật. Trả lời hữu ích, thân thiện, ngắn gọn.`;

  const chat = getCurrentChat();
  const historyMessages = [];
  if (chat && chat.messages) {
    for (const msg of chat.messages.slice(-20)) {
      if (msg.role === 'ai' && msg.content && msg.content.includes("Xin chào")) continue;
      if (msg.isMedia || msg.fileMeta) continue;
      historyMessages.push({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content });
    }
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemMsg },
        ...historyMessages,
        { role: "user", content: userContent }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const status = response.status;
    const tried = [..._triedModels, model];

    if (isModelUnsupportedError(status, errorText)) {
      if (needsVision) {
        const models = await fetchGroqModels(apiKey);
        const visionModels = models?.filter(m => classifyModelId(m.id) === 'vision' && !tried.includes(m.id));
        if (visionModels && visionModels.length > 0) {
          const next = visionModels[0];
          showToast('Đổi model Vision', `Chuyển sang ${next.id}`, 'warning', 2000);
          GROQ_MODEL = next.id;
          localStorage.setItem('groq_model', next.id);
          updateModelDisplay();
          return askGroq(prompt, fileContentArg, attachedImageDataUrlArg, tried);
        }
        throw new Error(`Groq không có model Vision khả dụng. Thử /api1 (Gemini) để phân tích ảnh.`);
      } else {
        throw new Error(`Groq ${model}: ${errorText.substring(0, 200)}`);
      }
    }

    if (isQuotaError(status, errorText)) {
      const models = await fetchGroqModels(apiKey);
      const next = models?.find(m =>
        !tried.includes(m.id) &&
        (!needsVision || classifyModelId(m.id) === 'vision')
      );
      if (next) {
        showToast('Đổi model Groq', `Chuyển sang ${next.id}`, 'warning', 2000);
        GROQ_MODEL = next.id;
        localStorage.setItem('groq_model', next.id);
        updateModelDisplay();
        return askGroq(prompt, fileContentArg, attachedImageDataUrlArg, tried);
      }
      throw new Error(`Groq hết quota tất cả model. Đã thử: ${tried.join(', ')}`);
    }

    throw new Error(`Groq ${model} lỗi (${status}): ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (!answer) throw new Error(`Groq ${model} không trả về nội dung.`);
  updateModelDisplay();
  return repairMojibake(answer);
}


async function askGemini(prompt, fileContentArg = null, attachedImageDataUrlArg = null) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
    throw new Error("Gemini (no key)");
  }
  if (!GEMINI_MODELS_CACHE || !GEMINI_MODELS_CACHE.length) {
    await fetchGeminiModels();
  }
  const model = GEMINI_MODEL || (GEMINI_MODELS_CACHE?.[0]?.id);
  if (!model) throw new Error("Gemini (no model)");

  const needsVision = !!attachedImageDataUrlArg;
  let parts = [];
  if (needsVision) {
    parts.push({ text: prompt || "Phân tích ảnh này giúp tôi." });
    const base64Data = attachedImageDataUrlArg.split(',')[1];
    const mimeMatch = attachedImageDataUrlArg.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    parts.push({ inlineData: { mimeType, data: base64Data } });
  } else {
    let fullPrompt = prompt;
    if (fileContentArg) {
      fullPrompt = `Nội dung file:\n\`\`\`\n${fileContentArg}\n\`\`\`\n\nYêu cầu: ${prompt || "Phân tích và tóm tắt nội dung file trên"}`;
    }
    parts.push({ text: fullPrompt });
  }

  const chat = getCurrentChat();
  const historyContents = [];
  if (chat && chat.messages) {
    for (const msg of chat.messages.slice(-20)) {
      if (msg.role === 'ai' && msg.content && msg.content.includes("Xin chào")) continue;
      if (msg.isMedia || msg.fileMeta) continue;
      historyContents.push({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }

  const body = {
    contents: [...historyContents, { role: 'user', parts: parts }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
  };

  const response = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (isQuotaError(response.status, errorText)) {
      const models = await fetchGeminiModels();
      if (models && models.length > 1) {
        const next = models.find(m => m.id !== model);
        if (next) {
          showToast('Đổi model Gemini', `Chuyển sang ${next.id}`, 'warning', 3000);
          GEMINI_MODEL = next.id;
          localStorage.setItem('gemini_model', next.id);
          updateModelDisplay();
          return askGemini(prompt, fileContentArg, attachedImageDataUrlArg);
        }
      }
    }
    throw new Error(`Gemini ${model} lỗi (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!answer) throw new Error(`Gemini ${model} không trả về nội dung.`);
  return repairMojibake(answer);
}


async function askKira(prompt, fileContentArg = null, attachedImageDataUrlArg = null) {
  if (!KIRA_API_KEY || KIRA_API_KEY.length < 10) {
    throw new Error("Kira (no key)");
  }

  if (!KIRA_MODELS_WORKING.length) {
    showToast('Đang dò', 'Đang tìm model Kira hoạt động...', 'info', 2000);
    const detected = await detectKiraModel((m) => console.log('Thử Kira:', m));
    if (!detected) throw new Error("Kira (no working model)");
    KIRA_MODEL = detected;
    localStorage.setItem('kira_model', detected);
  }

  const messages = [];
  const chat = getCurrentChat();
  if (chat && chat.messages) {
    for (const msg of chat.messages.slice(-20)) {
      if (msg.role === 'ai' && msg.content && msg.content.includes("Xin chào")) continue;
      if (msg.isMedia || msg.fileMeta) continue;
      messages.push({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content });
    }
  }

  let userText = prompt || "Phân tích nội dung đính kèm";
  if (fileContentArg) {
    userText = `Nội dung file:\n\`\`\`\n${fileContentArg}\n\`\`\`\n\nYêu cầu: ${userText}`;
  }

  if (attachedImageDataUrlArg) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: attachedImageDataUrlArg } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: userText });
  }

  const response = await fetch(`${KIRA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + KIRA_API_KEY
    },
    body: JSON.stringify({
      model: KIRA_MODEL,
      messages,
      max_tokens: 4096,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (isQuotaError(response.status, errorText)) {
      markKiraFailed(KIRA_MODEL);
      const next = KIRA_FREE_MODELS.find(m => !KIRA_MODELS_WORKING.includes(m) && m !== KIRA_MODEL);
      if (next) {
        showToast('Đổi model Kira', `Chuyển sang ${next}`, 'warning', 3000);
        KIRA_MODEL = next;
        localStorage.setItem('kira_model', next);
        return askKira(prompt, fileContentArg, attachedImageDataUrlArg);
      }
    }
    throw new Error(`Kira ${KIRA_MODEL} lỗi (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (!answer) throw new Error(`Kira ${KIRA_MODEL} không trả về nội dung.`);
  markKiraWorking(KIRA_MODEL);
  return repairMojibake(answer);
}


async function askCohere(prompt, fileContentArg = null, attachedImageDataUrlArg = null) {
  if (!COHERE_API_KEY || COHERE_API_KEY.length < 10) {
    throw new Error("Cohere (no key)");
  }
  if (!COHERE_MODELS_CACHE || !COHERE_MODELS_CACHE.length) {
    await fetchCohereModels();
  }
  const model = COHERE_MODEL || (COHERE_MODELS_CACHE?.[0]?.id);
  if (!model) throw new Error("Cohere (no model)");

  const messages = [];
  const chat = getCurrentChat();
  if (chat && chat.messages) {
    for (const msg of chat.messages.slice(-20)) {
      if (msg.role === 'ai' && msg.content && msg.content.includes("Xin chào")) continue;
      if (msg.isMedia || msg.fileMeta) continue;
      messages.push({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content });
    }
  }

  let userText = prompt || "Phân tích nội dung đính kèm";
  if (fileContentArg) {
    userText = `Nội dung file:\n\`\`\`\n${fileContentArg}\n\`\`\`\n\nYêu cầu: ${userText}`;
  }
  messages.push({ role: 'user', content: userText });

  const response = await fetch(`${COHERE_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + COHERE_API_KEY },
    body: JSON.stringify({ model, messages })
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (isQuotaError(response.status, errorText)) {
      const next = COHERE_MODELS_CACHE?.find(m => m.id !== model);
      if (next) {
        showToast('Đổi model Cohere', `Chuyển sang ${next.id}`, 'warning', 3000);
        COHERE_MODEL = next.id;
        localStorage.setItem('cohere_model', next.id);
        return askCohere(prompt, fileContentArg, attachedImageDataUrlArg);
      }
    }
    throw new Error(`Cohere ${model} lỗi (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  let answer = '';
  const content = data?.message?.content;
  if (Array.isArray(content)) {
    answer = content.filter(c => c?.type === 'text').map(c => c.text).join('\n').trim();
  }
  if (!answer) throw new Error(`Cohere ${model} không trả về nội dung.`);
  return repairMojibake(answer);
}


async function askChatAnywhere(prompt, fileContentArg = null, attachedImageDataUrlArg = null) {
  if (!CHATANYWHERE_API_KEY || CHATANYWHERE_API_KEY.length < 10) {
    throw new Error("ChatAnywhere (no key)");
  }

  if (!CHATANYWHERE_MODELS_CACHE) fetchChatAnywhereModels();
  if (!CHATANYWHERE_MODEL) {
    CHATANYWHERE_MODEL = CHATANYWHERE_DEFAULT_MODEL;
    localStorage.setItem('chatanywhere_model', CHATANYWHERE_MODEL);
  }

  const messages = [];
  const chat = getCurrentChat();
  if (chat && chat.messages) {
    for (const msg of chat.messages.slice(-20)) {
      if (msg.role === 'ai' && msg.content && msg.content.includes("Xin chào")) continue;
      if (msg.isMedia || msg.fileMeta) continue;
      messages.push({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content });
    }
  }

  let userText = prompt || "Phân tích nội dung đính kèm";
  if (fileContentArg) {
    userText = `Nội dung file:\n\`\`\`\n${fileContentArg}\n\`\`\`\n\nYêu cầu: ${userText}`;
  }

  if (attachedImageDataUrlArg) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: attachedImageDataUrlArg } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: userText });
  }

  const response = await fetch(`${CHATANYWHERE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHATANYWHERE_API_KEY
    },
    body: JSON.stringify({
      model: CHATANYWHERE_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (isQuotaError(response.status, errorText)) {
      const next = CHATANYWHERE_FIXED_MODELS.find(m => m.id !== CHATANYWHERE_MODEL);
      if (next) {
        showToast('Đổi model ChatAnywhere', `Chuyển sang ${next.id}`, 'warning', 3000);
        CHATANYWHERE_MODEL = next.id;
        localStorage.setItem('chatanywhere_model', next.id);
        updateModelDisplay();
        return askChatAnywhere(prompt, fileContentArg, attachedImageDataUrlArg);
      }
    }
    throw new Error(`ChatAnywhere ${CHATANYWHERE_MODEL} lỗi (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (!answer) throw new Error(`ChatAnywhere ${CHATANYWHERE_MODEL} không trả về nội dung.`);
  updateModelDisplay();
  return repairMojibake(answer);
}



/* ============================================================
   FUSION AI — ensemble mode
   Uses every configured non-Gemini chat provider in parallel,
   then asks the strongest available synthesizer to produce
   one final answer. Gemini is excluded.
   ============================================================ */
const FUSION_PROVIDER_ORDER = ['groq', 'kira', 'cohere', 'chatanywhere'];

function fusionProviderReady(provider) {
  return isProviderReady(provider);
}

async function askFusionAI(prompt, fileContentArg = null, attachedImageDataUrlArg = null, onProgress = null, webContext = '') {
  const available = FUSION_PROVIDER_ORDER.filter(fusionProviderReady);
  if (!available.length) {
    throw new Error('Fusion AI cần ít nhất 1 API key: Groq, Kira, Cohere hoặc ChatAnywhere.');
  }

  onProgress?.(`Đang gọi ${available.length} AI cùng lúc…`);

  const jobs = available.map(async provider => {
    try {
      let text = '';
      if (provider === 'groq') text = await askGroq(prompt, fileContentArg, attachedImageDataUrlArg);
      else if (provider === 'kira') text = await askKira(prompt, fileContentArg, attachedImageDataUrlArg);
      else if (provider === 'cohere') text = await askCohere(prompt, fileContentArg, attachedImageDataUrlArg);
      else if (provider === 'chatanywhere') text = await askChatAnywhere(prompt, fileContentArg, attachedImageDataUrlArg);
      return { provider, ok: true, text };
    } catch (error) {
      console.warn(`[Fusion] ${provider} failed`, error);
      return { provider, ok: false, error: error?.message || String(error) };
    }
  });

  const results = await Promise.all(jobs);
  const successful = results.filter(r => r.ok && r.text);
  if (!successful.length) {
    throw new Error(`Tất cả AI trong Fusion đều lỗi: ${results.map(r => `${r.provider}: ${r.error}`).join(' | ')}`);
  }

  onProgress?.(`Đã nhận ${successful.length}/${available.length} AI · đang tổng hợp…`);

  // Pick a synthesizer without Gemini. Prefer Groq, then the first
  // provider that returned a successful answer.
  const synthesizer = successful.find(r => r.provider === 'groq')?.provider || successful[0].provider;

  const evidence = successful.map((r, i) =>
    `### AI #${i + 1} — ${PROVIDER_LABELS[r.provider]}\n${r.text}`
  ).join('\n\n');

  const synthPrompt = `Bạn là bộ tổng hợp cuối của FUSION AI.
Bạn không cần nhắc đến các provider nội bộ; chỉ trả lời người dùng.
Hãy tổng hợp các câu trả lời của nhiều AI thành MỘT câu trả lời tốt nhất cho người dùng.
Ưu tiên: đúng, đầy đủ, logic, thực tế; loại bỏ mâu thuẫn; không bịa dữ kiện.
Nếu các AI không thống nhất, hãy nêu điểm chưa chắc chắn thay vì đoán.
Giữ nguyên ngôn ngữ người dùng và trình bày dễ đọc.

YÊU CẦU GỐC:
${prompt || 'Phân tích nội dung đính kèm'}

CÁC KẾT QUẢ ĐỂ ĐỐI CHIẾU:
${evidence}

${webContext ? `DỮ LIỆU WEB ĐƯỢC TRA CỨU (nếu có):
${webContext}` : ''}`;

  let finalText = '';
  try {
    if (synthesizer === 'groq') finalText = await askGroq(synthPrompt, null, null);
    else if (synthesizer === 'kira') finalText = await askKira(synthPrompt, null, null);
    else if (synthesizer === 'cohere') finalText = await askCohere(synthPrompt, null, null);
    else finalText = await askChatAnywhere(synthPrompt, null, null);
  } catch (error) {
    console.warn('[Fusion] synthesis failed, returning best available answer', error);
    finalText = successful[0].text;
  }

  return {
    text: finalText,
    webSearch: false,
    fusion: true,
    providers: successful.map(r => r.provider),
    responses: successful
  };
}

async function askAI(prompt, fileContentArg = null, attachedImageDataUrlArg = null) {
  if (!isProviderReady(ACTIVE_PROVIDER)) {
    const fallback = getNextProvider(ACTIVE_PROVIDER, []);
    if (fallback) {
      showToast('Đổi provider', `${PROVIDER_LABELS[ACTIVE_PROVIDER]} chưa có key → ${PROVIDER_LABELS[fallback]}`, 'warning', 3000);
      ACTIVE_PROVIDER = fallback;
      localStorage.setItem('active_provider', fallback);
      updateModelDisplay();
    } else {
      throw new Error('❌ Không có provider nào sẵn sàng. Nhập key: /api, /api1, /api2, /api3, /api4');
    }
  }

  const triedProviders = [];

  while (true) {
    const currentProvider = ACTIVE_PROVIDER;
    triedProviders.push(currentProvider);

    try {
      switch (currentProvider) {
        case 'gemini':       return await askGemini(prompt, fileContentArg, attachedImageDataUrlArg);
        case 'kira':         return await askKira(prompt, fileContentArg, attachedImageDataUrlArg);
        case 'cohere':       return await askCohere(prompt, fileContentArg, attachedImageDataUrlArg);
        case 'chatanywhere': return await askChatAnywhere(prompt, fileContentArg, attachedImageDataUrlArg);
        case 'groq':
        default:             return await askGroq(prompt, fileContentArg, attachedImageDataUrlArg);
      }
    } catch (err) {
      const errMsg = err.message || '';
      const statusMatch = errMsg.match(/\((\d{3})\)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;

      const shouldFallback = isQuotaError(status, errMsg) ||
                            /no working model|no model|no key/i.test(errMsg);

      if (!shouldFallback) throw err;

      console.warn(`Provider ${currentProvider} fail:`, errMsg);

      const next = getNextProvider(currentProvider, triedProviders);
      if (!next) {
        throw new Error(`❌ Tất cả provider đều hết quota. Đã thử: ${triedProviders.map(p => PROVIDER_LABELS[p]).join(', ')}`);
      }

      showToast(
        'Tự chuyển provider',
        `${PROVIDER_LABELS[currentProvider]} hết → ${PROVIDER_LABELS[next]}`,
        'warning',
        4000
      );

      ACTIVE_PROVIDER = next;
      localStorage.setItem('active_provider', next);
      updateModelDisplay();

      try {
        if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ activeProvider: next });
      } catch (e) { console.warn(e); }
    }
  }
}

async function pickModelForRequest(apiKey, needsVision) {
  const models = await fetchGroqModels(apiKey);
  if (!models || !models.length) return GROQ_MODEL || "openai/gpt-oss-120b";

  if (needsVision) {
    if (models.some(m => m.id === VISION_MODEL)) return VISION_MODEL;
    const vision = models.find(m => classifyModelId(m.id) === 'vision');
    if (vision) return vision.id;
  }

  const current = GROQ_MODEL || localStorage.getItem('groq_model');
  if (current && models.some(m => m.id === current)) return current;

  const gptOss = models.find(m => m.id.startsWith('openai/gpt-oss'));
  if (gptOss) {
    GROQ_MODEL = gptOss.id;
    localStorage.setItem('groq_model', gptOss.id);
    updateModelDisplay();
    return gptOss.id;
  }
  return models[0].id;
}

function updateModelDisplay() {
  const el1 = document.getElementById('currentModelName');
  const el2 = document.getElementById('modelFoot');

  let displayName = '';
  let icon = '';

  if (ACTIVE_PROVIDER === 'gemini') {
    displayName = GEMINI_MODEL || 'gemini...';
    icon = '✨';
  } else if (ACTIVE_PROVIDER === 'kira') {
    displayName = KIRA_MODEL || 'kira...';
    icon = '🐰';
  } else if (ACTIVE_PROVIDER === 'cohere') {
    displayName = COHERE_MODEL || 'cohere...';
    icon = '🧠';
  } else if (ACTIVE_PROVIDER === 'chatanywhere') {
    displayName = CHATANYWHERE_MODEL || CHATANYWHERE_DEFAULT_MODEL;
    icon = '🌐';
  } else {
    displayName = GROQ_MODEL || 'groq...';
    icon = '💬';
  }

  if (el1) el1.textContent = `${icon} ${displayName}`;
  if (el2) el2.textContent = `${ACTIVE_PROVIDER}/${displayName}`;
}


function renderModelPicker() {
  const body = document.getElementById('modelPickerBody');
  const count = document.getElementById('modelPickerCount');
  if (!body) return;

  let cache = null;
  let currentModel = '';
  let providerLabel = '';
  let providerIcon = '';

  if (ACTIVE_PROVIDER === 'gemini') {
    cache = GEMINI_MODELS_CACHE;
    currentModel = GEMINI_MODEL;
    providerLabel = 'Gemini';
    providerIcon = '✨';
  } else if (ACTIVE_PROVIDER === 'kira') {
    cache = KIRA_FREE_MODELS.map(id => ({ id, owned_by: 'kira', type: 'chat' }));
    currentModel = KIRA_MODEL;
    providerLabel = 'Kira';
    providerIcon = '🐰';
  } else if (ACTIVE_PROVIDER === 'cohere') {
    cache = COHERE_MODELS_CACHE;
    currentModel = COHERE_MODEL;
    providerLabel = 'Cohere';
    providerIcon = '🧠';
  } else if (ACTIVE_PROVIDER === 'chatanywhere') {
    cache = CHATANYWHERE_FIXED_MODELS;
    currentModel = CHATANYWHERE_MODEL;
    providerLabel = 'ChatAnywhere';
    providerIcon = '🌐';
  } else {
    cache = GROQ_MODELS_CACHE;
    currentModel = GROQ_MODEL;
    providerLabel = 'Groq';
    providerIcon = '💬';
  }

  if (!cache || !cache.length) {
    body.innerHTML = `<div class="model-picker-loading">
      <i class="fa-solid fa-triangle-exclamation"></i> Chưa có model nào cho <b>${providerIcon} ${providerLabel}</b>.<br>
      <small style="color:var(--text-4);">Nhập key tương ứng để dùng.</small>
    </div>`;
    if (count) count.textContent = '0 model · ' + providerIcon + ' ' + providerLabel;
    return;
  }

  let list = cache;
  if (ACTIVE_PROVIDER === 'groq' && MODEL_PICKER_FILTER !== 'all') {
    list = list.filter(m => classifyModelId(m.id) === MODEL_PICKER_FILTER);
  }

  if (count) count.textContent = list.length + ' model · ' + providerIcon + ' ' + providerLabel;

  if (!list.length) {
    body.innerHTML = `<div class="model-picker-loading">Không có model nào khớp bộ lọc.</div>`;
    return;
  }

  body.innerHTML = list.map(m => {
    const type = ACTIVE_PROVIDER === 'groq' ? classifyModelId(m.id) : (m.type || 'chat');
    const selected = m.id === currentModel;
    const created = m.created ? new Date(m.created * 1000).toLocaleDateString('vi-VN') : '';
    const owner = m.owned_by || ACTIVE_PROVIDER;

    let badge = 'FREE';
    let badgeColor = '';
    if (ACTIVE_PROVIDER === 'gemini') { badge = 'GEMINI'; badgeColor = 'background:linear-gradient(135deg,#4285f4,#34a853);'; }
    else if (ACTIVE_PROVIDER === 'kira') { badge = 'KIRA'; badgeColor = 'background:linear-gradient(135deg,#ec4899,#f472b6);'; }
    else if (ACTIVE_PROVIDER === 'cohere') { badge = 'COHERE'; badgeColor = 'background:linear-gradient(135deg,#39594d,#5a7d6e);'; }
    else if (ACTIVE_PROVIDER === 'chatanywhere') { badge = 'FREE'; badgeColor = 'background:linear-gradient(135deg,#0ea5e9,#06b6d4);'; }

    return `<div class="model-picker-item ${selected ? 'selected' : ''}" data-model="${m.id}">
      <div class="mp-ico">${modelEmoji(type)}</div>
      <div class="mp-body">
        <div class="mp-name">${escapeHtml(m.id)}</div>
        <div class="mp-meta">
          <span>${modelTypeLabel(type)}</span>
          ${created ? `<span>📅 ${created}</span>` : ''}
          <span>🏢 ${escapeHtml(owner)}</span>
        </div>
      </div>
      <span class="mp-badge" style="${badgeColor}">${badge}</span>
    </div>`;
  }).join('');

  body.querySelectorAll('.model-picker-item').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.dataset.model;

      if (ACTIVE_PROVIDER === 'gemini') {
        GEMINI_MODEL = id;
        localStorage.setItem('gemini_model', id);
      } else if (ACTIVE_PROVIDER === 'kira') {
        KIRA_MODEL = id;
        localStorage.setItem('kira_model', id);
      } else if (ACTIVE_PROVIDER === 'cohere') {
        COHERE_MODEL = id;
        localStorage.setItem('cohere_model', id);
      } else if (ACTIVE_PROVIDER === 'chatanywhere') {
        CHATANYWHERE_MODEL = id;
        localStorage.setItem('chatanywhere_model', id);
      } else {
        GROQ_MODEL = id;
        localStorage.setItem('groq_model', id);
      }

      updateModelDisplay();
      renderModelPicker();
      showToast('Đã chọn', `${id} (${providerLabel})`, 'success');
      setTimeout(() => document.getElementById('modelPickerOverlay').classList.remove('open'), 400);
    });
  });
}

async function openModelPicker() {
  const overlay = document.getElementById('modelPickerOverlay');
  if (!overlay) return;
  overlay.classList.add('open');

  document.querySelectorAll('.model-filter-chip').forEach(chip => {
    chip.style.display = (ACTIVE_PROVIDER === 'groq') ? '' : 'none';
  });

  const body = document.getElementById('modelPickerBody');
  if (body) {
    body.innerHTML = `<div class="model-picker-loading"><i class="fa-solid fa-spinner fa-spin"></i> Đang quét model từ <b>${PROVIDER_LABELS[ACTIVE_PROVIDER]}</b>...</div>`;
  }

  if (ACTIVE_PROVIDER === 'gemini') {
    await fetchGeminiModels(true);
  } else if (ACTIVE_PROVIDER === 'cohere') {
    await fetchCohereModels(true);
  } else if (ACTIVE_PROVIDER === 'chatanywhere') {
    fetchChatAnywhereModels();
  } else if (ACTIVE_PROVIDER === 'groq') {
    const apiKey = GROQ_API_KEY || localStorage.getItem('groq_key');
    await fetchGroqModels(apiKey, true);
  }

  renderModelPicker();
}


function detectWebSearchIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase().trim();
  const patterns = [
    { regex: /thời tiết|nhiệt độ|dự báo|weather/i, type: 'weather' },
    { regex: /tin tức|thời sự|news|mới nhất|hôm nay có gì/i, type: 'news' },
    { regex: /hôm nay (là )?ngày|hôm nay thứ mấy|ngày mấy|mấy giờ|giờ hiện tại/i, type: 'datetime' },
    { regex: /giá (vàng|bitcoin|usd|đô la|chứng khoán|xăng|dầu)|tỷ giá/i, type: 'price' },
    { regex: /tìm (kiếm|thông tin)|tra cứu|tra google|search/i, type: 'search' },
    { regex: /dân số|GDP|lạm phát|thống kê mới/i, type: 'statistics' }
  ];
  for (const p of patterns) {
    if (p.regex.test(lower)) return { needsSearch: true, searchType: p.type, query: text.trim() };
  }
  return null;
}

async function performWebSearch(query, searchType = 'search') {
  if (!TAVILY_API_KEY || TAVILY_API_KEY.length < 10) await loadTavilyKey();
  if (!TAVILY_API_KEY || TAVILY_API_KEY.length < 10) {
    throw new Error('Chưa có Tavily key. Gõ /apitavily tvly-... để nhập.');
  }
  const response = await fetch(TAVILY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY, query, search_depth: 'advanced',
      max_results: searchType === 'datetime' ? 3 : 5, include_answer: true, include_raw_content: false
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Tavily ${response.status}: ${errText}`);
  }
  const data = await response.json();
  return { answer: data.answer || '', results: Array.isArray(data.results) ? data.results : [] };
}

function getLocalDateTime() {
  const now = new Date();
  const days = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
  const dayName = days[now.getDay()];
  const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  return { dayName, dateStr, timeStr, answer: `Hôm nay là ${dayName}, ngày ${dateStr}. Bây giờ là ${timeStr}.` };
}

function formatWebSearchResults(searchData, searchType, originalQuery) {
  if (searchType === 'datetime') {
    const dt = getLocalDateTime();
    return `🕐 **Thông tin thời gian hiện tại:**\n\n${dt.answer}\n\n📅 Ngày: **${dt.dateStr}**\n⏰ Giờ: **${dt.timeStr}**\n📆 Thứ: **${dt.dayName}**`;
  }
  const icons = { weather: '🌤️', news: '📰', price: '💰', search: '🔍', statistics: '📊' };
  const icon = icons[searchType] || '🔍';
  let output = `${icon} **Kết quả tìm kiếm cho:** _"${originalQuery}"_\n\n`;
  if (searchData.answer) output += `### 🤖 Tóm tắt\n${searchData.answer}\n\n`;
  if (searchData.results && searchData.results.length > 0) {
    output += `### 📌 Nguồn tham khảo\n`;
    searchData.results.slice(0, 4).forEach((r, i) => {
      const title = (r.title || 'Không có tiêu đề').trim();
      const content = (r.content || '').trim();
      const url = r.url || '';
      const shortContent = content.length > 220 ? content.substring(0, 220) + '...' : content;
      output += `\n**${i + 1}. ${title}**\n${shortContent}\n`;
      if (url) output += `🔗 [${url}](${url})\n`;
    });
  }
  output += `\n_⏱️ Cập nhật: ${new Date().toLocaleString('vi-VN')}_`;
  return output;
}

const AUTO_SEARCH_PATTERNS = [
  /thời tiết|nhiệt độ|dự báo|mưa|nắng|bão|lũ|weather/i,
  /tin tức|thời sự|news|mới nhất|hôm nay có gì|sự kiện/i,
  /hôm nay (là )?ngày|hôm nay thứ mấy|ngày mấy|mấy giờ|giờ hiện tại|bây giờ là/i,
  /giá (vàng|bitcoin|btc|usd|đô la|chứng khoán|xăng|dầu|euro|nhân dân tệ)|tỷ giá|giá cả/i,
  /dân số|gdp|lạm phát|thống kê mới|báo cáo mới/i,
  /tỷ số|kết quả (trận|trận đấu|bóng đá)|lịch thi đấu|bảng xếp hạng/i,
  /tìm (kiếm|thông tin)|tra cứu|tra google|search|google/i,
  /(hiện tại|hiện nay|bây giờ|gần đây|mới nhất|2024|2025|2026)/i,
];

function shouldAutoSearch(text) {
  if (!text || typeof text !== 'string') return false;
  return AUTO_SEARCH_PATTERNS.some(re => re.test(text));
}

let _selfCheckCache = new Map();

async function aiNeedsWebSearch(userText) {
  if (!userText || userText.length < 3) return false;
  const cacheKey = userText.toLowerCase().trim().slice(0, 100);
  if (_selfCheckCache.has(cacheKey)) return _selfCheckCache.get(cacheKey);

  const apiKey = GROQ_API_KEY || localStorage.getItem('groq_key');
  if (!apiKey || apiKey.length < 10) return false;

  const prompt = `Bạn là bộ phân loại. Đọc câu hỏi và trả lời CHỈ "YES" hoặc "NO".
YES nếu câu hỏi cần thông tin thời gian thực: thời tiết, tin tức, giá cả, sự kiện mới, số liệu cập nhật, tỷ số, người/vật cụ thể ít phổ biến, câu hỏi có "hiện tại/hôm nay/mới nhất".
NO nếu: kiến thức cơ bản, viết code, dịch, toán, tâm sự, xã giao.

Câu hỏi: "${userText}"
Trả lời (YES/NO):`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: SELF_CHECK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 5
      })
    });
    if (!res.ok) return false;
    const data = await res.json();
    const answer = (data?.choices?.[0]?.message?.content || '').trim().toUpperCase();
    const needs = answer.startsWith('YES');
    _selfCheckCache.set(cacheKey, needs);
    if (_selfCheckCache.size > 50) {
      _selfCheckCache.delete(_selfCheckCache.keys().next().value);
    }
    return needs;
  } catch (e) {
    console.warn('aiNeedsWebSearch:', e);
    return false;
  }
}

const AI_DONT_KNOW_PATTERNS = [
  /tôi (không|ko|chưa) (biết|có thông tin|thể truy cập|cập nhật)/i,
  /tôi không chắc/i,
  /kiến thức (của tôi|tôi) (chỉ )?(đến|tới|dừng ở)/i,
  /tôi (được )?(huấn luyện|train) (đến|tới|vào)/i,
  /không có quyền truy cập/i,
  /không thể tra cứu/i,
  /thông tin (này )?(có thể )?(đã )?(cũ|lỗi thời)/i,
  /tôi (không|ko) (được )?(cập nhật|huấn luyện) (về|với)/i,
  /vui lòng (tra|tìm|kiểm tra)/i,
  /tôi (không|ko) (có|nắm) (dữ liệu|thông tin)/i,
  /cần (tra|tìm) (cứu|kiếm) thêm/i,
  /tôi (sẽ|sẽ cố) (thử )?(tra|tìm)/i,
  /(rất tiếc|xin lỗi)[,.]? (tôi|mình) (không|ko|chưa)/i,
];

function aiSaidIDontKnow(replyText) {
  if (!replyText) return false;
  return AI_DONT_KNOW_PATTERNS.some(re => re.test(replyText));
}

async function tryGetWebContext(prompt, force = false) {
  try {
    if (!force && (!TAVILY_API_KEY || TAVILY_API_KEY.length < 10)) {
      await loadTavilyKey();
    }
    if (!TAVILY_API_KEY || TAVILY_API_KEY.length < 10) return '';
    const intent = detectWebSearchIntent(prompt) || { searchType: 'search', query: prompt };
    const searchData = await performWebSearch(intent.query, intent.searchType);
    if (intent.searchType === 'datetime') {
      const dt = getLocalDateTime();
      return `${dt.answer}`;
    }
    return `${searchData.answer || ''}\n\n` +
      (searchData.results || []).slice(0, 5).map(r =>
        `- ${r.title}: ${(r.content || '').substring(0, 300)}`
      ).join('\n');
  } catch (e) {
    console.warn('tryGetWebContext:', e);
    return '';
  }
}


function markdown(text) {
  if (!text) return "";
  text = repairMojibake(String(text));
  const codeBlocks = [];
  let protectedText = String(text).replace(/```html([\s\S]*?)```/gi, function(match, code) {
    const cleanCode = repairHtmlCode(code.replace(/^\s+|\s+$/g, ''));
    const encodedCode = btoa(unescape(encodeURIComponent(cleanCode)));
    const escapedCode = cleanCode.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const block = `<div class="code-block-wrapper">
      <div class="code-block-header"><span class="code-label">📄 HTML</span><span class="code-status"><span class="dot"></span> Ready</span></div>
      <div class="code-content"><pre><code>${escapedCode}</code></pre></div>
      <div class="code-block-toolbar">
        <button class="run-btn" onclick="runHtmlCode(decodeBase64Utf8('${encodedCode}'))">▶ Run</button>
        <button class="copy-btn" onclick="copyCode(this, decodeBase64Utf8('${encodedCode}'))">📋 Copy</button>
      </div>
    </div>`;
    const token = `___HTML_CODE_BLOCK_${codeBlocks.length}___`;
    codeBlocks.push(block);
    return token;
  });

  const mediaBlocks = [];
  protectedText = protectedText.replace(/<(video|img)\b[^>]*>.*?<\/\1>|<(video|img)\b[^>]*\/?>/gi, (m) => {
    const token = `___MEDIA_BLOCK_${mediaBlocks.length}___`;
    mediaBlocks.push(m);
    return token;
  });

  let html = protectedText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
    const cleanCode = repairHtmlCode(code.replace(/^\s+|\s+$/g, ''));
    const escapedCode = cleanCode.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const encodedCode = btoa(unescape(encodeURIComponent(cleanCode)));
    return `<div class="code-block-wrapper">
      <div class="code-content"><pre><code>${escapedCode}</code></pre></div>
      <div class="code-block-toolbar"><button class="copy-btn" onclick="copyCode(this, decodeBase64Utf8('${encodedCode}'))">📋 Copy</button></div>
    </div>`;
  });
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, "<br>");
  codeBlocks.forEach((block, index) => {
    html = html.replace(`___HTML_CODE_BLOCK_${index}___`, block);
  });
  mediaBlocks.forEach((block, i) => {
    html = html.replace(`___MEDIA_BLOCK_${i}___`, block);
  });
  return html;
}

function copyCode(btn, text) {
  text = repairHtmlCode(String(text || ''));
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
    showToast('Thành công', 'Đã sao chép code!', 'success');
  });
}

function runHtmlCode(htmlCode) {
  const newTab = window.open('', '_blank');
  if (!newTab) { showToast('Cảnh báo', 'Trình duyệt chặn popup!', 'warning'); return; }
  newTab.document.write(htmlCode);
  newTab.document.close();
  showToast('Thành công', 'Đã mở tab chạy HTML!', 'success');
}
window.runHtmlCode = runHtmlCode;
window.copyCode = copyCode;


const KNOWN_APPS = {
  'youtube': { scheme: 'youtube://', name: 'YouTube', fallback: 'https://www.youtube.com/', search: 'https://www.youtube.com/results?search_query=' },
  'tiktok': { scheme: 'tiktok://', name: 'TikTok', fallback: 'https://www.tiktok.com/', search: 'https://www.tiktok.com/search?q=' },
  'facebook': { scheme: 'fb://', name: 'Facebook', fallback: 'https://www.facebook.com/', search: 'https://www.facebook.com/search/top/?q=' },
  'instagram': { scheme: 'instagram://', name: 'Instagram', fallback: 'https://www.instagram.com/', search: 'https://www.instagram.com/explore/search/keyword/?q=' },
  'shopee': { scheme: 'shopee://', name: 'Shopee', fallback: 'https://shopee.vn/', search: 'https://shopee.vn/search?keyword=' },
  'telegram': { scheme: 'tg://', name: 'Telegram', fallback: 'https://t.me/' },
  'spotify': { scheme: 'spotify://', name: 'Spotify', fallback: 'https://open.spotify.com/' },
  'chrome': { scheme: 'googlechrome://', name: 'Chrome', fallback: 'https://www.google.com/' }
};

function detectAppIntent(text) {
  const lower = text.toLowerCase().trim();
  if (lower.includes('tìm') && (lower.includes('youtube') || lower.includes('yt'))) {
    let query = text.replace(/tìm|kiếm|trên youtube|youtube|yt/gi, '').trim();
    return { action: 'search_youtube', query };
  }
  if (lower.includes('tìm') && (lower.includes('tiktok') || lower.includes('tt'))) {
    let query = text.replace(/tìm|kiếm|trên tiktok|tiktok|tt/gi, '').trim();
    return { action: 'search_tiktok', query };
  }
  const openWords = ['mở', 'open', 'mo', 'bật', 'bat'];
  const hasOpen = openWords.some(w => lower.includes(w));
  if (hasOpen) {
    let appText = text;
    for (const w of openWords) appText = appText.replace(new RegExp(w, 'gi'), '');
    appText = appText.trim();
    const knownKeys = Object.keys(KNOWN_APPS);
    for (const key of knownKeys) {
      if (appText.includes(key)) return { action: 'open_app', app: key };
    }
    if (appText.length > 1) return { action: 'open_app', app: appText };
  }
  return null;
}

function openAppAdvanced(appName, query = '') {
  const app = KNOWN_APPS[appName];
  if (app) {
    if (query) {
      window.open(app.search + encodeURIComponent(query), '_blank');
      showToast('Đang tìm', `"${query}" trên ${app.name}`, 'success');
      return true;
    }
    try {
      const link = document.createElement('a');
      link.href = app.scheme;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Thành công', `Mở ${app.name}`, 'success');
      return true;
    } catch (e) {}
    window.open(app.fallback, '_blank');
    return true;
  }
  window.open(`https://www.google.com/search?q=${encodeURIComponent(appName)}`, '_blank');
  return true;
}


async function askAIEnhanced(prompt, fileContentArg, options = {}, attachedImageDataUrlArg = null) {
  const hasAttachment = !!attachedImageDataUrlArg || !!fileContentArg;

  let usedWebSearch = false;
  let webSearchContext = '';

  if (!hasAttachment && prompt && prompt.length > 3) {
    let needSearch = webSearchEnabled || shouldAutoSearch(prompt);
    if (!needSearch) {
      needSearch = await aiNeedsWebSearch(prompt);
    }

    if (needSearch) {
      try {
        showToast('Đang tìm', 'Đang tra cứu thông tin...', 'info', 1800);
        webSearchContext = await tryGetWebContext(prompt);
        if (webSearchContext) usedWebSearch = true;
      } catch (e) {
        console.warn('Pre-search error:', e);
      }
    }
  }

  const enrichedPrompt = webSearchContext
    ? `${prompt}\n\n(Dùng thông tin mới nhất sau đây để trả lời, đừng nói bạn không biết:\n${webSearchContext})`
    : prompt;

  let reply = await askAI(enrichedPrompt, fileContentArg, attachedImageDataUrlArg);

  if (!usedWebSearch && !hasAttachment && aiSaidIDontKnow(reply)) {
    console.log('🤖 AI không biết → tự động search + retry...');
    showToast('AI cần tra cứu', 'Đang tìm thông tin bổ sung...', 'info', 2000);

    try {
      const forceContext = await tryGetWebContext(prompt, true);
      if (forceContext) {
        const retryPrompt = `${prompt}\n\n(Đây là thông tin mới nhất từ web, hãy dùng nó để trả lời:\n${forceContext})`;
        const reply2 = await askAI(retryPrompt, fileContentArg, attachedImageDataUrlArg);
        if (reply2 && reply2.length > 20 && reply2.trim() !== reply.trim()) {
          reply = reply2;
          usedWebSearch = true;
        }
      }
    } catch (e) {
      console.warn('Retry search failed:', e);
    }
  }

  return { text: reply, webSearch: usedWebSearch };
}
const askGroqEnhanced = askAIEnhanced;


function saveChats() {
  localStorage.setItem("ai_chats", JSON.stringify(chats));
  if (currentChatId) localStorage.setItem("ai_current_chat", currentChatId);
}
function getChat(id) { return chats.find(c => c.id === id); }
function getCurrentChat() { return getChat(currentChatId); }

function createNewChat() {
  const id = Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const welcomeMessages = [
    "Xin chào! Tôi là NPN - GPT. Hãy hỏi tôi bất cứ điều gì nhé! 😊",
    "Chào bạn! Tôi là trợ lý AI của Nguyễn Phi Nhật. Sẵn sàng giúp đỡ! 🤖"
  ];
  let welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  welcomeMsg += "\n\n📱 Nói 'mở [tên app]' → mở app\n🔍 'tìm [nội dung] trên youtube' → tìm YouTube\n🌐 Tự động tra Google khi cần thông tin mới\n📄 Đính kèm file/ảnh → tôi phân tích (PDF, Word, Excel, ảnh, text)\n📥 Nói 'tạo file [loại]...' → tôi tạo file (txt, json, csv, md, pdf, docx, xlsx, code...)\n💻 Code HTML → ấn Run để chạy\n🎨 Bật nút 'Tạo' ở composer → Tạo Ảnh / Video\n\n🔑 Nhập key:\n/api gsk_... — Groq\n/api1 AIza... — Gemini\n/api2 ... — Kira\n/api3 ... — Cohere\n/api4 sk-... — ChatAnywhere\n/apiimg sk-... — Agnes (Ảnh & Video)\n/apitts murf_... — Murf TTS\n/apitavily tvly-... — Search";
  const chat = {
    id,
    title: "Cuộc trò chuyện mới",
    messages: [{ role: "ai", content: welcomeMsg, ts: Date.now() }],
    time: Date.now()
  };
  chats.unshift(chat);
  currentChatId = chat.id;
  saveChats();
  return chat;
}

function updateChatTitle() {
  const chat = getCurrentChat();
  if (!chat) return;
  if (chat.title === "Cuộc trò chuyện mới" && chat.messages.length > 1) {
    const firstUserMsg = chat.messages.find(m => m.role === 'user');
    if (firstUserMsg) { chat.title = firstUserMsg.content.substring(0, 30); saveChats(); }
  }
}


function buildTabMenu() {
  const cfg = { 1: 'Chat', 2: 'Camera', 3: 'Run HTML', 4: '⚡ Fusion AI', 5: 'Coming Soon', 6: 'Call', 7: 'Settings' };
  const cur = currentTab === 'ai' ? 1 : currentTab === 'camera' ? 2 : currentTab === 'run' ? 3 :
              currentTab === 'fusion' ? 4 : currentTab === 'soon5' ? 5 : currentTab === 'call' ? 6 : 7;
  const items = Object.entries(cfg).map(([num, name]) => {
    const active = parseInt(num) === cur;
    return `<div class="tab-menu-item ${active ? 'active' : ''}" data-tab="${num}">
      <span class="mi-num">${num}</span><span class="mi-label">${name}</span>
      <svg class="mi-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    </div>`;
  }).join('');

  return `<div class="tab-dropdown" id="tabDropdown">
    <button class="tab-btn" id="tabBtn"><span class="t-num">${cur}</span><span class="t-label">${cfg[cur]}</span>
      <svg class="t-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="tab-menu" id="tabMenu">${items}</div>
  </div>

  <div class="tab-dropdown" id="mediaDropdown">
    <button class="tab-btn" id="mediaBtn" title="Tạo Ảnh / Video">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span class="t-label">Tạo</span>
      <svg class="t-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="tab-menu" id="mediaMenu">
      <div class="tab-menu-item ${IMAGE_MODE_ENABLED ? 'active' : ''}" data-media="image">
        <svg class="mi-num" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span class="mi-label">Tạo Ảnh</span>
        <svg class="mi-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="tab-menu-item ${VIDEO_MODE_ENABLED ? 'active' : ''}" data-media="video">
        <svg class="mi-num" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        <span class="mi-label">Tạo Video</span>
        <svg class="mi-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>
  </div>`;
}


function buildChatTab() {
  const wrap = document.createElement('div');
  wrap.className = 'tab-content active' + (CHAT_THEME === 'chat2' ? ' chat-theme2' : '');
  const chat = getCurrentChat();
  const hasHistory = chat && chat.messages && chat.messages.length > 1;

  let heroHTML;
  if (CHAT_THEME === 'chat2') {
    heroHTML = `<div class="chat-hero" id="chatHero" style="display:${hasHistory ? 'none' : 'flex'}">
      <div class="hero-code">
<span class="c-com">// Chào mừng đến với NPN-GPT</span><br>
<span class="c-key">const</span> <span class="c-var">assistant</span> = <span class="c-key">new</span> <span class="c-fn">Chatbot</span>({<br>
&nbsp;&nbsp;provider: <span class="c-str">"${ACTIVE_PROVIDER}"</span>,<br>
&nbsp;&nbsp;webSearch: <span class="c-key">${webSearchEnabled}</span>,<br>
&nbsp;&nbsp;lang: <span class="c-str">"vi"</span><br>
});<br><br>
<span class="c-var">assistant</span>.<span class="c-fn">ready</span>();<span class="cursor"></span>
      </div>
      <h1 class="hero-title" style="font-family:var(--mono);font-size:28px;">Chào bạn, tôi có thể <span class="accent">giúp gì?</span></h1>
      <p class="hero-sub" style="font-family:var(--mono);font-size:12.5px;">Provider: <b>${PROVIDER_LABELS[ACTIVE_PROVIDER]}</b> · Auto search: <b>ON</b></p>
    </div>`;
  } else {
    heroHTML = `<div class="chat-hero" id="chatHero" style="display:${hasHistory ? 'none' : 'flex'}">
      <div class="hero-visual">
        <div class="diamond-stage">
          <div class="cube n"></div><div class="cube e"></div><div class="cube s"></div><div class="cube w"></div>
          <div class="cube center"></div>
        </div>
      </div>
      <h1 class="hero-title">Chào bạn, tôi có thể <span class="accent">giúp gì?</span></h1>
      <p class="hero-sub">Provider: <b style="color:var(--cyan)">${PROVIDER_LABELS[ACTIVE_PROVIDER]}</b> · Auto search: <b style="color:var(--cyan)">ON</b></p>
    </div>`;
  }

  wrap.innerHTML = `
    <div class="chat-wrap">
      ${heroHTML}
      <div class="chat-stream" id="chatStream" style="display:${hasHistory ? 'flex' : 'none'}"></div>
      <div class="composer-wrap">
        <div class="composer">
          <div class="composer-tools">
            ${buildTabMenu()}
            <div style="flex:1"></div>
            <button class="tool-icon-btn" id="btnHistory" title="Lịch sử chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span class="badge" id="historyBadge" style="display:none">0</span>
            </button>
            <button class="tool-icon-btn" id="btnNewChat" title="Chat mới">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div class="composer-row">
            <button class="composer-btn attach-btn" id="btnAttach" title="Đính kèm file/ảnh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <button class="composer-btn websearch-btn ${webSearchEnabled ? 'active' : ''}" id="btnWebSearch" title="Luôn bật tra cứu Google">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </button>
            <textarea id="chatInput" placeholder="Nhập tin nhắn..." rows="1"></textarea>
            <button class="send-btn" id="btnSend" title="Gửi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
        <div class="composer-foot">
          <div><span class="kbd">Enter</span> gửi · <span class="kbd">/api</span> · <span class="kbd">/api1</span> · <span class="kbd">/api2</span> · <span class="kbd">/api3</span> · <span class="kbd">/api4</span> · <span class="kbd">/api5</span> · <span class="kbd">/apiimg</span></div>
          <div id="modelFoot">${ACTIVE_PROVIDER}/${escapeHtml(GROQ_MODEL)}</div>
        </div>
      </div>
    </div>
    <input type="file" id="fileInput" hidden accept=".txt,.json,.csv,.js,.html,.css,.py,.md,.xml,.yml,.yaml,.log,.pdf,.docx,.xlsx,.xls,image/*">`;

  if (hasHistory) {
    requestAnimationFrame(() => {
      const stream = document.getElementById('chatStream');
      if (stream && chat) renderMessages(stream, chat.messages);
    });
  }
  setTimeout(updateComposerHint, 50);
  return wrap;
}


function renderMessages(stream, history) {
  stream.innerHTML = '';
  history.forEach(msg => appendMessageUI(
    stream, msg.role, msg.content, false, msg.ts,
    msg.imageDataUrl, msg.webSearch, msg.fileMeta
  ));
  stream.scrollTop = stream.scrollHeight;
}

function appendMessageUI(stream, role, content, thinking, ts, imageDataUrl, webSearchBadge, fileMeta = null) {
  if (role === 'ai') role = 'bot';

  const wrap = document.createElement('div');
  wrap.className = 'turn ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'turn-avatar';
  if (role === 'user') {
    avatar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  }

  const cont = document.createElement('div');
  cont.className = 'turn-content';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (webSearchBadge && role === 'bot') {
    const badge = document.createElement('div');
    badge.className = 'bubble-websearch';
    badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;margin-bottom:8px;border-radius:100px;background:rgba(103,232,249,0.1);border:1px solid rgba(103,232,249,0.3);font-size:10.5px;font-family:var(--mono);color:var(--cyan);font-weight:500;';
    badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:11px;height:11px;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span>Đã tra cứu Google</span>';
    bubble.appendChild(badge);
  }

  if (thinking) {
    const think = document.createElement('span');
    think.className = 'thinking';
    think.innerHTML = '<span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span>';
    bubble.appendChild(think);
  } else if (role === 'bot') {
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = markdown(content);
    bubble.appendChild(contentDiv);
  } else {
    const textNode = document.createElement('div');
    textNode.textContent = content;
    bubble.appendChild(textNode);
    if (imageDataUrl) {
      const img = document.createElement('img');
      img.src = imageDataUrl;
      img.className = 'msg-image';
      bubble.appendChild(img);
    }
  }

  cont.appendChild(bubble);

  if (role === 'bot' && !thinking) {
    cont.appendChild(buildBubbleActions(bubble, content, fileMeta));
  }

  wrap.appendChild(avatar);
  wrap.appendChild(cont);
  stream.appendChild(wrap);
  stream.scrollTop = stream.scrollHeight;
  return wrap;
}


function buildBubbleActions(bubble, rawContent, fileMeta = null) {
  const actions = document.createElement('div');
  actions.className = 'bubble-actions';

  const spk = document.createElement('button');
  spk.type = 'button';
  spk.className = 'bubble-action-btn';
  spk.title = 'Đọc tin nhắn';
  spk.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  spk.addEventListener('click', (e) => { e.stopPropagation(); speakBubble(spk, bubble); });
  actions.appendChild(spk);

  const cpy = document.createElement('button');
  cpy.type = 'button';
  cpy.className = 'bubble-action-btn';
  cpy.title = 'Copy tin nhắn';
  cpy.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  cpy.addEventListener('click', async (e) => {
    e.stopPropagation();
    const raw = bubble.innerText || bubble.textContent || rawContent || '';
    try {
      await navigator.clipboard.writeText(raw);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = raw;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    cpy.classList.add('copied');
    const orig = cpy.innerHTML;
    cpy.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"/></svg>';
    showToast('Đã copy', 'Nội dung đã được sao chép', 'success', 1500);
    setTimeout(() => { cpy.classList.remove('copied'); cpy.innerHTML = orig; }, 1200);
  });
  actions.appendChild(cpy);

  if (fileMeta && fileMeta.ext && fileMeta.content) {
    const dl = document.createElement('button');
    dl.type = 'button';
    dl.className = 'bubble-action-btn download-btn';
    dl.title = `Tải file .${fileMeta.ext}`;
    dl.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    dl.addEventListener('click', async (e) => {
      e.stopPropagation();
      dl.disabled = true;
      dl.style.opacity = '0.5';
      try {
        const result = await createAndDownloadFile(fileMeta.ext, fileMeta.content, fileMeta.baseName || 'output');
        showToast('Đã tải', result.filename, 'success', 2500);
      } catch (err) {
        showToast('Lỗi tải', err.message, 'error', 3000);
      }
      dl.disabled = false;
      dl.style.opacity = '1';
    });
    actions.appendChild(dl);
  }

  return actions;
}


async function safeSpeakMurf(text) {
  ensureDefaultVoice();
  const primaryVoice = CALL_TTS_MODEL;
  const voices = await fetchMurfVoices();
  const primaryVoiceData = voices.find(v => v.id === primaryVoice);
  const primaryLang = primaryVoiceData?.language || 'vi';

  const chain = [primaryVoice];
  MURF_WORKING_VOICES.forEach(v => {
    if (chain.includes(v)) return;
    const voiceData = voices.find(x => x.id === v);
    if (voiceData && voiceData.language === primaryLang) chain.push(v);
  });
  const fallbackList = primaryLang === 'vi' ? MURF_FALLBACK_VI : MURF_FALLBACK_EN;
  fallbackList.forEach(v => {
    if (!chain.includes(v)) chain.push(v);
  });
  voices.forEach(v => {
    if (v.language === primaryLang && !chain.includes(v.id)) {
      chain.push(v.id);
    }
  });

  let lastError = null;
  for (const voiceId of chain) {
    try {
      const audioUrl = await murfStreamOrFallback(MURF_API_KEY, voiceId, text);
      if (audioUrl) {
        markVoiceWorking(voiceId);
        if (voiceId !== primaryVoice) {
          const voiceData = voices.find(v => v.id === voiceId);
          showToast('Đã chuyển giọng', `Giọng "${primaryVoice}" lỗi → dùng "${voiceData?.name || voiceId}"`, 'warning', 3000);
        }
        return { url: audioUrl, voiceId };
      }
    } catch (err) {
      lastError = err;
      console.warn(`Murf voice "${voiceId}" failed:`, err.message);
      markVoiceFailed(voiceId);
    }
  }
  throw lastError || new Error('Tất cả giọng Murf đều lỗi');
}

async function speakBubble(btn, bubble) {
  unlockAudioSync();

  if (_currentSpeakerBtn === btn) {
    const a = _ensureSharedAudio();
    try { a.pause(); a.currentTime = 0; } catch(e){}
    _resetSpeakerBtn();
    return;
  }

  const a = _ensureSharedAudio();
  try { a.pause(); a.currentTime = 0; } catch(e){}
  _resetSpeakerBtn();

  if (!MURF_API_KEY || MURF_API_KEY.length < 10) {
    showToast('Chưa có Murf key', 'Gõ /apitts murf_... để nhập key', 'warning', 4000);
    return;
  }

  let raw = bubble.innerText || bubble.textContent || '';
  raw = raw.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]+`/g, ' ');
  raw = raw.replace(/\s+/g, ' ').trim();
  if (!raw) return;
  if (raw.length > 500) raw = raw.substring(0, 500) + '...';

  try {
    _currentSpeakerBtn = btn;
    btn.classList.add('speaking');
    btn.title = 'Dừng đọc';

    const { url: audioUrl } = await safeSpeakMurf(raw);

    const audio = _ensureSharedAudio();
    try { audio.pause(); audio.currentTime = 0; } catch(e){}
    audio.src = audioUrl;
    audio.volume = 1.0;
    audio.muted = false;
    setupGainOnce(audio);

    audio.onended = () => _resetSpeakerBtn();
    audio.onerror = () => _resetSpeakerBtn();

    const p = audio.play();
    if (p && p.catch) {
      p.catch(async (err) => {
        console.warn('play() bị chặn, thử resume...', err);
        _unlockAudioContextSync();
        if (callTTSAudioContext && callTTSAudioContext.state === 'suspended') {
          try { await callTTSAudioContext.resume(); } catch(e){}
        }
        try { await audio.play(); }
        catch (e2) {
          _resetSpeakerBtn();
          showToast('Lỗi phát audio', 'Bấm loa lần nữa để phát', 'warning', 4000);
        }
      });
    }
  } catch (err) {
    console.error('Murf TTS error:', err);
    _resetSpeakerBtn();
    showToast('Lỗi TTS', err.message || 'Không phát được giọng Murf', 'error', 4000);
  }
}

function _resetSpeakerBtn() {
  if (_currentSpeakerBtn) {
    _currentSpeakerBtn.classList.remove('speaking');
    _currentSpeakerBtn.title = 'Đọc tin nhắn';
  }
  _currentSpeakerBtn = null;
  if (callTTSAudio && !callTTSAudio.paused) {
    try { callTTSAudio.pause(); callTTSAudio.currentTime = 0; } catch(e){}
  }
}

async function callSpeakText(text) {
  if (!callIsTTSEnabled) return;
  const a0 = _ensureSharedAudio();
  if (callIsTTSPlaying) { try { a0.pause(); a0.currentTime = 0; } catch (e) {} }

  let cleanText = String(text || '').replace(/[#*_`~>]/g, '').trim();
  if (!cleanText) return;
  if (cleanText.length > 500) cleanText = cleanText.substring(0, 500) + '...';

  if (!MURF_API_KEY || MURF_API_KEY.length < 10) {
    showToast('Chưa có Murf key', 'Gõ /apitts murf_... để nhập key', 'warning', 4000);
    return;
  }

  callIsTTSPlaying = true;
  callIsSpeaking = true;
  callUpdateUI();

  try {
    const { url: audioUrl } = await safeSpeakMurf(cleanText);
    const audio = _ensureSharedAudio();
    try { audio.pause(); audio.currentTime = 0; } catch (e) {}
    audio.src = audioUrl;
    audio.volume = 1.0;
    audio.muted = false;
    setupGainOnce(audio);

    await new Promise((resolve, reject) => {
      audio.onended = () => {
        callIsTTSPlaying = false;
        callIsSpeaking = false;
        callUpdateUI();
        resolve();
      };
      audio.onerror = () => reject(new Error('Lỗi phát audio'));
      const p = audio.play();
      if (p && p.catch) p.catch(reject);
    });
  } catch (error) {
    console.error('Call TTS:', error);
    callIsTTSPlaying = false;
    callIsSpeaking = false;
    callUpdateUI();
    showToast('Lỗi TTS', error.message || 'Không phát được giọng Murf', 'error', 4000);
  }
}

async function camSpeakText(text) {
  if (!text) return;
  let clean = String(text).replace(/[#*_`~>]/g, '').trim();
  if (!clean) return;
  if (clean.length > 400) clean = clean.substring(0, 400) + '...';
  if (!MURF_API_KEY || MURF_API_KEY.length < 10) return;

  try {
    const { url: audioUrl } = await safeSpeakMurf(clean);
    const audio = _ensureSharedAudio();
    try { audio.pause(); audio.currentTime = 0; } catch(e){}
    audio.src = audioUrl;
    audio.volume = 1.0;
    audio.muted = false;
    setupGainOnce(audio);
    const p = audio.play();
    if (p && p.catch) p.catch((err) => {
      console.warn('Camera TTS play bị chặn:', err);
      _unlockAudioContextSync();
    });
  } catch (err) {
    console.warn('camSpeakText error:', err);
  }
}
window.camSpeakText = camSpeakText;


function updateHistoryBadge() {
  const b = document.getElementById('historyBadge');
  if (!b) return;
  const c = chats.length;
  if (c > 0) {
    b.textContent = c > 99 ? '99+' : c;
    b.style.display = 'flex';
  } else {
    b.style.display = 'none';
  }
}

function renderHistoryList() {
  const box = document.getElementById('historyList');
  if (!box) return;
  if (!chats.length) {
    box.innerHTML = '<div class="history-empty"><div class="he-ico">💬</div>Chưa có cuộc trò chuyện nào.<br>Bắt đầu chat để lưu lịch sử tự động.</div>';
    return;
  }
  box.innerHTML = chats.map(chat => {
    const dt = new Date(chat.time || Date.now());
    const ts = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' · ' +
               dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const active = chat.id === currentChatId ? ' active' : '';
    const msgCount = (chat.messages || []).length;
    return `<div class="history-item${active}" data-chat-id="${chat.id}">
      <div class="h-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
      <div class="h-body">
        <div class="h-title">${escapeHtml(chat.title || 'Cuộc trò chuyện')}</div>
        <div class="h-meta"><span>${ts}</span><span>${msgCount} tin</span></div>
      </div>
      <button class="h-del" data-del-id="${chat.id}" title="Xoá">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`;
  }).join('');

  box.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.h-del')) return;
      loadChatFromHistory(el.dataset.chatId);
    });
  });
  box.querySelectorAll('.h-del').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.delId;
      const ok = await confirmModal('Xoá cuộc trò chuyện', 'Bạn có chắc muốn xoá?');
      if (!ok) return;
      const idx = chats.findIndex(c => c.id === id);
      if (idx !== -1) {
        chats.splice(idx, 1);
        if (currentChatId === id) {
          currentChatId = chats[0] ? chats[0].id : null;
          if (!currentChatId) createNewChat();
        }
        saveChats();
        updateHistoryBadge();
        renderHistoryList();
        switchTab('ai');
        showToast('Đã xoá', 'Cuộc trò chuyện đã bị xoá', 'success', 2000);
      }
    });
  });
}

function loadChatFromHistory(id) {
  const chat = chats.find(c => c.id === id);
  if (!chat) return;
  currentChatId = id;
  saveChats();
  const overlay = document.getElementById('historyOverlay');
  if (overlay) overlay.classList.remove('open');
  switchTab('ai');
  showToast('Đã mở', chat.title, 'success', 1500);
}



function buildFusionTab() {
  const wrap = buildChatTab();
  wrap.classList.add('fusion-tab');
  const hero = wrap.querySelector('#chatHero');
  if (hero) {
    const title = hero.querySelector('.hero-title');
    const sub = hero.querySelector('.hero-sub');
    if (title) title.innerHTML = `FUSION <span class="accent">AI</span>`;
    if (sub) sub.innerHTML = `⚡ <b>Ensemble Mode</b> · Groq + Kira + Cohere + ChatAnywhere · Gemini không tham gia`;
  }
  return wrap;
}

function buildCameraTab() {
  const wrap = document.createElement('div');
  wrap.className = 'tab-content active';
  wrap.innerHTML = `
    <button class="tab-exit-btn" id="camExitBtn">✕ Đóng tab</button>
    <div class="cam-wrap">
      <div class="cam-view">
        <div class="cam-frame">
          <div class="cam-placeholder" id="camPlaceholder">
            <div class="cp-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>
            <div class="cp-title">Camera chưa bật</div>
            <div class="cp-sub">Nhấn nút bên dưới để bắt đầu</div>
          </div>
          <video id="camVideo" autoplay playsinline muted></video>
          <canvas id="camCanvas"></canvas>
          <div class="vf-flash" id="camFlash"></div>
        </div>
      </div>
      <div class="cam-info">
        <div class="cam-status-text" id="camStatusText">Sẵn sàng</div>
        <div class="cam-result-text" id="camResultText"></div>
      </div>
      <div class="cam-controls">
        <button class="ctrl-btn" id="btnCamFlip" title="Đổi camera"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
        <button class="shutter-btn" id="btnShutter" disabled></button>
        <button class="ctrl-btn" id="btnCamPower"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg></button>
      </div>
      <div class="cam-sensitivity"><span>Độ nhạy</span><input type="range" id="camSens" min="10" max="100" step="5" value="50"><span id="camSensVal">50</span></div>
    </div>`;
  return wrap;
}


function buildRunTab() {
  const wrap = document.createElement('div');
  wrap.className = 'tab-content active';
  const defaultCode = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Hello</title>
<style>body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0b10;color:#f5f7ff;font-family:system-ui;margin:0}
.card{padding:40px;border-radius:20px;background:linear-gradient(135deg,#151822,#0f1117);border:1px solid rgba(124,158,255,0.3);text-align:center}
h1{background:linear-gradient(135deg,#7c9eff,#a78bfa,#f0abfc);-webkit-background-clip:text;-webkit-text-fill-color:transparent}</style>
</head><body><div class="card"><h1>Vibe Code</h1><p>Chỉnh sửa code bên trái, xem kết quả bên phải</p></div></body></html>`;
  const savedCode = localStorage.getItem('run_code') || defaultCode;
  wrap.innerHTML = `
    <button class="tab-exit-btn" id="runExitBtn">✕ Đóng tab</button>
    <div class="run-wrap">
      <div class="run-toolbar">
        <button class="run-tool-btn primary" id="btnRunRun"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Chạy</button>
        <button class="run-tool-btn" id="btnRunExport"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button>
      </div>
      <div class="run-split">
        <div class="run-pane editor">
          <div class="run-pane-head"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span> index.html</div>
          <div class="run-editor-area">
            <div class="run-line-numbers" id="runLineNumbers"></div>
            <textarea class="run-code-input" id="runCodeInput" spellcheck="false">${escapeHtml(savedCode)}</textarea>
          </div>
        </div>
        <div class="run-pane preview">
          <div class="run-pane-head"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span> Preview</div>
          <iframe class="run-preview-frame" id="runPreviewFrame" sandbox="allow-scripts allow-modals allow-forms allow-popups"></iframe>
        </div>
      </div>
    </div>`;
  return wrap;
}


function buildComingSoonTab(tabKey) {
  const wrap = document.createElement('div');
  wrap.className = 'tab-content active';
  const slotName = tabKey === 'soon4' ? 'Slot #4' : 'Slot #5';
  wrap.innerHTML = `
    <button class="tab-exit-btn" id="soonExitBtn">✕ Đóng tab</button>
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;gap:20px;padding:40px 20px;text-align:center;">
      <div style="font-size:80px;line-height:1;filter:drop-shadow(0 0 30px rgba(124,158,255,0.6));animation:soonPulse 2.5s ease-in-out infinite;">✨</div>
      <h2 style="font-family:var(--mono);font-size:26px;background:linear-gradient(135deg,#7c9eff,#a78bfa,#f0abfc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;">
        ${slotName} — Sắp ra mắt
      </h2>
      <p style="color:var(--text-3);font-size:14px;max-width:420px;line-height:1.7;margin:0;">
        Tab này đang được để trống để chờ chức năng mới.<br>
        Sẽ sớm được cập nhật trong phiên bản tiếp theo 🚀
      </p>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;justify-content:center;">
        <button class="settings-btn primary" onclick="switchTab('ai')" style="padding:10px 20px;">💬 Về Chat</button>
        <button class="settings-btn primary" onclick="switchTab('settings')" style="padding:10px 20px;background:linear-gradient(135deg,#10b981,#34d399);">⚙️ Cài đặt</button>
      </div>
      <style>
        @keyframes soonPulse {
          0%,100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.15) rotate(5deg); opacity: 0.85; }
        }
      </style>
    </div>`;
  return wrap;
}


function buildCallTab() {
  const wrap = document.createElement('div');
  wrap.className = 'tab-content active';
  wrap.innerHTML = `
    <button class="tab-exit-btn" id="callExitBtn">✕ Đóng tab</button>
    <div class="call-wrap">
      <div class="call-stage">
        <div class="call-avatar-wrap">
          <div class="call-ring"></div><div class="call-ring"></div><div class="call-ring"></div>
          <img class="call-avatar-img" id="callAvatarImg" src="callai.png" alt="AI" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div style="display:none;width:130px;height:130px;border-radius:50%;background:linear-gradient(135deg,#7c9eff,#a78bfa,#f0abfc);align-items:center;justify-content:center;color:#fff;font-family:var(--mono);font-size:36px;font-weight:800;position:relative;z-index:2;">AI</div>
        </div>
        <div class="call-info"><div class="call-name">NPN Assistant</div><div class="call-state" id="callStateText">Sẵn sàng</div></div>
        <div class="call-bubble" id="callBubble"><span id="callBubbleContent">Chạm một lần để bắt đầu trò chuyện 🎙️</span></div>
        <div class="call-status-text" id="callStatusText">Chạm một lần để bắt đầu • AI sẽ tự nghe tiếp</div>
        <div class="call-timer" id="callTimer">0:00</div>
      </div>
      <div class="call-controls">
        <button class="call-btn" id="btnCallMute" title="Bật/Tắt mic" style="display:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>
        <button class="call-btn-main" id="btnCallMain" title="Bắt đầu trò chuyện"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/><path d="M8 22h8"/></svg></button>
        <button class="call-btn" id="btnCallTTS" title="Tắt/bật giọng" style="display:none;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg></button>
      </div>
    </div>`;
  return wrap;
}


function buildSettingsTab() {
  const wrap = document.createElement('div');
  wrap.className = 'tab-content active';
  wrap.innerHTML = `
    <button class="tab-exit-btn" id="settingsExitBtn">✕ Đóng tab</button>
    <div class="settings-wrap">
      <div class="settings-header"><div class="settings-header-title"><span class="ico">⚙️</span> Cài đặt</div></div>
      <div class="settings-body"><div class="settings-inner">
        <div class="settings-section">
          <div class="settings-section-title"><span class="ico">🎨</span> Theme giao diện Chat</div>
          <div class="settings-card">
            <div class="theme-switcher">
              <div class="theme-option ${CHAT_THEME === 'chat1' ? 'active' : ''}" data-theme="chat1"><div class="theme-preview chat1"></div><div class="theme-name">Theme 1 · Diamond</div></div>
              <div class="theme-option ${CHAT_THEME === 'chat2' ? 'active' : ''}" data-theme="chat2"><div class="theme-preview chat2"></div><div class="theme-name">Theme 2 · Vibe Code</div></div>
            </div>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title"><span class="ico">🤖</span> Provider đang dùng</div>
          <div class="settings-card cyan">
            <div class="settings-card-title">Chọn provider <span class="tag">${ACTIVE_PROVIDER}</span></div>
            <div class="filter-row" style="grid-template-columns: 1fr;">
              <select id="setProvider">
                <option value="groq" ${ACTIVE_PROVIDER === 'groq' ? 'selected' : ''}>💬 Groq</option>
                <option value="gemini" ${ACTIVE_PROVIDER === 'gemini' ? 'selected' : ''}>✨ Gemini</option>
                <option value="kira" ${ACTIVE_PROVIDER === 'kira' ? 'selected' : ''}>🐰 Kira</option>
                <option value="cohere" ${ACTIVE_PROVIDER === 'cohere' ? 'selected' : ''}>🧠 Cohere</option>
                <option value="chatanywhere" ${ACTIVE_PROVIDER === 'chatanywhere' ? 'selected' : ''}>🌐 ChatAnywhere</option>
              </select>
            </div>
            <button class="settings-btn primary" id="btnApplyProvider" style="margin-top:8px;">✅ Áp dụng</button>
            <small style="display:block;margin-top:6px;color:var(--text-3);font-size:11px;">
              Khi provider hết quota sẽ tự chuyển sang provider khác còn key.
            </small>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title"><span class="ico">🎤</span> Giọng đọc TTS (Murf)</div>
          <div class="settings-card amber">
            <div class="settings-card-title">Chọn giọng Murf <span class="tag">CALL + CHAT + CAM</span></div>
            <div class="filter-row" style="grid-template-columns: 1fr 1fr;">
              <select id="ttsVoiceLangFilter">
                <option value="all">🌐 Tất cả</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇺🇸 Tiếng Anh</option>
              </select>
              <select id="ttsVoiceGenderFilter">
                <option value="all">👥 Tất cả</option>
                <option value="female">👩 Nữ</option>
                <option value="male">👨 Nam</option>
              </select>
            </div>
            <input class="more-input" id="ttsVoiceSearch" placeholder="🔍 Tìm giọng..." style="margin-top:6px;">
            <div class="voice-grid-mini" id="ttsVoiceGrid" style="margin-top:8px;"></div>
            <small style="display:block; margin-top:6px; color:var(--text-3); font-size:11px; font-family:var(--mono);">
              <span id="ttsVoiceCount">0</span> giọng — Đang dùng: <strong id="ttsVoiceStatus" style="color:var(--accent);">${CALL_TTS_MODEL || 'vi-VN-Natalie'}</strong>
            </small>
            <div class="more-btn-row" style="margin-top:10px;">
              <button class="settings-btn primary" id="btnApplyTtsVoice" style="flex:1;">✅ Áp dụng</button>
              <button class="settings-btn primary" id="btnRefreshVoices" style="flex:1;background:linear-gradient(135deg,#10b981,#34d399);">🔄 Tải lại</button>
            </div>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title"><span class="ico">📞</span> Model Call</div>
          <div class="settings-card cyan">
            <div class="settings-card-title">Model cho cuộc gọi <span class="tag">CALL</span></div>
            <div class="settings-select-wrap"><select id="setCallModel"></select></div>
            <button class="settings-btn primary" id="btnApplyCallModel">✅ Áp dụng cho Call</button>
          </div>
        </div>
        <div class="settings-section">
          <div class="settings-section-title"><span class="ico">🎨</span> Agnes AI (Tạo Ảnh & Video)</div>
          <div class="settings-card">
            <div class="settings-card-title">Cấu hình tạo Ảnh / Video <span class="tag">${AGNES_API_KEY ? 'Đã có key' : 'Chưa có key'}</span></div>
            <div class="filter-row" style="grid-template-columns: 1fr 1fr;">
              <div>
                <label style="font-size:11px;color:var(--text-3);">Kích thước ảnh</label>
                <select id="setImageSize">
                  <option value="1024x1024" ${IMAGE_DEFAULT_SIZE === '1024x1024' ? 'selected' : ''}>1024x1024 (vuông)</option>
                  <option value="1024x768" ${IMAGE_DEFAULT_SIZE === '1024x768' ? 'selected' : ''}>1024x768 (ngang)</option>
                  <option value="768x1024" ${IMAGE_DEFAULT_SIZE === '768x1024' ? 'selected' : ''}>768x1024 (dọc)</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;color:var(--text-3);">Thời lượng video</label>
                <select id="setVideoSeconds">
                  <option value="4" ${VIDEO_DEFAULT_SECONDS === '4' ? 'selected' : ''}>4 giây</option>
                  <option value="5" ${VIDEO_DEFAULT_SECONDS === '5' ? 'selected' : ''}>5 giây</option>
                  <option value="6" ${VIDEO_DEFAULT_SECONDS === '6' ? 'selected' : ''}>6 giây</option>
                  <option value="8" ${VIDEO_DEFAULT_SECONDS === '8' ? 'selected' : ''}>8 giây</option>
                  <option value="10" ${VIDEO_DEFAULT_SECONDS === '10' ? 'selected' : ''}>10 giây</option>
                </select>
              </div>
            </div>
            <div class="filter-row" style="grid-template-columns: 1fr; margin-top:8px;">
              <div>
                <label style="font-size:11px;color:var(--text-3);">Tỷ lệ video</label>
                <select id="setVideoAspect">
                  <option value="16:9" ${VIDEO_DEFAULT_ASPECT === '16:9' ? 'selected' : ''}>16:9 (ngang)</option>
                  <option value="9:16" ${VIDEO_DEFAULT_ASPECT === '9:16' ? 'selected' : ''}>9:16 (dọc)</option>
                  <option value="1:1" ${VIDEO_DEFAULT_ASPECT === '1:1' ? 'selected' : ''}>1:1 (vuông)</option>
                  <option value="4:3" ${VIDEO_DEFAULT_ASPECT === '4:3' ? 'selected' : ''}>4:3</option>
                  <option value="3:4" ${VIDEO_DEFAULT_ASPECT === '3:4' ? 'selected' : ''}>3:4</option>
                </select>
              </div>
            </div>
            <button class="settings-btn primary" id="btnApplyAgnes" style="margin-top:10px;">✅ Áp dụng cấu hình</button>
            <small style="display:block;margin-top:6px;color:var(--text-3);font-size:11px;">
              Nhập key: gõ <code style="background:rgba(124,158,255,0.15);padding:2px 6px;border-radius:4px;font-family:var(--mono);">/apiimg sk-...</code> trong chat.
            </small>
          </div>
        </div>
      </div></div>
    </div>`;
  return wrap;
}

async function bindSettingsEvents() {
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      CHAT_THEME = opt.dataset.theme;
      localStorage.setItem('chat_theme', CHAT_THEME);
      document.querySelectorAll('.theme-option').forEach(o => o.classList.toggle('active', o.dataset.theme === CHAT_THEME));
      showToast('Đã đổi theme', CHAT_THEME === 'chat1' ? 'Diamond' : 'Vibe Code', 'success');
    });
  });

  document.getElementById('btnApplyProvider')?.addEventListener('click', async () => {
    const sel = document.getElementById('setProvider');
    if (!sel) return;
    ACTIVE_PROVIDER = sel.value;
    localStorage.setItem('active_provider', ACTIVE_PROVIDER);
    updateModelDisplay();

    if (ACTIVE_PROVIDER === 'gemini' && GEMINI_API_KEY && !GEMINI_MODELS_CACHE) {
      fetchGeminiModels().catch(() => {});
    } else if (ACTIVE_PROVIDER === 'cohere' && COHERE_API_KEY && !COHERE_MODELS_CACHE) {
      fetchCohereModels().catch(() => {});
    } else if (ACTIVE_PROVIDER === 'chatanywhere') {
      fetchChatAnywhereModels();
    } else if (ACTIVE_PROVIDER === 'groq' && GROQ_API_KEY && !GROQ_MODELS_CACHE) {
      fetchGroqModels(GROQ_API_KEY).catch(() => {});
    }

    try {
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ activeProvider: ACTIVE_PROVIDER });
    } catch (e) { console.warn(e); }

    showToast('Đã đổi provider', PROVIDER_LABELS[ACTIVE_PROVIDER], 'success');
  });

  document.getElementById('btnApplyAgnes')?.addEventListener('click', () => {
    IMAGE_DEFAULT_SIZE = document.getElementById('setImageSize')?.value || '1024x768';
    VIDEO_DEFAULT_SECONDS = document.getElementById('setVideoSeconds')?.value || '5';
    VIDEO_DEFAULT_ASPECT = document.getElementById('setVideoAspect')?.value || '16:9';
    localStorage.setItem('image_default_size', IMAGE_DEFAULT_SIZE);
    localStorage.setItem('video_default_seconds', VIDEO_DEFAULT_SECONDS);
    localStorage.setItem('video_default_aspect', VIDEO_DEFAULT_ASPECT);
    showToast('Đã lưu', `Ảnh: ${IMAGE_DEFAULT_SIZE} · Video: ${VIDEO_DEFAULT_SECONDS}s ${VIDEO_DEFAULT_ASPECT}`, 'success');
  });

  const apiKey = GROQ_API_KEY || localStorage.getItem('groq_key');
  const models = await fetchGroqModels(apiKey);
  const callSel = document.getElementById('setCallModel');
  if (models && models.length && callSel) {
    const opts = models.map(m => {
      const type = classifyModelId(m.id);
      return `<option value="${m.id}">${modelEmoji(type)} ${escapeHtml(m.id)}</option>`;
    }).join('');
    callSel.innerHTML = opts;
    callSel.value = CALL_MODEL;
  }
  document.getElementById('btnApplyCallModel')?.addEventListener('click', () => {
    CALL_MODEL = callSel.value;
    localStorage.setItem('call_model', CALL_MODEL);
    showToast('Đã áp dụng cho Call', CALL_MODEL, 'success');
  });

  ensureDefaultVoice();
  const voices = await fetchMurfVoices();

  async function renderTtsVoiceGrid() {
    const grid = document.getElementById('ttsVoiceGrid');
    const countEl = document.getElementById('ttsVoiceCount');
    if (!grid) return;
    const langFilter = document.getElementById('ttsVoiceLangFilter')?.value || 'all';
    const genderFilter = document.getElementById('ttsVoiceGenderFilter')?.value || 'all';
    const search = (document.getElementById('ttsVoiceSearch')?.value || '').toLowerCase().trim();
    let filtered = voices.filter(v => {
      if (langFilter !== 'all' && v.language !== langFilter) return false;
      if (genderFilter !== 'all' && v.gender !== genderFilter) return false;
      if (search && !v.name.toLowerCase().includes(search)) return false;
      return true;
    });
    if (countEl) countEl.textContent = filtered.length;
    grid.innerHTML = filtered.map(v => `
      <div class="voice-item-mini ${v.id === CALL_TTS_MODEL ? 'active' : ''}" data-voice="${v.id}">
        <span class="flag">${v.flag || '🌐'}</span>
        <span class="name">${escapeHtml(v.name.slice(0, 14))}</span>
        <span class="gender-icon">${v.gender === 'male' ? '👨' : '👩'}${MURF_WORKING_VOICES.includes(v.id) ? ' ✓' : ''}</span>
      </div>
    `).join('');
    grid.querySelectorAll('.voice-item-mini').forEach(el => {
      el.addEventListener('click', () => {
        CALL_TTS_MODEL = el.dataset.voice;
        localStorage.setItem('call_tts_model', CALL_TTS_MODEL);
        renderTtsVoiceGrid();
        const status = document.getElementById('ttsVoiceStatus');
        const voice = voices.find(v => v.id === CALL_TTS_MODEL);
        if (status) status.textContent = voice ? voice.name : CALL_TTS_MODEL;
      });
    });
  }
  renderTtsVoiceGrid();
  document.getElementById('ttsVoiceLangFilter')?.addEventListener('change', renderTtsVoiceGrid);
  document.getElementById('ttsVoiceGenderFilter')?.addEventListener('change', renderTtsVoiceGrid);
  document.getElementById('ttsVoiceSearch')?.addEventListener('input', renderTtsVoiceGrid);
  document.getElementById('btnRefreshVoices')?.addEventListener('click', async () => {
    showToast('Đang tải', 'Đang tải danh sách giọng từ Murf...', 'info', 2000);
    const fresh = await fetchMurfVoices(true);
    voices.length = 0;
    fresh.forEach(v => voices.push(v));
    renderTtsVoiceGrid();
    showToast('Thành công', 'Đã tải ' + fresh.length + ' giọng', 'success', 2500);
  });
  document.getElementById('btnApplyTtsVoice')?.addEventListener('click', () => {
    localStorage.setItem('call_tts_model', CALL_TTS_MODEL);
    const voice = voices.find(v => v.id === CALL_TTS_MODEL);
    showToast('Đã đổi giọng', voice ? voice.name : CALL_TTS_MODEL, 'success', 3000);
  });
}

/* ============================================================
   SWITCH TAB
   ============================================================ */
function switchTab(tab) {
  currentTab = tab;
  const main = document.getElementById('mainArea');
  const lyraC = document.getElementById('lyraContainer');
  const ytC = document.getElementById('youtubeTabContainer');
  if (lyraC) lyraC.classList.remove('active');
  if (ytC) { ytC.classList.remove('active'); ytC.style.display = 'none'; }
  if (typeof window.__cameraStop === 'function' && tab !== 'camera') window.__cameraStop();
  if (callActive && tab !== 'call') callEnd();

  main.innerHTML = '';
  if (tab === 'ai') main.appendChild(buildChatTab());
  else if (tab === 'fusion') main.appendChild(buildFusionTab());
  else if (tab === 'camera') main.appendChild(buildCameraTab());
  else if (tab === 'run') main.appendChild(buildRunTab());
  else if (tab === 'call') main.appendChild(buildCallTab());
  else if (tab === 'settings') main.appendChild(buildSettingsTab());
  else if (tab === 'soon4' || tab === 'soon5') main.appendChild(buildComingSoonTab(tab));
  bindTabEvents(tab);
  setTimeout(updateHistoryBadge, 50);
}

function bindTabEvents(tab) {
  const tabBtn = document.getElementById('tabBtn');
  const tabDropdown = document.getElementById('tabDropdown');
  const tabMenu = document.getElementById('tabMenu');
  const mediaBtn = document.getElementById('mediaBtn');
  const mediaDropdown = document.getElementById('mediaDropdown');
  const mediaMenu = document.getElementById('mediaMenu');

  if (tabBtn && tabDropdown && tabMenu) {
    tabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mediaDropdown?.classList.remove('open');
      tabDropdown.classList.toggle('open');
    });
    tabMenu.querySelectorAll('.tab-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const num = parseInt(item.dataset.tab);
        tabDropdown.classList.remove('open');
        const map = { 1: 'ai', 2: 'camera', 3: 'run', 4: 'fusion', 5: 'soon5', 6: 'call', 7: 'settings' };
        switchTab(map[num]);
      });
    });
  }

  if (mediaBtn && mediaDropdown && mediaMenu) {
    mediaBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tabDropdown?.classList.remove('open');
      mediaDropdown.classList.toggle('open');
    });

    mediaMenu.querySelectorAll('.tab-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const kind = item.dataset.media;

        if (kind === 'image') {
          IMAGE_MODE_ENABLED = !IMAGE_MODE_ENABLED;
          localStorage.setItem('image_mode_enabled', IMAGE_MODE_ENABLED);
          if (IMAGE_MODE_ENABLED && VIDEO_MODE_ENABLED) {
            VIDEO_MODE_ENABLED = false;
            localStorage.setItem('video_mode_enabled', false);
          }
          item.classList.toggle('active', IMAGE_MODE_ENABLED);
          mediaMenu.querySelector('[data-media="video"]')?.classList.toggle('active', VIDEO_MODE_ENABLED);
          showToast(
            IMAGE_MODE_ENABLED ? 'Bật tạo Ảnh' : 'Tắt tạo Ảnh',
            IMAGE_MODE_ENABLED ? 'Chat sẽ tạo ảnh từ mô tả của bạn' : 'Chat bình thường',
            IMAGE_MODE_ENABLED ? 'success' : 'info'
          );
        } else if (kind === 'video') {
          VIDEO_MODE_ENABLED = !VIDEO_MODE_ENABLED;
          localStorage.setItem('video_mode_enabled', VIDEO_MODE_ENABLED);
          if (VIDEO_MODE_ENABLED && IMAGE_MODE_ENABLED) {
            IMAGE_MODE_ENABLED = false;
            localStorage.setItem('image_mode_enabled', false);
          }
          item.classList.toggle('active', VIDEO_MODE_ENABLED);
          mediaMenu.querySelector('[data-media="image"]')?.classList.toggle('active', IMAGE_MODE_ENABLED);
          showToast(
            VIDEO_MODE_ENABLED ? 'Bật tạo Video' : 'Tắt tạo Video',
            VIDEO_MODE_ENABLED ? 'Chat sẽ tạo video (mất ~1 phút)' : 'Chat bình thường',
            VIDEO_MODE_ENABLED ? 'success' : 'info'
          );
        }

        updateComposerHint();
        mediaDropdown.classList.remove('open');
      });
    });
  }

  document.addEventListener('click', () => {
    tabDropdown?.classList.remove('open');
    document.getElementById('mediaDropdown')?.classList.remove('open');
  });

  if (tab === 'ai' || tab === 'fusion') {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('btnSend');
    const webBtn = document.getElementById('btnWebSearch');
    const attachBtn = document.getElementById('btnAttach');
    const fileInput = document.getElementById('fileInput');
    const newChatBtn = document.getElementById('btnNewChat');
    const historyBtn = document.getElementById('btnHistory');

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 180) + 'px';
      });
    }
    if (webBtn) {
      webBtn.addEventListener('click', () => {
        webSearchEnabled = !webSearchEnabled;
        webBtn.classList.toggle('active', webSearchEnabled);
        showToast(webSearchEnabled ? 'Đã bật' : 'Đã tắt', webSearchEnabled ? 'Luôn tra Google' : 'Chỉ tra khi cần thiết', webSearchEnabled ? 'success' : 'info');
      });
    }
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
    }
    if (newChatBtn) {
      newChatBtn.addEventListener('click', async () => {
        const ok = await confirmModal('Chat mới', 'Bắt đầu cuộc trò chuyện mới?');
        if (!ok) return;
        createNewChat();
        switchTab('ai');
      });
    }
    if (historyBtn) {
      updateHistoryBadge();
      historyBtn.addEventListener('click', () => {
        renderHistoryList();
        document.getElementById('historyOverlay').classList.add('open');
      });
    }
  }

  if (tab === 'fusion') {
    // Fusion reuses the standard chat composer and history.
  }
  if (tab === 'run') {
    document.getElementById('runExitBtn')?.addEventListener('click', () => switchTab('ai'));
    initRunTab();
  }
  if (tab === 'camera') {
    document.getElementById('camExitBtn')?.addEventListener('click', () => {
      if (typeof window.__cameraStop === 'function') window.__cameraStop();
      switchTab('ai');
    });
    initCameraTab();
  }
  if (tab === 'call') {
    document.getElementById('callExitBtn')?.addEventListener('click', () => {
      if (callActive) callEnd();
      switchTab('ai');
    });
    bindCallEvents();
  }
  if (tab === 'settings') {
    document.getElementById('settingsExitBtn')?.addEventListener('click', () => switchTab('ai'));
    bindSettingsEvents();
  }
  if (tab === 'soon4' || tab === 'soon5') {
    document.getElementById('soonExitBtn')?.addEventListener('click', () => switchTab('ai'));
  }
}


function initRunTab() {
  const codeInput = document.getElementById('runCodeInput');
  const frame = document.getElementById('runPreviewFrame');
  const lineNumbers = document.getElementById('runLineNumbers');
  if (!codeInput || !frame || !lineNumbers) return;
  const lines = codeInput.value.split('\n').length;
  lineNumbers.innerHTML = '';
  for (let i = 1; i <= lines; i++) {
    const d = document.createElement('div');
    d.className = 'ln'; d.textContent = i;
    lineNumbers.appendChild(d);
  }
  frame.srcdoc = codeInput.value;
  codeInput.addEventListener('input', () => {
    localStorage.setItem('run_code', codeInput.value);
    const ln = codeInput.value.split('\n').length;
    if (lineNumbers.children.length !== ln) {
      lineNumbers.innerHTML = '';
      for (let i = 1; i <= ln; i++) {
        const d = document.createElement('div');
        d.className = 'ln'; d.textContent = i;
        lineNumbers.appendChild(d);
      }
    }
  });
  codeInput.addEventListener('scroll', () => { lineNumbers.scrollTop = codeInput.scrollTop; });
  document.getElementById('btnRunRun')?.addEventListener('click', () => { frame.srcdoc = codeInput.value; });
  document.getElementById('btnRunExport')?.addEventListener('click', () => {
    const blob = new Blob([codeInput.value], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'index.html'; a.click();
    URL.revokeObjectURL(url);
    showToast('Thành công', 'Đã tải xuống', 'success');
  });
}


function initCameraTab() {
  let stream = null;
  let isCameraOn = false;
  let isFrozen = false;
  let facingMode = 'environment';
  let sensitivity = 50;
  let snappedCanvas = null;
  let lastBoxes = [];
  let rainbowRAF = 0;

  function setStatus(text) {
    const el = document.getElementById('camStatusText');
    if (el) el.textContent = text;
  }
  function setResult(text) {
    const el = document.getElementById('camResultText');
    if (el) el.textContent = text;
  }

  async function openStream(mode) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Không hỗ trợ camera');
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      });
    } catch (_) {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
  }

  async function startCamera() {
    if (isCameraOn) return;
    const video = document.getElementById('camVideo');
    const canvas = document.getElementById('camCanvas');
    const placeholder = document.getElementById('camPlaceholder');
    const shutter = document.getElementById('btnShutter');
    if (!video || !canvas) return;
    try {
      stream = await openStream(facingMode);
      video.srcObject = stream;
      video.muted = true;
      await video.play().catch(() => {});
      await new Promise(resolve => {
        if (video.videoWidth > 0) resolve();
        else video.addEventListener('loadedmetadata', resolve, { once: true });
      });
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 960;
      if (facingMode === 'user') { video.classList.add('mirrored'); canvas.classList.add('mirrored'); }
      isCameraOn = true;
      isFrozen = false;
      if (placeholder) placeholder.style.display = 'none';
      setStatus('Sẵn sàng! Bấm nút chụp');
      setResult('');
      if (shutter) shutter.disabled = false;
    } catch (e) {
      console.error('Camera error:', e);
      setStatus('❌ Không mở được camera');
      setResult(e.message);
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rainbowRAF);
    rainbowRAF = 0;
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    const video = document.getElementById('camVideo');
    if (video) video.srcObject = null;
    isCameraOn = false;
    isFrozen = false;
    snappedCanvas = null;
    lastBoxes = [];
    const canvas = document.getElementById('camCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const placeholder = document.getElementById('camPlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
    const shutter = document.getElementById('btnShutter');
    if (shutter) shutter.disabled = true;
    setStatus('Camera đã tắt');
    setResult('');
  }
  window.__cameraStop = stopCamera;

  function capture() {
    const video = document.getElementById('camVideo');
    const canvas = document.getElementById('camCanvas');
    const flash = document.getElementById('camFlash');
    if (!isCameraOn || isFrozen || !video || !canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const snap = document.createElement('canvas');
    snap.width = w; snap.height = h;
    const sctx = snap.getContext('2d');
    if (facingMode === 'user') {
      sctx.save(); sctx.translate(w, 0); sctx.scale(-1, 1);
      sctx.drawImage(video, 0, 0, w, h); sctx.restore();
    } else sctx.drawImage(video, 0, 0, w, h);
    snappedCanvas = snap;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(snappedCanvas, 0, 0, w, h);
    isFrozen = true;
    if (flash) { flash.classList.add('fire'); setTimeout(() => flash.classList.remove('fire'), 100); }
    setStatus('🔍 Đang phát hiện vật thể...');
    setTimeout(() => {
      try { analyzeForeground(); } catch (e) { console.error(e); }
    }, 0);
  }

  function analyzeForeground() {
    if (!snappedCanvas) return;
    const W = snappedCanvas.width, H = snappedCanvas.height;
    const MAX = 320;
    const scale = Math.max(1, Math.ceil(Math.max(W, H) / MAX));
    const sw = Math.max(40, Math.floor(W / scale));
    const sh = Math.max(40, Math.floor(H / scale));
    const work = document.createElement('canvas');
    work.width = sw; work.height = sh;
    const wctx = work.getContext('2d', { willReadFrequently: true });
    wctx.drawImage(snappedCanvas, 0, 0, sw, sh);
    const data = wctx.getImageData(0, 0, sw, sh).data;
    const samples = [];
    const bw = Math.max(5, Math.floor(sw * 0.06));
    const bh = Math.max(5, Math.floor(sh * 0.06));
    const addPatch = (x0, y0, x1, y1) => {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
        const i = (y * sw + x) * 4; r += data[i]; g += data[i+1]; b += data[i+2]; n++;
      }
      if (n) samples.push([r / n, g / n, b / n]);
    };
    addPatch(0, 0, sw, bh); addPatch(0, sh - bh, sw, sh);
    addPatch(0, 0, bw, sh); addPatch(sw - bw, 0, sw, sh);
    const bg = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const vals = samples.map(s => s[c]).sort((a, b) => a - b);
      bg[c] = vals[Math.floor(vals.length / 2)] || 0;
    }
    const mask = new Uint8Array(sw * sh);
    const threshold = 18 + Math.max(0, Math.min(100, sensitivity)) * 1.05;
    for (let y = 1; y < sh - 1; y++) {
      for (let x = 1; x < sw - 1; x++) {
        const i = (y * sw + x) * 4;
        const dr = data[i] - bg[0], dg = data[i+1] - bg[1], db = data[i+2] - bg[2];
        mask[y * sw + x] = (dr * dr + dg * dg + db * db) > threshold * threshold ? 1 : 0;
      }
    }
    const clean = new Uint8Array(mask.length);
    for (let y = 1; y < sh - 1; y++) for (let x = 1; x < sw - 1; x++) {
      const idx = y * sw + x;
      if (!mask[idx]) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (mask[(y + dy) * sw + (x + dx)]) n++;
      if (n >= 3) clean[idx] = 1;
    }
    const blobs = findComponents(clean, sw, sh);
    const frameArea = sw * sh;
    const minArea = Math.max(18, frameArea * 0.0012);
    const maxArea = frameArea * 0.92;
    let boxes = blobs.filter(b => b.area >= minArea && b.area <= maxArea && b.w >= 4 && b.h >= 4);
    boxes = mergeNearby(boxes, Math.max(3, Math.round(sw * 0.025)));
    boxes.sort((a, b) => b.area - a.area);
    boxes = boxes.slice(0, 12);
    lastBoxes = boxes.map(b => ({
      x: Math.max(0, b.x * scale), y: Math.max(0, b.y * scale),
      w: Math.min(W - b.x * scale, b.w * scale), h: Math.min(H - b.y * scale, b.h * scale)
    })).filter(b => b.w > 4 && b.h > 4);
    drawBaseAndBoxes();
    if (lastBoxes.length) {
      setStatus('🌈 Vẽ ' + lastBoxes.length + ' khung vật thể');
      setResult('Phát hiện ' + lastBoxes.length + ' vùng · Độ nhạy ' + sensitivity);
      animateRainbow();
      setTimeout(() => recognizeCameraImage(), 0);
    } else {
      setStatus('🟢 Không thấy vật thể khác nền');
      setResult('🌈 ESP không tìm thấy vùng khác nền · 🤖 đang nhận diện AI...');
      setTimeout(() => recognizeCameraImage(), 0);
    }
  }

  function findComponents(mask, w, h) {
    const seen = new Uint8Array(w * h);
    const boxes = [];
    const stack = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (!mask[start] || seen[start]) continue;
      seen[start] = 1; stack.length = 0; stack.push(start);
      let minX = x, maxX = x, minY = y, maxY = y, area = 0;
      while (stack.length) {
        const cur = stack.pop();
        const cy = (cur / w) | 0, cx = cur - cy * w;
        area++;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        if (cx > 0 && mask[cur - 1] && !seen[cur - 1]) { seen[cur - 1] = 1; stack.push(cur - 1); }
        if (cx < w - 1 && mask[cur + 1] && !seen[cur + 1]) { seen[cur + 1] = 1; stack.push(cur + 1); }
        if (cy > 0 && mask[cur - w] && !seen[cur - w]) { seen[cur - w] = 1; stack.push(cur - w); }
        if (cy < h - 1 && mask[cur + w] && !seen[cur + w]) { seen[cur + w] = 1; stack.push(cur + w); }
      }
      boxes.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, area });
    }
    return boxes;
  }

  function mergeNearby(boxes, gap) {
    const out = [];
    for (const b0 of boxes) {
      let b = { ...b0 };
      let merged = true;
      while (merged) {
        merged = false;
        for (let i = 0; i < out.length; i++) {
          if (touchOrNear(out[i], b, gap)) { b = union(out[i], b); out.splice(i, 1); merged = true; break; }
        }
      }
      out.push(b);
    }
    return out;
  }
  function touchOrNear(a, b, gap) {
    const ax = a.x + a.w, ay = a.y + a.h, bx = b.x + b.w, by = b.y + b.h;
    const gx = Math.max(0, Math.max(a.x, b.x) - Math.min(ax, bx));
    const gy = Math.max(0, Math.max(a.y, b.y) - Math.min(ay, by));
    return gx <= gap && gy <= gap;
  }
  function union(a, b) {
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    const x2 = Math.max(a.x + a.w, b.x + b.w), y2 = Math.max(a.y + a.h, b.y + b.h);
    return { x, y, w: x2 - x, h: y2 - y, area: a.area + b.area };
  }

  function drawBaseAndBoxes() {
    if (!snappedCanvas) return;
    const canvas = document.getElementById('camCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snappedCanvas, 0, 0, canvas.width, canvas.height);
    drawBoxes(ctx, lastBoxes, performance.now());
  }

  function drawBoxes(ctx, boxes, time) {
    const canvas = document.getElementById('camCanvas');
    const W = canvas.width;
    boxes.forEach((b, i) => {
      const hue = (time * 0.08 + i * 70) % 360;
      const color = `hsl(${hue},100%,60%)`;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, W / 420);
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    });
  }

  function animateRainbow() {
    cancelAnimationFrame(rainbowRAF);
    const canvas = document.getElementById('camCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const loop = (t) => {
      if (!isFrozen || !lastBoxes.length) { rainbowRAF = 0; return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(snappedCanvas, 0, 0, canvas.width, canvas.height);
      drawBoxes(ctx, lastBoxes, t);
      rainbowRAF = requestAnimationFrame(loop);
    };
    rainbowRAF = requestAnimationFrame(loop);
  }

  async function recognizeCameraImage() {
    if (!snappedCanvas) return;
    const key = GROQ_API_KEY || localStorage.getItem('groq_key');
    if (!key || key.length < 10) {
      setStatus('🌈 Đã vẽ khung · chưa có API AI');
      setResult('Đã chụp và vẽ khung · gõ /api gsk_... để nhập key');
      return;
    }
    try {
      setResult('🌈 Đã vẽ khung · 🤖 đang nhận diện...');
      const imageData = snappedCanvas.toDataURL('image/jpeg', 0.78);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: CAMERA_VISION_MODEL,
          messages: [
            { role: 'system', content: 'Bạn là En nờ, AI nhận diện vật thể. Trả lời ngắn gọn bằng tiếng Việt.' },
            { role: 'user', content: [
              { type: 'text', text: 'Trong ảnh có vật thể gì?' },
              { type: 'image_url', image_url: { url: imageData } }
            ]}
          ],
          temperature: 0.1,
          max_completion_tokens: 80
        })
      });
      if (!response.ok) throw new Error('Vision ' + response.status);
      const data = await response.json();
      let objectName = data?.choices?.[0]?.message?.content?.trim() || '';
      objectName = objectName.replace(/^```[\s\S]*?\n|```$/g, '')
                             .replace(/^đây là\s*/i, '')
                             .replace(/^vật thể là\s*/i, '')
                             .trim();
      if (!objectName) throw new Error('AI không xác định được');
      setStatus('🤖 ' + objectName);
      setResult('🌈 Đã vẽ khung · 🤖 Trong ảnh là: ' + objectName);

      if (MURF_API_KEY && MURF_API_KEY.length > 10) {
        try {
          await camSpeakText('Trong ảnh có ' + objectName);
        } catch (e) {
          console.warn('Camera TTS:', e);
        }
      }
    } catch (e) {
      console.error('Camera Vision:', e);
      setResult('🌈 ESP hoạt động · ⚠️ AI: ' + (e.message || 'không nhận diện được'));
    }
  }

  document.getElementById('btnCamPower')?.addEventListener('click', () => {
    unlockAudioSync();
    isCameraOn ? stopCamera() : startCamera();
  });
  document.getElementById('btnShutter')?.addEventListener('click', () => {
    unlockAudioSync();
    capture();
  });
  document.getElementById('btnCamFlip')?.addEventListener('click', () => {
    unlockAudioSync();
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    const video = document.getElementById('camVideo');
    const canvas = document.getElementById('camCanvas');
    if (video) video.classList.toggle('mirrored', facingMode === 'user');
    if (canvas) canvas.classList.toggle('mirrored', facingMode === 'user');
    if (isCameraOn) { stopCamera(); setTimeout(startCamera, 200); }
  });
  document.getElementById('camSens')?.addEventListener('input', (e) => {
    sensitivity = Number(e.target.value);
    const v = document.getElementById('camSensVal');
    if (v) v.textContent = sensitivity;
  });
}

/* ============================================================
   CALL
   ============================================================ */
const MURF_FALCON_VOICE_MAP = {
  Natalie: "en-US-natalie", Ruby: "en-UK-ruby", Amara: "en-US-amara",
  Maverick: "en-US-maverick"
};
function getMurfFalconVoiceId(voiceId) { return MURF_FALCON_VOICE_MAP[voiceId] || voiceId; }

async function murfGenerateFallback(key, voiceId, text) {
  const response = await fetch('https://api.murf.ai/v1/speech/generate', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ voiceId, text, locale: 'vi-VN' })
  });
  if (!response.ok) throw new Error('Murf HTTP ' + response.status);
  const data = await response.json();
  const audioData = data.audioFile || data.audioUrl || data.audio;
  if (!audioData) throw new Error('Murf không trả audio');
  if (audioData.startsWith('data:audio') || audioData.includes('base64')) {
    const base64Data = audioData.split(',')[1] || audioData;
    const byteCharacters = atob(base64Data);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
    return URL.createObjectURL(new Blob([byteArray], { type: 'audio/mpeg' }));
  }
  return audioData;
}

async function murfStreamOrFallback(key, voiceId, text) {
  const falconVoiceId = getMurfFalconVoiceId(voiceId);
  try {
    const response = await fetch('https://global.api.murf.ai/v1/speech/stream', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', 'Accept': '*/*' },
      body: JSON.stringify({
        voiceId: falconVoiceId, text, model: 'falcon-2',
        locale: 'vi-VN', format: 'MP3', channelType: 'MONO', sampleRate: 24000
      })
    });
    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const chunks = [];
      let totalBytes = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value && value.byteLength) { chunks.push(value); totalBytes += value.byteLength; }
      }
      if (totalBytes > 0) return URL.createObjectURL(new Blob(chunks, { type: 'audio/mpeg' }));
    }
    if (response.status !== 406 && response.status !== 400 && response.status !== 422) {
      throw new Error(`Murf HTTP ${response.status}`);
    }
  } catch (e) {
    if (!/HTTP 40[0-9]|HTTP 422|Failed to fetch/.test(e.message)) {
      console.warn('Murf stream error (sẽ fallback):', e.message);
    }
  }
  return await murfGenerateFallback(key, voiceId, text);
}

async function callAskAI(prompt, history = []) {
  const apiKey = GROQ_API_KEY || localStorage.getItem("groq_key");
  if (!apiKey || apiKey.length < 10) throw new Error('❌ Chưa có API AI. Gõ /api gsk_... để nhập.');
  const model = CALL_MODEL || GROQ_MODEL || "openai/gpt-oss-120b";
  const systemMsg = `Bạn là En nờ, trợ lý AI thông minh, lễ phép. Gọi người dùng là "cậu chủ". Trả lời ngắn gọn, tự nhiên. KHÔNG xưng "Em" hoặc "tôi".`;
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemMsg }, ...history, { role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 256
    })
  });
  if (!response.ok) throw new Error('Call Model lỗi (' + response.status + ')');
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

function callUpdateUI() {
  const mainBtn = document.getElementById('btnCallMain');
  const statusText = document.getElementById('callStatusText');
  const muteBtn = document.getElementById('btnCallMute');
  const ttsBtn = document.getElementById('btnCallTTS');
  if (!mainBtn) return;

  if (callIsListening) {
    mainBtn.className = 'call-btn-main listening';
    statusText && (statusText.textContent = '🎙️ Đang nghe... Cứ nói tự nhiên, im lặng là AI tự xử lý');
  } else if (callIsSpeaking) {
    mainBtn.className = 'call-btn-main speaking';
    statusText && (statusText.textContent = '🔊 Đang nói...');
  } else if (callIsProcessing) {
    mainBtn.className = 'call-btn-main thinking';
    statusText && (statusText.textContent = '🧠 Đang suy nghĩ...');
  } else {
    mainBtn.className = 'call-btn-main';
    statusText && (statusText.textContent = callIsMuted ? '🔇 Mic đã tắt' : (callActive ? 'Chờ bạn nói... AI sẽ tự nghe tiếp' : 'Chạm một lần để bắt đầu trò chuyện'));
  }

  if (muteBtn) {
    if (callIsMuted) {
      muteBtn.classList.add('muted');
      muteBtn.title = 'Bật mic';
      muteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>`;
    } else {
      muteBtn.classList.remove('muted');
      muteBtn.title = 'Tắt mic';
      muteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>`;
    }
  }

  if (ttsBtn) ttsBtn.style.color = callIsTTSEnabled ? 'var(--green)' : 'var(--text-3)';
}

function callCleanupVAD() {
  if (callVADAnimation) { cancelAnimationFrame(callVADAnimation); callVADAnimation = null; }
  try { if (callVADSource) callVADSource.disconnect(); } catch (e) {}
  try { if (callVADContext) callVADContext.close(); } catch (e) {}
  callVADSource = null;
  callVADContext = null;
  callVADStream = null;
  callSpeechStartedAt = 0;
  callLastVoiceAt = 0;
  callListenStartedAt = 0;
}

function callArmVAD(stream, recorder) {
  callCleanupVAD();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    callVADContext = ctx;
    callVADSource = source;
    callVADStream = stream;
    const data = new Uint8Array(analyser.fftSize);
    const started = performance.now();
    callListenStartedAt = started;
    let speechSeen = false;
    let lastVoice = started;
    const SILENCE_MS = 1050;
    const MIN_SPEECH_MS = 260;
    const MAX_UTTERANCE_MS = 14000;
    const INITIAL_TIMEOUT_MS = 9000;
    const VOICE_THRESHOLD = 0.032;

    const tick = () => {
      if (!callWhisperRecording || !callActive || callIsMuted || callIsProcessing) {
        callCleanupVAD();
        return;
      }
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const now = performance.now();
      const voice = rms > VOICE_THRESHOLD;
      if (voice) {
        if (!speechSeen) callSpeechStartedAt = now;
        speechSeen = true;
        lastVoice = now;
        callLastVoiceAt = now;
      }

      if (speechSeen && now - lastVoice >= SILENCE_MS && now - callSpeechStartedAt >= MIN_SPEECH_MS) {
        callCleanupVAD();
        try { if (recorder.state !== 'inactive') recorder.stop(); } catch (e) {}
        return;
      }
      if (!speechSeen && now - started >= INITIAL_TIMEOUT_MS) {
        callCleanupVAD();
        try { if (recorder.state !== 'inactive') recorder.stop(); } catch (e) {}
        return;
      }
      if (now - started >= MAX_UTTERANCE_MS) {
        callCleanupVAD();
        try { if (recorder.state !== 'inactive') recorder.stop(); } catch (e) {}
        return;
      }
      callVADAnimation = requestAnimationFrame(tick);
    };
    callVADAnimation = requestAnimationFrame(tick);
  } catch (e) {
    console.warn('Call VAD unavailable:', e);
  }
}

async function callStartListening() {
  if (!callActive || callIsMuted || callIsProcessing || callIsSpeaking) return;
  if (callWhisperRecording) return;

  const apiKey = GROQ_API_KEY || localStorage.getItem('groq_key');
  if (!apiKey || apiKey.length < 10) {
    const st = document.getElementById('callStatusText');
    if (st) st.textContent = '❌ Chưa có API AI. Gõ /api gsk_... để nhập.';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000, sampleSize: 16 }
    });
    let mimeType = '';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
    else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
    else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';

    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    callWhisperRecorder = recorder;
    callWhisperChunks = chunks;
    callWhisperRecording = true;
    callIsListening = true;
    callUpdateUI();

    recorder.onstop = async () => {
      callCleanupVAD();
      callWhisperRecording = false;
      callWhisperRecorder = null;
      stream.getTracks().forEach(t => t.stop());
      callIsListening = false;
      callUpdateUI();

      try {
        let blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 1200) {
          if (callActive && !callIsMuted && !callIsProcessing) callScheduleAutoListen(180);
          return;
        }
        blob = await processAudioForWhisper(blob);
        const file = new File([blob], 'voice.webm', { type: blob.type });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', WHISPER_MODEL);
        formData.append('language', 'vi');
        formData.append('response_format', 'json');
        formData.append('temperature', '0');
        formData.append('prompt', WHISPER_PROMPT_VI);

        callIsProcessing = true;
        callUpdateUI();
        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST', headers: { 'Authorization': 'Bearer ' + apiKey }, body: formData
        });
        if (!res.ok) {
          const st = document.getElementById('callStatusText');
          if (st) st.textContent = '❌ Whisper lỗi: ' + res.status;
          callIsProcessing = false;
          callUpdateUI();
          callScheduleAutoListen(300);
          return;
        }
        const data = await res.json();
        const text = (data.text || '').trim();
        callIsProcessing = false;
        if (text && callActive && !callIsMuted) {
          const bc = document.getElementById('callBubbleContent');
          if (bc) bc.textContent = `🎙️ ${text}`;
          callSendMessage(text);
        } else if (callActive && !callIsMuted) {
          callScheduleAutoListen(180);
        } else {
          callUpdateUI();
        }
      } catch (err) {
        callIsProcessing = false;
        callUpdateUI();
        console.warn('Whisper exception:', err);
        if (callActive && !callIsMuted) callScheduleAutoListen(500);
      }
    };

    recorder.onerror = () => {
      callCleanupVAD();
      callWhisperRecording = false;
      callWhisperRecorder = null;
      stream.getTracks().forEach(t => t.stop());
      callIsListening = false;
      callUpdateUI();
      if (callActive && !callIsMuted) callScheduleAutoListen(500);
    };

    recorder.start(120);
    callArmVAD(stream, recorder);
    const st = document.getElementById('callStatusText');
    if (st) st.textContent = '🎙️ Đang nghe... cứ nói, im lặng là tự gửi';
    const bc = document.getElementById('callBubbleContent');
    if (bc) bc.textContent = '🎙️ Đang lắng nghe...';
  } catch (err) {
    callCleanupVAD();
    callWhisperRecording = false;
    callWhisperRecorder = null;
    callIsListening = false;
    callUpdateUI();
    if (err.name === 'NotAllowedError') showToast('Lỗi mic', 'Bạn đã từ chối quyền micro', 'error');
    else showToast('Lỗi mic', err.message, 'error');
  }
}

function callScheduleAutoListen(delay = 250) {
  if (callAutoListenTimer) clearTimeout(callAutoListenTimer);
  if (!callActive || callIsMuted) return;
  callAutoListenTimer = setTimeout(() => {
    callAutoListenTimer = null;
    if (callActive && !callIsMuted && !callIsProcessing && !callIsSpeaking && !callWhisperRecording) callStartListening();
  }, delay);
}

function callStopListening() {
  if (callAutoListenTimer) { clearTimeout(callAutoListenTimer); callAutoListenTimer = null; }
  callCleanupVAD();
  if (callWhisperRecorder && callWhisperRecording) {
    try { callWhisperRecorder.stop(); } catch (e) {}
  }
  callWhisperRecording = false;
  callIsListening = false;
  callUpdateUI();
}

async function callSendMessage(text) {
  if (callIsProcessing || !callActive) return;
  callIsProcessing = true;
  callChatHistory.push({ role: 'user', content: text });
  callUpdateUI();

  try {
    let enrichedText = text;

    const needSearch = shouldAutoSearch(text) || await aiNeedsWebSearch(text);

    if (needSearch) {
      const st = document.getElementById('callStatusText');
      if (st) st.textContent = '🔍 Đang tra cứu...';
      try {
        const intent = detectWebSearchIntent(text) || { searchType: 'search', query: text };
        if (intent.searchType === 'datetime') {
          const dt = getLocalDateTime();
          enrichedText = `Câu hỏi: ${text}\n\nThông tin hiện tại: ${dt.answer}`;
        } else {
          const searchData = await performWebSearch(intent.query, intent.searchType);
          enrichedText = `Câu hỏi: ${text}\n\nThông tin mới nhất từ web (dùng để trả lời):\n${searchData.answer || ''}\n` +
            (searchData.results || []).slice(0, 3).map(r =>
              `- ${r.title}: ${(r.content || '').substring(0, 200)}`
            ).join('\n');
        }
      } catch (e) { console.warn('Call search:', e); }
    }

    let reply = await callAskAI(enrichedText, callChatHistory.slice(-10));

    if (!needSearch && aiSaidIDontKnow(reply)) {
      console.log('📞 Call: AI không biết → retry với search...');
      try {
        const ctx = await tryGetWebContext(text, true);
        if (ctx) {
          const enriched2 = `Câu hỏi: ${text}\n\nThông tin mới nhất:\n${ctx}`;
          const reply2 = await callAskAI(enriched2, callChatHistory.slice(-10));
          if (reply2 && reply2.length > 10) reply = reply2;
        }
      } catch (e) { console.warn('Call retry:', e); }
    }

    callChatHistory.push({ role: 'assistant', content: reply });
    if (callIsTTSEnabled) {
      try { await callSpeakText(reply); } catch (e) { console.error(e); }
    }
  } catch (error) {
    console.error('Call AI:', error);
  } finally {
    callIsProcessing = false;
    callUpdateUI();
    if (callActive && !callIsMuted) callScheduleAutoListen(callIsTTSEnabled ? 300 : 180);
  }
}

function callStart() {
  if (callActive) return;
  callActive = true;
  callStartTime = Date.now();
  callChatHistory = [];
  unlockAudioSync();
  const wrap = document.querySelector('.call-wrap');
  if (wrap) wrap.classList.add('call-active');
  if (callTimerInterval) clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    const el = document.getElementById('callTimer');
    if (el) el.textContent = `${mins}:${secs}`;
  }, 1000);
  const muteBtn = document.getElementById('btnCallMute');
  const ttsBtn = document.getElementById('btnCallTTS');
  if (muteBtn) muteBtn.style.display = 'flex';
  if (ttsBtn) ttsBtn.style.display = 'flex';
  const st = document.getElementById('callStatusText');
  if (st) st.textContent = '🎙️ Đang kết nối...';
  const bc = document.getElementById('callBubbleContent');
  if (bc) bc.textContent = '🎙️ Bắt đầu trò chuyện...';
  callUpdateUI();
  showToast('Cuộc gọi', 'Đã kết nối — cứ nói tự nhiên, không cần bấm lại', 'success');
  callScheduleAutoListen(250);
}

function callEnd() {
  callActive = false;
  if (callAutoListenTimer) { clearTimeout(callAutoListenTimer); callAutoListenTimer = null; }
  callCleanupVAD();
  callIsListening = false;
  callIsSpeaking = false;
  callIsProcessing = false;
  if (callWhisperRecorder && callWhisperRecording) {
    try { callWhisperRecorder.stop(); } catch (e) {}
  }
  callWhisperRecording = false;
  callWhisperRecorder = null;
  if (callTTSAudio) { try { callTTSAudio.pause(); callTTSAudio.currentTime = 0; } catch (e) {} }
  callIsTTSPlaying = false;
  if (callTimerInterval) { clearInterval(callTimerInterval); callTimerInterval = null; }
  const wrap = document.querySelector('.call-wrap');
  if (wrap) wrap.classList.remove('call-active');
  const muteBtn = document.getElementById('btnCallMute');
  const ttsBtn = document.getElementById('btnCallTTS');
  if (muteBtn) muteBtn.style.display = 'none';
  if (ttsBtn) ttsBtn.style.display = 'none';
  const el = document.getElementById('callTimer');
  if (el) el.textContent = '0:00';
  callUpdateUI();
}

function bindCallEvents() {
  const mainBtn = document.getElementById('btnCallMain');
  const muteBtn = document.getElementById('btnCallMute');
  const ttsBtn = document.getElementById('btnCallTTS');

  if (mainBtn) {
    mainBtn.addEventListener('click', () => {
      unlockAudioSync();
      if (!callActive) { callStart(); return; }
      // Trong chế độ hội thoại liên tục, nút chính chỉ dùng để kết thúc cuộc gọi.
      if (callIsSpeaking || callIsTTSPlaying) {
        const a = _ensureSharedAudio();
        try { a.pause(); a.currentTime = 0; } catch (e) {}
        callIsTTSPlaying = false;
        callIsSpeaking = false;
        callScheduleAutoListen(120);
      } else {
        callEnd();
      }
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      unlockAudioSync();
      callIsMuted = !callIsMuted;
      if (callIsMuted) {
        callStopListening();
        if (callTTSAudio) { try { callTTSAudio.pause(); } catch (e) {} }
        const st = document.getElementById('callStatusText');
        if (st) st.textContent = '🔇 đã tắt mic';
      } else {
        const st = document.getElementById('callStatusText');
        if (st) st.textContent = '🎙️ đã bật mic';
        callScheduleAutoListen(150);
      }
      callUpdateUI();
    });
  }

  if (ttsBtn) {
    ttsBtn.addEventListener('click', () => {
      unlockAudioSync();
      callIsTTSEnabled = !callIsTTSEnabled;
      if (!callIsTTSEnabled && callTTSAudio) { try { callTTSAudio.pause(); } catch (e) {} }
      callUpdateUI();
    });
  }
}


function clearAttach() {
  attachedFile = null;
  fileContent = null;
  attachedImageDataUrl = null;
  const fi = document.getElementById('fileInput');
  if (fi) fi.value = '';
  const ap = document.getElementById('attachPreview');
  if (ap) ap.remove();
  const fb = document.querySelector('.attach-btn');
  if (fb) fb.classList.remove('has-attach');
}
window.clearAttach = clearAttach;

function updateAttachPreview() {
  let ap = document.getElementById('attachPreview');
  if (ap) ap.remove();
  if (!attachedFile) {
    const fb = document.querySelector('.attach-btn');
    if (fb) fb.classList.remove('has-attach');
    return;
  }
  ap = document.createElement('div');
  ap.className = 'attach-preview';
  ap.id = 'attachPreview';
  const icon = attachedImageDataUrl ? '🖼️' : '📄';
  const sizeKB = (attachedFile.size / 1024).toFixed(1);

  let previewHTML = '';
  if (!attachedImageDataUrl && fileContent) {
    const preview = fileContent.substring(0, 100).replace(/\n/g, ' ').trim();
    previewHTML = `<div class="attach-preview-text" title="${escapeHtml(preview)}">${escapeHtml(preview)}...</div>`;
  }

  ap.innerHTML = `${attachedImageDataUrl ? `<img src="${attachedImageDataUrl}">` : ''}
    <div class="attach-info">
      <span class="attach-name">${icon} ${escapeHtml(attachedFile.name)} (${sizeKB} KB)</span>
      ${previewHTML}
    </div>
    <span class="attach-remove" onclick="clearAttach()">✕</span>`;
  const composer = document.querySelector('.composer');
  if (composer) composer.appendChild(ap);
  const fb = document.querySelector('.attach-btn');
  if (fb) fb.classList.add('has-attach');
}

async function handleFileSelect(file) {
  if (!file) return;

  const name = file.name.toLowerCase();
  const type = file.type || '';

  if (type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      attachedFile = file;
      attachedImageDataUrl = ev.target.result;
      fileContent = null;
      updateAttachPreview();
    };
    reader.readAsDataURL(file);
    return;
  }

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      showToast('Đang đọc PDF', 'Vui lòng đợi...', 'info', 2000);
      const text = await extractPdfText(file);
      if (!text || text.trim().length < 5) {
        throw new Error('PDF không có text — có thể là ảnh scan');
      }
      attachedFile = file;
      fileContent = text.length > FILE_MAX_TEXT_LENGTH
        ? text.substring(0, FILE_MAX_TEXT_LENGTH) + `\n\n[... cắt bớt, tổng ${text.length} ký tự]`
        : text;
      attachedImageDataUrl = null;
      updateAttachPreview();
      showToast('Đọc PDF xong', `${text.length} ký tự`, 'success', 2000);
    } catch (e) {
      showToast('Lỗi PDF', e.message, 'error', 4000);
    }
    return;
  }

  if (name.endsWith('.docx') ||
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      showToast('Đang đọc Word', 'Vui lòng đợi...', 'info', 2000);
      const text = await extractDocxText(file);
      attachedFile = file;
      fileContent = text.length > FILE_MAX_TEXT_LENGTH
        ? text.substring(0, FILE_MAX_TEXT_LENGTH) + `\n\n[... cắt bớt, tổng ${text.length} ký tự]`
        : text;
      attachedImageDataUrl = null;
      updateAttachPreview();
      showToast('Đọc Word xong', `${text.length} ký tự`, 'success', 2000);
    } catch (e) {
      showToast('Lỗi Word', e.message, 'error', 4000);
    }
    return;
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    try {
      showToast('Đang đọc Excel', 'Vui lòng đợi...', 'info', 2000);
      const text = await extractExcelText(file);
      attachedFile = file;
      fileContent = text.length > FILE_MAX_TEXT_LENGTH
        ? text.substring(0, FILE_MAX_TEXT_LENGTH) + `\n\n[... cắt bớt, tổng ${text.length} ký tự]`
        : text;
      attachedImageDataUrl = null;
      updateAttachPreview();
      showToast('Đọc Excel xong', `${text.length} ký tự`, 'success', 2000);
    } catch (e) {
      showToast('Lỗi Excel', e.message, 'error', 4000);
    }
    return;
  }

  if (name.endsWith('.doc')) {
    showToast('Không hỗ trợ .doc', 'Vui lòng convert sang .docx', 'warning', 4000);
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    let text = ev.target.result;
    if (text.length > FILE_MAX_TEXT_LENGTH) {
      text = text.substring(0, FILE_MAX_TEXT_LENGTH) +
        `\n\n[... cắt bớt, tổng ${ev.target.result.length} ký tự]`;
    }
    attachedFile = file;
    fileContent = text;
    attachedImageDataUrl = null;
    updateAttachPreview();
  };
  reader.onerror = () => showToast('Lỗi đọc file', 'Không đọc được', 'error');
  reader.readAsText(file, 'UTF-8');
}

/* ============================================================
   SEND MESSAGE
   ============================================================ */
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const stream = document.getElementById('chatStream');
  const hero = document.getElementById('chatHero');
  const text = input.value.trim();
  if (!text && !fileContent && !attachedImageDataUrl) return;
  if (isSending) return;

  isSending = true;
  const sendBtn = document.getElementById('btnSend');
  if (sendBtn) sendBtn.disabled = true;

  try {
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';

    if (text && text.startsWith('/')) {
      const handled = await handleApiCommand(text);
      if (handled) {
        input.value = ''; input.style.height = 'auto';
        clearAttach();
        isSending = false;
        if (sendBtn) sendBtn.disabled = false;
        return;
      }
    }

    let displayText = text;
    if (!displayText && attachedFile) displayText = attachedImageDataUrl ? `🖼️ ${attachedFile.name}` : `📄 ${attachedFile.name}`;

    const userMsg = { role: 'user', content: displayText, ts: Date.now() };
    if (attachedImageDataUrl) userMsg.imageDataUrl = attachedImageDataUrl;
    const chat = getCurrentChat();
    if (chat) { chat.messages.push(userMsg); saveChats(); }
    if (stream) appendMessageUI(stream, 'user', displayText, false, Date.now(), attachedImageDataUrl);

    // ⚡ FUSION AI: fan-out to all configured non-Gemini providers,
    // then synthesize the strongest combined answer.
    if (currentTab === 'fusion') {
      input.value = ''; input.style.height = 'auto';
      const fileToSend = fileContent;
      const imgToSend = attachedImageDataUrl;
      clearAttach();
      const thinkingWrap = stream ? appendMessageUI(stream, 'bot', '', true, Date.now()) : null;
      try {
        let fusionWebContext = '';
        if (!fileToSend && !imgToSend && text && (webSearchEnabled || shouldAutoSearch(text))) {
          try {
            fusionWebContext = await tryGetWebContext(text);
          } catch (webErr) {
            console.warn('[Fusion] web search failed:', webErr);
          }
        }
        const result = await askFusionAI(
          text || (imgToSend ? 'Phân tích ảnh này' : fileToSend ? 'Phân tích nội dung file đính kèm' : 'Xin chào'),
          fileToSend,
          imgToSend,
          (status) => {
            const th = thinkingWrap?.querySelector('.thinking');
            if (th) th.innerHTML = `<span style="font-size:12px;color:var(--text-3);font-family:var(--mono);">${escapeHtml(status)}</span>`;
          },
          fusionWebContext
        );
        if (thinkingWrap) thinkingWrap.remove();
        const providers = result.providers.map(p => PROVIDER_LABELS[p]).join(' · ');
        const replyText = `${result.text}\n\n---\n⚡ **Fusion:** ${providers}`;
        if (chat) { chat.messages.push({ role: 'ai', content: replyText, ts: Date.now(), webSearch: false }); saveChats(); }
        if (stream) appendMessageUI(stream, 'bot', replyText, false, Date.now());
        updateChatTitle();
      } catch (err) {
        if (thinkingWrap) thinkingWrap.remove();
        const errMsg = `❌ Fusion AI: ${err.message}`;
        if (chat) { chat.messages.push({ role: 'ai', content: errMsg, ts: Date.now() }); saveChats(); }
        if (stream) appendMessageUI(stream, 'bot', errMsg, false, Date.now());
        showToast('Fusion lỗi', err.message, 'error', 5000);
      }
      return;
    }

    // 📥 KIỂM TRA TẠO FILE
    const fileIntent = detectFileIntent(text);
    if (fileIntent && !attachedImageDataUrl && !fileContent) {
      input.value = ''; input.style.height = 'auto';
      const thinkingWrap = stream ? appendMessageUI(stream, 'bot', '', true, Date.now()) : null;

      try {
        const ext = fileIntent.fileType;
        const promptWithInstruction = buildFileCreatePrompt(text, ext);
        const result = await askAIEnhanced(promptWithInstruction, null, {}, null);
        if (thinkingWrap) thinkingWrap.remove();

        const replyText = result.text;
        const fileContentClean = extractFileContent(replyText);

        let baseName = 'output';
        const nameMatch = text.match(/(?:tên|đặt tên|called|named)\s+["']?([\w\d\u00C0-\u024F_-]+)["']?/i);
        if (nameMatch) baseName = nameMatch[1];

        const fileMeta = { ext, content: fileContentClean, baseName };

        const previewText = `**File .${ext} đã sẵn sàng!**\n\nBấm nút 📥 để tải về máy.\n\n---\n\n**Nội dung:**\n\`\`\`\n${fileContentClean.substring(0, 1500)}${fileContentClean.length > 1500 ? '\n... [xem trong file để thấy đầy đủ]' : ''}\n\`\`\``;

        if (chat) {
          chat.messages.push({ role: 'ai', content: previewText, ts: Date.now(), fileMeta });
          saveChats();
        }
        if (stream) appendMessageUI(stream, 'bot', previewText, false, Date.now(), null, false, fileMeta);
        updateChatTitle();
        showToast('File sẵn sàng', `Bấm 📥 để tải .${ext}`, 'success', 3000);
      } catch (err) {
        if (thinkingWrap) thinkingWrap.remove();
        const errMsg = `❌ Lỗi tạo file: ${err.message}`;
        if (chat) { chat.messages.push({ role: 'ai', content: errMsg, ts: Date.now() }); saveChats(); }
        if (stream) appendMessageUI(stream, 'bot', errMsg, false, Date.now());
        showToast('Lỗi', err.message, 'error', 5000);
      }

      isSending = false;
      if (sendBtn) sendBtn.disabled = false;
      return;
    }

    // 🎨 KIỂM TRA TẠO ẢNH / VIDEO
    const wantsImage = IMAGE_MODE_ENABLED || detectImageIntent(text);
    const wantsVideo = VIDEO_MODE_ENABLED || detectVideoIntent(text);

    if ((wantsImage || wantsVideo) && !attachedImageDataUrl && !fileContent) {
      input.value = ''; input.style.height = 'auto';

      if (!AGNES_API_KEY || AGNES_API_KEY.length < 10) {
        const errMsg = '⚠️ Chưa có Agnes API key.\n\nGõ: `/apiimg sk-...` để nhập key.\n\n_(Lấy key tại platform.agnes-ai.com)_';
        if (stream) appendMessageUI(stream, 'bot', errMsg, false, Date.now());
        if (chat) { chat.messages.push({ role: 'ai', content: errMsg, ts: Date.now() }); saveChats(); }
        updateChatTitle();
        isSending = false;
        if (sendBtn) sendBtn.disabled = false;
        return;
      }

      const thinkingWrap = stream ? appendMessageUI(stream, 'bot', '', true, Date.now()) : null;

      try {
        let replyContent = '';

        if (wantsVideo) {
          const vPrompt = extractVideoPrompt(text) || text;
          const result = await agnesGenerateVideo(vPrompt, {}, (pct, msg) => {
            const th = thinkingWrap?.querySelector('.thinking');
            if (th) {
              th.innerHTML = `<span style="font-size:12px;color:var(--text-3);font-family:var(--mono);">Đang render... ${msg}</span>`;
            }
          });
          if (thinkingWrap) thinkingWrap.remove();

          replyContent = `**Video đã tạo xong!**\n\n**Prompt:** _${escapeHtml(result.prompt)}_\n**Thời lượng:** ${result.seconds}s · **Tỷ lệ:** ${result.aspect}\n\n<video src="${result.url}" controls playsinline style="width:100%;border-radius:12px;margin-top:8px;"></video>\n\n[Tải video](${result.url})`;
        } else {
          const iPrompt = extractImagePrompt(text) || text;
          const result = await agnesGenerateImage(iPrompt);
          if (thinkingWrap) thinkingWrap.remove();

          replyContent = `**Ảnh đã tạo xong!**\n\n**Prompt:** _${escapeHtml(result.prompt)}_\n**Kích thước:** ${result.size}\n\n<img src="${result.url}" alt="Generated" style="width:100%;border-radius:12px;margin-top:8px;" onerror="this.style.display='none';">\n\n[Mở ảnh gốc](${result.url})`;
        }

        if (chat) {
          chat.messages.push({ role: 'ai', content: replyContent, ts: Date.now(), isMedia: true });
          saveChats();
        }
        if (stream) appendMessageUI(stream, 'bot', replyContent, false, Date.now());
        updateChatTitle();
      } catch (err) {
        if (thinkingWrap) thinkingWrap.remove();
        const errMsg = `❌ Lỗi tạo ${wantsVideo ? 'video' : 'ảnh'}: ${err.message}`;
        if (chat) { chat.messages.push({ role: 'ai', content: errMsg, ts: Date.now() }); saveChats(); }
        if (stream) appendMessageUI(stream, 'bot', errMsg, false, Date.now());
        showToast('Lỗi', err.message, 'error', 5000);
      }

      isSending = false;
      if (sendBtn) sendBtn.disabled = false;
      return;
    }

    const appIntent = detectAppIntent(text);
    if (appIntent && !attachedImageDataUrl && !fileContent) {
      input.value = ''; input.style.height = 'auto';
      clearAttach();
      let reply = '';
      if (appIntent.action === 'search_youtube') {
        if (appIntent.query) { openAppAdvanced('youtube', appIntent.query); reply = `🔍 Đang tìm **"${appIntent.query}"** trên YouTube...`; }
        else reply = `🔍 Nhập: \`tìm [nội dung] trên youtube\``;
      } else if (appIntent.action === 'search_tiktok') {
        if (appIntent.query) { openAppAdvanced('tiktok', appIntent.query); reply = `🔍 Đang tìm **"${appIntent.query}"** trên TikTok...`; }
        else reply = `🔍 Nhập: \`tìm [nội dung] trên tiktok\``;
      } else if (appIntent.action === 'open_app') {
        openAppAdvanced(appIntent.app);
        reply = `✅ Mở **${appIntent.app}**...`;
      }
      if (stream) appendMessageUI(stream, 'bot', reply, false, Date.now());
      if (chat) { chat.messages.push({ role: 'ai', content: reply, ts: Date.now() }); saveChats(); }
      updateChatTitle();
      isSending = false;
      if (sendBtn) sendBtn.disabled = false;
      return;
    }

    input.value = ''; input.style.height = 'auto';

    const fileToSend = fileContent;
    const imgToSend = attachedImageDataUrl;
    clearAttach();

    const thinkingWrap = stream ? appendMessageUI(stream, 'bot', '', true, Date.now()) : null;

    try {
      const result = await askAIEnhanced(
        text || (imgToSend ? 'Phân tích ảnh này' : fileToSend ? 'Phân tích nội dung file đính kèm' : 'Xin chào'),
        fileToSend,
        {},
        imgToSend
      );
      if (thinkingWrap) thinkingWrap.remove();

      const replyText = result.text;
      const usedWeb = result.webSearch;

      if (chat) { chat.messages.push({ role: 'ai', content: replyText, ts: Date.now(), webSearch: usedWeb }); saveChats(); }
      if (stream) appendMessageUI(stream, 'bot', replyText, false, Date.now(), null, usedWeb);
      updateChatTitle();
    } catch (err) {
      if (thinkingWrap) thinkingWrap.remove();
      const errMsg = "❌ Lỗi: " + err.message;
      if (chat) { chat.messages.push({ role: 'ai', content: errMsg, ts: Date.now() }); saveChats(); }
      if (stream) appendMessageUI(stream, 'bot', errMsg, false, Date.now());
      showToast('Lỗi', err.message, 'error', 5000);
    }
  } finally {
    isSending = false;
    if (sendBtn) sendBtn.disabled = false;
  }
}


async function handleApiCommand(text) {
  const trimmed = text.trim();

  const apiMatch = trimmed.match(/^\/api\s+(.+)$/);
  if (apiMatch) {
    const newKey = apiMatch[1].trim();
    if (!newKey || newKey.length < 10) {
      showToast('Cảnh báo', 'API key không hợp lệ!', 'warning');
      return true;
    }
    GROQ_API_KEY = newKey;
    localStorage.setItem('groq_key', newKey);
    GROQ_MODELS_CACHE = null;
    ACTIVE_PROVIDER = 'groq';
    localStorage.setItem('active_provider', 'groq');
    updateModelDisplay();
    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';
    const msg = `✅ **Groq Key đã lưu!**\n\n🔑 \`${newKey.substring(0, 12)}...\`\n🤖 Provider: **Groq**\n📌 Model: \`${GROQ_MODEL}\``;
    if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
    showToast('Thành công', 'Groq Key đã lưu!', 'success', 4000);
    try {
      if (window.firebaseApiReady) await window.firebaseApiReady;
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ ai: newKey, activeProvider: 'groq' });
    } catch (e) { console.warn(e); }
    return true;
  }

  const geminiMatch = trimmed.match(/^\/api1\s+(.+)$/);
  if (geminiMatch) {
    const newKey = geminiMatch[1].trim();
    if (!newKey || newKey.length < 10) {
      showToast('Cảnh báo', 'Gemini key không hợp lệ!', 'warning');
      return true;
    }
    GEMINI_API_KEY = newKey;
    localStorage.setItem('gemini_key', newKey);
    GEMINI_MODELS_CACHE = null;
    GEMINI_MODEL = "";
    ACTIVE_PROVIDER = 'gemini';
    localStorage.setItem('active_provider', 'gemini');

    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';
    if (stream) appendMessageUI(stream, 'bot', '⏳ Đang quét model Gemini...', false, Date.now());

    const models = await fetchGeminiModels(true);

    if (models && models.length > 0) {
      const list = models.slice(0, 10).map(m => `• \`${m.id}\``).join('\n');
      const msg = `✅ **Gemini Key đã lưu!**\n\n🔑 \`${newKey.substring(0, 12)}...\`\n🤖 Provider: **Gemini**\n\n**Quét được ${models.length} model:**\n${list}\n\n📌 Đang dùng: \`${GEMINI_MODEL}\``;
      if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
      showToast('Thành công', `Gemini OK - ${models.length} model`, 'success', 4000);
    } else {
      if (stream) appendMessageUI(stream, 'bot', '⚠️ Không quét được model Gemini. Kiểm tra key.', false, Date.now());
      showToast('Cảnh báo', 'Không quét được model Gemini', 'warning', 4000);
    }
    updateModelDisplay();
    try {
      if (window.firebaseApiReady) await window.firebaseApiReady;
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ gemini: newKey, activeProvider: 'gemini' });
    } catch (e) { console.warn(e); }
    return true;
  }

  const kiraMatch = trimmed.match(/^\/api2\s+(.+)$/);
  if (kiraMatch) {
    const newKey = kiraMatch[1].trim();
    if (!newKey || newKey.length < 10) {
      showToast('Cảnh báo', 'Kira key không hợp lệ!', 'warning');
      return true;
    }
    KIRA_API_KEY = newKey;
    localStorage.setItem('kira_api_key', newKey);
    ACTIVE_PROVIDER = 'kira';
    localStorage.setItem('active_provider', 'kira');
    KIRA_MODELS_WORKING = [];
    localStorage.removeItem('kira_working_models');

    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';
    if (stream) appendMessageUI(stream, 'bot', '⏳ Đang dò model Kira...', false, Date.now());

    const detected = await detectKiraModel((m) => console.log('Thử Kira:', m));

    if (detected) {
      KIRA_MODEL = detected;
      localStorage.setItem('kira_model', detected);
      const msg = `✅ **Kira Key đã lưu!**\n\n🔑 \`${newKey.substring(0, 12)}...\`\n🤖 Provider: **Kira**\n📌 Model: \`${detected}\``;
      if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
      showToast('Thành công', `Kira OK - ${detected}`, 'success', 4000);
    } else {
      if (stream) appendMessageUI(stream, 'bot', '⚠️ Không có model Kira nào hoạt động.', false, Date.now());
      showToast('Cảnh báo', 'Kira không có model chạy', 'warning', 4000);
    }
    updateModelDisplay();
    try {
      if (window.firebaseApiReady) await window.firebaseApiReady;
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ kira: newKey, activeProvider: 'kira' });
    } catch (e) { console.warn(e); }
    return true;
  }

  const cohereMatch = trimmed.match(/^\/api3\s+(.+)$/);
  if (cohereMatch) {
    const newKey = cohereMatch[1].trim();
    if (!newKey || newKey.length < 10) {
      showToast('Cảnh báo', 'Cohere key không hợp lệ!', 'warning');
      return true;
    }
    COHERE_API_KEY = newKey;
    localStorage.setItem('cohere_api_key', newKey);
    COHERE_MODELS_CACHE = null;
    COHERE_MODEL = "";
    ACTIVE_PROVIDER = 'cohere';
    localStorage.setItem('active_provider', 'cohere');

    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';
    if (stream) appendMessageUI(stream, 'bot', '⏳ Đang quét model Cohere...', false, Date.now());

    const models = await fetchCohereModels(true);

    if (models && models.length > 0) {
      const list = models.slice(0, 10).map(m => `• \`${m.id}\``).join('\n');
      const msg = `✅ **Cohere Key đã lưu!**\n\n🔑 \`${newKey.substring(0, 12)}...\`\n🤖 Provider: **Cohere**\n\n**Quét được ${models.length} model:**\n${list}\n\n📌 Đang dùng: \`${COHERE_MODEL}\``;
      if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
      showToast('Thành công', `Cohere OK - ${models.length} model`, 'success', 4000);
    } else {
      if (stream) appendMessageUI(stream, 'bot', '⚠️ Không quét được model Cohere.', false, Date.now());
      showToast('Cảnh báo', 'Không quét được model Cohere', 'warning', 4000);
    }
    updateModelDisplay();
    try {
      if (window.firebaseApiReady) await window.firebaseApiReady;
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ cohere: newKey, activeProvider: 'cohere' });
    } catch (e) { console.warn(e); }
    return true;
  }

  const chatAnywhereMatch = trimmed.match(/^\/api4\s+(.+)$/);
  if (chatAnywhereMatch) {
    const newKey = chatAnywhereMatch[1].trim();
    if (!newKey || newKey.length < 10) {
      showToast('Cảnh báo', 'ChatAnywhere key không hợp lệ!', 'warning');
      return true;
    }
    CHATANYWHERE_API_KEY = newKey;
    localStorage.setItem('chatanywhere_key', newKey);
    CHATANYWHERE_MODELS_CACHE = null;
    CHATANYWHERE_MODEL = "";
    ACTIVE_PROVIDER = 'chatanywhere';
    localStorage.setItem('active_provider', 'chatanywhere');

    fetchChatAnywhereModels();
    updateModelDisplay();

    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';

    const list = CHATANYWHERE_FIXED_MODELS.map(m => `• \`${m.id}\``).join('\n');
    const msg = `✅ **ChatAnywhere Key đã lưu!**\n\n🔑 \`${newKey.substring(0, 12)}...\`\n🤖 Provider: **ChatAnywhere**\n\n**6 model có sẵn:**\n${list}\n\n📌 Đang dùng: \`${CHATANYWHERE_MODEL}\``;
    if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
    showToast('Thành công', 'ChatAnywhere sẵn sàng — 6 model', 'success', 4000);

    try {
      if (window.firebaseApiReady) await window.firebaseApiReady;
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ chatanywhere: newKey, activeProvider: 'chatanywhere' });
    } catch (e) { console.warn(e); }
    return true;
  }

  const agnesMatch = trimmed.match(/^\/apiimg\s+(.+)$/);
  if (agnesMatch) {
    const newKey = agnesMatch[1].trim();
    if (!newKey || newKey.length < 10) {
      showToast('Cảnh báo', 'Agnes key không hợp lệ!', 'warning');
      return true;
    }
    AGNES_API_KEY = newKey;
    localStorage.setItem('agnes_api_key', newKey);

    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';

    const msg = `✅ **Agnes AI Key đã lưu!**\n\n🔑 \`${newKey.substring(0, 12)}...\`\n\n🎨 **Có thể tạo Ảnh & Video:**\n\n**Cách 1 — Bật toggle:**\n• Bấm **Tạo** ở composer → chọn **Tạo Ảnh** hoặc **Tạo Video**\n• Chat sẽ tự tạo khi bạn nhập mô tả\n\n**Cách 2 — Gõ trực tiếp:**\n• \`tạo cho tôi 1 bức ảnh [mô tả]\`\n• \`tạo video [mô tả]\`\n\n_Key đã được lưu lên Firebase._`;
    if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
    showToast('Thành công', 'Agnes AI sẵn sàng', 'success', 4000);

    try {
      if (window.firebaseApiReady) await window.firebaseApiReady;
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ agnes: newKey });
    } catch (e) { console.warn(e); }
    return true;
  }

  const ttsMatch = trimmed.match(/^\/apitts\s+(.+)$/);
  if (ttsMatch) {
    const newKey = ttsMatch[1].trim();
    if (!newKey || newKey.length < 10) {
      showToast('Cảnh báo', 'Murf key không hợp lệ!', 'warning');
      return true;
    }
    MURF_API_KEY = newKey;
    localStorage.setItem('murf_api_key', newKey);
    MURF_VOICES_CACHE = null;
    localStorage.removeItem('murf_voices_cache');
    fetchMurfVoices(true).then(voices => {
      showToast('Đã tải ' + voices.length + ' giọng', 'Murf voices', 'success', 3000);
    }).catch(() => {});

    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';
    const msg = `✅ **Murf TTS Key đã lưu!**\n\n🔑 \`${newKey.substring(0, 12)}...\``;
    if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
    showToast('Thành công', 'Murf Key đã lưu!', 'success', 4000);
    try {
      if (window.firebaseApiReady) await window.firebaseApiReady;
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ tts: newKey });
    } catch (e) { console.warn(e); }
    return true;
  }

  const tavilyMatch = trimmed.match(/^\/apitavily\s+(.+)$/);
  if (tavilyMatch) {
    const newKey = tavilyMatch[1].trim();
    if (!newKey || newKey.length < 10) {
      showToast('Cảnh báo', 'Tavily key không hợp lệ!', 'warning');
      return true;
    }
    TAVILY_API_KEY = newKey;
    localStorage.setItem('tavily_key', newKey);
    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';
    const msg = `✅ **Tavily Key đã lưu!**\n\n🔑 \`${newKey.substring(0, 12)}...\``;
    if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
    showToast('Thành công', 'Tavily Key đã lưu!', 'success', 4000);
    try {
      if (window.firebaseApiReady) await window.firebaseApiReady;
      if (window.firebaseApiStore) await window.firebaseApiStore.savePartial({ tavily: newKey });
    } catch (e) { console.warn(e); }
    return true;
  }

  if (trimmed === '/help' || trimmed === '/?') {
    const stream = document.getElementById('chatStream');
    const hero = document.getElementById('chatHero');
    if (hero) hero.style.display = 'none';
    if (stream) stream.style.display = 'flex';
    const msg = `**🔑 Lệnh nhập API Key:**\n\n\`/api gsk_xxxxx\` — Groq\n\`/api1 AIza...\` — Gemini\n\`/api2 <key>\` — Kira\n\`/api3 <key>\` — Cohere\n\`/api4 sk-xxxxx\` — ChatAnywhere\n\`/apiimg sk-xxxxx\` — Agnes AI (Tạo Ảnh & Video)\n\`/apitts murf_xxxxx\` — Murf TTS\n\`/apitavily tvly-xxxxx\` — Tavily Search\n\n**📊 Provider hiện tại:** \`${ACTIVE_PROVIDER}\`\n\n**📄 Đọc file:** PDF, DOCX, XLSX, XLS, TXT, JSON, CSV, ảnh...\n\n**📥 Tạo file:**\n• "tạo file txt chứa 10 món ăn Việt Nam"\n• "tạo file PDF báo cáo doanh thu"\n• "tạo file Excel danh sách nhân viên"\n• → Bấm nút 📥 trong chat để tải về\n\n**🎨 Tạo Ảnh / Video:**\n• Bấm nút **Tạo** cạnh nút chuyển tab\n• Hoặc gõ: \`tạo cho tôi 1 bức ảnh...\`\n\n**🌐 Auto Search 3 lớp:**\n1. Pattern: thời tiết, giá vàng, tin tức...\n2. AI tự đánh giá có cần tra web không\n3. AI nói "không biết" → tự động search lại\n\n**🔊 TTS:** Chat, Call, Camera đều đọc được\n\nKhi provider hết quota → tự động chuyển provider khác còn key.\nTất cả key đều được lưu lên Firebase.`;
    if (stream) appendMessageUI(stream, 'bot', msg, false, Date.now());
    return true;
  }

  return false;
}


document.getElementById('btnContact')?.addEventListener('click', () => {
  document.getElementById('contactOverlay').classList.add('open');
});
document.getElementById('contactModalClose')?.addEventListener('click', () => {
  document.getElementById('contactOverlay').classList.remove('open');
});
document.getElementById('contactOverlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'contactOverlay') e.target.classList.remove('open');
});


document.getElementById('btnModel')?.addEventListener('click', openModelPicker);
document.getElementById('modelPickerClose')?.addEventListener('click', () => {
  document.getElementById('modelPickerOverlay').classList.remove('open');
});
document.getElementById('modelRefreshBtn')?.addEventListener('click', async () => {
  const body = document.getElementById('modelPickerBody');
  if (body) body.innerHTML = `<div class="model-picker-loading"><i class="fa-solid fa-spinner fa-spin"></i> Đang quét lại từ <b>${PROVIDER_LABELS[ACTIVE_PROVIDER]}</b>...</div>`;

  if (ACTIVE_PROVIDER === 'gemini') {
    GEMINI_MODELS_CACHE = null;
    await fetchGeminiModels(true);
  } else if (ACTIVE_PROVIDER === 'cohere') {
    COHERE_MODELS_CACHE = null;
    await fetchCohereModels(true);
  } else if (ACTIVE_PROVIDER === 'chatanywhere') {
    fetchChatAnywhereModels();
  } else if (ACTIVE_PROVIDER === 'groq') {
    const apiKey = GROQ_API_KEY || localStorage.getItem('groq_key');
    await fetchGroqModels(apiKey, true);
  }
  renderModelPicker();
});
document.querySelectorAll('.model-filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    MODEL_PICKER_FILTER = chip.dataset.filter;
    document.querySelectorAll('.model-filter-chip').forEach(c => c.classList.toggle('active', c === chip));
    renderModelPicker();
  });
});


document.getElementById('historyModalClose')?.addEventListener('click', () => {
  document.getElementById('historyOverlay').classList.remove('open');
});
document.getElementById('historyOverlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'historyOverlay') e.target.classList.remove('open');
});
document.getElementById('btnClearAll')?.addEventListener('click', async () => {
  if (!chats.length) return;
  const ok = await confirmModal('Xoá toàn bộ', `Xoá ${chats.length} cuộc trò chuyện?`);
  if (!ok) return;
  chats = [];
  currentChatId = null;
  localStorage.removeItem('ai_current_chat');
  createNewChat();
  saveChats();
  renderHistoryList();
  updateHistoryBadge();
  switchTab('ai');
  showToast('Đã xoá', 'Toàn bộ lịch sử đã xoá', 'success', 2000);
});


async function loadApiKey() {
  const loadedFromFirebase = await loadFirebaseApiKeys();

  if (!MURF_API_KEY || MURF_API_KEY.length < 10) await loadMurfKey();
  if (!TAVILY_API_KEY || TAVILY_API_KEY.length < 10) await loadTavilyKey();

  const gem = localStorage.getItem('gemini_key');
  if (!GEMINI_API_KEY && gem && gem.length > 10) GEMINI_API_KEY = gem;
  const kira = localStorage.getItem('kira_api_key');
  if (!KIRA_API_KEY && kira && kira.length > 10) KIRA_API_KEY = kira;
  const co = localStorage.getItem('cohere_api_key');
  if (!COHERE_API_KEY && co && co.length > 10) COHERE_API_KEY = co;
  const ca = localStorage.getItem('chatanywhere_key');
  if (!CHATANYWHERE_API_KEY && ca && ca.length > 10) CHATANYWHERE_API_KEY = ca;
  const ag = localStorage.getItem('agnes_api_key');
  if (!AGNES_API_KEY && ag && ag.length > 10) AGNES_API_KEY = ag;

  if (CHATANYWHERE_API_KEY && CHATANYWHERE_API_KEY.length > 10) {
    fetchChatAnywhereModels();
  }

  if (loadedFromFirebase && GROQ_API_KEY && GROQ_API_KEY.length > 10) return true;
  const savedKey = localStorage.getItem('groq_key');
  if (savedKey && savedKey.length > 10) { GROQ_API_KEY = savedKey; return true; }
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'api.txt?' + Date.now(), false);
    xhr.send();
    if (xhr.status === 200) {
      const key = xhr.responseText.trim();
      if (key.length > 10) { GROQ_API_KEY = key; localStorage.setItem('groq_key', key); return true; }
    }
  } catch (e) {}
  return false;
}


window.addEventListener('load', async () => {
  await loadApiKey();
  updateModelDisplay();
  ensureDefaultVoice();

  if (!chats.length) {
    createNewChat();
  } else {
    if (!currentChatId || !getChat(currentChatId)) {
      currentChatId = chats[0].id;
    }
  }
  saveChats();

  switchTab('ai');

  if (GROQ_API_KEY && GROQ_API_KEY.length > 10) {
    fetchGroqModels(GROQ_API_KEY).catch(() => {});
  }
  if (MURF_API_KEY && MURF_API_KEY.length > 10) {
    fetchMurfVoices().catch(() => {});
  }
  if (ACTIVE_PROVIDER === 'gemini' && GEMINI_API_KEY) {
    fetchGeminiModels().catch(() => {});
  } else if (ACTIVE_PROVIDER === 'cohere' && COHERE_API_KEY) {
    fetchCohereModels().catch(() => {});
  } else if (ACTIVE_PROVIDER === 'chatanywhere' && CHATANYWHERE_API_KEY) {
    fetchChatAnywhereModels();
  }

  const firstClickUnlock = () => {
    unlockAudioSync();
    document.removeEventListener('click', firstClickUnlock, true);
    document.removeEventListener('touchstart', firstClickUnlock, true);
  };
  document.addEventListener('click', firstClickUnlock, true);
  document.addEventListener('touchstart', firstClickUnlock, true);
});

window.addEventListener('beforeunload', () => {
  saveChats();
  if (callWhisperRecorder && callWhisperRecording) {
    try { callWhisperRecorder.stop(); } catch (e) {}
  }
});
setInterval(saveChats, 5000);


window.switchTab = switchTab;
window.createNewChat = createNewChat;
window.sendMessage = sendMessage;
window.callSpeakText = callSpeakText;
window.callEnd = callEnd;
window.clearAttach = clearAttach;
window.confirmModal = confirmModal;
window.showToast = showToast;
window.unlockAudioSync = unlockAudioSync;
window.camSpeakText = camSpeakText;
window.aiNeedsWebSearch = aiNeedsWebSearch;
window.shouldAutoSearch = shouldAutoSearch;
window.detectFileIntent = detectFileIntent;
window.createAndDownloadFile = createAndDownloadFile;
