import React, { useMemo } from 'react';
import { WasteRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Database, TrendingUp, Users } from 'lucide-react';

interface StatsProps {
    data: WasteRecord[];
}

export const Stats: React.FC<StatsProps> = ({ data }) => {

    const wasteChartData = useMemo(() => {
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

        return [
            { name: 'ถุงเขียว (รวม)', value: greenTotal, color: '#4ade80' },
            { name: 'ถังขยะเปียก (รวม)', value: wetTotal, color: '#059669' },
            { name: 'อาหารสัตว์', value: animalFood, color: '#f97316' },
            { name: 'ทำปุ๋ย', value: fertilizer, color: '#a855f7' },
        ];
    }, [data]);

    const waterChartData = useMemo(() => {
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

        return [
            { name: 'ติดตั้งบ่อดักแล้ว', value: stats.hasTrap, color: '#10b981' },
            { name: 'รอติดตั้ง', value: stats.waitingTrap, color: '#f59e0b' },
            { name: 'ลงพื้นที่ส่วนตัว', value: stats.privateArea, color: '#34d399' },
            { name: 'ลงบ่อเกรอะ', value: stats.septicTank, color: '#059669' },
            { name: 'ลงท่อสาธารณะ', value: stats.publicDrain, color: '#ef4444' },
        ];
    }, [data]);

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <Database size={28} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">ข้อมูลทั้งหมด</p>
                        <h3 className="text-3xl font-bold text-slate-800">{data.length}</h3>
                        <p className="text-xs text-slate-400">ครัวเรือน/สถานประกอบการ</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                         <p className="text-slate-500 text-sm font-medium">การจัดการขยะ</p>
                         <h3 className="text-3xl font-bold text-slate-800">
                            {wasteChartData.reduce((acc, curr) => acc + curr.value, 0)}
                         </h3>
                         <p className="text-xs text-slate-400">รายการบันทึก (Method Count)</p>
                    </div>
                </div>

                 <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-4 bg-sky-50 text-sky-600 rounded-xl">
                        <Users size={28} />
                    </div>
                    <div>
                         <p className="text-slate-500 text-sm font-medium">ประชากรเฉลี่ย</p>
                         <h3 className="text-3xl font-bold text-slate-800">
                             {data.length > 0 ? (data.reduce((acc, curr) => acc + Number(curr.householdSize || 0), 0) / data.length).toFixed(1) : 0}
                         </h3>
                         <p className="text-xs text-slate-400">คนต่อครัวเรือน</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Waste Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-500 rounded-sm"></span>
                        สถิติการจัดการขยะ
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={wasteChartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 12, fill: '#64748b'}} interval={0} />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}} 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" name="จำนวน (ครัวเรือน)" radius={[0, 8, 8, 0]} barSize={24} label={{ position: 'right', fill: '#64748b', fontSize: 12 }}>
                                    {wasteChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Water Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-sky-500 rounded-sm"></span>
                        สถิติการจัดการน้ำเสีย
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={waterChartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 12, fill: '#64748b'}} interval={0} />
                                <Tooltip 
                                     cursor={{fill: '#f1f5f9'}} 
                                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" name="จำนวน (ครัวเรือน)" radius={[0, 8, 8, 0]} barSize={24} label={{ position: 'right', fill: '#64748b', fontSize: 12 }}>
                                    {waterChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};