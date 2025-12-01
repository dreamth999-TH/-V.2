import React, { useState, useEffect } from 'react';
import { Home, Trash2, Droplets, PieChart, RefreshCw, Download, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { Dashboard } from './components/Dashboard';
import { WasteDataTable } from './components/WasteDataTable';
import { WaterDataTable } from './components/WaterDataTable';
import { Stats } from './components/Stats';
import { Footer } from './components/Footer';
import { checkConnection, fetchAllRecords, deleteRecord } from './services/googleSheetService';
import { ConnectionStatus, WasteRecord } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'waste' | 'water' | 'stats'>('dashboard');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('loading');
  const [data, setData] = useState<WasteRecord[]>([]);

  useEffect(() => {
    handleTestConnection();
    loadData(true);
  }, []);

  const handleTestConnection = async () => {
    setConnectionStatus('loading');
    try {
      await checkConnection();
      setConnectionStatus('online');
    } catch {
      setConnectionStatus('offline');
    }
  };

  const loadData = async (silent = false) => {
    if (!silent) {
        Swal.fire({
            title: 'กำลังโหลดข้อมูล...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    }
    
    try {
        const records = await fetchAllRecords();
        setData(records);
        if (!silent) Swal.close();
    } catch (error) {
        console.error(error);
        if (!silent) Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    loadData(true);
  };
  
  const handleEdit = (record: WasteRecord) => {
      Swal.fire('Info', 'ฟังก์ชันแก้ไขข้อมูลยังไม่เปิดใช้งานในเวอร์ชัน Demo', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sarabun text-slate-800">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-emerald-100/50 to-sky-100/50 -z-10 rounded-b-[50px]"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-100/40 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-40 -left-20 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl -z-10"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass shadow-sm border-b border-white/40">
        <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-4">
                
                {/* Logo & Brand */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-600 leading-tight">
                            ระบบจัดการขยะและน้ำเสีย
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">ทม.แม่ฮ่องสอน</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 overflow-x-auto max-w-full">
                    {[
                        { id: 'dashboard', icon: Home, label: 'หน้าหลัก' },
                        { id: 'waste', icon: Trash2, label: 'จัดการขยะ' },
                        { id: 'water', icon: Droplets, label: 'จัดการน้ำเสีย' },
                        { id: 'stats', icon: PieChart, label: 'สถิติ' },
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                                activeTab === item.id 
                                ? 'bg-white text-emerald-600 shadow-md shadow-slate-200 scale-100' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Status Indicator */}
                <div className="hidden lg:flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full border border-slate-200 text-xs font-medium">
                        {connectionStatus === 'online' && <CheckCircle2 size={14} className="text-emerald-500" />}
                        {connectionStatus === 'loading' && <RefreshCw size={14} className="text-yellow-500 animate-spin" />}
                        {connectionStatus === 'offline' && <AlertCircle size={14} className="text-red-500" />}
                        <span className={
                            connectionStatus === 'online' ? 'text-emerald-700' : 
                            connectionStatus === 'loading' ? 'text-yellow-700' : 'text-red-700'
                        }>
                            {connectionStatus === 'online' ? 'Connected' : connectionStatus === 'loading' ? 'Connecting...' : 'Offline'}
                        </span>
                    </div>
                    <button 
                        onClick={() => loadData()}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                        title="Reload Data"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {/* Mobile Connection Status (Visible only on small screens) */}
      <div className="lg:hidden bg-white/50 backdrop-blur border-b border-slate-100 px-4 py-2 flex justify-between items-center text-xs">
         <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
                connectionStatus === 'online' ? 'bg-emerald-500' : connectionStatus === 'loading' ? 'bg-yellow-400' : 'bg-red-500'
            }`}></span>
            <span className="text-slate-600">
                {connectionStatus === 'online' ? 'ระบบออนไลน์' : 'กำลังเชื่อมต่อ...'}
            </span>
         </div>
         <button onClick={() => loadData()} className="text-emerald-600 font-bold flex items-center gap-1">
            <Download size={12} /> อัปเดต
         </button>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-200px)]">
        {activeTab === 'dashboard' && <div className="animate-fade-in-up"><Dashboard onSuccess={() => loadData(true)} /></div>}
        {activeTab === 'waste' && (
            <div className="animate-fade-in-up space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                        <Trash2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">ข้อมูลการจัดการขยะ</h2>
                        <p className="text-slate-500 text-sm">รายชื่อและวิธีการจัดการขยะของแต่ละครัวเรือน</p>
                    </div>
                </div>
                <WasteDataTable data={data} onDelete={handleDelete} onEdit={handleEdit} />
            </div>
        )}
        {activeTab === 'water' && (
             <div className="animate-fade-in-up space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl">
                        <Droplets size={32} />
                    </div>
                     <div>
                        <h2 className="text-2xl font-bold text-slate-800">ข้อมูลการจัดการน้ำเสีย</h2>
                        <p className="text-slate-500 text-sm">สถานะการติดตั้งถังดักไขมันและบ่อบำบัด</p>
                    </div>
                </div>
                <WaterDataTable data={data} onDelete={handleDelete} onEdit={handleEdit} />
            </div>
        )}
        {activeTab === 'stats' && (
            <div className="animate-fade-in-up space-y-4">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                        <PieChart size={32} />
                    </div>
                     <div>
                        <h2 className="text-2xl font-bold text-slate-800">สถิติภาพรวม</h2>
                        <p className="text-slate-500 text-sm">Dashboard สรุปผลการดำเนินงาน</p>
                    </div>
                </div>
                <Stats data={data} />
            </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;