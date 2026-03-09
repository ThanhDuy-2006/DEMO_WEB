
import React, { useState, useEffect } from 'react';
import { 
  Languages, Search, Plus, Edit2, Trash2, FileUp, Upload, 
  X, Check, AlertCircle, Volume2, HelpCircle 
} from 'lucide-react';
import vocabularyService from '../../services/vocabularyService';
import { useToast } from '../../context/ToastContext';

const VocabularyManagement = () => {
  const toast = useToast();
  const [vocabulary, setVocabulary] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    word: '', type: 'noun', pronounce: '', meaning: '', 
    example_sentence: '', audio_url: '', topic_id: ''
  });
  const [importFile, setImportFile] = useState(null);
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchVocabulary();
  }, [searchTerm, filterTopic]);

  const fetchTopics = async () => {
    try {
      const res = await vocabularyService.getTopics();
      setTopics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVocabulary = async () => {
    try {
      setLoading(true);
      const res = await vocabularyService.getAll(searchTerm, '', filterTopic);
      setVocabulary(res.data);
    } catch (err) {
      toast.error("Failed to load vocabulary");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        topic_id: item.topic_id || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ 
        word: '', type: 'noun', pronounce: '', meaning: '', 
        example_sentence: '', audio_url: '', topic_id: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await vocabularyService.update(editingItem.id, formData);
        toast.success("Vocabulary updated!");
      } else {
        await vocabularyService.create(formData);
        toast.success("Vocabulary added!");
      }
      setIsModalOpen(false);
      fetchVocabulary();
    } catch (err) {
      toast.error(err.response?.data?.error || "An error occurred");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this word?")) {
      try {
        await vocabularyService.delete(id);
        toast.success("Deleted!");
        fetchVocabulary();
      } catch (err) {
        toast.error("Delete failed!");
      }
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    const fd = new FormData();
    fd.append('file', importFile);
    
    try {
      setLoading(true);
      const res = await vocabularyService.importBulk(fd);
      setImportResults(res.data);
      toast.success("Import successful!");
      fetchTopics(); // Refresh topics as import might have added new ones
      fetchVocabulary();
    } catch (err) {
      toast.error("Import failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-slate-800/40 p-6 rounded-2xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý Từ vựng</h1>
            <p className="text-slate-400 text-sm">Hệ thống học tiếng Anh tập trung vào từ vựng.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all border border-white/5"
          >
            <FileUp className="w-4 h-4" /> Import Excel
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm từ mới
          </button>
        </div>
      </div>

      {/* Stats Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">{vocabulary.length}</div>
            <p className="text-slate-400 font-medium">Tổng số từ vựng</p>
         </div>
         <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 font-bold">{topics.length}</div>
            <p className="text-slate-400 font-medium">Chủ đề từ vựng</p>
         </div>
      </div>

      {/* Search & List */}
      <div className="bg-slate-800/30 rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm từ hoặc nghĩa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <select 
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 min-w-[200px]"
          >
            <option value="">Tất cả chủ đề</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/40 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Word</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Topic</th>
                <th className="px-6 py-4">Pronounce</th>
                <th className="px-6 py-4">Meaning</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && vocabulary.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500 italic">Đang tải...</td>
                </tr>
              ) : vocabulary.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white group-hover:text-primary transition-colors">{item.word}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-700/50 text-slate-400 text-[10px] px-2 py-1 rounded uppercase font-black">{item.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-primary text-[10px] font-bold uppercase tracking-wider">{item.topic_name || "Chưa phân loại"}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-sm">{item.pronounce}</td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{item.meaning}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(item)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-white/10">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all border border-red-500/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
               <h3 className="text-xl font-bold text-white">{editingItem ? "Sửa từ vựng" : "Thêm từ vựng mới"}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4 md:col-span-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Từ vựng (Word)</label>
                 <input 
                   required
                   value={formData.word}
                   onChange={e => setFormData({...formData, word: e.target.value})}
                   className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                 />
               </div>
               
               <div className="space-y-4">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loại từ</label>
                 <select 
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value})}
                   className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                 >
                   {['noun', 'verb', 'adjective', 'adverb', 'phrase', 'preposition'].map(t => (
                     <option key={t} value={t}>{t}</option>
                   ))}
                 </select>
               </div>

               <div className="space-y-4">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chủ đề (Topic)</label>
                 <select 
                   value={formData.topic_id}
                   onChange={e => setFormData({...formData, topic_id: e.target.value})}
                   className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                 >
                   <option value="">-- Chọn chủ đề --</option>
                   {topics.map(t => (
                     <option key={t.id} value={t.id}>{t.name}</option>
                   ))}
                 </select>
               </div>

               <div className="space-y-4">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phiên âm (IPA)</label>
                 <input 
                   value={formData.pronounce}
                   onChange={e => setFormData({...formData, pronounce: e.target.value})}
                   className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                 />
               </div>

               <div className="space-y-4 md:col-span-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ý nghĩa</label>
                 <textarea 
                   required
                   value={formData.meaning}
                   onChange={e => setFormData({...formData, meaning: e.target.value})}
                   className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 h-24 resize-none"
                 />
               </div>

               <div className="space-y-4 md:col-span-2">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Câu ví dụ</label>
                 <input 
                   value={formData.example_sentence}
                   onChange={e => setFormData({...formData, example_sentence: e.target.value})}
                   className="w-full bg-slate-800 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50"
                 />
               </div>

               <div className="p-6 border-t border-white/5 md:col-span-2 flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white transition-all">Hủy</button>
                 <button type="submit" className="bg-primary hover:bg-primary-dark px-10 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-primary/20">Lưu ngay</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <FileUp className="w-5 h-5 text-primary" /> Import Danh sách (Bulk)
               </h3>
               <button onClick={() => { setIsImportModalOpen(false); setImportResults(null); }} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              {!importResults ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                       <HelpCircle className="w-3 h-3" /> Hướng dẫn
                    </div>
                     <p className="text-slate-400 text-sm leading-relaxed">
                       File của bạn cần có các cột: <strong className="text-white">Word, Type, Pronounce, Meaning, Example, Audio, Topic</strong>. Hệ thống sẽ tự tạo Topic nếu chưa tồn tại.
                     </p>
                  </div>

                  <div 
                    onClick={() => document.getElementById('file-upload').click()}
                    className="border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center gap-4 bg-slate-800/20 hover:bg-slate-800/50 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">{importFile ? importFile.name : "Kéo thả hoặc nhấp để tải file"}</p>
                      <p className="text-slate-500 text-xs mt-1">Dung lượng tối đa 5MB</p>
                    </div>
                    <input id="file-upload" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={e => setImportFile(e.target.files[0])} />
                  </div>

                  <button 
                    disabled={!importFile || loading}
                    onClick={handleImport}
                    className="w-full bg-primary disabled:bg-slate-700 hover:bg-primary-dark text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                  >
                    {loading ? "Đang xử lý..." : "Bắt đầu Import"}
                  </button>
                </>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center">
                      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                         <Check className="w-6 h-6" />
                      </div>
                      <h4 className="text-white font-bold text-lg">Hoàn tất Import</h4>
                      <p className="text-slate-400 text-sm">Dữ liệu đã được đồng bộ vào hệ thống.</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-white/5">
                         <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Đã nhập mới</p>
                         <p className="text-2xl font-black text-white">{importResults.imported}</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-white/5">
                         <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Đã cập nhật</p>
                         <p className="text-2xl font-black text-white">{importResults.updated}</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-white/5 col-span-2">
                         <p className="text-[10px] text-red-500 uppercase font-black tracking-widest">Lỗi (Bị bỏ qua)</p>
                         <p className="text-2xl font-black text-white">{importResults.errors}</p>
                      </div>
                   </div>

                   <button 
                     onClick={() => { setIsImportModalOpen(false); setImportResults(null); }}
                     className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                   >
                     Đóng cửa sổ
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyManagement;
