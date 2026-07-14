// src/utils/ReflectionAI.js
import { sanitizePlainText } from './UIHelpers';

export async function getCounselorReflection(data = {}) {
  const { chapter, choices, mentalShield, anxiety, storyMode, storyResults } = data;
  const payload = { chapter, choices, mentalShield, anxiety, storyMode, storyResults };
  const endpoint = import.meta.env.VITE_REFLECTION_ENDPOINT;

  if (!endpoint) {
    return localReflection(payload);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Reflection endpoint failed: ${res.status}`);

    const data = await res.json();
    const rawReflection = data.reflection || data.text || data.choices?.[0]?.message?.content;
    return sanitizePlainText(rawReflection) || localReflection(payload);
  } catch {
    return localReflection(payload);
  } finally {
    clearTimeout(timeoutId);
  }
}

function getChapterName(chapter) {
  if (chapter === 'linear') return 'Alur Cerita 1-3';
  if (chapter === 2) return 'Body Shaming';
  if (chapter === 3) return 'Cyber Grooming';
  return 'Cyberbullying';
}

function summarizeChoices(choices = []) {
  if (!choices.length) return 'belum ada pilihan yang tercatat';
  return choices.slice(-6).map(cleanChoiceLabel).join(', ');
}

function cleanChoiceLabel(choice) {
  return String(choice ?? '').replace(new RegExp('\\s*\\(\\s*game\\s*over\\s*\\)\\s*', 'gi'), '').trim();
}

function localReflection({ chapter, choices = [], mentalShield = 0, anxiety = 0, storyMode = 'single', storyResults = {} }) {
  const chapterName = getChapterName(chapter);
  const safeShield = Math.round(mentalShield);
  const safeAnxiety = Math.round(anxiety);

  if (storyMode === 'linear' || chapter === 'linear') {
    const summaries = Object.values(storyResults)
      .map((result) => `${getChapterName(result.chapter)}: ${summarizeChoices(result.choices)}`)
      .join('\n');

    return [
      `Refleksi gabungan ${chapterName}`,
      '',
      `Kamu sudah menyelesaikan tiga situasi digital yang berbeda. Pola pilihanmu menunjukkan cara Ray menghadapi tekanan sosial, komentar tubuh, dan ajakan tidak aman dari orang asing.`,
      '',
      summaries || `Pilihan yang tercatat: ${summarizeChoices(choices)}.`,
      '',
      `Mental Shield akhir berada di ${safeShield}, sementara Anxiety berada di ${safeAnxiety}. Nilai ini bukan label diri, melainkan pengingat bahwa dukungan, batas aman, dan jeda dari layar bisa mengubah arah situasi.`,
      '',
      'Langkah sehat yang bisa kamu bawa ke dunia nyata: simpan bukti saat diserang, batasi akun yang menyakiti, jangan merahasiakan percakapan yang membuat tidak nyaman, dan cari orang dewasa tepercaya ketika tekanan mulai terasa berat.',
    ].join('\n');
  }

  return [
    `Refleksi ${chapterName}`,
    '',
    `Kamu membuat ${choices.length} keputusan dalam cerita ini. Pilihan yang paling terlihat: ${summarizeChoices(choices)}.`,
    '',
    `Mental Shield kamu berada di ${safeShield}, dan Anxiety berada di ${safeAnxiety}. Saat tekanan digital muncul, yang paling penting adalah memperlambat reaksi, menjaga batas, dan tidak menghadapi semuanya sendirian.`,
    '',
    'Coping sehat yang bisa dicoba: tarik napas dan beri jeda sebelum membalas, screenshot bukti, blokir atau laporkan akun yang berbahaya, ceritakan ke teman atau orang dewasa tepercaya, dan lakukan grounding ketika tubuh terasa panik.',
  ].join('\n');
}
