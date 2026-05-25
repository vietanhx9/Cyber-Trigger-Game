# 🎮 CYBER TRIGGER — PLAN & WALKTHROUGH

> Game bắn súng 2D góc nhìn từ trên xuống theo phong cách cyberpunk neon.  
> File này tổng hợp toàn bộ kế hoạch thiết kế và hướng dẫn trải nghiệm game.

---

## 📁 Cấu trúc File

| File | Mô tả |
|------|-------|
| [index.html](./index.html) | Cấu trúc HTML, UI overlay, màn hình chọn vai trò |
| [style.css](./style.css) | Thiết kế cyberpunk neon, animation, glassmorphism |
| [game.js](./game.js) | Toàn bộ logic game engine, entities, collision |
| [PLAN.md](./PLAN.md) | File này — kế hoạch & hướng dẫn |

---

## 🕹️ Điều khiển

| Phím / Chuột | Chức năng |
|---|---|
| `WASD` / `↑↓←→` | Di chuyển phi thuyền |
| Chuột trái (giữ) | Tấn công chính (bắn / chém / gõ búa) |
| `Space` | Kỹ năng đặc biệt (Dash / Shockwave) |
| `E` | Kỹ năng phụ nhanh |
| `P` | Tạm dừng game (Pause) |
| `M` | Bật/tắt âm thanh |

---

## ⚔️ Hệ thống Vai trò RPG (4 Classes)

### 🛡️ Đấu sĩ (Fighter) — Màu Vàng
- **HP**: 150 | **SPD**: Chậm | **Vũ khí**: Búa Vàng Năng Lượng
- Gõ búa tạo **sóng xung kích hình nón màu vàng** đẩy lùi cực mạnh, nghiền nát đạn quái
- Có thể nâng cấp thành **sóng kích 360 độ** bảo vệ toàn diện

### 🔮 Pháp sư (Mage) — Màu Tím
- **HP**: 80 | **SPD**: Nhanh | **Vũ khí**: Cầu Lửa Ma Pháp Tím
- Phóng cầu lửa tím bay chậm, để lại **vệt khói lửa** dọc đường, chạm đích **nổ AoE tím**
- Có thể nâng cấp thành **Siêu Cầu Phép** kích thước gấp đôi, bán kính nổ +50%

### 🎯 Xạ thủ (Ranger) — Màu Cyan
- **HP**: 90 | **SPD**: Nhanh | **Vũ khí**: Súng Laser Tầm Xa
- Xả loạt **3 tia laser cyan song song** tốc độ cao theo hướng trỏ chuột
- Có thể nâng cấp thành **5 tia laser** song song (Lõi Pháo Kép)

### 🗡️ Sát thủ (Assassin) — Màu Hồng
- **HP**: 70 | **SPD**: Cực nhanh | **Vũ khí**: Kiếm Plasma Hồng
- **Tự động chém** khi quái đến gần (110px), không cần click chuột
- Có thể nâng cấp thành **Song Kiếm Phân Thân** — chém cả trước lẫn sau lưng

---

## 📈 Hệ thống Nâng cấp Level-Up (Theo từng Class)

Mỗi lần thăng cấp, người chơi chọn **1 trong 3 thẻ nâng cấp** ngẫu nhiên từ pool của vai trò mình đang chơi.

### 🔨 Đấu sĩ (Fighter) — Thẻ màu Vàng
| ID | Tên | Hiệu ứng |
|----|-----|----------|
| `damage` | Búa Năng Lượng Nặng 🔨 | +30% sát thương búa mỗi cấp |
| `fireRate` | Nện Búa Liên Hoàn ⚡ | -20% hồi chiêu gõ búa mỗi cấp |
| `hammer360` | **Địa Chấn 360 Độ 💥** | Sóng kích tỏa tròn 360°, cản đạn toàn hướng *(1 lần)* |
| `maxHp` | Giáp Kháng Lực ❤️ | +25 HP tối đa & hồi đầy |
| `speed` | Động Cơ Đẩy Phản Lực 🚀 | +15% tốc độ di chuyển |
| `magnet` | Từ Trường Nam Châm 🧲 | +50% bán kính hút XP |

### 🔮 Pháp sư (Mage) — Thẻ màu Tím
| ID | Tên | Hiệu ứng |
|----|-----|----------|
| `damage` | Khuếch Đại Tinh Thể 🔮 | +25% sát thương cầu lửa mỗi cấp |
| `fireRate` | Niệm Chú Siêu Tốc ⏳ | -20% hồi chiêu bắn cầu phép mỗi cấp |
| `giantFireball` | **Siêu Cầu Phép ☄️** | Cầu lửa x2 kích thước (r18px), nổ AoE 55→82px, sát thương lan 65% *(1 lần)* |
| `maxHp` | Lõi Năng Lượng Phép ❤️ | +20 HP tối đa & hồi đầy |
| `speed` | Gia Tốc Ma Pháp 🚀 | +15% tốc độ di chuyển |
| `magnet` | Hút Linh Hồn 🧲 | +50% bán kính hút XP |

### 🔫 Xạ thủ (Ranger) — Thẻ màu Cyan
| ID | Tên | Hiệu ứng |
|----|-----|----------|
| `damage` | Xung Điện Laser 🔫 | +25% sát thương laser mỗi cấp |
| `fireRate` | Bộ Tăng Tốc Xả Đạn 🔥 | -20% hồi chiêu bắn mỗi cấp |
| `doubleShot` | **Lõi Pháo Kép 🎛️** | Nâng từ 3 tia → 5 tia laser song song *(1 lần)* |
| `maxHp` | Hợp Kim Bảo Vệ ❤️ | +25 HP tối đa & hồi đầy |
| `speed` | Cơ Động Xạ Thủ 🚀 | +15% tốc độ di chuyển |
| `magnet` | Từ Trường Thu Gom 🧲 | +50% bán kính hút XP |

### 🗡️ Sát thủ (Assassin) — Thẻ màu Hồng
| ID | Tên | Hiệu ứng |
|----|-----|----------|
| `damage` | Kiếm Khí Sắc Lẹm 🗡️ | +25% sát thương chém kiếm mỗi cấp |
| `fireRate` | Đoản Kiếm Chớp Nhoáng ⚔️ | -20% hồi chiêu vung kiếm mỗi cấp |
| `dualSlash` | **Song Kiếm Phân Thân 🔄** | Chém đồng thời trước và sau lưng phi thuyền *(1 lần)* |
| `maxHp` | Giáp Phản Quang ❤️ | +20 HP tối đa & hồi đầy |
| `speed` | Kích Tốc Ảnh Tử 🚀 | +15% tốc độ di chuyển |
| `magnet` | Từ Trường Ám Khí 🧲 | +50% bán kính hút XP |

---

## ⚡ Vật phẩm Power-Up "x2" — Tương thích Theo Class

Nhặt vật phẩm `x2` (màu cyan) kích hoạt buff **8 giây** với hiệu ứng tùy class:

| Class | Hiệu ứng x2 | Text nổi |
|-------|-------------|----------|
| **Đấu sĩ** (chưa có 360°) | Sóng búa tỏa tròn 360° | `ĐỊA CHẤN TỎA TRÒN!` 🟡 |
| **Đấu sĩ** (đã có 360°) | Sóng búa 360° + +35% DMG & +35% bán kính | `XUNG KÍCH SIÊU ĐỊA CHẤN!` 🟡 |
| **Pháp sư** | Bắn đôi cầu lửa (2 quả chéo góc) | `SONG MA PHÁP CẦU!` 🟣 |
| **Xạ thủ** | 5 tia laser song song | `LASER PHÁO KÉP!` 🔵 |
| **Sát thủ** (chưa có dualSlash) | Chém trước + sau lưng | `ÁNH ẢNH SONG KIẾM!` 🩷 |
| **Sát thủ** (đã có dualSlash) | Chém 4 hướng chữ thập | `TỨ KIẾM TRẬN!` 🩷 |

---

## 🏆 Trận chiến Boss (Thời điểm 2:00)

1. **Ở giây 120**: Màn hình cảnh báo đỏ nhấp nháy `⚠️ SYSTEM INTRUSION ⚠️` hiện ra, đếm ngược 3 giây kèm còi báo động.
2. **Boss xuất hiện**: Thanh HP lớn vàng neon ở đầu màn hình. Quái thường ngưng spawn.
3. **Kỹ năng Boss**:
   - Lao húc tốc độ cao (đổi màu đỏ hồng trước khi húc)
   - Phun mưa đạn tỏa tròn xoay vòng
   - Triệu hồi 4 quái Runner bao vây
4. **Boss chết**: Nổ chuỗi 1.5 giây → Nổ lớn → Rơi **Rương Lõi Siêu Cấp** vàng.

---

## 🛡️ Vũ khí phụ (từ Rương Boss)

Mở Rương Boss để chọn **1 trong 3 vũ khí phụ tự động** (có thể nâng cấp nhiều lần):

| Vũ khí | Mô tả |
|--------|-------|
| 🛡️ **Lá Chắn Xoay Vòng** | Lưỡi dao tím neon xoay quanh phi thuyền, tự chém quái lại gần. Nâng cấp tăng số lưỡi dao (tối đa 4). |
| 🚀 **Tên Lửa Tầm Nhiệt** | Tự khóa và truy đuổi mục tiêu gần nhất, nổ lan AoE khi chạm. Nâng cấp giảm hồi chiêu. |
| 🤖 **Laser Drone Mini** | Drone bay hộ tống, tự ngắm và bắn laser xanh lá vào kẻ địch gần nhất. Nâng cấp tăng tốc bắn. |

---

## 🧪 Hướng dẫn Kiểm thử Nhanh

**Truy cập**: 👉 [http://localhost:8000](http://localhost:8000)

1. **Chọn vai trò**: Ở màn Start, click từng thẻ vai trò → Quan sát viền neon tương ứng sáng lên và nút BẮT ĐẦU đổi màu theo.
2. **Thử Đấu sĩ**: Giữ chuột trái → Búa vàng tạo sóng hình nón → Quái bị đẩy lùi, đạn quái bị xóa.
3. **Thử Pháp sư**: Bắn → Quả cầu tím bay chậm → Nổ AoE khi chạm quái.
4. **Thử Xạ thủ**: Bắn → 3 tia laser cyan song song xuyên nhanh.
5. **Thử Sát thủ**: Đi gần quái (không click) → Phi thuyền tự chém; click chuột → chém chủ động.
6. **Pause**: Nhấn `P` → Màn hình TẠM DỪNG → Nhấn `P` lại để tiếp tục, hoặc CHỌN LẠI VAI TRÒ.
7. **Low HP**: HP < 30% → Viền đỏ neon nhấp nháy xung quanh màn hình.
8. **Boss**: Sống đến 2:00 → Cảnh báo → Tiêu diệt Boss → Nhặt Rương → Chọn vũ khí phụ.

---

*Cập nhật lần cuối: 2026-05-25*
