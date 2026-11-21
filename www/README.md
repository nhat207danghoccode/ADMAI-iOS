# ADMAI

## Bản Fusion AI

- Đã loại bỏ hoàn toàn provider legacy provider khỏi UI, logic, model picker và API command.
- Thêm tab **⚡ Fusion AI**.
- Fusion gọi song song tất cả provider chat khả dụng **trừ Gemini**:
  - Groq
  - Kira
  - Cohere
  - ChatAnywhere
- Các kết quả được đưa vào một vòng tổng hợp cuối để tạo câu trả lời thống nhất.
- Fusion dùng chung lịch sử chat, file/ảnh đính kèm và composer hiện tại.
- Khi có web search được bật/được phát hiện cần thiết, Fusion có thể đưa dữ liệu web vào vòng tổng hợp.
- Gemini vẫn có thể dùng ở tab Chat thông thường; **Fusion AI không gọi Gemini**.
