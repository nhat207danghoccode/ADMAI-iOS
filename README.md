# ADMAI iOS — GitHub Actions + Windows Free Apple ID

Bản này đóng gói ADMAI hiện tại thành app iOS bằng Capacitor/WKWebView.

## Mục tiêu

Bạn không cần Mac và không cần thuê Mac:

`ADMAI HTML → GitHub Actions (macOS runner) → ADMAI-unsigned.ipa → Windows + Sideloadly + Apple ID miễn phí → iPhone`

GitHub Actions dùng máy macOS của GitHub để chạy Xcode. File IPA tạo ra ở bước này là **unsigned**; bước ký/install được thực hiện trên Windows bằng Apple ID của chính bạn.

## 1. Build IPA bằng GitHub Actions

1. Tạo một repository GitHub mới.
2. Upload **toàn bộ nội dung bên trong thư mục `ADMAI-iOS`** vào repo.
3. Vào tab **Actions**.
4. Chọn workflow **Build ADMAI iOS IPA**.
5. Bấm **Run workflow**.
6. Chờ job chạy xong.
7. Mở phần **Artifacts** của workflow run.
8. Tải artifact **ADMAI-unsigned-ipa**.

Bên trong artifact là `ADMAI-unsigned.ipa`.

### Nếu GitHub hỏi bật Actions

Vào **Settings → Actions → General** và cho phép Actions chạy nếu repo mới đang tắt Actions.

## 2. Ký và cài trên Windows — không cần trả tiền

Cách đơn giản nhất là dùng **Sideloadly** trên Windows.

Trang chính thức: https://sideloadly.io/

Sideloadly hỗ trợ Apple ID miễn phí. Theo tài liệu của Sideloadly, app ký bằng tài khoản miễn phí có thời hạn 7 ngày và có thể được ký lại; tài khoản miễn phí cũng bị giới hạn số app sideload đồng thời. Apple xác nhận tài khoản miễn phí dùng Personal Team để cài/test app trên thiết bị và provisioning profile hết hạn sau 7 ngày.

### Chuẩn bị

- Windows 10/11.
- iPhone + cáp USB.
- Apple ID của bạn.
- File `ADMAI-unsigned.ipa` vừa tải từ GitHub Actions.
- Sideloadly.
- Trên Windows, Sideloadly yêu cầu **bản iTunes/iCloud dạng web/desktop của Apple**, không phải bản Microsoft Store theo hướng dẫn hiện tại của Sideloadly.

### Cài

1. Cài Sideloadly.
2. Mở Sideloadly.
3. Cắm iPhone vào PC.
4. Mở khóa iPhone và chọn **Trust This Computer** nếu iPhone hỏi.
5. Kéo `ADMAI-unsigned.ipa` vào Sideloadly.
6. Chọn iPhone của bạn.
7. Nhập Apple ID.
8. Nếu Apple gửi mã xác minh 2FA, nhập mã đó.
9. Bấm **Start**.
10. Chờ Sideloadly ký và cài app.

### Sau khi cài

Nếu iPhone báo nhà phát triển chưa được tin cậy:

**Settings → General → VPN & Device Management → chọn profile Apple ID → Trust**.

Sau đó mở ADMAI.

## 3. Về giới hạn 7 ngày

Đây là giới hạn của Apple đối với tài khoản miễn phí, không phải lỗi ADMAI.

Apple hiện ghi rõ Personal Team có:

- tối đa 10 App IDs;
- tối đa 3 thiết bị;
- tối đa 3 app trên mỗi thiết bị;
- provisioning profile cho Personal Team hết hạn sau 7 ngày.

Sideloadly có tính năng auto-refresh để ký lại app trước khi hết hạn. Để auto-refresh hoạt động, PC cần có thể kết nối với iPhone qua USB hoặc Wi‑Fi theo hướng dẫn của Sideloadly.

## 4. Quan trọng về Apple ID

**Không đưa Apple ID hoặc mật khẩu vào GitHub repository, GitHub Actions secrets, README hoặc code.**

Workflow GitHub trong repo này **không cần Apple ID**. Nó chỉ build IPA unsigned.

Apple ID chỉ nhập trực tiếp vào công cụ sideload trên máy Windows của bạn.

Nếu muốn an toàn hơn, có thể dùng một Apple ID riêng cho việc sideload.

## 5. Nếu Sideloadly lỗi

Các lỗi thường gặp:

### `Device not found`

- Mở khóa iPhone.
- Bấm Trust This Computer.
- Đổi cáp/cổng USB.
- Kiểm tra Apple Devices/iTunes đã nhận iPhone.

### `Unable to install`

- Xóa bản ADMAI cũ rồi thử lại.
- Hoặc dùng cùng Apple ID + cùng Bundle ID để ghi đè bản cũ.
- Kiểm tra iPhone còn slot app miễn phí.

### App cài được nhưng không mở

- Vào **Settings → General → VPN & Device Management** và Trust profile.
- Kiểm tra app chưa hết hạn.
- Kết nối Internet và thử mở lại.

### GitHub Actions build fail

Mở **Actions → workflow run → Build ADMAI iOS IPA → job build** rồi xem bước bị đỏ.

## 6. Workflow hiện tại

Workflow nằm tại:

`.github/workflows/build-ios.yml`

Nó sẽ:

1. chạy trên `macos-14`;
2. checkout source;
3. cài Node 20;
4. cài Capacitor;
5. tạo iOS project;
6. sync ADMAI vào WKWebView;
7. chạy `xcodebuild` ở chế độ không ký;
8. đóng `.app` thành `ADMAI-unsigned.ipa`;
9. upload IPA thành GitHub Actions artifact.

## 7. Tại sao không ký luôn trên GitHub?

Có thể làm CI signing nếu có Apple Developer signing assets phù hợp. Nhưng với **Apple ID miễn phí**, quy trình Personal Team được Apple quản lý qua Xcode/device provisioning; nó không phải một certificate phân phối thông thường để nhét vào GitHub Actions.

Vì vậy với mục tiêu **0 đồng + không Mac**, cách ít rắc rối nhất là:

**GitHub Actions build → Windows Sideloadly sign/install.**

---

### Nguồn chính thức

- Apple Developer: https://developer.apple.com/help/account/basics/about-your-developer-account/
- Apple Developer: https://developer.apple.com/get-started/
- Sideloadly: https://sideloadly.io/
