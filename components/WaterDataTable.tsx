import React, { useState, useMemo } from 'react';
import { WasteRecord } from '../types';
import { Search, Eye, Edit2, Trash2, MapPin, Filter, Navigation } from 'lucide-react';
import Swal from 'sweetalert2';

interface WaterDataTableProps {
    data: WasteRecord[];
    onDelete: (id: string) => void;
    onEdit: (record: WasteRecord) => void;
}

export const WaterDataTable: React.FC<WaterDataTableProps> = ({ data, onDelete, onEdit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(20);

    const filteredData = useMemo(() => {
        return data.filter(item => 
            item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.community.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const visibleData = filteredData.slice(0, visibleCount);

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: 'ยืนยันการลบ',
            text: `ต้องการลบข้อมูลของ ${name} ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ลบข้อมูล',
            customClass: { popup: 'rounded-2xl' }
        }).then((result) => {
            if (result.isConfirmed) {
                onDelete(id);
                Swal.fire('ลบสำเร็จ!', '', 'success');
            }
        });
    };

    const openMap = (lat?: number, lng?: number) => {
        if (lat && lng) {
            // Use 'dir' (directions) with destination to trigger navigation mode
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        }
    };

    const handleView = (record: WasteRecord) => {
        Swal.fire({
            title: `<span class="text-xl font-bold text-gray-800">${record.fullName}</span>`,
            html: `
                <div class="text-left text-sm space-y-3 p-2">
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p class="text-gray-500 text-xs mb-1">ที่อยู่</p>
                        <p class="font-medium text-gray-800 text-base">${record.address} ${record.street}</p>
                        <p class="text-gray-600 mt-1">ชุมชน${record.community}</p>
                    </div>
                    <div>
                        <p class="font-semibold text-sky-700 mb-2 flex items-center gap-2">
                            <span class="w-1.5 h-4 bg-sky-500 rounded-full"></span>
                            การจัดการน้ำเสีย
                        </p>
                        <ul class="list-disc list-inside text-gray-600 pl-2 space-y-1">
                            ${record.waterMethods.map(m => `<li>${m}</li>`).join('')}
                        </ul>
                    </div>
                     ${record.lat && record.lng ? `
                    <div class="mt-4">
                         <a href="https://www.google.com/maps/dir/?api=1&destination=${record.lat},${record.lng}" target="_blank" class="flex items-center justify-center w-full px-4 py-3 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-200 gap-2 cursor-pointer no-underline decoration-0" style="text-decoration: none;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                            นำทางด้วย Google Maps
                        </a>
                    </div>` : ''}
                </div>
            `,
            width: 450,
            showCloseButton: true,
            showConfirmButton: false,
            customClass: { popup: 'rounded-2xl' }
        });
    };

    const waterStats = useMemo(() => {
        const stats = {
            hasTrap: 0,
            waitingTrap: 0,
            privateArea: 0,
            septicTank: 0,
            publicDrain: 0
        };
        data.forEach(d => {
            d.waterMethods.forEach(m => {
                if (m.includes('มีการติดตั้ง')) stats.hasTrap++;
                else if (m.includes('รอการติดตั้ง')) stats.waitingTrap++;
                else if (m.includes('พื้นที่ส่วนตัว')) stats.privateArea++;
                else if (m.includes('บ่อเกรอะ')) stats.septicTank++;
                else if (m.includes('ท่อระบายน้ำสาธารณะ')) stats.publicDrain++;
            });
        });
        return stats;
    }, [data]);

    const renderWaterMethods = (methods: string[]) => {
        return (
            <div className="flex flex-wrap gap-1.5">
                {methods.map((m, idx) => {
                    let className = "px-2 py-0.5 rounded-md text-[11px] font-semibold border ";
                    if (m.includes('มีการติดตั้ง') || m.includes('พื้นที่ส่วนตัว') || m.includes('บ่อเกรอะ')) {
                        className += "bg-green-50 text-green-700 border-green-200"; 
                    } else if (m.includes('รอการติดตั้ง')) {
                        className += "bg-orange-50 text-orange-700 border-orange-200";
                    } else if (m.includes('ท่อระบายน้ำสาธารณะ')) {
                        className += "bg-red-50 text-red-700 border-red-200";
                    } else {
                        className += "bg-gray-100 text-gray-700 border-gray-200";
                    }
                    return <span key={idx} className={className}>{m}</span>;
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            
            {/* Stats Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
                     <span className="w-1.5 h-4 bg-sky-500 rounded-full"></span>
                    สถานะการจัดการน้ำเสีย (ภาพรวม)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex flex-col items-center text-center">
                        <span className="text-xs text-green-700 font-medium mb-1">ติดตั้งถังดักแล้ว</span>
                        <span className="text-2xl font-bold text-green-800">{waterStats.hasTrap}</span>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-col items-center text-center">
                        <span className="text-xs text-orange-700 font-medium mb-1">รอติดตั้ง</span>
                        <span className="text-2xl font-bold text-orange-600">{waterStats.waitingTrap}</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex flex-col items-center text-center">
                        <span className="text-xs text-emerald-700 font-medium mb-1">พื้นที่ส่วนตัว</span>
                        <span className="text-2xl font-bold text-emerald-700">{waterStats.privateArea}</span>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-xl border border-teal-100 flex flex-col items-center text-center">
                        <span className="text-xs text-teal-700 font-medium mb-1">บ่อเกรอะ</span>
                        <span className="text-2xl font-bold text-teal-700">{waterStats.septicTank}</span>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col items-center text-center">
                        <span className="text-xs text-red-700 font-medium mb-1">ท่อสาธารณะ</span>
                        <span className="text-2xl font-bold text-red-600">{waterStats.publicDrain}</span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="ค้นหา... (ชื่อ, ชุมชน, ถนน, ผู้รับผิดชอบ)" 
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4 whitespace-nowrap">ชื่อ-นามสกุล / ประเภท</th>
                                <th className="p-4 whitespace-nowrap">ที่อยู่ / ชุมชน</th>
                                <th className="p-4 whitespace-nowrap">เบอร์โทร</th>
                                <th className="p-4 min-w-[200px]">การจัดการน้ำเสีย</th>
                                <th className="p-4 text-center w-28">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {visibleData.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 align-top">
                                        <div className="font-semibold text-slate-800">{item.fullName}</div>
                                        <div className="text-xs text-slate-500 inline-block bg-slate-100 px-1.5 py-0.5 rounded mt-1">{item.addressType}</div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-slate-700">{item.address}</span>
                                            <span className="text-xs text-slate-500">ชุมชน{item.community}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-top font-mono text-slate-600">{item.phone}</td>
                                    <td className="p-4 align-top">
                                        {renderWaterMethods(item.waterMethods)}
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="flex justify-center gap-1">
                                            {item.lat && item.lng ? (
                                                <button 
                                                    onClick={() => openMap(item.lat, item.lng)}
                                                    className="p-1.5 text-sky-500 hover:bg-sky-50 rounded-lg transition"
                                                    title="นำทาง (Google Maps)"
                                                >
                                                    <Navigation size={18} />
                                                </button>
                                            ) : (
                                                <button disabled className="p-1.5 text-gray-300 cursor-not-allowed">
                                                    <MapPin size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => handleView(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="ดูข้อมูล">
                                                <Eye size={18} />
                                            </button>
                                            <button onClick={() => onEdit(item)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition" title="แก้ไข">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id, item.fullName)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="ลบ">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

             {filteredData.length > visibleCount && (
                <div className="text-center pt-4">
                    <button 
                        onClick={() => setVisibleCount(prev => Math.min(prev + 20, 100))}
                        className="px-8 py-2.5 bg-white border border-sky-200 text-sky-600 rounded-full hover:bg-sky-50 hover:shadow-md transition-all font-semibold text-sm"
                    >
                        โหลดข้อมูลเพิ่มเติม ({filteredData.length - visibleCount})
                    </button>
                </div>
            )}
        </div>
    );
};