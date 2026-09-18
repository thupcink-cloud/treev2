/**
 * App.js - แอปพลิเคชันหลัก
 */
const App = {
    plants: [],
    busyDates: [],
    petData: { level: 1, current_exp: 0, max_exp: 100 },
    currentUser: null,

    async init() {
        this.currentUser = await Auth.getCurrentUser();

        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.renderUserHeader();
        this.setupFormListeners();
        await this.refreshData();
    },

    renderUserHeader() {
        const navbar = document.querySelector('.navbar');
        if (navbar && !document.getElementById('userStatusArea')) {
            const userArea = document.createElement('div');
            userArea.id = 'userStatusArea';
            userArea.style.cssText = 'margin-top: auto; padding: 0.8rem; background: rgba(0,0,0,0.1); border-radius: 8px; width: 100%;';
            
            // ✅ แก้ไข: ดึงจาก Property ของ user ตรงๆ (ไม่ผ่าน user_metadata)
            const displayUsername = this.currentUser.username || 'ผู้ใช้งาน';
            const lineName = this.currentUser.line_display_name ? `<br><small style="color:#a8e6cf">LINE: ${this.currentUser.line_display_name}</small>` : '';
            
            userArea.innerHTML = `
                <div style="font-size: 0.85rem; word-break: break-all;">
                    👤 <strong>${displayUsername}</strong>${lineName}
                </div>
                <button onclick="Auth.signOut()" class="btn" style="background:#e53935; color:white; border:none; border-radius:4px; width:100%; margin-top:0.5rem; padding:0.4rem; font-size:0.8rem; cursor:pointer;">
                    <i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ
                </button>
            `;
            navbar.appendChild(userArea);
        }
    },

    async refreshData() {
        const fetchedPet = await Database.getPetInfo();
        if (fetchedPet) {
            this.petData = fetchedPet;
        }

        const dashPet = document.getElementById('dashPetLevel');
        if (dashPet) dashPet.innerText = `Lv. ${this.petData.level}`;

        this.plants = await Database.getPlants();
        this.renderPlantGallery();

        const now = new Date().getTime();
        const hasNeedsWater = this.plants.some(p => {
            if (!p.next_water_time) return true;
            return new Date(p.next_water_time).getTime() <= now;
        });

        UI.renderPet(this.petData, hasNeedsWater ? 'wilted' : 'normal');

        const busyRecords = await Database.getBusyDates();
        this.busyDates = busyRecords.map(b => b.busy_date);
        this.renderBusyList(busyRecords);

        await UI.generateSchedule(this.plants, this.busyDates);
    },

    async handleWaterAction(plantIndex, plantName) {
        const targetPlant = this.plants[plantIndex];
        if (!targetPlant) return;

        this.petData.current_exp += 20;

        if (this.petData.current_exp >= this.petData.max_exp) {
            this.petData.level += 1;
            this.petData.current_exp -= this.petData.max_exp;
            Swal.fire('🎉 เลเวลอัป!', `รดน้ำ ${plantName} แล้ว! ตัวการ์ตูนวิวัฒนาการเป็น Level ${this.petData.level}`, 'success');
        } else {
            Swal.fire({ 
                toast: true, 
                position: 'top-end', 
                icon: 'success', 
                title: `รดน้ำ ${plantName} แล้ว! (+20 EXP)`, 
                showConfirmButton: false, 
                timer: 1500 
            });
        }

        let nextDate = new Date();
        const species = targetPlant.species || '';
        
        if (species.includes('แคคตัส')) {
            nextDate.setDate(nextDate.getDate() + 7);
        } else {
            nextDate.setDate(nextDate.getDate() + 1);
        }

        const nextWaterISO = nextDate.toISOString();
        targetPlant.next_water_time = nextWaterISO;

        UI.renderPet(this.petData, 'fresh');

        await Database.updatePetInfo(this.petData.level, this.petData.current_exp);
        await Database.updatePlantWaterTime(targetPlant.id, nextWaterISO);

        await UI.generateSchedule(this.plants, this.busyDates);
    },

    setupFormListeners() {
        const plantForm = document.getElementById('addPlantForm');
        if (plantForm) {
            plantForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('plantName').value;
                const species = document.getElementById('plantSpecies').value;

                Swal.showLoading();
                const success = await Database.addPlant(name, species);
                if (success) {
                    document.getElementById('plantName').value = '';
                    await this.refreshData();
                    Swal.fire('สำเร็จ', 'บันทึกต้นไม้ลงฐานข้อมูลเรียบร้อย', 'success');
                } else {
                    Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
                }
            });
        }

        const busyForm = document.getElementById('addBusyForm');
        if (busyForm) {
            busyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const date = document.getElementById('busyDate').value;
                const days = parseInt(document.getElementById('busyDays').value) || 1;
                const slot = document.getElementById('busyTimeSlot').value;

                Swal.showLoading();
                const success = await Database.addBusyDate(date, days, slot);
                if (success) {
                    await this.refreshData();
                    Swal.fire('สำเร็จ', 'บันทึกวันติดธุระเรียบร้อย', 'success');
                } else {
                    Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
                }
            });
        }
    },

    renderPlantGallery() {
        const gallery = document.getElementById('plantGallery');
        const countEl = document.getElementById('dashPlantCount');
        if (countEl) countEl.innerText = this.plants.length;

        if (!gallery) return;
        if (this.plants.length === 0) {
            gallery.innerHTML = '<p class="text-muted">ยังไม่มีข้อมูลต้นไม้ในระบบ</p>';
            return;
        }

        gallery.innerHTML = this.plants.map(p => `
            <div class="card" style="margin-bottom:0.5rem; padding: 0.8rem;">
                <strong>🪴 ${p.name}</strong> <small>(${p.species})</small>
            </div>
        `).join('');
    },

    renderBusyList(busyRecords) {
        const list = document.getElementById('busyDatesList');
        const countEl = document.getElementById('dashBusyCount');
        if (countEl) countEl.innerText = busyRecords.length;

        if (!list) return;
        if (busyRecords.length === 0) {
            list.innerHTML = '<li>ยังไม่มีบันทึกวันติดธุระ</li>';
            return;
        }

        list.innerHTML = busyRecords.map(b => `
            <li>📅 ${new Date(b.busy_date).toLocaleDateString('th-TH')} (${b.days} วัน - ${b.time_slot})</li>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());