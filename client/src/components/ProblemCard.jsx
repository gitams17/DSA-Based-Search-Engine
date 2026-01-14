import React from 'react';

const getPlatformStyle = (url) => {
  if (url.includes('leetcode')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (url.includes('codeforces')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (url.includes('atcoder')) return 'bg-gray-800 text-white border-gray-600';
  if (url.includes('cses')) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (url.includes('codechef')) return 'bg-amber-900 text-white border-amber-700';
  return 'bg-gray-100 text-gray-800';
};

const getPlatformName = (url) => {
    if (url.includes('leetcode')) return 'LeetCode';
    if (url.includes('codeforces')) return 'Codeforces';
    if (url.includes('atcoder')) return 'AtCoder';
    if (url.includes('cses')) return 'CSES';
    if (url.includes('codechef')) return 'CodeChef';
    return 'Unknown';
}

export default function ProblemCard({ problem }) {
  const { title, url, description } = problem;
  const platformStyle = getPlatformStyle(url);
  const platformName = getPlatformName(url);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
            <span className={`text-xs font-bold px-2 py-1 rounded border ${platformStyle}`}>
              {platformName}
            </span>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-blue-600 hover:underline mb-2 block">
          {title}
        </a>
        <p className="text-gray-600 text-sm line-clamp-3">
          {description}
        </p>
      </div>
    </div>
  );
}