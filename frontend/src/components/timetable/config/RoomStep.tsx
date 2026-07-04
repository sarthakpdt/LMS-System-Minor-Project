import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Save, Trash2, Pencil, MapPin, FlaskConical } from 'lucide-react';
import { engineApi, manageApi } from '../manageApi';
import { TtDepartment, TtLab, TtRoom } from '../types';
import { StepHeader, FieldLabel, inputClass, btnPrimary, btnSecondary, idOf } from './shared';

interface Props {
  departments: TtDepartment[];
  onRefresh: () => Promise<void>;
  onDirty: () => void;
}

export default function RoomStep({ departments, onRefresh, onDirty }: Props) {
  const [rooms, setRooms] = useState<TtRoom[]>([]);
  const [labs, setLabs] = useState<TtLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roomForm, setRoomForm] = useState({
    id: '',
    name: '',
    type: 'classroom' as 'classroom' | 'lab',
    capacity: 60,
    labType: '',
    building: '',
    floor: '',
    equipment: '',
  });
  const [labForm, setLabForm] = useState({
    id: '',
    name: '',
    labType: 'Computer',
    capacity: 40,
    building: '',
    floor: '',
    equipment: '',
    departmentId: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [roomsRes, labsRes] = await Promise.all([
        engineApi.getRooms(),
        manageApi.getLabs(),
      ]);
      setRooms(roomsRes.rooms);
      setLabs(labsRes.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateRoom = (): string | null => {
    if (!roomForm.name.trim()) return 'Room number/name is required.';
    if (roomForm.capacity < 1) return 'Capacity must be at least 1.';
    if (rooms.some((r) => r.name.toLowerCase() === roomForm.name.trim().toLowerCase() && r._id !== roomForm.id)) {
      return 'Room number already exists.';
    }
    return null;
  };

  const handleSaveRoom = async () => {
    const err = validateRoom();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      await engineApi.saveRoom({
        _id: roomForm.id || undefined,
        name: roomForm.name.trim(),
        type: roomForm.type,
        capacity: Number(roomForm.capacity),
        labType: roomForm.type === 'lab' ? roomForm.labType : '',
      });
      toast.success('Room saved.');
      setRoomForm({ id: '', name: '', type: 'classroom', capacity: 60, labType: '', building: '', floor: '', equipment: '' });
      onDirty();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save room.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await engineApi.deleteRoom(id);
      toast.success('Room deleted.');
      onDirty();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete room.');
    }
  };

  const handleSaveLab = async () => {
    if (!labForm.name.trim()) {
      toast.error('Lab name is required.');
      return;
    }
    if (!labForm.departmentId) {
      toast.error('Select a department for the lab.');
      return;
    }
    if (labForm.capacity < 1) {
      toast.error('Capacity must be at least 1.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: labForm.name.trim(),
        labType: labForm.labType,
        capacity: Number(labForm.capacity),
        building: labForm.building,
        floor: labForm.floor,
        equipment: labForm.equipment.split(',').map((e) => e.trim()).filter(Boolean),
        departmentId: labForm.departmentId,
      };
      if (labForm.id) {
        await manageApi.updateLab(labForm.id, payload);
      } else {
        await manageApi.createLab(payload);
      }
      toast.success('Lab saved.');
      setLabForm({ id: '', name: '', labType: 'Computer', capacity: 40, building: '', floor: '', equipment: '', departmentId: labForm.departmentId });
      onDirty();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save lab.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLab = async (id: string) => {
    if (!window.confirm('Delete this lab?')) return;
    try {
      await manageApi.deleteLab(id);
      toast.success('Lab deleted.');
      onDirty();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete lab.');
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8">
      <StepHeader
        title="Step 4 — Room Management"
        description="Manage classrooms, labs, and seminar halls with capacity, building, floor, and equipment."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-600" /> {roomForm.id ? 'Edit' : 'Add'} Room
          </h4>
          <div>
            <FieldLabel>Room Number *</FieldLabel>
            <input className={inputClass()} value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="Room 204" />
          </div>
          <div>
            <FieldLabel>Type</FieldLabel>
            <select className={inputClass()} value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value as 'classroom' | 'lab' })}>
              <option value="classroom">Classroom</option>
              <option value="lab">Lab / Seminar Hall</option>
            </select>
          </div>
          <div>
            <FieldLabel>Capacity *</FieldLabel>
            <input type="number" min={1} className={inputClass()} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} />
          </div>
          {roomForm.type === 'lab' && (
            <div>
              <FieldLabel>Lab Type</FieldLabel>
              <input className={inputClass()} value={roomForm.labType} onChange={(e) => setRoomForm({ ...roomForm, labType: e.target.value })} placeholder="Computer" />
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" className={btnPrimary(saving)} disabled={saving} onClick={handleSaveRoom}>
              <Save className="w-4 h-4" /> Save Room
            </button>
            {roomForm.id && (
              <button type="button" className={btnSecondary()} onClick={() => setRoomForm({ id: '', name: '', type: 'classroom', capacity: 60, labType: '', building: '', floor: '', equipment: '' })}>Cancel</button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Registered Rooms ({rooms.length})</h4>
          {rooms.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center border border-dashed rounded-xl">No rooms registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map((r) => (
                <div key={r._id} className="border border-gray-100 rounded-xl p-4 bg-white flex justify-between items-start group">
                  <div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.type === 'lab' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{r.type}</span>
                    <h5 className="font-bold text-sm mt-1">{r.name}</h5>
                    <p className="text-xs text-gray-500">Capacity: {r.capacity}</p>
                    {r.labType && <p className="text-xs text-gray-400">{r.labType}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button type="button" className="p-1.5 text-gray-400 hover:text-purple-600" onClick={() => setRoomForm({ id: r._id || '', name: r.name, type: r.type, capacity: r.capacity, labType: r.labType || '', building: '', floor: '', equipment: '' })}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1.5 text-gray-400 hover:text-red-500" onClick={() => handleDeleteRoom(r._id!)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-green-600" /> {labForm.id ? 'Edit' : 'Add'} Specialized Lab
          </h4>
          <div>
            <FieldLabel>Lab Name *</FieldLabel>
            <input className={inputClass()} value={labForm.name} onChange={(e) => setLabForm({ ...labForm, name: e.target.value })} placeholder="DBMS Lab" />
          </div>
          <div>
            <FieldLabel>Department *</FieldLabel>
            <select className={inputClass()} value={labForm.departmentId} onChange={(e) => setLabForm({ ...labForm, departmentId: e.target.value })}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.code} — {d.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Building</FieldLabel>
              <input className={inputClass()} value={labForm.building} onChange={(e) => setLabForm({ ...labForm, building: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Floor</FieldLabel>
              <input className={inputClass()} value={labForm.floor} onChange={(e) => setLabForm({ ...labForm, floor: e.target.value })} />
            </div>
          </div>
          <div>
            <FieldLabel>Capacity</FieldLabel>
            <input type="number" min={1} className={inputClass()} value={labForm.capacity} onChange={(e) => setLabForm({ ...labForm, capacity: Number(e.target.value) })} />
          </div>
          <div>
            <FieldLabel>Equipment (comma-separated)</FieldLabel>
            <input className={inputClass()} value={labForm.equipment} onChange={(e) => setLabForm({ ...labForm, equipment: e.target.value })} placeholder="PCs, Projector, Network" />
          </div>
          <button type="button" className={btnPrimary(saving)} disabled={saving} onClick={handleSaveLab}>
            <Save className="w-4 h-4" /> Save Lab
          </button>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Specialized Labs ({labs.length})</h4>
          {labs.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center border border-dashed rounded-xl">No specialized labs yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {labs.map((lab) => (
                <div key={lab._id} className="border border-green-100 rounded-xl p-4 bg-green-50/30">
                  <div className="flex justify-between">
                    <div>
                      <h5 className="font-bold text-sm">{lab.name}</h5>
                      <p className="text-xs text-gray-500">{lab.labType} · Cap {lab.capacity}</p>
                      {lab.building && <p className="text-xs text-gray-400">{lab.building}, Floor {lab.floor}</p>}
                    </div>
                    <button type="button" className="text-red-400 hover:text-red-600 p-1" onClick={() => handleDeleteLab(lab._id!)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
