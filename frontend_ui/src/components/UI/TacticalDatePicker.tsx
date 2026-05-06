import React from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isBefore,
  isAfter,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface TacticalDatePickerProps {
  label: string;
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date | null;
  placeholder?: string;
  align?: 'left' | 'right';
}

export function TacticalDatePicker({ 
  label, 
  selectedDate, 
  onChange, 
  minDate,
  placeholder = "SELECT DATE",
  align = 'left'
}: TacticalDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-background-muted/50">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:text-brand-primary transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:text-brand-primary transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    return (
      <div className="grid grid-cols-7 mb-2 border-b border-border-subtle/30 pb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[7px] font-mono font-bold text-text-muted tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isDisabled = minDate ? isBefore(day, startOfDay(minDate)) : false;

        days.push(
          <button
            key={day.toString()}
            disabled={isDisabled}
            className={cn(
              "h-8 w-full flex items-center justify-center text-[9px] font-mono transition-all border border-transparent",
              !isCurrentMonth ? "text-text-muted/20" : "text-text-primary",
              isSelected ? "bg-brand-primary text-white border-brand-primary shadow-[0_0_10px_rgba(255,62,0,0.3)] z-10" : "hover:border-brand-primary/40",
              isDisabled && "opacity-20 cursor-not-allowed bg-zinc-950 grayscale"
            )}
            onClick={() => {
              onChange(cloneDay);
              setIsOpen(false);
            }}
          >
            <span>{formattedDate}</span>
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="p-2">{rows}</div>;
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="space-y-1.5">
        <label className="text-[8px] font-bold text-text-muted uppercase tracking-[0.3em]">{label}</label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full bg-background-muted border border-border-subtle px-4 py-2.5 text-[10px] font-mono text-left flex items-center justify-between group transition-all",
            isOpen ? "border-brand-primary/50 ring-1 ring-brand-primary/20" : "hover:border-brand-primary/30"
          )}
        >
          <span className={cn(selectedDate ? "text-text-primary" : "text-text-muted")}>
            {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : placeholder}
          </span>
          <CalendarIcon size={12} className={cn("transition-colors", isOpen ? "text-brand-primary" : "text-text-muted group-hover:text-brand-primary")} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={cn(
              "absolute top-full mt-2 w-64 bg-surface border border-border-subtle shadow-2xl z-[100] backdrop-blur-md",
              align === 'right' ? "right-0" : "left-0"
            )}
          >
            {renderHeader()}
            <div className="p-4">
              {renderDays()}
              {renderCells()}
            </div>
            <div className="p-3 border-t border-border-subtle bg-background-muted/30 flex justify-between items-center">
               <button 
                onClick={() => { onChange(new Date()); setIsOpen(false); }}
                className="text-[8px] font-bold text-brand-primary hover:underline uppercase tracking-widest"
               >
                 Today
               </button>
               <div className="text-[7px] font-mono text-text-muted uppercase opacity-40">Tactical Date Picker v1</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Internal helper to avoid time confusion
function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
