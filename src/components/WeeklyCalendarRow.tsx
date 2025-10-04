// src/components/WeeklyCalendarRow.tsx
export type WeekDayCell = {
  dateKey: string;
  label: string;     // 'S','M','T','W','T','F','S'
  isToday: boolean;
  done: boolean;
};

type Props = {
  days: WeekDayCell[];
  onClickDay?: (dateKey: string) => void;
};

export default function WeeklyCalendarRow({ days, onClickDay }: Props) {
  return (
    <div className="week" aria-label="Weekly habit calendar">
      <div className="week-grid" role="list">
        {days.map((d) => (
          <button
            key={d.dateKey}
            className={`dot${d.done ? " done" : ""}${d.isToday ? " today" : ""}`}
            title={d.dateKey}
            aria-pressed={d.done}
            onClick={onClickDay ? () => onClickDay(d.dateKey) : undefined}
            type="button"
          >
            <span className="dot-letter" aria-hidden="true">
              {d.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

