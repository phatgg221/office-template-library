import type { TemplateCreateInput } from "../schemas"
import { b, bi, doc, h, hr, i, ol, p, table, u, ul } from "./builders"

/**
 * Seed document templates. Adding a template here (or through the admin page / POST /api/templates)
 * makes it appear in the library automatically; the UI never hard-codes templates.
 */
const quocHieu = [
  p(b("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"), "center"),
  p(u("Độc lập - Tự do - Hạnh phúc"), "center"),
]

export const documentTemplates: Omit<TemplateCreateInput, "isPublished">[] = [
  {
    kind: "document",
    slug: "cong-van-hanh-chinh",
    name: "Công văn hành chính",
    category: "Hành chính",
    description: "Mẫu công văn theo thể thức Nghị định 30/2020/NĐ-CP, dùng cho thông báo, đề nghị và trao đổi công việc.",
    tags: ["công văn", "hành chính", "nghị định 30"],
    content: doc(
      table(null, [
        [[b("[TÊN CƠ QUAN CHỦ QUẢN]")], [b("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM")]],
        [[b("[TÊN CÔNG TY]")], [u("Độc lập - Tự do - Hạnh phúc")]],
        [["Số: [số]/CV-[viết tắt]"], [i("[Địa danh], ngày [..] tháng [..] năm [....]")]],
      ]),
      p(["V/v: ", i("[Trích yếu nội dung công văn]")]),
      p(),
      p([b("Kính gửi: "), "[Tên cơ quan, tổ chức hoặc cá nhân nhận]"], "center"),
      p(),
      p(
        "[Tên công ty] xin gửi tới Quý [cơ quan/đơn vị] lời chào trân trọng. Căn cứ [văn bản, quy định liên quan], [Tên công ty] trân trọng thông báo/đề nghị nội dung như sau:",
        "justify",
      ),
      ol(
        [b("Nội dung thứ nhất: "), "[Mô tả chi tiết nội dung, thời hạn, phạm vi áp dụng]."],
        [b("Nội dung thứ hai: "), "[Mô tả chi tiết nội dung, đầu mối phối hợp]."],
        [b("Đề nghị: "), "[Nêu rõ đề nghị, kiến nghị hoặc yêu cầu đối với đơn vị nhận]."],
      ),
      p("Thông tin chi tiết xin liên hệ: [Họ tên], [chức vụ], số điện thoại [....], email [....].", "justify"),
      p("Trân trọng./.", "justify"),
      p(),
      table(null, [
        [[bi("Nơi nhận:")], [b("GIÁM ĐỐC")]],
        [["- Như trên;"], [i("(Ký, ghi rõ họ tên và đóng dấu)")]],
        [["- Lưu: VT, [đơn vị soạn thảo]."], [""]],
      ]),
    ),
  },
  {
    kind: "document",
    slug: "hop-dong-lao-dong",
    name: "Hợp đồng lao động",
    category: "Nhân sự",
    description: "Hợp đồng lao động xác định thời hạn theo Bộ luật Lao động 2019, có bảng lương và quyền lợi.",
    tags: ["hợp đồng", "lao động", "nhân sự", "tuyển dụng"],
    content: doc(
      ...quocHieu,
      p(),
      h(1, "HỢP ĐỒNG LAO ĐỘNG", "center"),
      p(i("Số: [số]/[năm]/HĐLĐ"), "center"),
      p(i("Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20/11/2019 và nhu cầu, năng lực của hai bên."), "justify"),
      p("Hôm nay, ngày [..] tháng [..] năm [....], tại [địa chỉ], chúng tôi gồm:"),
      h(2, "Bên A: Người sử dụng lao động"),
      ul(
        [b("Tên công ty: "), "[Tên công ty]"],
        [b("Địa chỉ: "), "[Địa chỉ trụ sở]"],
        [b("Đại diện: "), "[Họ và tên] — Chức vụ: [Chức vụ]"],
      ),
      h(2, "Bên B: Người lao động"),
      ul(
        [b("Họ và tên: "), "[Họ và tên]  —  Ngày sinh: [dd/mm/yyyy]"],
        [b("Số CCCD: "), "[Số CCCD], cấp ngày [....] tại [....]"],
        [b("Địa chỉ thường trú: "), "[Địa chỉ]"],
      ),
      h(2, "Điều 1. Công việc và thời hạn hợp đồng"),
      ol(
        "Loại hợp đồng: Hợp đồng lao động xác định thời hạn [..] tháng, từ ngày [....] đến ngày [....].",
        "Chức danh chuyên môn: [Vị trí]. Địa điểm làm việc: [Địa điểm].",
        "Công việc phải làm: [Mô tả công việc theo bản mô tả công việc đính kèm].",
      ),
      h(2, "Điều 2. Tiền lương và quyền lợi"),
      table(
        ["Khoản mục", "Mức hưởng", "Hình thức chi trả"],
        [
          ["Lương cơ bản", "[....] VNĐ/tháng", "Chuyển khoản, ngày [..] hằng tháng"],
          ["Phụ cấp ăn trưa", "[....] VNĐ/tháng", "Cùng kỳ lương"],
          ["Thưởng hiệu quả", "Theo quy chế công ty", "Theo quý"],
          ["Bảo hiểm XH, YT, TN", "Theo quy định pháp luật", "Công ty đóng hằng tháng"],
        ],
      ),
      h(2, "Điều 3. Thời giờ làm việc, nghỉ ngơi"),
      ul("Thời giờ làm việc: 8 giờ/ngày, từ thứ Hai đến thứ Sáu.", "Nghỉ phép năm: 12 ngày/năm, hưởng nguyên lương."),
      h(2, "Điều 4. Điều khoản thi hành"),
      p(
        "Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản và có hiệu lực kể từ ngày ký.",
        "justify",
      ),
      table(null, [
        [[b("NGƯỜI LAO ĐỘNG")], [b("NGƯỜI SỬ DỤNG LAO ĐỘNG")]],
        [[i("(Ký, ghi rõ họ tên)")], [i("(Ký, ghi rõ họ tên và đóng dấu)")]],
      ]),
    ),
  },
  {
    kind: "document",
    slug: "bien-ban-cuoc-hop",
    name: "Biên bản cuộc họp",
    category: "Hành chính",
    description: "Ghi nhận thành phần tham dự, nội dung thảo luận, kết luận và phân công công việc sau cuộc họp.",
    tags: ["biên bản", "họp", "meeting"],
    content: doc(
      p(b("[TÊN CÔNG TY]")),
      ...quocHieu,
      h(1, "BIÊN BẢN CUỘC HỌP", "center"),
      p(i("V/v: [Chủ đề cuộc họp]"), "center"),
      h(2, "I. Thời gian, địa điểm"),
      ul([b("Thời gian: "), "[..] giờ [..], ngày [..]/[..]/[....]"], [b("Địa điểm: "), "[Phòng họp / Link họp trực tuyến]"]),
      h(2, "II. Thành phần tham dự"),
      table(
        ["STT", "Họ và tên", "Chức vụ / Bộ phận", "Vai trò"],
        [
          ["1", "[Họ và tên]", "[Chức vụ]", "Chủ trì"],
          ["2", "[Họ và tên]", "[Chức vụ]", "Thư ký"],
          ["3", "[Họ và tên]", "[Chức vụ]", "Thành viên"],
        ],
      ),
      h(2, "III. Nội dung cuộc họp"),
      ol(
        [b("Báo cáo tình hình: "), "[Tóm tắt nội dung báo cáo]."],
        [b("Thảo luận: "), "[Các ý kiến chính được nêu]."],
        [b("Biểu quyết: "), "[Kết quả biểu quyết, nếu có]."],
      ),
      h(2, "IV. Kết luận và phân công"),
      table(
        ["Đầu việc", "Người phụ trách", "Hạn hoàn thành"],
        [
          ["[Đầu việc 1]", "[Họ tên]", "[dd/mm/yyyy]"],
          ["[Đầu việc 2]", "[Họ tên]", "[dd/mm/yyyy]"],
        ],
      ),
      p("Cuộc họp kết thúc vào lúc [..] giờ [..] cùng ngày. Biên bản đã được đọc lại và các thành viên thống nhất."),
      table(null, [
        [[b("THƯ KÝ")], [b("CHỦ TRÌ")]],
        [[i("(Ký, ghi rõ họ tên)")], [i("(Ký, ghi rõ họ tên)")]],
      ]),
    ),
  },
  {
    kind: "document",
    slug: "don-xin-nghi-phep",
    name: "Đơn xin nghỉ phép",
    category: "Nhân sự",
    description: "Đơn xin nghỉ phép ngắn gọn cho nhân viên, có lý do, thời gian nghỉ và người bàn giao công việc.",
    tags: ["đơn", "nghỉ phép", "nhân sự"],
    content: doc(
      ...quocHieu,
      p(),
      h(1, "ĐƠN XIN NGHỈ PHÉP", "center"),
      p(),
      p([b("Kính gửi: "), "Ban Giám đốc [Tên công ty]; Trưởng phòng [Tên phòng ban]"]),
      p("Tôi tên là: [Họ và tên]"),
      p("Chức vụ: [Chức vụ]   —   Bộ phận: [Phòng ban]"),
      p("Nay tôi làm đơn này kính đề nghị Ban Giám đốc cho tôi được nghỉ phép:", "justify"),
      ul(
        [b("Thời gian nghỉ: "), "từ ngày [dd/mm/yyyy] đến hết ngày [dd/mm/yyyy] (tổng [..] ngày)."],
        [b("Lý do: "), "[Nêu lý do nghỉ phép]."],
        [b("Người nhận bàn giao: "), "[Họ và tên], [Chức vụ]."],
      ),
      p(
        "Tôi đã bàn giao đầy đủ công việc và cam kết luôn giữ liên lạc qua số điện thoại [....] khi cần thiết. Kính mong Ban Giám đốc xem xét và chấp thuận.",
        "justify",
      ),
      p("Tôi xin chân thành cảm ơn!"),
      p(i("[Địa danh], ngày [..] tháng [..] năm [....]"), "right"),
      table(null, [
        [[b("Ý KIẾN CỦA QUẢN LÝ")], [b("NGƯỜI LÀM ĐƠN")]],
        [[i("(Ký, ghi rõ họ tên)")], [i("(Ký, ghi rõ họ tên)")]],
      ]),
    ),
  },
  {
    kind: "document",
    slug: "bao-cao-cong-viec-tuan",
    name: "Báo cáo công việc tuần",
    category: "Báo cáo",
    description: "Tổng hợp kết quả, tiến độ, khó khăn và kế hoạch tuần tới; phù hợp cho cá nhân và nhóm dự án.",
    tags: ["báo cáo", "tuần", "tiến độ", "kpi"],
    content: doc(
      h(1, "BÁO CÁO CÔNG VIỆC TUẦN", "center"),
      p(i("Tuần [số] — từ ngày [dd/mm] đến ngày [dd/mm/yyyy]"), "center"),
      ul([b("Người báo cáo: "), "[Họ và tên] — [Bộ phận]"], [b("Gửi tới: "), "[Quản lý trực tiếp]"]),
      h(2, "1. Tổng quan"),
      p(
        "[Tóm tắt 2–3 câu về kết quả nổi bật trong tuần, mức độ hoàn thành so với kế hoạch và các điểm cần lưu ý.]",
        "justify",
      ),
      h(2, "2. Kết quả công việc"),
      table(
        ["Công việc", "Trạng thái", "Tiến độ", "Ghi chú"],
        [
          ["[Công việc 1]", "Hoàn thành", "100%", ""],
          ["[Công việc 2]", "Đang thực hiện", "60%", "[Ghi chú]"],
          ["[Công việc 3]", "Chưa bắt đầu", "0%", "[Lý do]"],
        ],
      ),
      h(2, "3. Khó khăn, vướng mắc"),
      ul("[Khó khăn 1 và ảnh hưởng]", "[Khó khăn 2 và đề xuất hỗ trợ]"),
      h(2, "4. Kế hoạch tuần tới"),
      ol("[Mục tiêu / đầu việc ưu tiên 1]", "[Mục tiêu / đầu việc ưu tiên 2]", "[Mục tiêu / đầu việc ưu tiên 3]"),
      hr(),
      p(i("Báo cáo được lập ngày [dd/mm/yyyy]."), "right"),
    ),
  },
  {
    kind: "document",
    slug: "thu-moi-su-kien",
    name: "Thư mời sự kiện",
    category: "Sự kiện",
    description: "Thư mời trang trọng cho hội thảo, lễ kỷ niệm hoặc sự kiện khách hàng, kèm chương trình và xác nhận tham dự.",
    tags: ["thư mời", "sự kiện", "hội thảo"],
    content: doc(
      p(b("[TÊN CÔNG TY]"), "center"),
      p(i("[Địa chỉ] • [Số điện thoại] • [Website]"), "center"),
      hr(),
      h(1, "THƯ MỜI", "center"),
      p(i("V/v: Tham dự [Tên sự kiện]"), "center"),
      p(),
      p([b("Kính gửi: "), "Quý [Ông/Bà] [Họ và tên khách mời]"]),
      p(
        "[Tên công ty] trân trọng kính mời Quý [Ông/Bà] đến tham dự [Tên sự kiện] — sự kiện [mô tả ngắn mục đích, ý nghĩa của sự kiện].",
        "justify",
      ),
      ul(
        [b("Thời gian: "), "[..] giờ [..], [thứ], ngày [dd/mm/yyyy]"],
        [b("Địa điểm: "), "[Tên địa điểm, địa chỉ]"],
        [b("Trang phục: "), "[Lịch sự / Business casual]"],
      ),
      h(2, "Chương trình"),
      table(
        ["Thời gian", "Nội dung"],
        [
          ["[08:30 – 09:00]", "Đón khách và check-in"],
          ["[09:00 – 09:15]", "Phát biểu khai mạc"],
          ["[09:15 – 11:00]", "[Nội dung chính]"],
          ["[11:00 – 12:00]", "Giao lưu và tiệc nhẹ"],
        ],
      ),
      p(
        "Để công tác đón tiếp được chu đáo, Quý khách vui lòng xác nhận tham dự trước ngày [dd/mm/yyyy] qua [Họ tên], số điện thoại [....] hoặc email [....].",
        "justify",
      ),
      p("Sự hiện diện của Quý [Ông/Bà] là niềm vinh hạnh của chúng tôi."),
      p(b("TM. BAN TỔ CHỨC"), "right"),
      p(i("(Ký, ghi rõ họ tên)"), "right"),
    ),
  },
]
