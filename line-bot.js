/**
 * line-bot.js - ระบบส่งข้อความแจ้งเตือนผ่าน LINE Messaging API
 */
const LineBot = {
    // ⚠️ นำ Channel Access Token (Long-lived) จาก LINE Developers Console มาวางที่นี่
    CHANNEL_ACCESS_TOKEN: "ljLdqektjOMfYUDdqMCJ+6RBxzD4RtF7NvBYUU25FEhUkgV0/0x0TQ2NVoM6p1KMYbuxy+L7xEiOj+C/qnXXOn2mwr67cNJ81Kvbf83DKDndbbi8284al+mzbidOxWJsgvaxYDv+z16ozoKOOLvgaAdB04t89/1O/w1cDnyilFU=",

    /**
     * ส่งข้อความแจ้งเตือนการรดน้ำไปยัง User ID ที่กำหนด
     * @param {string} lineUserId - LINE User ID ของผู้รับ
     * @param {string} plantName - ชื่อต้นไม้
     * @param {string} adviceText - คำแนะนำการดูแลจาก AI
     */
    async sendWateringReminder(lineUserId, plantName, adviceText = "") {
        if (!this.CHANNEL_ACCESS_TOKEN || this.CHANNEL_ACCESS_TOKEN === "YOUR_LINE_CHANNEL_ACCESS_TOKEN") {
            console.error("กรุณากรอก CHANNEL_ACCESS_TOKEN ในไฟล์ line-bot.js");
            return false;
        }

        if (!lineUserId) {
            console.error("ไม่พบ LINE User ID สำหรับการส่งแจ้งเตือน");
            return false;
        }

        const endpoint = "https://api.line.me/v2/bot/message/push";

        // โครงสร้างข้อความแบบ Flex Message ให้ดูสวยงาม
        const messagePayload = {
            to: lineUserId,
            messages: [
                {
                    type: "flex",
                    altText: `🌱 ถึงเวลารดน้ำต้นไม้ ${plantName} แล้ว!`,
                    contents: {
                        type: "bubble",
                        header: {
                            type: "box",
                            layout: "vertical",
                            backgroundColor: "#2e7d32",
                            contents: [
                                {
                                    type: "text",
                                    text: "🌱 ได้เวลารดน้ำต้นไม้!",
                                    color: "#ffffff",
                                    weight: "bold",
                                    size: "md"
                                }
                            ]
                        },
                        body: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: plantName,
                                    weight: "bold",
                                    size: "xl",
                                    color: "#1b5e20",
                                    wrap: true
                                },
                                {
                                    type: "text",
                                    text: adviceText || "อย่าลืมเช็กความชื้นของดินก่อนรดน้ำนะครับ",
                                    size: "sm",
                                    color: "#555555",
                                    wrap: true,
                                    margin: "md"
                                }
                            ]
                        }
                    }
                }
            ]
        };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.CHANNEL_ACCESS_TOKEN}`
                },
                body: JSON.stringify(messagePayload)
            });

            if (response.ok) {
                console.log(`ส่งแจ้งเตือนไปที่ ${lineUserId} สำเร็จ!`);
                return true;
            } else {
                const errData = await response.json();
                console.error("LINE Messaging API Error:", errData);
                return false;
            }
        } catch (err) {
            console.error("Error sending LINE push message:", err);
            return false;
        }
    },

    /**
     * ดึงรายการต้นไม้ที่ต้องรดน้ำวันนี้จาก Supabase แล้วส่งแจ้งเตือนรายคน
     */
    async checkAndNotifyDaily() {
        if (typeof _supabase === 'undefined' || !_supabase) {
            console.error("Supabase ยังไม่พร้อมใช้งาน");
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        // ดึงข้อมูลต้นไม้ที่มีกำหนดรดน้ำตรงกับวันนี้ พร้อมดึง line_user_id ของเจ้าของ
        const { data: plants, error } = await _supabase
            .from('plants')
            .select('plant_name, species, users(line_user_id)')
            .eq('care_date', today);

        if (error) {
            console.error("Error fetching daily plants:", error);
            return;
        }

        if (!plants || plants.length === 0) {
            console.log("ไม่มีรายการรดน้ำต้นไม้สำหรับวันนี้");
            return;
        }

        // วนลูปส่ง Push Message หาแต่ละคน
        for (const item of plants) {
            const lineUserId = item.users?.line_user_id;
            if (lineUserId) {
                // ดึงคำแนะนำ AI ก่อนส่ง
                const advice = await AI.generateCareAdvice(item.plant_name, item.species, today, false);
                await this.sendWateringReminder(lineUserId, item.plant_name, advice);
            }
        }
    }
};