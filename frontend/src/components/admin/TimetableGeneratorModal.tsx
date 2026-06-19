// src/components/admin/TimetableGeneratorModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateTimetable } from '@/api/timetableApi';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimetableGeneratorModal({ open, onOpenChange }: Props) {
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [sectionCount, setSectionCount] = useState('');
  const [roomConstraints, setRoomConstraints] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload = { branch, semester, sectionCount, roomConstraints };
      const res = await generateTimetable(payload);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Automatic Timetable Generator</DialogTitle>
          <DialogDescription>Provide basic parameters and let the AI engine generate a schedule.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-sm font-medium" htmlFor="branch">Branch</label>
            <input id="branch" value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. CS" className="col-span-1 rounded border border-gray-300 p-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-sm font-medium" htmlFor="semester">Semester</label>
            <input id="semester" value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. 3" className="col-span-1 rounded border border-gray-300 p-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-sm font-medium" htmlFor="sectionCount">Section Count</label>
            <input id="sectionCount" value={sectionCount} onChange={e => setSectionCount(e.target.value)} placeholder="e.g. 2" className="col-span-1 rounded border border-gray-300 p-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 items-center gap-2">
            <label className="text-sm font-medium" htmlFor="roomConstraints">Room Constraints</label>
            <input id="roomConstraints" value={roomConstraints} onChange={e => setRoomConstraints(e.target.value)} placeholder="e.g. Lab, Capacity >=30" className="col-span-1 rounded border border-gray-300 p-2 text-sm" />
          </div>
        </div>
        {result && (
          <pre className="bg-gray-100 rounded p-2 text-sm overflow-x-auto max-h-48">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading || !branch || !semester}>
            {loading ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
