'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get('period') || '30d';

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'month', label: 'This Month' },
    { value: 'lifetime', label: 'Lifetime' },
  ];

  function handleSelect(val: string) {
    const params = new URLSearchParams(searchParams);
    params.set('period', val);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="date-pills">
      {periods.map(p => (
        <button
          key={p.value}
          onClick={() => handleSelect(p.value)}
          className={`date-pill ${currentPeriod === p.value ? 'active' : ''}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
