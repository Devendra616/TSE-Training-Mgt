import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, isWithinInterval } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { getBatches, type Batch } from '@/services/batches';
import { cn } from '@/utils/cn';
import { useNavigate } from 'react-router-dom';

export function CalendarPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch batches
  const { data: batches, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => getBatches(),
  });

  // Generate calendar days
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get batches for a specific day
  const getBatchesForDay = (day: Date): Batch[] => {
    if (!batches) return [];
    return batches.filter((batch) => {
      const startDate = parseISO(batch.startDate);
      const endDate = parseISO(batch.endDate);
      return isWithinInterval(day, { start: startDate, end: endDate });
    });
  };

  // Get first day of week offset
  const firstDayOffset = useMemo(() => {
    return startOfMonth(currentMonth).getDay();
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Calendar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View all scheduled training batches
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[120px] border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                  />
                ))}

                {/* Days */}
                {days.map((day) => {
                  const dayBatches = getBatchesForDay(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'min-h-[120px] border-b border-r border-gray-100 dark:border-gray-800 p-2',
                        isToday && 'bg-blue-50 dark:bg-blue-900/10'
                      )}
                    >
                      <div
                        className={cn(
                          'text-sm font-medium mb-1',
                          isToday
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white'
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayBatches.slice(0, 3).map((batch) => (
                          <button
                            key={batch.id}
                            onClick={() => navigate(`/batches/${batch.id}`)}
                            className={cn(
                              'w-full text-left px-2 py-1 rounded text-xs truncate transition-colors',
                              batch.status === 'in_progress'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                : batch.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                            )}
                            title={`${batch.training?.name} - ${batch.venue}`}
                          >
                            {batch.training?.code || batch.training?.name}
                          </button>
                        ))}
                        {dayBatches.length > 3 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayBatches.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Completed</span>
        </div>
      </div>
    </div>
  );
}
