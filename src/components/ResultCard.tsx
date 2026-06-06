import React from 'react';
import type { GradingResult } from '../types';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { stripGradingGuideSection } from '../utils/gradingText';

interface Props {
  result: GradingResult;
}

const ResultCard: React.FC<Props> = ({ result }) => {
  const [expandedTasks, setExpandedTasks] = React.useState<string[]>([]);

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div className="border-b border-gray-200 bg-gray-50 p-6">
        <h2 className="text-xl font-bold text-gray-800">
          {result.projectName} ({result.projectId})
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-sm text-blue-600">Tổng điểm</p>
            <p className="text-2xl font-bold text-blue-700">
              {result.totalScore} / {result.maxScore}
            </p>
          </div>
          <div className="rounded-md bg-indigo-50 p-3">
            <p className="text-sm text-indigo-600">Tỷ lệ</p>
            <p className="text-2xl font-bold text-indigo-700">{result.percentage}%</p>
          </div>
          <div className={clsx('rounded-md p-3', result.percentage >= 70 ? 'bg-green-50' : 'bg-yellow-50')}>
            <p className={clsx('text-sm', result.percentage >= 70 ? 'text-green-600' : 'text-yellow-600')}>
              Trạng thái
            </p>
            <p
              className={clsx(
                'text-2xl font-bold',
                result.percentage >= 70 ? 'text-green-700' : 'text-yellow-700'
              )}
            >
              {result.status}
            </p>
          </div>
          <div className="rounded-md bg-gray-100 p-3">
            <p className="text-sm text-gray-500">Ngày chấm</p>
            <p className="mt-1 text-sm font-medium">{new Date(result.gradedAt).toLocaleString('vi-VN')}</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {result.taskResults.map((task, index) => {
          const taskKey = `${task.taskId}-${index}`;
          const errors = (task.errors || [])
            .map((err) => stripGradingGuideSection(err))
            .filter(Boolean);
          const details = (task.details || [])
            .map((detail) => stripGradingGuideSection(detail))
            .filter(Boolean);

          return (
            <div key={taskKey} className="bg-white">
              <div
                className="flex cursor-pointer items-center justify-between p-4 transition hover:bg-gray-50"
                onClick={() => toggleTask(taskKey)}
              >
                <div className="flex items-center gap-3">
                  {task.isPassed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {task.taskId}: {task.taskName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={clsx('font-bold', task.score === task.maxScore ? 'text-green-600' : 'text-red-600')}>
                    {task.score}/{task.maxScore}
                  </span>
                  {expandedTasks.includes(taskKey) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {expandedTasks.includes(taskKey) && (
                <div className="px-12 pb-4 pt-0 text-sm">
                  {errors.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 font-semibold text-red-600">Lỗi sai:</p>
                      <ul className="list-disc space-y-1 pl-5 text-red-500">
                        {errors.map((err, idx) => (
                          <li key={idx}>{err.replace('â’ ', '')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {details.length > 0 && (
                    <div>
                      <p className="mb-1 font-semibold text-green-600">Chi tiết đúng:</p>
                      <ul className="list-disc space-y-1 pl-5 text-green-500">
                        {details.map((detail, idx) => (
                          <li key={idx}>{detail.replace('âœ“ ', '')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultCard;
