import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import type { Class, Student } from '../types';
import { Upload, FileCheck2, Pencil, Eye } from 'lucide-react';

const StudentList = ({ selectedClass }: { selectedClass: Class }) => {
    const [students, setStudents] = useState<Student[]>([]);

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
            // Giả sử row 0 là header, data từ row 1
            const list: Student[] = [];
            data.slice(1).forEach((row: any, index) => {
                if (row[0]) {
                    list.push({
                        id: index + 1,
                        hoDem: row[0],
                        ten: row[1],
                        lop: row[2],
                        truong: row[3] || ""
                    });
                }
            });
            setStudents(list);
        };
        reader.readAsBinaryString(file);
    };

    // Demo chức năng, bạn có thể thay thế bằng handler thực sự
    const handleGrade = (student: Student) => {
        alert(`Chấm điểm cho học sinh: ${student.hoDem} ${student.ten}`);
    };
    const handleEdit = (student: Student) => {
        alert(`Sửa điểm cho: ${student.hoDem} ${student.ten}`);
    };
    const handleView = (student: Student) => {
        alert(`Xem điểm của: ${student.hoDem} ${student.ten}`);
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Danh sách học sinh</h1>
                <div className="relative">
                    <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" id="import-excel" />
                    <label htmlFor="import-excel" className="bg-green-600 text-white px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-green-700">
                        <Upload size={18} /> Import Excel
                    </label>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ và Tên đệm</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trường</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Chức năng</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Chưa có dữ liệu. Vui lòng import file Excel.</td>
                            </tr>
                        ) : (
                            students.map((st) => (
                                <tr key={st.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{st.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{st.hoDem}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{st.ten}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{st.lop}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{st.truong}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleGrade(st)}
                                            className="inline-flex items-center gap-1 text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 mr-1"
                                            title="Chấm điểm thi"
                                        >
                                            <FileCheck2 size={16} /> Chấm điểm
                                        </button>
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
        </div>
    );
};

export default StudentList;
