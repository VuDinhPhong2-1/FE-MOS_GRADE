const fs = require('fs');
const path = require('path');

const outputDir = path.join(process.cwd(), 'artifacts');
fs.mkdirSync(outputDir, { recursive: true });

const htmlPath = path.join(outputDir, 'mos-multi-project-plan-song-ngu.html');

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const bulletList = (items) =>
  `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;

const table = (headers, rows) => `
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>
`;

const modelPublicationRows = [
  ['ExamPublication', 'Cấu hình phát hành ca thi', 'Lưu cấu hình của ca thi được giáo viên phát hành.'],
  ['projectSequence', 'Danh sách project theo thứ tự', 'Quy định học sinh phải làm Project 01, rồi Project 02, rồi Project 03...'],
  ['order', 'Thứ tự project', 'Số thứ tự của project trong ca thi.'],
  ['projectCode', 'Mã project', 'Mã định danh project, ví dụ WORD_P01 hoặc EXCEL_P02.'],
  ['subject', 'Môn/ứng dụng thi', 'Cho biết project thuộc Word, Excel, PowerPoint...'],
  ['templateFileName', 'Tên file mẫu', 'Tên file gốc mà Agent sẽ copy để học sinh làm bài.'],
  ['gradingApiEndpoint', 'Đường dẫn API chấm điểm', 'Endpoint dùng để gửi file bài làm lên hệ thống chấm.'],
  ['taskSnapshot', 'Bản sao danh sách task', 'Lưu danh sách yêu cầu của project tại thời điểm phát hành để tránh bị thay đổi về sau.'],
  ['modeRules', 'Quy tắc theo chế độ', 'Quy định khác nhau giữa Training và Testing, ví dụ hiển thị feedback hay không.'],
];

const modelSessionRows = [
  ['ExamSession', 'Phiên làm bài/phiên thi', 'Đại diện cho toàn bộ ca thi của một học sinh.'],
  ['currentProjectIndex', 'Vị trí project hiện tại', 'Cho biết học sinh đang ở project số mấy trong projectSequence.'],
  ['currentProjectStatus', 'Trạng thái project hiện tại', 'Cho biết project hiện tại đang làm, đã nộp, đã chấm hay lỗi.'],
  ['projectAttempts[]', 'Danh sách lần làm từng project', 'Lưu kết quả và file làm bài của từng project con.'],
  ['completedProjectCount', 'Số project đã hoàn thành', 'Dùng để hiển thị tiến độ như Project 2/10.'],
  ['aggregateScore', 'Điểm tổng toàn ca thi', 'Điểm tổng hợp sau khi hoàn tất tất cả project.'],
];

const modelAttemptRows = [
  ['ExamSessionProjectAttempt', 'Lần làm bài của project', 'Bản ghi chi tiết cho một project trong ca thi.'],
  ['projectCode', 'Mã project', 'Liên kết attempt với project cụ thể.'],
  ['subject', 'Môn/ứng dụng thi', 'Xác định Word/Excel/PowerPoint để mở đúng phần mềm.'],
  ['templateFileName', 'Tên file mẫu', 'File gốc để copy khi bắt đầu hoặc restart project.'],
  ['workingFilePath', 'Đường dẫn file đang làm', 'File thực tế mà học sinh đang chỉnh sửa trong thư mục Exam.'],
  ['status', 'Trạng thái', 'Chưa bắt đầu, đang làm, đã nộp, đã chấm, lỗi...'],
  ['startedAt', 'Thời điểm bắt đầu', 'Ghi nhận khi học sinh bắt đầu project.'],
  ['submittedAt', 'Thời điểm nộp', 'Ghi nhận khi project được submit (nộp bài).'],
  ['score', 'Điểm project', 'Điểm riêng của project hiện tại.'],
  ['feedback', 'Phản hồi/chấm lỗi', 'Chi tiết lỗi hoặc nhận xét theo từng task.'],
  ['attemptNo', 'Số lần làm lại', 'Tăng khi học sinh restart hoặc làm lại project hiện tại.'],
];

const apiRows = [
  ['Teacher API', 'POST /api/exam-publications', 'Giáo viên tạo publication/ca thi gồm nhiều project theo thứ tự.'],
  ['Student Public API', 'GET /api/public/exams/{token}/sessions/{sessionId}', 'FE học sinh lấy trạng thái session và project hiện tại.'],
  ['Student Public API', 'POST /api/public/exams/{token}/sessions/{sessionId}/next-project', 'FE yêu cầu chuyển sang project kế tiếp.'],
  ['Local Agent API', 'POST /start-exam', 'Agent bắt đầu ca thi và mở project đầu tiên.'],
  ['Local Agent API', 'POST /submit-current-project', 'Agent nộp file của project hiện tại để chấm.'],
  ['Local Agent API', 'POST /next-project', 'Agent submit project hiện tại, chờ chấm, rồi mở project kế tiếp.'],
  ['Local Agent API', 'POST /restart-current-project', 'Agent reset/làm lại đúng project đang làm.'],
  ['Local Agent API', 'GET /current-state', 'FE lấy trạng thái hiện tại từ Agent local.'],
  ['Agent-facing Backend API', 'POST /api/agent/exam-sessions/{sessionId}/projects/{projectCode}/score-upload', 'Agent/backend chấm điểm gửi kết quả project lên backend.'],
  ['Agent-facing Backend API', 'POST /api/agent/exam-sessions/{sessionId}/advance', 'Backend xác nhận và chuyển session sang project tiếp theo.'],
  ['Agent-facing Backend API', 'GET /api/agent/exam-sessions/{sessionId}/current-project-bootstrap', 'Agent lấy dữ liệu khởi tạo project hiện tại hoặc kế tiếp.'],
];

const detailedEndpointRows = [
  [
    'POST /api/exam-publications',
    'Tạo publication/ca thi nhiều project',
    'FE giáo viên',
    'Backend',
    'Nhận danh sách projectSequence thay vì một project đơn. Backend lưu thứ tự project, taskSnapshot, modeRules và cấu hình file mẫu/chấm điểm.',
  ],
  [
    'GET /api/public/exams/{token}/sessions/{sessionId}',
    'Lấy trạng thái phiên thi',
    'FE học sinh',
    'Backend public',
    'Trả về project hiện tại, project kế tiếp, tiến độ Project x/y, trạng thái project hiện tại, task list và instruction panel cần hiển thị.',
  ],
  [
    'POST /api/public/exams/{token}/sessions/{sessionId}/next-project',
    'Yêu cầu chuyển project',
    'FE học sinh',
    'Backend public hoặc Agent qua FE',
    'Dùng khi học sinh bấm Project tiếp theo. Endpoint này không tự mở file; nó điều phối trạng thái và/hoặc yêu cầu Agent xử lý chuyển bài.',
  ],
  [
    'POST /start-exam',
    'Bắt đầu ca thi trên máy local',
    'FE học sinh',
    'Local Agent',
    'Agent lấy metadata project đầu tiên, copy file mẫu từ Desktop\\MOS\\Template sang Desktop\\MOS\\Exam, mở file bài làm và cập nhật current project context.',
  ],
  [
    'POST /submit-current-project',
    'Nộp project hiện tại',
    'FE học sinh hoặc Agent nội bộ',
    'Local Agent',
    'Agent lấy file đang làm, upload/chấm project hiện tại và cập nhật kết quả. Nếu lỗi upload/chấm thì không được chuyển project.',
  ],
  [
    'POST /next-project',
    'Chuyển sang project kế tiếp',
    'FE học sinh',
    'Local Agent',
    'Endpoint quan trọng nhất. Agent khóa chống bấm đúp, submit project hiện tại, chờ backend chấm xong, gọi advance, lấy bootstrap project mới, copy file mẫu mới và mở file mới.',
  ],
  [
    'POST /restart-current-project',
    'Làm lại project hiện tại',
    'FE học sinh',
    'Local Agent',
    'Chỉ reset project đang làm. Agent copy lại đúng file mẫu của project hiện tại, không ảnh hưởng điểm của project đã nộp trước đó.',
  ],
  [
    'GET /current-state',
    'Lấy trạng thái Agent',
    'FE học sinh',
    'Local Agent',
    'Trả project hiện tại, file đang mở, trạng thái xử lý, tiến độ, lỗi gần nhất nếu có. FE dùng để khóa/mở nút và đồng bộ instruction panel.',
  ],
  [
    'POST /api/agent/exam-sessions/{sessionId}/projects/{projectCode}/score-upload',
    'Gửi điểm project',
    'Local Agent hoặc service chấm',
    'Backend agent API',
    'Nhận điểm, feedback, trạng thái chấm và lưu vào projectAttempts[] của đúng projectCode.',
  ],
  [
    'POST /api/agent/exam-sessions/{sessionId}/advance',
    'Chuyển session sang project kế tiếp',
    'Local Agent',
    'Backend agent API',
    'Chỉ cho advance khi project hiện tại đã submit/chấm thành công. Backend tăng currentProjectIndex và trả metadata project tiếp theo hoặc trạng thái hoàn thành ca thi.',
  ],
  [
    'GET /api/agent/exam-sessions/{sessionId}/current-project-bootstrap',
    'Lấy dữ liệu mở project',
    'Local Agent',
    'Backend agent API',
    'Trả thông tin cần thiết để Agent mở project: projectCode, subject, templateFileName, taskSnapshot, modeRules và đường dẫn/cấu hình liên quan.',
  ],
];

const feAgentRows = [
  ['FE học sinh', 'Nút Project tiếp theo', 'Cho phép học sinh chuyển sang project kế tiếp sau khi làm xong project hiện tại.'],
  ['FE học sinh', 'Progress Project 1/10', 'Hiển thị học sinh đang ở project số mấy trên tổng số project.'],
  ['FE học sinh', 'Task list động', 'Task list và instruction panel phải đổi theo project hiện tại.'],
  ['FE học sinh', 'Khóa thao tác khi chuyển bài', 'Tránh học sinh bấm nhiều lần trong lúc Agent đang submit/chấm/mở bài mới.'],
  ['FE giáo viên', 'Chọn danh sách project theo thứ tự', 'Màn tạo publication cho phép kéo/thả hoặc chọn thứ tự project.'],
  ['FE giáo viên', 'Monitor project hiện tại', 'Màn monitor cần hiển thị học sinh đang ở project số mấy, không chỉ started/submitted.'],
  ['Local Agent', 'current project context', 'Agent lưu ngữ cảnh project hiện tại: projectCode, file path, status, sessionId.'],
  ['Local Agent', 'Chống bấm đúp next-project', 'Không cho mở hai project kế tiếp cùng lúc.'],
  ['Local Agent', 'Từ chối advance khi submit lỗi', 'Nếu upload/chấm thất bại thì giữ nguyên project hiện tại.'],
  ['Local Agent', 'Luôn lấy file từ Template', 'Không tái sử dụng file đã làm từ project trước.'],
];

const glossaryRows = [
  ['Publication', 'Đợt phát hành đề/ca thi', 'Cấu hình do giáo viên tạo để học sinh vào làm bài.'],
  ['Session', 'Phiên làm bài', 'Một lượt làm bài của một học sinh trong một ca thi.'],
  ['Project', 'Bài thi con', 'Một phần bài thi Word/Excel/PowerPoint trong ca thi.'],
  ['Attempt', 'Lần làm bài', 'Một lần thực hiện hoặc nộp một project.'],
  ['Local Agent', 'Ứng dụng chạy trên máy học sinh', 'Phần mềm local có nhiệm vụ mở file, copy template, submit file và chuyển bài.'],
  ['Endpoint', 'Đường dẫn API/chức năng API', 'URL để FE, Agent hoặc service gọi backend thực hiện một chức năng.'],
  ['Submit', 'Nộp bài', 'Gửi file đang làm lên hệ thống để chấm.'],
  ['Grading', 'Chấm điểm', 'Xử lý file bài làm và tạo điểm/feedback.'],
  ['Score Upload', 'Gửi kết quả chấm', 'Đẩy điểm và feedback của project về backend.'],
  ['Advance', 'Chuyển bước/chuyển project', 'Cập nhật session sang project tiếp theo.'],
  ['Bootstrap', 'Dữ liệu khởi tạo', 'Thông tin ban đầu để Agent mở đúng project/file/task.'],
  ['Task Snapshot', 'Bản sao task tại lúc phát hành', 'Giữ task ổn định dù project gốc bị chỉnh sửa sau này.'],
  ['Mode Rules', 'Quy tắc chế độ', 'Các quy tắc riêng cho Training/Testing.'],
  ['Current Project Context', 'Ngữ cảnh project hiện tại', 'Thông tin Agent đang giữ để biết file nào/project nào đang làm.'],
  ['Aggregate Score', 'Điểm tổng', 'Điểm tổng hợp của toàn bộ project trong session.'],
  ['Template', 'File mẫu', 'File gốc chưa làm bài, dùng để copy ra file làm bài.'],
  ['Working File', 'File đang làm', 'File học sinh đang chỉnh sửa trong thư mục Exam.'],
];

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>PLAN MỤC 3-5: THI MOS THEO CA NHIỀU PROJECT VỚI LOCAL AGENT</title>
  <style>
    @page {
      size: A4;
      margin: 1.8cm;
    }
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.45;
      color: #111827;
    }
    h1, h2, h3 {
      color: #0f172a;
      margin-top: 18pt;
      margin-bottom: 8pt;
    }
    h1 {
      font-size: 18pt;
      text-align: center;
      margin-top: 0;
    }
    h2 {
      font-size: 14pt;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3pt;
    }
    h3 {
      font-size: 12.5pt;
    }
    p {
      margin: 0 0 8pt 0;
    }
    ul {
      margin: 0 0 10pt 18pt;
    }
    li {
      margin-bottom: 4pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 14pt 0;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #94a3b8;
      padding: 6pt 7pt;
      vertical-align: top;
      word-wrap: break-word;
    }
    th {
      background: #e2e8f0;
      font-weight: bold;
      text-align: left;
    }
    .note {
      background: #f8fafc;
      border-left: 4px solid #64748b;
      padding: 8pt 10pt;
      margin: 8pt 0 14pt 0;
    }
    .small {
      font-size: 11pt;
    }
  </style>
</head>
<body>
  <h1>PLAN MỤC 3-5: THI MOS THEO CA NHIỀU PROJECT VỚI LOCAL AGENT</h1>
  <p><strong>Bản bổ sung:</strong> giữ nguyên tên kỹ thuật tiếng Anh để dev triển khai, đồng thời thêm giải thích tiếng Việt cho model, trường dữ liệu, API endpoint và thư mục/chức năng liên quan.</p>

  <div class="note small">
    <strong>Ghi chú đọc tài liệu:</strong> Tên kỹ thuật bằng tiếng Anh được giữ nguyên để dev triển khai đúng theo code/API; phần tiếng Việt bên cạnh dùng để giải thích nghiệp vụ và ngữ nghĩa.
  </div>

  <h2>1. Tóm tắt</h2>
  <p>Nâng plan từ mô hình <strong>1 publication = 1 project</strong> sang <strong>1 publication = 1 ca thi gồm nhiều project theo thứ tự</strong>, ví dụ Project 01 -&gt; Project 02 -&gt; Project 03.</p>
  <p><strong>Local Agent (ứng dụng chạy trên máy học sinh)</strong> cần bổ sung API chuyển bài. Sau khi học sinh làm xong một project, hệ thống tự <strong>submit (nộp bài)</strong> và chấm ngay project hiện tại, sau đó copy/mở project kế tiếp trong cùng session.</p>

  <h2>2. Mô hình dữ liệu</h2>

  <h3>2.1 ExamPublication (cấu hình phát hành ca thi)</h3>
  <p><strong>ExamPublication (cấu hình phát hành ca thi)</strong> là bản ghi phát hành đề/ca thi cho học sinh. Trước đây mỗi publication chỉ gắn với một project, nay một publication chứa danh sách nhiều project theo đúng thứ tự làm bài.</p>
  ${table(
    ['Tên tiếng Anh', 'Tên/ý nghĩa tiếng Việt', 'Mục đích sử dụng'],
    modelPublicationRows.map((row) => row.map(escapeHtml))
  )}

  <h3>2.2 ExamSession (phiên làm bài của học sinh)</h3>
  <p><strong>ExamSession (phiên làm bài/phiên thi)</strong> là phiên làm bài cấp ca thi. Một session có thể gồm nhiều project con và lưu tiến độ hiện tại của học sinh.</p>
  ${table(
    ['Tên tiếng Anh', 'Tên/ý nghĩa tiếng Việt', 'Mục đích sử dụng'],
    modelSessionRows.map((row) => row.map(escapeHtml))
  )}

  <h3>2.3 ExamSessionProjectAttempt (lần làm bài của một project)</h3>
  <p><strong>ExamSessionProjectAttempt (lần làm bài của một project con)</strong> lưu thông tin chi tiết cho từng project con trong một session. Đây là nơi lưu <strong>working file (file đang làm)</strong>, điểm, feedback và số lần restart/nộp lại.</p>
  ${table(
    ['Tên tiếng Anh', 'Tên/ý nghĩa tiếng Việt', 'Mục đích sử dụng'],
    modelAttemptRows.map((row) => row.map(escapeHtml))
  )}

  <h2>3. API/backend cần bổ sung</h2>
  <p>Các <strong>endpoint (đường dẫn API)</strong> bên dưới được chia theo nhóm người gọi: giáo viên, học sinh/FE, Local Agent và backend dành riêng cho Agent.</p>
  ${table(
    ['Nhóm API', 'Endpoint', 'Giải thích tiếng Việt ngắn'],
    apiRows.map((row) => row.map(escapeHtml))
  )}

  <h2>4. Giải thích chi tiết endpoint</h2>
  ${table(
    ['Endpoint', 'Tên tiếng Việt', 'Bên gọi', 'Bên xử lý', 'Giải thích chi tiết'],
    detailedEndpointRows.map((row) => row.map(escapeHtml))
  )}

  <h2>5. Hành vi nghiệp vụ</h2>
  <h3>5.1 Bắt đầu ca thi</h3>
  ${bulletList([
    'Học sinh vào link, chọn tên và tạo session.',
    'Agent mở project đầu tiên trong projectSequence.',
    'FE hiển thị project hiện tại, tổng số project và task list của project hiện tại.',
  ])}

  <h3>5.2 Chuyển sang bài tiếp theo</h3>
  ${bulletList([
    'Học sinh bấm Chuyển qua Project 02.',
    'FE gọi Agent endpoint POST /next-project.',
    'Agent submit project hiện tại, chờ backend chấm, sau đó mở project kế tiếp.',
    'FE nạp lại task list và instruction panel của project mới.',
  ])}

  <h3>5.3 Kết thúc ca thi</h3>
  ${bulletList([
    'Khi hoàn tất project cuối cùng, next-project không còn khả dụng.',
    'FE chuyển sang trạng thái Hoàn thành ca thi.',
    'Backend tính aggregateScore từ toàn bộ projectAttempts[].',
  ])}

  <h3>5.4 Restart project</h3>
  ${bulletList([
    'Restart chỉ áp dụng cho project hiện tại.',
    'Không làm mất điểm của project đã submit trước đó.',
    'Nếu restart trước khi submit, chỉ reset file bài con đó.',
  ])}

  <h2>6. FE và Agent</h2>
  ${table(
    ['Khu vực', 'Chức năng cần thêm', 'Giải thích tiếng Việt'],
    feAgentRows.map((row) => row.map(escapeHtml))
  )}

  <h3>6.1 Tạo ca thi cho lớp (FE giáo viên)</h3>
  ${bulletList([
    'Giáo viên đăng nhập vào FE admin, chọn menu Quản lý ca thi.',
    'Nhấn nút Tạo ca thi, nhập tên ca thi và mô tả (nếu có).',
    'Chọn danh sách project (projectSequence) và sắp xếp thứ tự làm bài.',
    'Chọn lớp học hoặc danh sách học sinh tham gia.',
    'Thiết lập ngày giờ thi, thời gian làm bài và các thông số khác (thời gian đóng ca, điểm mục tiêu...).',
    'Xác nhận và lưu. FE sẽ gọi API tạo publication chứa projectSequence và gắn ca thi vào lớp.',
    'Hệ thống hiển thị link dự thi để giáo viên gửi cho học sinh, và quản lý danh sách học sinh cùng trạng thái ca thi.',
    'Giáo viên có thể chỉnh sửa hoặc hủy ca thi trước khi học sinh bắt đầu.',
    'Tên học sinh được chọn trong FE tương ứng với StudentId, hệ thống sẽ lưu điểm theo StudentId thay vì chỉ theo tên.',
  ])}

  <h2>7. Test plan</h2>
  ${bulletList([
    'Publication nhiều project được tạo đúng thứ tự.',
    'Start exam mở đúng project đầu tiên.',
    'Next-project submit và chấm ngay project hiện tại trước khi mở project kế tiếp.',
    'Nếu upload/chấm lỗi thì không được advance sang project mới.',
    'Task list/instruction đổi đúng khi sang project tiếp theo.',
    'Restart chỉ reset project hiện tại.',
    'Hoàn tất project cuối thì session chuyển sang complete và tính điểm tổng đúng.',
    'Agent không ghi đè file của project trước khi đã lưu kết quả.',
  ])}

  <h2>8. Giả định và mặc định đã chốt</h2>
  ${bulletList([
    'Một ca thi có thể gồm nhiều project nối tiếp.',
    'Khi sang project tiếp theo, hệ thống tự lưu và chấm ngay project vừa xong.',
    'File mẫu vẫn được phát sẵn thủ công tại Desktop\\MOS\\Template.',
    'Agent cần bổ sung API next-project; plan trước còn thiếu phần này.',
  ])}

  <h2>9. Từ điển thuật ngữ tiếng Anh - tiếng Việt</h2>
  ${table(
    ['Thuật ngữ tiếng Anh', 'Nên hiểu là', 'Giải thích'],
    glossaryRows.map((row) => row.map(escapeHtml))
  )}
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`Generated HTML: ${htmlPath}`);
