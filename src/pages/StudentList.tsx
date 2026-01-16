// src/pages/StudentList.tsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { Class } from '../types';
import type { Student, StudentImportItem } from '../types/student.types';
import studentService from '../services/student.service';
import { Upload, FileCheck2, Pencil, Eye, Save, RefreshCw } from 'lucide-react';
import GradingModal from '../components/GradingModal';

const StudentList = ({ selectedClass }: { selectedClass: Class }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);

    useEffect(() => {
        if (selectedClass?.id) {
            loadStudents();
        }
    }, [selectedClass?.id]);

    const loadStudents = async () => {
        setIsLoading(true);
        try {
            const data = await studentService.getStudentsByClassId(selectedClass.id);
            setStudents(data);
        } catch (error) {
            console.error('❌ Error loading students:', error);
            alert('Không thể tải danh sách học sinh!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            const list: Student[] = [];
            data.slice(1).forEach((row: any, index) => {
                if (row[0] && row[1]) {
                    list.push({
                        id: `temp-${index + 1}`,
                        middleName: row[0],
                        firstName: row[1],
                        gradingApiEndpoint: row[2]
                    });
                }
            });
            setStudents(list);
        };
        reader.readAsBinaryString(file);
    };

    const handleSaveStudents = async () => {
        if (students.length === 0) {
            alert('Chưa có học sinh nào để lưu!');
            return;
        }

        setIsLoading(true);

        try {
            const importItems: StudentImportItem[] = students.map((st) => ({
                MiddleName: st.middleName,
                FirstName: st.firstName,
            }));

            const result = await studentService.bulkImportStudents({
                Students: importItems,
                ClassId: selectedClass.id,
            });

            if (!result) {
                alert('❌ Không nhận được phản hồi từ server!');
                return;
            }

            alert(
                `✅ Import thành công: ${result.SuccessCount}/${result.TotalCount} học sinh`
            );

            if (result.Errors && result.Errors.length > 0) {
                console.error('Lỗi khi import:', result.Errors);
                alert(`⚠️ Có ${result.Errors.length} lỗi khi import. Xem console để biết chi tiết.`);
            }

            await loadStudents();
        } catch (error) {
            console.error('❌ Error importing students:', error);
            alert('Có lỗi xảy ra khi import học sinh!');
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ MỞ MODAL CHẤM ĐIỂM
    const handleGrade = () => {
        if (students.length === 0) {
            alert('Chưa có học sinh nào để chấm điểm!');
            return;
        }
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.rangeCount > 0) {
            sel.removeAllRanges();
        }
        setIsGradingModalOpen(true);
    };

    const handleGradingSuccess = () => {
        // Có thể reload students hoặc làm gì đó khác
    };

    const handleEdit = (student: Student) => {
        alert(`Sửa điểm cho: ${student.middleName} ${student.firstName}`);
    };

    const handleView = (student: Student) => {
        alert(`Xem điểm của: ${student.middleName} ${student.firstName}`);
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Danh sách học sinh - {selectedClass.name}
                </h1>
            </div>

            {/* NÚT CHẤM ĐIỂM RIÊNG BIỆT */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={handleGrade}
                    disabled={students.length === 0}
                    className="bg-purple-600 text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-purple-700 disabled:bg-gray-400 text-lg font-semibold disabled:cursor-not-allowed"
                    title="Chấm điểm cho cả lớp"
                >
                    <FileCheck2 size={20} />
                    Chấm điểm cho cả lớp
                </button>

                <div className="flex gap-2">
                    {/* NÚT TẢI LẠI */}
                    <button
                        onClick={loadStudents}
                        disabled={isLoading}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-700 disabled:bg-gray-400"
                        title="Tải lại danh sách"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        Tải lại
                    </button>

                    {/* NÚT IMPORT EXCEL */}
                    <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".xlsx, .xls"
                        className="hidden"
                        id="import-excel"
                    />
                    <label
                        htmlFor="import-excel"
                        className="bg-green-600 text-white px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-green-700"
                    >
                        <Upload size={18} /> Import Excel
                    </label>

                    {/* NÚT LƯU DANH SÁCH */}
                    {students.length > 0 && (
                        <button
                            onClick={handleSaveStudents}
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            <Save size={18} />
                            {isLoading ? 'Đang lưu...' : 'Lưu danh sách'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                STT
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Họ và Tên đệm
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Tên
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Chức năng
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : students.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-6 py-4 text-center text-gray-500"
                                >
                                    Chưa có học sinh nào. Vui lòng import file Excel.
                                </td>
                            </tr>
                        ) : (
                            students.map((st, index) => (
                                <tr key={st.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {st.middleName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {st.firstName}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleEdit(st)}
                                            className="inline-flex items-center gap-1 text-sm px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 mr-1"
                                            title="Sửa điểm"
                                        >
                                            <Pencil size={16} /> Sửa
                                        </button>
                                        <button
                                            onClick={() => handleView(st)}
                                            className="inline-flex items-center gap-1 text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            title="Xem điểm"
                                        >
                                            <Eye size={16} /> Xem
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <GradingModal
                isOpen={isGradingModalOpen}
                onClose={() => setIsGradingModalOpen(false)}
                classId={selectedClass.id}
                students={students}
                onSuccess={handleGradingSuccess}
            />
        </div>
    );
};

export default StudentList;
