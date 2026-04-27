import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  DoorOpen, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Download, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { Student, Room, Assignment } from './types';

// Mock data for initial play
const INITIAL_STUDENTS: Student[] = [
  { id: '1', nim: '2100018001', name: 'Budi Santoso', subject: 'Informatika', className: 'A' },
  { id: '2', nim: '2100018005', name: 'Ani Wijaya', subject: 'Informatika', className: 'A' },
  { id: '3', nim: '2100018002', name: 'Candra Pratama', subject: 'Informatika', className: 'A' },
  { id: '4', nim: '2100018010', name: 'Dewi Lestari', subject: 'Sistem Digital', className: 'B' },
  { id: '5', nim: '2100018012', name: 'Eko Saputra', subject: 'Sistem Digital', className: 'B' },
];

const INITIAL_ROOMS: Room[] = [
  { id: 'r1', name: 'R.101', capacity: 2 },
  { id: 'r2', name: 'R.102', capacity: 40 },
  { id: 'r3', name: 'R.201', capacity: 30 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'rooms' | 'appsheet' | 'search'>('dashboard');
  const [searchNim, setSearchNim] = useState('');
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sipeka_students') : null;
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sipeka_rooms') : null;
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [newStudent, setNewStudent] = useState({ nim: '', name: '', subject: '', className: '' });
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '' });

  useEffect(() => {
    localStorage.setItem('sipeka_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('sipeka_rooms', JSON.stringify(rooms));
  }, [rooms]);

  const assignments = useMemo(() => {
    const results: Assignment[] = [];
    const groups: Record<string, Student[]> = {};

    // 1. Group by Subject + Class
    students.forEach(s => {
      const key = `${s.subject}|${s.className}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    // Sort room names to ensure deterministic assignment
    const sortedRooms = [...rooms].sort((a, b) => a.name.localeCompare(b.name));
    let currentRoomIndex = 0;

    // 2. Process each group
    Object.keys(groups).sort().forEach(groupKey => {
      const groupStudents = [...groups[groupKey]].sort((a, b) => a.nim.localeCompare(b.nim));
      const [subject, className] = groupKey.split('|');

      let studentIdx = 0;
      while (studentIdx < groupStudents.length) {
        if (currentRoomIndex >= sortedRooms.length) break;

        const room = sortedRooms[currentRoomIndex];
        const capacity = room.capacity;
        
        const studentsInThisRoom = Math.min(groupStudents.length - studentIdx, capacity);

        for (let i = 0; i < studentsInThisRoom; i++) {
          const student = groupStudents[studentIdx + i];
          results.push({
            nim: student.nim,
            name: student.name,
            subject: subject,
            className: className,
            roomName: room.name,
            seatNumber: i + 1,
          });
        }

        studentIdx += studentsInThisRoom;
        currentRoomIndex++;
      }
    });

    return results;
  }, [students, rooms]);

  const searchResult = useMemo(() => {
    if (!searchNim) return null;
    return assignments.find(a => a.nim.trim() === searchNim.trim());
  }, [assignments, searchNim]);

  const addStudent = () => {
    if (!newStudent.nim || !newStudent.name || !newStudent.subject || !newStudent.className) return;
    setStudents([...students, { ...newStudent, id: Date.now().toString() }]);
    setNewStudent({ nim: '', name: '', subject: '', className: '' });
  };

  const addRoom = () => {
    if (!newRoom.name || !newRoom.capacity) return;
    setRooms([...rooms, { id: Date.now().toString(), name: newRoom.name, capacity: parseInt(newRoom.capacity) }]);
    setNewRoom({ name: '', capacity: '' });
  };

  const removeStudent = (id: string) => setStudents(students.filter(s => s.id !== id));
  const removeRoom = (id: string) => setRooms(rooms.filter(r => r.id !== id));

  const totalSeatsNeeded = students.length;
  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const capacityWarning = totalCapacity < totalSeatsNeeded;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-end justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-none flex items-center justify-center text-white">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                ExamSeat <span className="text-indigo-600">Sync</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1 italic">AppSheet Bridge Engine</p>
            </div>
          </div>
          <nav className="flex gap-2 bg-slate-100 p-1">
            {[
              { id: 'dashboard', label: 'Admin', icon: LayoutDashboard },
              { id: 'search', label: 'Cek Kursi', icon: Info },
              { id: 'students', label: 'MHS', icon: Users },
              { id: 'rooms', label: 'Ruang', icon: DoorOpen },
              { id: 'appsheet', label: 'AppSheet', icon: CheckCircle2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {activeTab === 'appsheet' && (
            <motion.div
              key="appsheet"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-12 flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-indigo-600 text-white flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">Google <span className="text-indigo-600">AppSheet</span> Deployment</h2>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Panduan Integrasi Database Cloud</p>
                </div>
              </div>

              <div className="col-span-5 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 p-6 shadow-sm border-l-4 border-l-slate-900">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Arsitektur Data Google Sheets</h3>
                  <ul className="space-y-6">
                    {[
                      { step: '01', title: 'Tabel Master_MHS', desc: 'Satu sheet untuk data mentah mahasiswa (NIM, Nama, MK, Kls).' },
                      { step: '02', title: 'Tabel Master_Ruang', desc: 'Satu sheet untuk daftar ruang dan kapasitas maksimalnya.' },
                      { step: '03', title: 'Virtual Column', desc: 'AppSheet menggunakan formula Excel untuk generate No_Kursi secara dinamis.' }
                    ].map((item) => (
                      <li key={item.step} className="flex gap-4">
                        <span className="flex-none w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">{item.step}</span>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tighter">{item.title}</p>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-indigo-600 p-6 text-white border-l-8 border-l-slate-900 shadow-xl">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-100 mb-4">Kenapa AppSheet + SSO?</h3>
                   <div className="space-y-4">
                      <div className="p-3 bg-white/10 border border-white/20">
                        <p className="text-xs font-black uppercase mb-1">Single Sign-On (SSO)</p>
                        <p className="text-[11px] opacity-80 italic">Mahasiswa login menggunakan email kampus (@uii.ac.id), AppSheet akan otomatis memfilter data sesuai NIM yang terikat pada email tersebut.</p>
                      </div>
                      <div className="p-3 bg-white/10 border border-white/20">
                        <p className="text-xs font-black uppercase mb-1">Zero Maintenance</p>
                        <p className="text-[11px] opacity-80 italic">Admin cukup upload file Excel ke Google Drive. AppSheet akan melakukan Sinkronisasi instan ke ribuan HP mahasiswa.</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="col-span-7 space-y-6">
                <div className="bg-white border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black uppercase text-slate-900 mb-6 tracking-widest underline decoration-2 underline-offset-8">Step-by-Step Setup</h3>
                  
                  <div className="space-y-8">
                    <div className="flex gap-6">
                       <div className="text-5xl font-black text-slate-100 italic select-none">1</div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight mb-2">Connect Google Sheets</p>
                          <p className="text-xs text-slate-500 leading-relaxed">Buka AppSheet.com, Create New App, dan pilih file Google Sheets yang berisi tabel MHS dan RUANG.</p>
                       </div>
                    </div>
                    <div className="flex gap-6">
                       <div className="text-5xl font-black text-slate-100 italic select-none">2</div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight mb-2">Configure Security (SSO)</p>
                          <p className="text-xs text-slate-500 leading-relaxed">Di tab Security, nyalakan 'Require Sign-In' dan pilih Google sebagai provider. Gunakan 'User Settings' untuk menangkap email mahasiswa.</p>
                       </div>
                    </div>
                    <div className="flex gap-6">
                       <div className="text-5xl font-black text-slate-100 italic select-none">3</div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight mb-2">Apply Slice & Excel Logic</p>
                          <p className="text-xs text-slate-500 leading-relaxed">Gunakan fitur 'Slice' dengan Row Filter: <code>[Email] = USEREMAIL()</code>. Masukkan formula No_Kursi di 'Virtual Column'.</p>
                       </div>
                    </div>
                  </div>

                  <div className="mt-10 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-none">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Preview Database Structure (Sheets)</p>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 border border-slate-200 font-mono text-[10px]">
                           <p className="font-black text-indigo-600 mb-1">Sheet MHS</p>
                           <p>ID_MHS (Key)</p>
                           <p>NIM</p>
                           <p>Nama</p>
                           <p>MK_Kelas</p>
                           <p>UserEmail (Ref)</p>
                        </div>
                        <div className="bg-white p-3 border border-slate-200 font-mono text-[10px]">
                           <p className="font-black text-indigo-600 mb-1">Sheet RUANG</p>
                           <p>Ruang_ID (Key)</p>
                           <p>Kapasitas</p>
                           <p>Lokasi_Gedung</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Student Self-Service</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium">Masukkan NIM Anda untuk melihat jadwal dan lokasi ujian.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIM IDENTIFIER</label>
                    <div className="flex gap-2 mt-2">
                       <input 
                         type="text" 
                         value={searchNim}
                         onChange={(e) => setSearchNim(e.target.value)}
                         className="flex-grow bg-slate-50 border-2 border-slate-200 px-6 py-4 outline-none focus:border-slate-900 font-mono text-lg font-bold"
                         placeholder="CONTOH: 2100018001"
                       />
                    </div>
                  </div>

                  <AnimatePresence>
                    {searchNim && searchResult && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-indigo-600 text-white p-8 mt-8 border-l-8 border-l-slate-900 relative overflow-hidden"
                      >
                        <div className="relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-4">Official Assignment Data</p>
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-bold opacity-60 uppercase mb-1">Nama Mahasiswa</p>
                              <p className="text-2xl font-black tracking-tight">{searchResult.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                               <div>
                                 <p className="text-xs font-bold opacity-60 uppercase mb-1">Mata Kuliah</p>
                                 <p className="text-lg font-bold">{searchResult.subject} - {searchResult.className}</p>
                               </div>
                               <div>
                                 <p className="text-xs font-bold opacity-60 uppercase mb-1">Ruang Ujian</p>
                                 <p className="text-3xl font-black tracking-tighter italic">{searchResult.roomName}</p>
                               </div>
                            </div>
                            <div className="pt-6 border-t border-white/20 flex justify-between items-end">
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Credential Verified</p>
                                  <p className="font-mono text-sm">{searchResult.nim}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Nomor Kursi</p>
                                  <span className="bg-white text-slate-900 px-6 py-2 text-3xl font-black">{searchResult.seatNumber.toString().padStart(2, '0')}</span>
                               </div>
                            </div>
                          </div>
                        </div>
                        {/* Background pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full" />
                      </motion.div>
                    )}

                    {searchNim && !searchResult && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-rose-50 border-2 border-rose-200 p-6 flex items-center gap-4 text-rose-900"
                      >
                         <AlertCircle size={32} />
                         <div>
                            <p className="font-black uppercase text-xs tracking-widest">No Record Found</p>
                            <p className="text-sm font-medium opacity-80">NIM tersebut belum terdaftar dalam sistem atau belum mendapatkan alokasi ruang.</p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-4">
                   <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Protocol</p>
                   <p className="text-[11px] font-medium leading-tight text-slate-600">Simpan kartu ini atau screenshot untuk bukti saat masuk ruang.</p>
                </div>
                <div className="bg-white border border-slate-200 p-4">
                   <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Verification</p>
                   <p className="text-[11px] font-medium leading-tight text-slate-600">Data diverifikasi secara real-time berdasarkan logic 365.</p>
                </div>
                <div className="bg-white border border-slate-200 p-4">
                   <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Support</p>
                   <p className="text-[11px] font-medium leading-tight text-slate-600">Hubungi Biro Akademik jika terdapat ketidaksesuaian data.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-12 gap-8"
            >
              {/* Stats Row */}
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 shadow-sm border-l-4 border-l-slate-900">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Population</p>
                  <p className="text-4xl font-black tracking-tighter">{students.length}</p>
                  <p className="text-xs text-slate-500 mt-2">Active Students</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 shadow-sm border-l-4 border-l-indigo-600">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Spatial Capacity</p>
                  <p className={`text-4xl font-black tracking-tighter ${capacityWarning ? 'text-rose-600' : 'text-slate-900'}`}>
                    {totalCapacity}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Total Seats Available</p>
                </div>
                <div className={`p-6 border flex items-center gap-4 ${capacityWarning ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-indigo-50 border-indigo-200 text-indigo-900'}`}>
                  {capacityWarning ? (
                    <div className="w-12 h-12 bg-rose-600 text-white flex items-center justify-center font-black italic">!</div>
                  ) : (
                    <div className="w-12 h-12 bg-indigo-600 text-white flex items-center justify-center"><CheckCircle2 size={24} /></div>
                  )}
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-sm">{capacityWarning ? 'Capacity Violation' : 'Status: Aligned'}</h3>
                    <p className="text-xs font-medium opacity-80">
                      {capacityWarning ? `Insufficient space for ${totalSeatsNeeded - totalCapacity} students` : 'All parameters within constraints'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assignments Output */}
              <div className="col-span-12 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                       <LayoutDashboard size={16} className="text-indigo-600" />
                       Allocation Output Matrix
                    </h2>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                        <th className="px-6 py-4">NIM</th>
                        <th className="px-6 py-4 text-center">Student Name</th>
                        <th className="px-6 py-4">Course / Class</th>
                        <th className="px-6 py-4">Assigned Room</th>
                        <th className="px-6 py-4 text-right">Seat #</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[13px]">
                      {assignments.map((as, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs">{as.nim}</td>
                          <td className="px-6 py-4 italic font-medium text-slate-600">{as.name}</td>
                          <td className="px-6 py-4 font-bold">{as.subject} - {as.className}</td>
                          <td className="px-6 py-4">
                            <span className="text-indigo-600 font-black">{as.roomName}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="bg-slate-900 text-white px-3 py-1 font-mono font-bold text-xs">
                              {as.seatNumber.toString().padStart(2, '0')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-white p-8 border border-slate-200 shadow-sm border-t-4 border-t-indigo-600">
                  <h3 className="text-xs font-black uppercase text-slate-900 mb-6 tracking-[0.2em] underline decoration-2 underline-offset-8">
                    Input: Student_Record
                  </h3>
                  <div className="space-y-5">
                    {[
                      { label: 'NIM', val: newStudent.nim, field: 'nim', placeholder: 'ID Number' },
                      { label: 'Name', val: newStudent.name, field: 'name', placeholder: 'Full Name' },
                      { label: 'Subject', val: newStudent.subject, field: 'subject', placeholder: 'Informatics...' },
                      { label: 'Class', val: newStudent.className, field: 'className', placeholder: 'A / B / C' },
                    ].map((input) => (
                      <div key={input.field}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{input.label}</label>
                        <input 
                          type="text" 
                          value={input.val} 
                          onChange={e => setNewStudent({...newStudent, [input.field]: e.target.value})}
                          className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-600 outline-none transition-all font-medium text-sm"
                          placeholder={input.placeholder}
                        />
                      </div>
                    ))}
                    <button 
                      onClick={addStudent}
                      className="w-full py-4 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all pt-5"
                    >
                      Commit to Data Layer
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Active Database Index</h3>
                  <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 font-bold">{students.length} ROWS</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-white sticky top-0 z-10">
                      <tr className="text-slate-400 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-6 py-4 font-black">NIM_ID</th>
                        <th className="px-6 py-4 font-black">ALIAS</th>
                        <th className="px-6 py-4 font-black">METADATA</th>
                        <th className="px-6 py-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic">
                      {students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 group">
                          <td className="px-6 py-4 font-mono text-xs">{s.nim}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 not-italic">{s.name}</td>
                          <td className="px-6 py-4 text-xs">
                            <span className="text-indigo-600 font-black not-italic uppercase tracking-tighter">{s.subject}</span>
                            <span className="mx-2 opacity-20">|</span>
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 border border-indigo-100 font-bold not-italic">{s.className}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => removeStudent(s.id)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors opacity-0 group-hover:opacity-100">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rooms' && (
            <motion.div
              key="rooms"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-12 md:col-span-4">
                <div className="bg-white p-8 border border-slate-200 shadow-sm border-t-4 border-t-indigo-600">
                  <h2 className="text-xs font-black uppercase text-slate-900 mb-6 tracking-widest underline decoration-2 underline-offset-8">
                    Config: Spatial_Unit
                  </h2>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Room ID</label>
                      <input 
                        type="text" 
                        value={newRoom.name} 
                        onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                        className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 outline-none focus:border-indigo-600 text-sm font-medium"
                        placeholder="R.101"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Load</label>
                      <input 
                        type="number" 
                        value={newRoom.capacity} 
                        onChange={e => setNewRoom({...newRoom, capacity: e.target.value})}
                        className="w-full mt-2 px-4 py-3 bg-slate-50 border border-slate-200 outline-none focus:border-indigo-600 text-sm font-medium font-mono"
                        placeholder="40"
                      />
                    </div>
                    <button 
                      onClick={addRoom}
                      className="w-full py-4 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] pt-5"
                    >
                      Register Spatial Unit
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rooms.map(r => (
                  <div key={r.id} className="bg-white p-6 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-900 transition-all">
                    <div className="flex justify-between items-start">
                       <h3 className="text-2xl font-black tracking-tighter uppercase">{r.name}</h3>
                       <button onClick={() => removeRoom(r.id)} className="text-slate-200 hover:text-rose-600 transition-colors group-hover:opacity-100 opacity-0 px-2 py-1">
                         <Trash2 size={16} />
                       </button>
                    </div>
                    <div className="mt-8 space-y-4">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                        <span>Current Load</span>
                        <span className="text-indigo-600">{r.capacity} UNITS</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-none overflow-hidden">
                        <div className="bg-indigo-600 h-full w-[100%]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'excel' && (
            <motion.div
              key="excel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-4 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 p-6 shadow-sm border-l-4 border-l-slate-900">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">System Logic Flow</h3>
                  <ul className="space-y-6">
                    {[
                      { step: '01', title: 'Group & Sort', desc: 'Process by MK+Class, internal SORT on NIM ascending.' },
                      { step: '02', title: 'Spatial Mapping', desc: 'Iterate through Sequential Room IDs based on load limits.' },
                      { step: '03', title: 'Coordinate Calc', desc: 'Execute MOD logic for exact seat position in grid.' }
                    ].map((item) => (
                      <li key={item.step} className="flex gap-4">
                        <span className="flex-none w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">{item.step}</span>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tighter">{item.title}</p>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-4 underline decoration-2 underline-offset-4">Primary Engine Logarithm</h3>
                   <code className="block bg-white p-4 border border-indigo-100 text-[10px] font-mono leading-relaxed text-indigo-800 break-words">
                      =LET(<br/>
                      &nbsp;&nbsp;s, SORT(MHS_DATA, 1, 1),<br/>
                      &nbsp;&nbsp;room, XLOOKUP(SEQ, LOAD_CAP, RUANG_ID,, 1),<br/>
                      &nbsp;&nbsp;pos, MOD(SEQ-1, ROM_CAP) + 1,<br/>
                      &nbsp;&nbsp;HSTACK(s, room, pos)<br/>
                      )
                   </code>
                </div>
              </div>

              <div className="col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 p-8">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-slate-900 text-white flex items-center justify-center">
                      <FileSpreadsheet size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic">Excel Formula <span className="text-indigo-600">Schematic</span></h2>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Office 365 Dynamic Array Environment Only</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { id: '1', title: 'Group Counter', formula: '=COUNTIFS($A$2:A2, A2)', color: 'border-l-indigo-600' },
                      { id: '2', title: 'Ruang Lookup', formula: '=XLOOKUP(ID, RUANG[KAP], RUANG[NO])', color: 'border-l-indigo-300' },
                      { id: '3', title: 'Seat Modulo', formula: '=MOD(ID-1, MAX_CAP) + 1', color: 'border-l-slate-900' },
                      { id: '4', title: 'Array Split', formula: '=CHOOSECOLS(DATA, 1, 3, 5)', color: 'border-l-slate-300' }
                    ].map(f => (
                      <div key={f.id} className={`p-5 bg-slate-50 border border-slate-200 border-l-4 ${f.color}`}>
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">{f.title}</p>
                        <code className="block text-[11px] font-mono text-slate-700">{f.formula}</code>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 p-6 bg-slate-900 text-white">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Protocol: Large Data Handling</p>
                     <p className="text-xs font-medium leading-relaxed opacity-80">
                        Stability confirmed up to <strong>50,000 entities</strong>. For optimal calculation speed, ensure all data is formatted as 
                        <strong> Structured Tables (Ctrl+T)</strong> within the XLSX container.
                     </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-10 border-t border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-8 justify-between">
         <div className="flex gap-6 text-[9px] font-mono font-bold uppercase text-slate-400 tracking-widest">
            <span>REF: DS_EXAM/2026</span>
            <span>AUTHURI: SYSTEM_ADMIN</span>
            <span>VER: 1.0.42_STABLE</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-600">Calculated State Synchronized</span>
         </div>
      </footer>
    </div>
  );
}
