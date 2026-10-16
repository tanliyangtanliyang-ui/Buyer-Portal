import { useEvents, severityStyles } from '@/lib/eventBus';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function ToastStack() {
  const { toasts, dismissToast } = useEvents();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm">
      {toasts.map((t) => (
        <Toast key={t.id} event={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}

function Toast({ event, onDismiss }: { event: ReturnType<typeof useEvents>['toasts'][number]; onDismiss: () => void }) {
  const style = severityStyles[event.severity];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 7000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`card p-3.5 pr-8 flex items-start gap-3 animate-fade-up relative ${style.border} ${style.bg}`}>
      <span className="text-xl shrink-0">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${style.text} uppercase tracking-wide`}>{event.source_module}</p>
        <p className="text-sm font-semibold text-brand-800 mt-0.5 leading-snug">{event.message}</p>
        {event.entity_code && (
          <p className="text-[11px] text-brand-500 mt-1 font-mono">{event.entity_code}</p>
        )}
      </div>
      <button onClick={onDismiss} className="absolute top-2.5 right-2.5 text-brand-400 hover:text-brand-700">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
