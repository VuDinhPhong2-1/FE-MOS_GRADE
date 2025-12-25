import React from 'react';
import type { GradingResult } from '../types';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  result: GradingResult;
}

const ResultCard: React.FC<Props> = ({ result }) => {
  const [expandedTasks, setExpandedTasks] = React.useState<string[]>([]);

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 mt-6">
      {/* Header Tổng quan */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">{result.projectName} ({result.projectId})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-600">Tổng điểm</p>
            <p className="text-2xl font-bold text-blue-700">{result.totalScore} / {result.maxScore}</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-md">
            <p className="text-sm text-indigo-600">Tỷ lệ</p>
            <p className="text-2xl font-bold text-indigo-700">{result.percentage}%</p>
          </div>
          <div className={clsx("p-3 rounded-md", result.percentage >= 70 ? "bg-green-50" : "bg-yellow-50")}>
            <p className={clsx("text-sm", result.percentage >= 70 ? "text-green-600" : "text-yellow-600")}>Trạng thái</p>
            <p className={clsx("text-2xl font-bold", result.percentage >= 70 ? "text-green-700" : "text-yellow-700")}>{result.status}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
             <p className="text-sm text-gray-500">Ngày chấm</p>
             <p className="text-sm font-medium mt-1">{new Date(result.gradedAt).toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      {/* Chi tiết Task */}
      <div className="divide-y divide-gray-100">
        {result.taskResults.map((task) => (
          <div key={task.taskId} className="bg-white">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
              onClick={() => toggleTask(task.taskId)}
            >
              <div className="flex items-center gap-3">
                {task.isPassed ? <CheckCircle className="text-green-500 w-5 h-5" /> : <XCircle className="text-red-500 w-5 h-5" />}
                <div>
                  <p className="font-medium text-gray-800">{task.taskId}: {task.taskName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={clsx("font-bold", task.score === task.maxScore ? "text-green-600" : "text-red-600")}>
                  {task.score}/{task.maxScore}
                </span>
                {expandedTasks.includes(task.taskId) ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
              </div>
            </div>

            {/* Nội dung chi tiết lỗi/đúng */}
            {expandedTasks.includes(task.taskId) && (
              <div className="px-12 pb-4 pt-0 text-sm">
                {task.errors.length > 0 && (
                  <div className="mb-2">
                    <p className="font-semibold text-red-600 mb-1">Lỗi sai:</p>
                    <ul className="list-disc pl-5 space-y-1 text-red-500">
                      {task.errors.map((err, idx) => <li key={idx}>{err.replace('❌ ', '')}</li>)}
                    </ul>
                  </div>
                )}
                {task.details.length > 0 && (
                  <div>
                    <p className="font-semibold text-green-600 mb-1">Chi tiết đúng:</p>
                    <ul className="list-disc pl-5 space-y-1 text-green-500">
                      {task.details.map((dt, idx) => <li key={idx}>{dt.replace('✓ ', '')}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultCard;
