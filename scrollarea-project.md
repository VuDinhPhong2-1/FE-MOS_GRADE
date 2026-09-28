# Plan: Tích hợp ScrollArea `type="scroll"` vào toàn bộ project

## 1. Overview
Đồng bộ hóa trải nghiệm cuộn (scroll experience) trên toàn bộ ứng dụng MOS Grader Pro bằng việc chuẩn hóa sử dụng component `ScrollArea` từ thư viện `@bug-on/m3-expressive/layout` với cơ chế hiển thị `type="scroll"`.

### Bối cảnh & Vấn đề hiện tại:
- Hiện nay trong dự án còn nhiều vị trí sử dụng thanh cuộn trình duyệt mặc định (`overflow-y-auto`, `overflow-x-auto`, `overflow-auto`), dẫn đến thanh cuộn thô cứng, không đồng nhất giữa các hệ điều hành (Windows scrollbars to bản, chiếm diện tích gây layout shift; macOS floating scrollbars).
- Một số component đã tích hợp `ScrollArea` (như `GradingView.tsx`, `TeacherListPanel.tsx`, `SchoolClassAssignmentPicker.tsx`) nhưng chưa khai báo rõ thuộc tính `type="scroll"` hoặc chưa đồng bộ kích thước track/thumb và bo góc MD3.
- Hai file thuộc `submission-portal` (`GradingResult.tsx` và `LeaderboardSection.tsx`) đã hoàn thiện tích hợp `ScrollArea` với `type="scroll"` thành công. Dự án cần mở rộng mẫu chuẩn này ra toàn bộ các phân hệ còn lại:
  1. **Khung cuộn chính của ứng dụng** (`Layout.tsx`): Bao bọc toàn bộ nội dung dashboard của tất cả các trang.
  2. **Bảng dữ liệu dùng chung** (`DataTable.tsx`): Hỗ trợ cuộn ngang và cuộn dọc mượt mà với `type="scroll"`, tương thích với `stickyHeader`.
  3. **Hệ thống Dialogs / Modals**: Các modal tạo mới/chỉnh sửa, xác nhận (`ConfirmDialog`, `AlertDialog`, `ErrorModal`, `StudentModal`, `SchoolFormModal`, `ClassFormModal`, v.v.).
  4. **Các Panel & Section tính năng**: Bảng phân quyền, bảng chọn bài thi, bộ lọc, xem mã XML/quy tắc chấm, và nhật ký agent.

---

## 2. Project Type
**WEB** (React 19 + TypeScript + Vite + Tailwind CSS + `@bug-on/m3-expressive`)

---

## 3. Success Criteria
- [ ] Khung layout chính (`Layout.tsx`) sử dụng `ScrollArea` với `type="scroll"`, tạo trải nghiệm cuộn đồng nhất cho tất cả các trang quản trị.
- [ ] Component `DataTable.tsx` được nâng cấp hỗ trợ `ScrollArea` (`type="scroll"`) cho vùng dữ liệu bảng, giữ nguyên tính năng `stickyHeader` và responsive.
- [ ] Toàn bộ các Modal / Dialog có nội dung dài (Body scroll) chuyển sang dùng `ScrollArea` (`type="scroll"`), loại bỏ hoàn toàn hiện tượng thanh cuộn native vỡ layout hay che mất viền bo góc `rounded-4xl` của Dialog.
- [ ] Tất cả các vị trí đã có `ScrollArea` (`GradingView`, `TeacherListPanel`, `SchoolClassAssignmentPicker`) được chuẩn hóa bổ sung thuộc tính `type="scroll"` rõ ràng.
- [ ] Các panel tính năng danh sách dài (`PermissionPanel`, `PortalDetailsSection`, `ClassAnalyticsPanel`, `MultiAssignmentSelector`, `ScoreboardContent`, `XmlGradingRulesPage`, `AssignmentManagementPage`, `LocalAgentCompactPanel`) được nâng cấp sang `ScrollArea` `type="scroll"`.
- [ ] Thanh cuộn tự động ẩn khi người dùng ngừng tương tác và chỉ hiển thị khi đang cuộn (`type="scroll"`), thời gian trễ ẩn chuẩn ~600ms.
- [ ] Tuân thủ chặt chẽ design tokens Material Design 3 trong `DESIGN.md` (màu track `bg-m3-surface-container`, màu thumb `bg-m3-on-surface/25 hover:bg-m3-on-surface/40`, bo góc full).
- [ ] Đạt 100% Type-check (`tsc -b`), lint và build thành công không có lỗi hoặc cảnh báo.

---

## 4. Tech Stack & Dependencies
- **UI Kit**: `@bug-on/m3-expressive/layout` (`ScrollArea`, `ScrollAreaScrollbar`, `ScrollAreaCorner`)
- **Tokens & Theming**: Tailwind CSS với CSS variables Material Design 3 (`--md-sys-color-*`)
- **Table Primitive**: `@tanstack/react-table` kết hợp `DataTable`
- **Core Primitives**: `@radix-ui/react-scroll-area` (bên dưới `@bug-on/m3-expressive`)

---

## 5. File Structure & Changes Plan

```
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx                     # [MODIFIED] Bọc main view bằng ScrollArea type="scroll"
│   │   └── ProfileModal.tsx               # [MODIFIED] Tích hợp ScrollArea cho DialogBody
│   ├── data-table/
│   │   └── DataTable.tsx                  # [MODIFIED] Tích hợp ScrollArea type="scroll" cho table content
│   └── common/
│       ├── ConfirmDialog.tsx              # [MODIFIED] Bọc message content bằng ScrollArea type="scroll"
│       ├── AlertDialog.tsx                # [MODIFIED] Bọc message content bằng ScrollArea type="scroll"
│       └── ErrorModal.tsx                 # [MODIFIED] Tích hợp ScrollArea type="scroll"
├── features/
│   ├── student-list/
│   │   ├── StudentModal.tsx               # [MODIFIED] ScrollArea type="scroll" cho form modal
│   │   ├── PasteStudentModal.tsx          # [MODIFIED] ScrollArea type="scroll" cho paste list modal
│   │   └── ClassAnalyticsPanel.tsx        # [MODIFIED] ScrollArea type="scroll" cho class analytics panel
│   ├── class-list/components/
│   │   ├── ClassFormModal.tsx             # [MODIFIED] ScrollArea type="scroll" cho form modal
│   │   └── HandoverModal.tsx              # [MODIFIED] ScrollArea type="scroll" cho danh sách bàn giao
│   ├── school-list/
│   │   └── SchoolFormModal.tsx            # [MODIFIED] ScrollArea type="scroll" cho form modal
│   ├── computer-rooms/components/
│   │   └── RoomFormModal.tsx              # [MODIFIED] ScrollArea type="scroll" cho form modal
│   ├── teacher-schedule/
│   │   ├── ScheduleFormModal.tsx          # [MODIFIED] ScrollArea type="scroll" cho form modal
│   │   └── AttendanceModal.tsx            # [MODIFIED] ScrollArea type="scroll" cho modal điểm danh
│   ├── permission-management/
│   │   ├── TeacherListPanel.tsx           # [MODIFIED] Thêm rõ type="scroll" cho ScrollArea
│   │   └── PermissionPanel.tsx            # [MODIFIED] Đổi overflow-y-auto sang ScrollArea type="scroll"
│   ├── submission-portal-management/components/
│   │   ├── SchoolClassAssignmentPicker.tsx# [MODIFIED] Chuẩn hóa type="scroll" cho 2 ScrollArea
│   │   ├── PortalFormDialog.tsx           # [MODIFIED] ScrollArea type="scroll" cho DialogBody
│   │   ├── PortalDetailsSection.tsx       # [MODIFIED] ScrollArea type="scroll" cho details list
│   │   └── SubmissionLogsTable.tsx        # [MODIFIED] Tận dụng ScrollArea từ DataTable
│   ├── grading/
│   │   ├── ViewAllScoresModal.tsx         # [MODIFIED] ScrollArea type="scroll" cho full modal
│   │   ├── components/dialogs/
│   │   │   └── ManualFileMatchModal.tsx   # [MODIFIED] ScrollArea type="scroll" cho modal
│   │   ├── components/manage/
│   │   │   └── EditAssignmentModal.tsx    # [MODIFIED] ScrollArea type="scroll" cho modal
│   │   ├── components/multi/
│   │   │   ├── MultiAssignmentSelector.tsx# [MODIFIED] ScrollArea type="scroll" cho danh sách bài thi
│   │   │   └── MultiGradingTable.tsx      # [MODIFIED] ScrollArea type="scroll"
│   │   ├── components/single/
│   │   │   └── SingleGradingTable.tsx     # [MODIFIED] ScrollArea type="scroll"
│   │   └── components/
│   │       └── ScoreboardContent.tsx      # [MODIFIED] ScrollArea type="scroll" cho error list & table
│   └── local-agent/
│       └── LocalAgentCompactPanel.tsx     # [MODIFIED] ScrollArea type="scroll" cho logs và chat list
└── pages/
    ├── GradingView.tsx                    # [MODIFIED] Bổ sung type="scroll" cho ScrollArea hiện có
    ├── AssignmentManagementPage.tsx       # [MODIFIED] ScrollArea type="scroll" cho assignment lists
    └── XmlGradingRulesPage.tsx            # [MODIFIED] ScrollArea type="scroll" cho rule trees & code pre
```

---

## 6. Task Breakdown

### Phase 1: Core Layout & Shared Components (P0)

#### Task 1.1: Tích hợp `ScrollArea` vào Main Application Layout
- **Target File**: `src/components/layout/Layout.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Thay thế `<div className="flex-1 min-h-0 overflow-y-auto p-5 sm:pb-24 lg:pb-20">` bằng `<ScrollArea type="scroll" orientation="vertical" className="flex-1 min-h-0" viewportClassName="p-5 sm:pb-24 lg:pb-20">`.
  - Giữ nguyên cấu trúc flex/min-h-0 và bo góc `rounded-m3-xl-inc` của khung ngoài.
- **INPUT**: `Layout.tsx` với `overflow-y-auto`
- **OUTPUT**: `Layout.tsx` sử dụng `ScrollArea` với `type="scroll"`, viewport padding chuẩn
- **VERIFY**: Mở bất kỳ trang quản trị nào (`/dashboard`, `/assignments`), cuộn trang và xác nhận thanh cuộn mượt mà chỉ hiện khi cuộn, tự ẩn sau 600ms.

#### Task 1.2: Nâng cấp `DataTable` với `ScrollArea` chuẩn `type="scroll"`
- **Target File**: `src/components/data-table/DataTable.tsx`, `src/components/data-table/types.ts`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `nextjs-react-expert`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Tích hợp `ScrollArea` với `type="scroll"` và `orientation="both"` (hoặc `"horizontal"` / `"vertical"` linh hoạt theo props) thay thế thẻ `<div className={cn("overflow-x-auto", scrollContainerClassName)}>` thông thường.
  - Hỗ trợ fallback linh hoạt khi được bọc ScrollArea ngoài (`overflow-visible`), tự động nhận diện orientation và làm sạch class.
- **INPUT**: `DataTable.tsx` dùng `div overflow-x-auto`
- **OUTPUT**: `DataTable.tsx` tích hợp `ScrollArea` `type="scroll"`
- **VERIFY**: Kiểm tra các trang có bảng (Submission Portal Management, Class List, Student List) hiển thị thanh cuộn chuẩn MD3 khi cuộn ngang/dọc, header dính khi cuộn dọc.

#### Task 1.3: Cập nhật các Dialog thông báo dùng chung (`ConfirmDialog`, `AlertDialog`, `ErrorModal`)
- **Target Files**:
  - `src/components/common/ConfirmDialog.tsx`
  - `src/components/common/AlertDialog.tsx`
  - `src/components/common/ErrorModal.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Bọc phần nội dung văn bản dài (`max-h-[60vh]` hoặc `max-h-[86vh]`) bằng `ScrollArea` với `type="scroll"` và `orientation="vertical"`.
- **INPUT**: Các dialog dùng thẻ `div overflow-y-auto` / `overflow-auto`
- **OUTPUT**: Dùng `ScrollArea type="scroll"` với padding và giới hạn chiều cao hợp lý
- **VERIFY**: Mở dialog có văn bản dài xác nhận cuộn êm và không tràn ra ngoài border-radius của modal.

---

### Phase 2: Form Modals & Dialogs (P1)

#### Task 2.1: Tích hợp `ScrollArea` vào Modals Quản lý Học sinh & Lớp học
- **Target Files**:
  - `src/features/student-list/StudentModal.tsx`
  - `src/features/student-list/PasteStudentModal.tsx`
  - `src/features/class-list/components/ClassFormModal.tsx`
  - `src/features/class-list/components/HandoverModal.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Chuyển đổi vùng cuộn `DialogBody` (`overflow-y-auto`) hoặc div danh sách bên trong sang sử dụng `ScrollArea` với `type="scroll"` và `orientation="vertical"`.
  - Đảm bảo form validation, auto-focus của input và dropdown selects (Menu/Select) không bị clipping hay xung đột sự kiện cuộn.
- **INPUT**: Các modal học sinh và lớp học có thanh cuộn native
- **OUTPUT**: Modal với `ScrollArea type="scroll"`, hiển thị tinh tế trên cả desktop và màn hình laptop nhỏ
- **VERIFY**: Mở form thêm mới học sinh / bàn giao lớp trên màn hình chiều cao thấp, kiểm tra cuộn mượt mà.

#### Task 2.2: Tích hợp `ScrollArea` vào Modals Cơ sở vật chất, Lịch dạy & Portal
- **Target Files**:
  - `src/features/school-list/SchoolFormModal.tsx`
  - `src/features/computer-rooms/components/RoomFormModal.tsx`
  - `src/features/teacher-schedule/ScheduleFormModal.tsx`
  - `src/features/teacher-schedule/AttendanceModal.tsx`
  - `src/features/submission-portal-management/components/PortalFormDialog.tsx`
  - `src/components/layout/ProfileModal.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Thay thế `overflow-y-auto` trên `DialogBody` / div container bằng `ScrollArea` `type="scroll"`.
  - Căn chỉnh `viewportClassName` giữ nguyên padding form chuẩn (`px-6 py-4`).
- **INPUT**: Các modal biểu mẫu quản lý trường/phòng máy/lịch/portal
- **OUTPUT**: Sử dụng `ScrollArea type="scroll"` đồng bộ
- **VERIFY**: Mở từng modal và tương tác với các trường nhập liệu, nút submit luôn nằm cố định ở footer.

---

### Phase 3: Feature Panels, Grading & Rule Pages (P2)

#### Task 3.1: Chuẩn hóa các component đã có `ScrollArea`
- **Target Files**:
  - `src/pages/GradingView.tsx`
  - `src/features/permission-management/TeacherListPanel.tsx`
  - `src/features/submission-portal-management/components/SchoolClassAssignmentPicker.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Bổ sung tường minh thuộc tính `type="scroll"` và `orientation="vertical"` vào các thẻ `<ScrollArea>` hiện có.
  - Chuẩn hóa `scrollbarSize={8}` hoặc mặc định, đảm bảo đồng bộ styling thanh cuộn.
- **INPUT**: `ScrollArea` không khai báo rõ ràng `type="scroll"`
- **OUTPUT**: `ScrollArea` khai báo rõ `type="scroll"`, `orientation="vertical"`
- **VERIFY**: Kiểm tra `GradingView.tsx`, `TeacherListPanel.tsx`, `SchoolClassAssignmentPicker.tsx` cuộn đúng chuẩn.

#### Task 3.2: Tích hợp `ScrollArea` vào Phân hệ Phân quyền & Quản lý Cổng nộp
- **Target Files**:
  - `src/features/permission-management/PermissionPanel.tsx`
  - `src/features/submission-portal-management/components/PortalDetailsSection.tsx`
  - `src/features/student-list/ClassAnalyticsPanel.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Thay thế các div có `max-h-... overflow-y-auto` bằng `ScrollArea` `type="scroll"`.
- **INPUT**: Các panel hiển thị danh sách với `overflow-y-auto`
- **OUTPUT**: Bọc trong `ScrollArea` với `type="scroll"`
- **VERIFY**: Tải trang Phân quyền và Chi tiết Cổng nộp, kiểm tra cuộn danh sách giáo viên/quyền hạn.

#### Task 3.3: Tích hợp `ScrollArea` vào Phân hệ Chấm bài (Grading)
- **Target Files**:
  - `src/features/grading/ViewAllScoresModal.tsx`
  - `src/features/grading/components/dialogs/ManualFileMatchModal.tsx`
  - `src/features/grading/components/manage/EditAssignmentModal.tsx`
  - `src/features/grading/components/multi/MultiAssignmentSelector.tsx`
  - `src/features/grading/components/multi/MultiGradingTable.tsx`
  - `src/features/grading/components/single/SingleGradingTable.tsx`
  - `src/features/grading/components/ScoreboardContent.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Thay thế vùng cuộn danh sách lỗi, bảng chấm điểm nhiều bài thi (`MultiGradingTable`), danh sách chọn bài thi (`MultiAssignmentSelector`), và modal tổng hợp điểm (`ViewAllScoresModal`).
- **INPUT**: Các bảng chấm và danh sách bài tập dùng `overflow-auto`
- **OUTPUT**: Chuyển sang `ScrollArea` `type="scroll"` với orientation phù hợp (`vertical` hoặc `both`)
- **VERIFY**: Mở trang chấm bài, xem kết quả chấm và bảng điểm tổng thể mượt mà, cuộn êm.

#### Task 3.4: Tích hợp `ScrollArea` vào Phân hệ Quản lý Bài tập, Quy tắc XML & Local Agent
- **Target Files**:
  - `src/pages/AssignmentManagementPage.tsx`
  - `src/pages/XmlGradingRulesPage.tsx`
  - `src/features/local-agent/LocalAgentCompactPanel.tsx`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`, `frontend-design`
- **Status**: [x] Đã hoàn thành
- **Mô tả**:
  - Trong `AssignmentManagementPage.tsx`: Thay các danh sách bài thi/lớp học gán (`max-h-56 overflow-auto`, `max-h-110 overflow-auto`) bằng `ScrollArea type="scroll"`.
  - Trong `XmlGradingRulesPage.tsx`: Thay các khối xem trước XML (`pre max-h-96 overflow-auto`) và cây danh mục quy tắc bằng `ScrollArea type="scroll" orientation="both"`.
  - Trong `LocalAgentCompactPanel.tsx`: Thay các vùng log console và lịch sử agent bằng `ScrollArea type="scroll"`.
- **INPUT**: Code blocks và logs dùng `overflow-auto`
- **OUTPUT**: `ScrollArea type="scroll"`
- **VERIFY**: Xem thử tab XML rules và logs local agent, cuộn hiển thị code không bị tràn layout.

---

## 7. Phase X: Final Verification Checklist

- [x] **Design Token Check**: Đảm bảo tất cả ScrollArea tuân thủ token MD3 (`bg-m3-surface-container`, `rounded-full` cho thumb, không hardcode màu tím hay màu lạ).
- [x] **Scroll Behavior Consistency**: Mọi nơi đều dùng `type="scroll"`, scrollbar ẩn khi không cuộn và hiện mượt mà khi cuộn.
- [x] **Responsive & Mobile Touch**: Hoạt động mượt trên cả cảm ứng điện thoại/tablet và con lăn chuột desktop.
- [x] **Accessibility & Keyboard Navigation**: Cho phép điều hướng bằng phím mũi tên, PgUp/PgDown trong vùng cuộn.
- [x] **TypeScript Check**: `tsc -b` thực thi thành công không có lỗi type nào.
- [x] **Build Check**: `bun run build` hoàn thành nhanh chóng, bundle tối ưu.
- [x] **Runtime Check**: Dev server chạy trơn tru trên `http://localhost:5173`.
