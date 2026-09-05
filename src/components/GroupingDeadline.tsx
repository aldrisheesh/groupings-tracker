import { useEffect, useState } from 'react';
import { CalendarClock, Check, Clock3, Loader2 } from 'lucide-react';
import type { Grouping } from '../App';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import './GroupingDeadline.css';

function localInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function deadlineRemaining(deadline: string, now: number) {
  const minutes = Math.max(1, Math.ceil((Date.parse(deadline) - now) / 60000));
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor(minutes % 1440 / 60)}h`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function GroupingDeadline({ grouping, isAdmin, now, onSaved }: {
  grouping: Grouping; isAdmin: boolean; now: number; onSaved: (row: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    setEnabled(Boolean(grouping.deadlineAt));
    setValue(localInput(grouping.deadlineAt ? new Date(grouping.deadlineAt) : new Date(Date.now() + 2 * 86400000)));
    setError('');
  }, [open, grouping.id, grouping.deadlineAt]);

  const expired = !!grouping.deadlineAt && Date.parse(grouping.deadlineAt) <= now;
  const completed = !!grouping.deadlineProcessedAt;
  const exactDate = grouping.deadlineAt ? new Date(grouping.deadlineAt).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }) : '';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  async function save() {
    const parsed = new Date(value);
    if (enabled && (!value || !Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now())) {
      setError('Choose a date and time in the future.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/grouping-deadline', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupingId: grouping.id, deadline: enabled ? parsed.toISOString() : null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save the deadline.');
      onSaved(result);
      setOpen(false);
      toast.success(enabled ? 'Registration deadline saved' : 'Registration deadline removed');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save the deadline. Please try again.');
    } finally { setSaving(false); }
  }

  if (!isAdmin && !grouping.deadlineAt) return null;
  return (
    <>
      <div className="registration-deadline flex flex-wrap items-center text-sm text-slate-500 dark:text-slate-400">
        {grouping.deadlineAt && (
          <div className="flex items-start gap-2">
            {completed ? <Check className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400" /> : <Clock3 className="w-4 h-4 mt-0.5 shrink-0" />}
            <div className="space-y-1">
              <p className="registration-deadline-title flex flex-wrap items-baseline">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {completed ? 'Registration closed' : expired ? 'Registration closed · Assignment pending' : `Registration closes in ${deadlineRemaining(grouping.deadlineAt, now)}`}
                </span>
                {!expired && <span className="text-xs">{exactDate}</span>}
              </p>
              {completed ? (
                <p className="text-xs">{grouping.deadlineUnassignedCount ? `Automatic assignment finished · ${grouping.deadlineUnassignedCount} student${grouping.deadlineUnassignedCount === 1 ? '' : 's'} still need a place${isAdmin ? '. Add space and set a new deadline to assign them.' : '.'}` : 'Remaining students have been automatically assigned.'}</p>
              ) : expired ? (
                <p className="text-xs">{grouping.deadlineError ? (isAdmin ? grouping.deadlineError : 'Automatic assignment is delayed. Please check back shortly.') : 'Remaining students will be assigned shortly.'}</p>
              ) : <p className="text-xs">Unassigned students will be placed into available groups at the deadline.</p>}
            </div>
          </div>
        )}
        {isAdmin && <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="gap-2 text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800">
          <CalendarClock className="w-4 h-4" />{grouping.deadlineAt ? 'Edit deadline' : 'Set deadline'}
        </Button>}
      </div>
      <Dialog open={open} onOpenChange={next => { if (!saving) setOpen(next); }}>
        <DialogContent className="registration-deadline-dialog dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Registration deadline</DialogTitle>
            <DialogDescription>Give students time to choose a group, then automatically place anyone remaining.</DialogDescription>
          </DialogHeader>
          <div className="registration-deadline-fields py-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="space-y-1">
                <Label htmlFor="deadline-enabled">Set a deadline</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">Optional for this grouping</p>
              </div>
              <Switch id="deadline-enabled" checked={enabled} onCheckedChange={setEnabled} disabled={saving} />
            </div>
            {enabled && <div className="space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3].map(days => <Button key={days} size="sm" variant="outline" disabled={saving} onClick={() => setValue(localInput(new Date(Date.now() + days * 86400000)))} className="flex-1 dark:border-slate-700">{days} day{days > 1 ? 's' : ''}</Button>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline-date">Close registration on</Label>
                <Input id="deadline-date" type="datetime-local" value={value} min={localInput(new Date())} onChange={event => setValue(event.target.value)} disabled={saving} className="dark:border-slate-700" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Your time zone: {timezone}</p>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">Existing members keep their places. Remaining students are randomly distributed, starting with smaller groups and respecting member limits.</p>
              {grouping.locked && <p className="text-xs text-amber-700 dark:text-amber-400">This grouping is locked. Unlock it separately to let students choose groups before the deadline.</p>}
            </div>}
            {!enabled && <p className="text-sm text-slate-500 dark:text-slate-400">Registration follows the grouping’s lock setting. No automatic assignment will run.</p>}
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="registration-deadline-save bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}Save deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
