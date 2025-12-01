import React, { useState, useMemo } from 'react';
import { WasteRecord } from '../types';
import { Search, Eye, Edit2, Trash2, MapPin, Filter, Navigation } from 'lucide-react';
import Swal from 'sweetalert2';

interface WasteDataTableProps {
    data: WasteRecord[];
    onDelete: (id: string) => void;
    onEdit: (record: WasteRecord) => void;
}

export const WasteDataTable: React.FC<WasteDataTableProps> = ({ data, onDelete, onEdit }) => {
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
            cancelButtonText: 'ยกเลิก',
            customClass: { popup: 'rounded-2xl' }
        }).then((result) => {
            if (result.isConfirmed) {
                onDelete(id);
                Swal.fire('ลบสำเร็จ!', 'ข้อมูลถูกลบเรียบร้อยแล้ว', 'success');
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
                        <p class="font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                            <span class="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                            การจัดการขยะ
                        </p>
                        <ul class="list-disc list-inside text-gray-600 pl-2 space-y-1">
                            ${record.wasteMethods.map(m => `<li>${m}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                        <span class="text-gray-500 text-xs">ผู้รับผิดชอบ: <span class="font-medium text-gray-700">${record.responsiblePerson}</span></span>
                    </div>
                    ${record.lat && record.lng ? `
                    <div class="mt-4">
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${record.lat},${record.lng}" target="_blank" class="flex items-center justify-center w-full px-4 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 gap-2 cursor-pointer no-underline decoration-0" style="text-decoration: none;">
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

    const responsibleStats = useMemo(() => {
        const stats: Record<string, number> = {};
        data.forEach(d => {
            stats[d.responsiblePerson] = (stats[d.responsiblePerson] || 0) + 1;
        });
        return stats;
    }, [data]);

    const methodStats = useMemo(() => {
        let greenTotal = 0; 
        let wetTotal = 0;
        let animalFood = 0;
        let fertilizer = 0;

        data.forEach(d => {
            d.wasteMethods.forEach(m => {
                if (m.includes('ถุงเขียว')) greenTotal++;
                if (m.includes('ถังขยะเปียก')) wetTotal++;
                if (m === 'นำไปเป็นอาหารของสัตว์') animalFood++;
                if (m === 'นำไปทำปุ๋ย') fertilizer++;
            });
        });

        return { greenTotal, wetTotal, animalFood, fertilizer };
    }, [data]);

    const renderWasteMethods = (methods: string[]) => {
        return (
            <div className="flex flex-wrap gap-1.5">
                {methods.map((m, idx) => {
                    let className = "px-2 py-0.5 rounded-md text-[11px] font-semibold border ";
                    if (m.includes('ถุงเขียว')) className += "bg-green-50 text-green-700 border-green-200";
                    else if (m.includes('ถังขยะเปียก')) className += "bg-emerald-100 text-emerald-800 border-emerald-200";
                    else if (m === 'นำไปเป็นอาหารของสัตว์') className += "bg-orange-50 text-orange-700 border-orange-200";
                    else if (m === 'นำไปทำปุ๋ย') className += "bg-purple-50 text-purple-700 border-purple-200";
                    else className += "bg-gray-100 text-gray-700 border-gray-200";
                    
                    return <span key={idx} className={className}>{m}</span>;
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                        ผู้รับผิดชอบ (คน)
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(responsibleStats).map(([name, count]) => (
                            <div key={name} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                <span className="text-slate-600">{name}</span>
                                <span className="font-bold bg-white px-2 py-0.5 rounded-md shadow-sm text-teal-600 border border-slate-100">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                     <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                        สรุปวิธีการจัดการ (ครัวเรือน)
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg border border-green-100"><span className="text-green-800">ถุงเขียว</span><span className="font-bold">{methodStats.greenTotal}</span></div>
                        <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100"><span className="text-emerald-800">ถังขยะเปียก</span><span className="font-bold">{methodStats.wetTotal}</span></div>
                        <div className="flex justify-between items-center bg-orange-50 p-2 rounded-lg border border-orange-100"><span className="text-orange-800">อาหารสัตว์</span><span className="font-bold">{methodStats.animalFood}</span></div>
                        <div className="flex justify-between items-center bg-purple-50 p-2 rounded-lg border border-purple-100"><span className="text-purple-800">ปุ๋ย</span><span className="font-bold">{methodStats.fertilizer}</span></div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="ค้นหา... (ชื่อ, ชุมชน, ถนน, ผู้รับผิดชอบ)" 
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none shadow-sm transition-all"
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
                                <th className="p-4 whitespace-nowrap w-24">ผู้รับผิดชอบ</th>
                                <th className="p-4 whitespace-nowrap">ชื่อ-นามสกุล</th>
                                <th className="p-4 whitespace-nowrap">ที่อยู่ / ชุมชน</th>
                                <th className="p-4 whitespace-nowrap">เบอร์โทร</th>
                                <th className="p-4 min-w-[200px]">วิธีการจัดการขยะ</th>
                                <th className="p-4 text-center w-36">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {visibleData.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 align-top">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-200">
                                                {item.responsiblePerson.charAt(0)}
                                            </div>
                                            <span className="text-xs font-medium text-slate-600">{item.responsiblePerson}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="font-semibold text-slate-800">{item.fullName}</div>
                                        <div className="text-xs text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-1">{item.addressType}</div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="flex flex-col">
                                            <span className="text-slate-700">{item.address}</span>
                                            <span className="text-xs text-slate-500">ชุมชน{item.community}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-top font-mono text-slate-600">{item.phone}</td>
                                    <td className="p-4 align-top">
                                        {renderWasteMethods(item.wasteMethods)}
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="flex justify-center gap-1">
                                            {item.lat && item.lng ? (
                                                <button 
                                                    onClick={() => openMap(item.lat, item.lng)}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
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
                            {visibleData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Filter size={48} className="mb-4 opacity-20"/>
                                            <p className="text-lg font-medium">ไม่พบข้อมูลที่ค้นหา</p>
                                            <p className="text-sm">ลองเปลี่ยนคำค้นหาใหม่</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredData.length > visibleCount && (
                <div className="text-center pt-4">
                    <button 
                        onClick={() => setVisibleCount(prev => Math.min(prev + 20, 100))}
                        className="px-8 py-2.5 bg-white border border-emerald-200 text-emerald-600 rounded-full hover:bg-emerald-50 hover:shadow-md transition-all font-semibold text-sm"
                    >
                        โหลดข้อมูลเพิ่มเติม ({filteredData.length - visibleCount})
                    </button>
                </div>
            )}
        </div>
    );
};