/**
 * ai.js - สร้างคำแนะนำการดูแลต้นไม้ด้วย Gemini API (เชื่อมต่อผ่าน config.js)
 */
const AI = {
    async generateCareAdvice(plantName, plantSpecies, dateStr, isBusy = false) {
        // 1. ตรวจสอบว่ามีการตั้งค่า GEMINI_API_KEY ใน config.js หรือไม่
        if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
            console.warn("Gemini API Key is missing in config.js");
            return "กรุณาตั้งค่า GEMINI_API_KEY ในไฟล์ config.js เพื่อเปิดใช้งานคำแนะนำจาก AI";
        }

        // 2. สร้าง Prompt สำหรับส่งให้ Gemini
        const busyContext = isBusy ? " (หมายเหตุ: เจ้าของติดธุระในวันดังกล่าว ช่วยแนะนำทางออกสั้นๆ เพิ่มเติม)" : "";
        const prompt = `คุณคือผู้เชี่ยวชาญด้านการดูแลต้นไม้ ให้คำแนะนำสั้นๆ กระชับ (ไม่เกิน 2 ประโยค) สำหรับการดูแลต้นไม้ชื่อ "${plantName}" สายพันธุ์ "${plantSpecies}" ซึ่งมีกำหนดรดน้ำในวันที่ ${dateStr}${busyContext}`;

        try {
            // 3. ยิง Request ไปยัง Gemini API โดยใช้ Key จาก config.js
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("Gemini API Error Response:", errData);
                throw new Error(`API returned status ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                return text.trim();
            } else {
                return "ไม่สามารถสร้างคำแนะนำได้ในขณะนี้ กรุณาเช็กความชื้นของดินก่อนรดน้ำ";
            }

        } catch (err) {
            console.error("Error generating care advice:", err);
            return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาตรวจสอบ API Key หรือการเชื่อมต่ออินเทอร์เน็ต";
        }
    }
};