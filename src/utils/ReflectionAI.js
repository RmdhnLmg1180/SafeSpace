// src/utils/ReflectionAI.js
export async function getCounselorReflection({ chapter, choices, mentalShield, anxiety }) {
  try {
    // Ganti dengan endpoint Gemini/OpenAI Anda
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_API_KEY',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah konselor kesehatan mental digital. Analisis coping style, evaluasi keputusan, dan rekomendasikan coping sehat berdasarkan data berikut: chapter=${chapter}, choices=${JSON.stringify(choices)}, mentalShield=${mentalShield}, anxiety=${anxiety}.`,
          },
        ],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || localReflection({ chapter, choices, mentalShield, anxiety });
  } catch {
    return localReflection({ chapter, choices, mentalShield, anxiety });
  }
}

function localReflection({ chapter, choices, mentalShield, anxiety }) {
  // Fallback lokal sederhana
  return `Refleksi: Pada chapter ${chapter}, kamu membuat keputusan ${choices.length} kali. Mental shield: ${mentalShield}, anxiety: ${anxiety}. Cobalah coping sehat seperti berbicara dengan orang terpercaya dan menjaga self-care.`;
}
