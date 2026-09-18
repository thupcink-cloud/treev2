let timerInterval = null;

const UI = {
    switchTab(tabId, element) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');
        if (element) element.classList.add('active');
    },

    // 🟢 แสดงวิดีโอสัตว์เลี้ยงเป็นวงกลม และรองรับ 3 สถานะ (normal, wilted, fresh)
    renderPet(petData, statusState = 'normal') {
        petData = petData || { level: 1, current_exp: 0, max_exp: 100 };
        const badge = document.getElementById('petLevelBadge');
        const expTxt = document.getElementById('expText');
        const fill = document.getElementById('expBarFill');
        
        if (badge) badge.innerText = `Level ${petData.level || 1}`;
        if (expTxt) expTxt.innerText = `EXP: ${petData.current_exp || 0} / ${petData.max_exp || 100}`;
        if (fill) {
            const pct = Math.min(100, ((petData.current_exp || 0) / (petData.max_exp || 100)) * 100);
            fill.style.width = `${pct}%`;
        }

        const avatarContainer = document.querySelector('.pet-avatar-container');
        if (avatarContainer) {
            let mediaSrc = '';
            const lvl = petData.level || 1;

            if (lvl <= 3) {
                mediaSrc = 'images/pet_lvl1.mp4';
            } 
            else if (lvl >= 4 && lvl <= 6) {
                if (statusState === 'fresh') mediaSrc = 'images/pet_lvl2_fresh.mp4';
                else if (statusState === 'wilted') mediaSrc = 'images/pet_lvl2_wilted.mp4';
                else mediaSrc = 'images/pet_lvl2_normal.mp4';
            } 
            else {
                if (statusState === 'fresh') mediaSrc = 'images/pet_lvl3_fresh.mp4';
                else if (statusState === 'wilted') mediaSrc = 'images/pet_lvl3_wilted.mp4';
                else mediaSrc = 'images/pet_lvl3_normal.mp4';
            }

            avatarContainer.innerHTML = `
                <video autoplay loop muted playsinline style="
                    width: 120px; 
                    height: 120px; 
                    object-fit: cover; 
                    border-radius: 50%; 
                    border: 4px solid #4CAF50; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                ">
                    <source src="${mediaSrc}" type="video/mp4">
                    เบราว์เซอร์ของคุณไม่รองรับวิดีโอ
                </video>
            `;
        }
    },

    async generateSchedule(plants, busyDates) {
        const tbody = document.getElementById('scheduleTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">🤖 AI กำลังประมวลผลคำแนะนำ...</td></tr>';

        if (!plants || plants.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">ยังไม่มีข้อมูลต้นไม้</td></tr>';
            return;
        }

        let rowsHTML = '';
        const targetDates = [];

        for (let i = 0; i < plants.length; i++) {
            const plant = plants[i];
            let targetDate = plant.next_water_time ? new Date(plant.next_water_time) : new Date();
            
            if (!plant.next_water_time) {
                targetDate.setHours(8, 0, 0, 0);
                const isBusy = (busyDates || []).some(bDate => new Date(bDate).toDateString() === targetDate.toDateString());
                if (isBusy) {
                    if (plant.species && plant.species.includes('แคคตัส')) {
                        targetDate.setDate(targetDate.getDate() + 2);
                    } else {
                        targetDate.setDate(targetDate.getDate() - 1);
                    }
                }
            }

            targetDates.push(targetDate);
            const dateStr = targetDate.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
            const aiAdvice = await AI.generateCareAdvice(plant.name, plant.species, dateStr, false);

            rowsHTML += `
                <tr>
                    <td><strong>${plant.name}</strong></td>
                    <td>${plant.species}</td>
                    <td>${dateStr}</td>
                    <td><span id="countdown-${i}" class="countdown-badge">กำลังคำนวณ...</span></td>
                    <td>${aiAdvice}</td>
                    <td>
                        <button id="waterBtn-${i}" class="btn btn-success" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;" disabled onclick="App.handleWaterAction(${i}, '${plant.name}')">
                            <i class="fa-solid fa-droplet"></i> รดน้ำ (+20 EXP)
                        </button>
                    </td>
                </tr>
            `;
        }

        tbody.innerHTML = rowsHTML;
        this.startCountdowns(targetDates);
    },

    startCountdowns(targetDates) {
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            const now = new Date().getTime();

            targetDates.forEach((targetDate, index) => {
                const element = document.getElementById(`countdown-${index}`);
                const btn = document.getElementById(`waterBtn-${index}`);
                if (!element) return;

                const distance = targetDate.getTime() - now;

                if (distance <= 0) {
                    element.innerHTML = "<strong style='color: red;'>ถึงเวลารดน้ำแล้ว!</strong>";
                    if (btn) {
                        btn.disabled = false;
                        btn.classList.add('btn-pulse');
                    }
                } else {
                    if (btn) {
                        btn.disabled = true;
                        btn.classList.remove('btn-pulse');
                    }

                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));

                    let timeText = "";
                    if (days > 0) timeText += `${days} วัน `;
                    timeText += `${hours} ชม. ${minutes} นาที ${seconds} วินาที`;

                    element.innerText = `⏳ ${timeText}`;
                }
            });
        }, 1000);
    }
};