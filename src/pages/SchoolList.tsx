import React, { useState } from 'react';
import ClassList from './Classlist';
import type { School } from '../types';

const initialSchools: School[] = [
  { id: 1, name: 'THPT A' },
  { id: 2, name: 'THPT B' }
];

const SchoolList = () => {
  const [schools] = useState<School[]>(initialSchools);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  return (
    <div className="p-4">
      {!selectedSchool ? (
        <>
          <h1 className="text-2xl font-bold mb-6">Quản lý trường học 🏫</h1>
          <div className="bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3">STT</th>
                  <th className="px-6 py-3">Tên trường</th>
                  <th className="px-6 py-3 text-center">Chức năng</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(sch => (
                  <tr key={sch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{sch.id}</td>
                    <td className="px-6 py-4">{sch.name}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedSchool(sch)}
                        className="bg-blue-100 text-blue-700 rounded px-2 py-1 hover:bg-blue-200"
                        title="Xem lớp học"
                      >Xem lớp học</button>
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
            onClick={() => setSelectedSchool(null)}
          >← Quay lại danh sách trường</button>
          <ClassList selectedSchool={selectedSchool} />
        </>
      )}
    </div>
  );
};

export default SchoolList;
