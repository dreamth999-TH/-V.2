import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { ADDRESS_TYPES, COMMUNITIES, STREETS, WASTE_METHODS, WATER_METHODS, RESPONSIBLE_PERSONS } from '../constants';
import { WasteRecord } from '../types';
import { saveRecord, uploadImage, fetchAllRecords } from '../services/googleSheetService';
import { Upload, Save, Loader2, MapPin, Crosshair, User, Home, Trash2, Droplets, Image as ImageIcon, XCircle } from 'lucide-react';

interface DashboardProps {
  onSuccess: () => void;
  initialData?: WasteRecord | null;
  onCancel?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSuccess, initialData, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Map State
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<WasteRecord>({
    defaultValues: {
      addressType: ADDRESS_TYPES[0],
      community: COMMUNITIES[0],
      street: STREETS[0],
      responsiblePerson: RESPONSIBLE_PERSONS[0],
      wasteMethods: [],
      waterMethods: [],
      householdSize: 1,
      lat: 19.302052,
      lng: 97.965449
    }
  });

  const addressType = watch('addressType');
  const lat = watch('lat');
  const lng = watch('lng');

  // Handle Initial Data for Editing (Form Fields only)
  useEffect(() => {
    if (initialData) {
        reset(initialData);
    }
  }, [initialData, reset]);

  // Initialize Map (Run ONCE)
  useEffect(() => {
    if (typeof (window as any).L === 'undefined') return;

    const container = document.getElementById('map-container');
    if (!container) return;

    // Safety: Cleanup existing map if ref persists but DOM was reset
    if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
    }

    const L = (window as any).L;
    // Use defaults for initial view
    const defaultLat = 19.302052;
    const defaultLng = 97.965449;

    const map = L.map('map-container').setView([defaultLat, defaultLng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], {
        draggable: true
    }).addTo(map);

    // Bind events
    marker.on('dragend', function(event: any) {
        const position = marker.getLatLng();
        setValue('lat', parseFloat(position.lat.toFixed(6)));
        setValue('lng', parseFloat(position.lng.toFixed(6)));
    });

    map.on('click', function(e: any) {
        marker.setLatLng(e.latlng);
        setValue('lat', parseFloat(e.latlng.lat.toFixed(6)));
        setValue('lng', parseFloat(e.latlng.lng.toFixed(6)));
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            markerRef.current = null;
        }
    }
  }, []); // Empty dependency array = Run once on mount

  // Update Map Position when initialData changes
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
        const L = (window as any).L;
        // If initialData exists, use it. Otherwise reset to default.
        const targetLat = initialData?.lat ?? 19.302052;
        const targetLng = initialData?.lng ?? 97.965449;
        
        const newLatLng = new L.LatLng(targetLat, targetLng);
        markerRef.current.setLatLng(newLatLng);
        mapRef.current.setView(newLatLng, 15);
    }
  }, [initialData]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
        Swal.fire('ข้อผิดพลาด', 'เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง', 'error');
        return;
    }

    Swal.fire({
        title: 'กำลังระบุตำแหน่ง...',
        didOpen: () => Swal.showLoading()
    });

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setValue('lat', parseFloat(latitude.toFixed(6)));
            setValue('lng', parseFloat(longitude.toFixed(6)));
            
            // Check refs before using them
            if (mapRef.current && markerRef.current) {
                const L = (window as any).L;
                const newLatLng = new L.LatLng(latitude, longitude);
                markerRef.current.setLatLng(newLatLng);
                mapRef.current.setView(newLatLng, 17);
            }
            Swal.close();
        },
        (error) => {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS', 'error');
            console.error(error);
        }
    );
  };

  const onSubmit = async (data: WasteRecord) => {
    if (data.wasteMethods.length === 0) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกวิธีการจัดการขยะอย่างน้อย 1 ข้อ', 'warning');
      return;
    }
    if (data.waterMethods.length === 0) {
      Swal.fire('แจ้งเตือน', 'กรุณาเลือกวิธีการจัดการน้ำเสียอย่างน้อย 1 ข้อ', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for duplicates ONLY if creating new record or if name changed
      if (!initialData || (initialData && initialData.fullName !== data.fullName)) {
          const existingRecords = await fetchAllRecords();
          const isDuplicate = existingRecords.some(r => r.fullName === data.fullName && r.id !== (initialData?.id || '')); 
          
          if (isDuplicate) {
             const confirm = await Swal.fire({
                title: 'พบข้อมูลซ้ำ',
                text: `มีชื่อ "${data.fullName}" ในระบบแล้ว ท่านต้องการบันทึกซ้ำหรือไม่?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก'
             });
             if (!confirm.isConfirmed) {
                setIsSubmitting(false);
                return;
             }
          }
      }

      let imageUrl = initialData?.imageUrl || '';
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const recordToSave: WasteRecord = {
        ...data,
        id: initialData ? initialData.id : crypto.randomUUID(), // Preserve ID if editing
        timestamp: initialData ? initialData.timestamp : new Date().toISOString(), // Preserve timestamp if editing
        imageUrl: imageUrl
      };

      await saveRecord(recordToSave);

      Swal.fire({
        title: initialData ? 'อัปเดตสำเร็จ' : 'บันทึกสำเร็จ',
        text: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว',
        icon: 'success',
        timer: 1500
      });
      
      reset();
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Reset Map to default
      if (mapRef.current && markerRef.current) {
          const defaultLat = 19.302052;
          const defaultLng = 97.965449;
          const L = (window as any).L;
          const latLng = new L.LatLng(defaultLat, defaultLng);
          markerRef.current.setLatLng(latLng);
          mapRef.current.setView(latLng, 15);
          setValue('lat', defaultLat);
          setValue('lng', defaultLng);
      }

      onSuccess();

    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all duration-200";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";
  const cardClass = "bg-white rounded-2xl shadow-lg shadow-gray-100 p-6 border border-gray-100";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10 space-y-3">
        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 pb-2">
            {initialData ? 'แก้ไขข้อมูลครัวเรือน' : 'บันทึกข้อมูลครัวเรือน'}
        </h1>
        <p className="text-gray-500 text-lg">แบบสำรวจการจัดการขยะและน้ำเสีย เทศบาลเมืองแม่ฮ่องสอน</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Section 1: Basic Info */}
        <div className={cardClass}>
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={24}/></div>
                <h3 className="text-xl font-bold text-gray-800">ข้อมูลทั่วไป (General Info)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Name */}
                <div className="lg:col-span-2">
                    <label className={labelClass}>ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        {...register('fullName', { required: 'กรุณากรอกชื่อ-นามสกุล' })}
                        className={`${inputClass} ${errors.fullName ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="ระบุชื่อจริงและนามสกุล"
                    />
                    {errors.fullName && <span className="text-xs text-red-500 mt-1">{errors.fullName.message}</span>}
                </div>
                 {/* Household Size */}
                 <div>
                    <label className={labelClass}>สมาชิกในบ้าน (คน)</label>
                    <input 
                        type="number" 
                        min="1"
                        {...register('householdSize')}
                        className={inputClass}
                    />
                </div>
                 {/* Phone */}
                 <div>
                    <label className={labelClass}>เบอร์โทรศัพท์</label>
                    <input 
                        type="tel" 
                        {...register('phone')}
                        className={inputClass}
                        placeholder="08x-xxx-xxxx"
                    />
                </div>
                 {/* Responsible Person */}
                 <div>
                    <label className={labelClass}>เจ้าหน้าที่รับผิดชอบ</label>
                    <div className="relative">
                        <select {...register('responsiblePerson')} className={`${inputClass} appearance-none`}>
                            {RESPONSIBLE_PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                             <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Section 2: Address */}
        <div className={cardClass}>
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Home size={24}/></div>
                <h3 className="text-xl font-bold text-gray-800">ข้อมูลที่อยู่ (Address)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address Type */}
                <div>
                    <label className={labelClass}>ประเภทที่อยู่</label>
                    <select {...register('addressType')} className={inputClass}>
                        {ADDRESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {addressType === 'อื่นๆ' && (
                        <input 
                            type="text" 
                            {...register('addressTypeOther', { required: addressType === 'อื่นๆ' })}
                            placeholder="ระบุเพิ่มเติม..."
                            className={`${inputClass} mt-2`}
                        />
                    )}
                </div>
                {/* Shop Name */}
                 <div>
                    <label className={labelClass}>ชื่อร้าน (ถ้ามี)</label>
                    <input 
                        type="text" 
                        {...register('shopName')}
                        className={inputClass}
                        placeholder="เช่น ร้านก๋วยเตี๋ยวป้า..."
                    />
                </div>
                 {/* Community */}
                 <div>
                    <label className={labelClass}>ชุมชน</label>
                    <select {...register('community')} className={inputClass}>
                        {COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                {/* Street */}
                <div>
                    <label className={labelClass}>ถนน</label>
                    <select {...register('street')} className={inputClass}>
                        {STREETS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 {/* Address No */}
                 <div className="md:col-span-2">
                    <label className={labelClass}>บ้านเลขที่ / รายละเอียดที่อยู่ <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        {...register('address', { required: 'กรุณากรอกที่อยู่' })}
                        className={`${inputClass} ${errors.address ? 'border-red-500' : ''}`}
                        placeholder="เช่น 123/4 หมู่ 1 ต.จองคำ"
                    />
                </div>
            </div>
            
            {/* Map */}
            <div className="mt-6 p-1 bg-gray-100 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center px-4 py-2">
                     <label className="text-sm font-semibold text-gray-600 flex items-center gap-2"><MapPin size={16}/> พิกัดแผนที่ (ลากหมุดเพื่อระบุตำแหน่ง)</label>
                     <button 
                        type="button"
                        onClick={getCurrentLocation}
                        className="text-xs bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-full flex items-center space-x-1 transition shadow-sm font-medium"
                    >
                        <Crosshair size={14} /> <span>ใช้ตำแหน่งปัจจุบัน</span>
                    </button>
                </div>
                <div className="w-full h-[320px] rounded-xl overflow-hidden relative z-0">
                    <div id="map-container" className="w-full h-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-0">
                    <div className="flex items-center gap-2 p-2 border-r border-gray-200 bg-white rounded-bl-xl">
                        <span className="text-xs font-bold text-gray-500 w-8">LAT</span>
                        <input type="number" step="any" {...register('lat')} className="w-full text-xs text-gray-700 outline-none bg-transparent" readOnly />
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-br-xl">
                         <span className="text-xs font-bold text-gray-500 w-8">LNG</span>
                        <input type="number" step="any" {...register('lng')} className="w-full text-xs text-gray-700 outline-none bg-transparent" readOnly />
                    </div>
                </div>
            </div>
        </div>

        {/* Section 3: Waste & Water */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Waste */}
            <div className={cardClass}>
                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Trash2 size={24}/></div>
                    <h3 className="text-xl font-bold text-gray-800">การจัดการขยะ</h3>
                </div>
                <div className="space-y-3">
                    <Controller
                        name="wasteMethods"
                        control={control}
                        render={({ field }) => (
                            <>
                                {WASTE_METHODS.map((method) => (
                                    <label key={method} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${field.value.includes(method) ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 ${field.value.includes(method) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                                             {field.value.includes(method) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={field.value.includes(method)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const newValue = checked
                                                    ? [...field.value, method]
                                                    : field.value.filter((v) => v !== method);
                                                field.onChange(newValue);
                                            }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{method}</span>
                                    </label>
                                ))}
                            </>
                        )}
                    />
                </div>
            </div>

            {/* Water */}
            <div className={cardClass}>
                <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><Droplets size={24}/></div>
                    <h3 className="text-xl font-bold text-gray-800">การจัดการน้ำเสีย</h3>
                </div>
                <div className="space-y-3">
                    <Controller
                        name="waterMethods"
                        control={control}
                        render={({ field }) => (
                            <>
                                {WATER_METHODS.map((method) => (
                                    <label key={method} className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${field.value.includes(method) ? 'bg-sky-50 border-sky-500 shadow-sm' : 'bg-white border-gray-200 hover:border-sky-300'}`}>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 ${field.value.includes(method) ? 'bg-sky-500 border-sky-500' : 'border-gray-300'}`}>
                                             {field.value.includes(method) && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={field.value.includes(method)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const newValue = checked
                                                    ? [...field.value, method]
                                                    : field.value.filter((v) => v !== method);
                                                field.onChange(newValue);
                                            }}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{method}</span>
                                    </label>
                                ))}
                            </>
                        )}
                    />
                </div>
            </div>
        </div>

        {/* Section 4: Image */}
        <div className={cardClass}>
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ImageIcon size={24}/></div>
                <h3 className="text-xl font-bold text-gray-800">รูปภาพประกอบ</h3>
            </div>
            
            {initialData?.imageUrl && !selectedImage && (
                <div className="mb-4 relative w-32 h-32 mx-auto rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={initialData.imageUrl} alt="Current" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs">
                        รูปปัจจุบัน
                    </div>
                </div>
            )}

            <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${selectedImage ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`w-10 h-10 mb-3 ${selectedImage ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className="mb-2 text-sm font-semibold text-gray-600">
                        {selectedImage ? selectedImage.name : (initialData?.imageUrl ? 'คลิกเพื่อเปลี่ยนรูปภาพ' : 'คลิกเพื่ออัปโหลดรูปภาพ')}
                    </p>
                    <p className="text-xs text-gray-500">รองรับไฟล์: JPG, PNG</p>
                </div>
                <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setSelectedImage(e.target.files[0]);
                        }
                    }}
                />
            </label>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-4 z-20 flex gap-4">
            {initialData && onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 shadow-xl shadow-gray-200 flex items-center justify-center space-x-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-4 px-6 rounded-2xl transform transition-all duration-300 hover:scale-[1.02] active:scale-95"
                >
                    <XCircle />
                    <span className="text-lg">ยกเลิก</span>
                </button>
            )}

             <button
                type="submit"
                disabled={isSubmitting}
                className={`shadow-2xl flex items-center justify-center space-x-2 font-bold py-4 px-6 rounded-2xl transform transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                    initialData 
                    ? 'flex-[2] shadow-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white' 
                    : 'w-full shadow-emerald-200 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white'
                }`}
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                <span className="text-lg">{initialData ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูลเข้าสู่ระบบ'}</span>
            </button>
        </div>

      </form>
    </div>
  );
};