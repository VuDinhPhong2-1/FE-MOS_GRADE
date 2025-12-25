import React, { useState } from 'react';
import StudentList from './StudentList';
import type { School, Class } from '../types';

const initialClasses: Class[] = [
  { id: 1, name: '10A1', schoolId: 1 },
  { id: 2, name: '10A2', schoolId: 1 },
  { id: 3, name: '11B1', schoolId: 2 }
];

const ClassList = ({ selectedSchool }: { selectedSchool: School }) => {
  const [classes] = useState<Class[]>(initialClasses);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Lọc lớp học theo trường đã chọn
  const displayedClasses = classes.filter((cls) => cls.schoolId === selectedSchool.id);

  return (
    <div>
      {!selectedClass ? (
        <>
          <h2 className="text-xl font-semibold mb-4">
            Danh sách lớp thuộc trường <span className="text-blue-600">{selectedSchool.name}</span>
          </h2>
          <div className="bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3">STT</th>
                  <th className="px-6 py-3">Tên lớp</th>
                  <th className="px-6 py-3 text-center">Chức năng</th>
                </tr>
              </thead>
              <tbody>
                {displayedClasses.map(cls => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{cls.id}</td>
                    <td className="px-6 py-4">{cls.name}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedClass(cls)}
                        className="bg-green-100 text-green-700 rounded px-2 py-1 hover:bg-green-200"
                        title="Xem danh sách học sinh"
                      >Xem danh sách học sinh</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <button
            className="mb-4 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            onClick={() => setSelectedClass(null)}
          >← Quay lại danh sách lớp</button>
          <StudentList selectedClass={selectedClass} />
        </>
      )}
    </div>
  );
};

export default ClassList;
