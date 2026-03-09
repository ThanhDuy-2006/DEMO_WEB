import re
import os

file_path = 'd:/Tool_Tam_Lum/webbanhang/frontend/src/pages/House.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# find return start in HouseDetail
start_idx = text.find('if (!house) return <HouseSkeleton />;')
if start_idx == -1:
    print('Failed to find start')
    exit()

# find end using unbalanced brace logic, or simply index of the last line.
# actually, the last function in file is HouseDetail
last_brace = text.rfind('}')
before_last_brace = text.rfind(';', 0, last_brace) # end of return statement or something
# Better: regex or string replace from the known `return (`

# We'll just replace the whole return block.
start_return = text.find('return (', start_idx)

# we can find the end of return ( by matching parens
parens_count = 0
end_return = -1
in_string = False
string_char = None
for i in range(start_return, len(text)):
    c = text[i]
    if not in_string:
        if c in ('"', "'", '`'):
            in_string = True
            string_char = c
        elif c == '(':
            parens_count += 1
        elif c == ')':
            parens_count -= 1
            if parens_count == 0:
                end_return = i + 1
                break
    else:
        if c == string_char and text[i-1] != '\\':
            in_string = False

old_jsx = text[start_return:end_return]

new_jsx = """return (
    <div className="house-vip-container animate-fade-in relative z-10 w-full min-h-screen">
      {/* BACKGROUND GRADIENT */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{ background: 'radial-gradient(circle at 20% 20%, #1b2a4a, #0b1220 60%)' }}></div>

      <div className="topbar">
        <div className="back-btn" onClick={() => navigate('/houses')}>← Quay lại danh sách</div>
        <div className="user-box">
          <div className="text-right">
            <div className="text-white font-semibold">{user?.full_name || user?.email || 'Guest'}</div>
            <small style={{opacity: '.6', fontSize: '10px'}}>{user?.role === 'admin' ? 'ADMIN' : (role ? role.toUpperCase() : 'MEMBER')}</small>
          </div>
          <div className="avatar flex items-center justify-center font-bold text-lg">{user?.full_name ? user.full_name[0].toUpperCase() : 'U'}</div>
        </div>
      </div>

      <div className="banner group">
        {/* EDIT COVER LOGIC */}
        <div 
            className={`absolute inset-0 z-0 group-hover:opacity-90 transition-opacity select-none ${isEditingCover ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onDoubleClick={() => {
                if ((role === 'owner' || user?.role === 'admin') && !isEditingCover) {
                    setIsEditingCover(true);
                }
            }}
            onMouseDown={(e) => {
                if (!isEditingCover) return;
                const img = e.currentTarget.querySelector('img');
                if (!img) return;
                e.preventDefault();
                const startY = e.clientY;
                let currentPosVal = 50;
                const currentPosStr = img.style.objectPosition.split(' ')[1];
                if (currentPosStr && currentPosStr.includes('%')) {
                     currentPosVal = parseFloat(currentPosStr);
                }
                const startPos = currentPosVal;
                const onMouseMove = (moveEvent) => {
                    moveEvent.preventDefault();
                    const deltaY = moveEvent.clientY - startY;
                    let newPos = startPos - (deltaY * 0.3);
                    newPos = Math.max(0, Math.min(100, newPos)); 
                    img.style.objectPosition = `center ${newPos}%`;
                };
                const onMouseUp = () => {
                   document.removeEventListener('mousemove', onMouseMove);
                   document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }}
        >
            {house.cover_image ? (
                <img 
                    src={house.cover_image} 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${!isEditingCover ? 'pointer-events-none opacity-50' : 'opacity-100'}`}
                    style={{ objectPosition: house.cover_position || 'center 50%' }}
                    alt="Cover" 
                    draggable={false}
                    id="cover-img-preview"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 opacity-50"></div>
            )}
        </div>

        {isEditingCover && (
            <div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-50 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-xl cursor-default"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <span className="text-white/80 text-xs flex items-center mr-2 font-medium">✨ Kéo ảnh để chỉnh</span>
                <button 
                    className="btn btn-sm btn-primary border-none shadow-none hover:scale-105 transition-transform"
                    onClick={async () => {
                        const img = document.getElementById('cover-img-preview');
                        const finalPos = img.style.objectPosition.split(' ')[1];
                         try {
                            await api.patch(`/houses/${id}/cover-position`, { cover_position: `center ${finalPos}` });
                            setIsEditingCover(false);
                            toast.success("Đã lưu vị trí ảnh bìa!");
                        } catch (err) {
                            console.error("Failed to save position", err);
                            toast.error("Lỗi khi lưu vị trí!");
                        }
                    }}
                >💾 Lưu</button>
                <button 
                    className="btn btn-sm bg-white/10 text-white hover:bg-white/20 border-none shadow-none hover:scale-105 transition-transform"
                    onClick={() => {
                        setIsEditingCover(false);
                        const img = document.getElementById('cover-img-preview');
                        img.style.objectPosition = house.cover_position || 'center 50%';
                    }}
                >❌ Hủy</button>
            </div>
        )}

        <div className="banner-content">
          <h1 className="text-4xl md:text-5xl font-black text-white text-glow tracking-tighter uppercase whitespace-nowrap">{house.name}</h1>
          <p className="text-sm mt-2 opacity-80 max-w-lg line-clamp-2">{house.description}</p>
          <div className="pills mt-4">
            <div className="pill">👥 {activeMembers.length} thành viên</div>
            <div className="pill">📦 {products.length} sản phẩm</div>
            {user && <div className="pill">💰 Ví của tôi: {wallet ? Number(wallet.balance).toLocaleString() : '0'}đ</div>}
          </div>
        </div>
        
        <div className="actions">
          {(!role && user) ? (
              <button className="btn-primary btn-sm px-6 rounded-full" onClick={handleJoin}>Tham gia Nhà</button>
          ) : (role === 'owner' || role === 'member' || user?.role === 'admin') && (
            <>
                <div className="action tooltip tooltip-top" data-tip="Trò chuyện" onClick={() => setShowChat(true)}>💬</div>
                
                <div className="action tooltip tooltip-top" data-tip="Sửa ảnh bìa" onClick={() => document.getElementById('update_cover_modal').showModal()}>📷</div>
                
                {house.cover_image && (
                    <div className="action tooltip tooltip-top" data-tip="Xóa ảnh bìa" onClick={handleDeleteCover}>🖼️</div>
                )}
                
                <div className="action tooltip tooltip-top" data-tip="Kho hàng" onClick={() => navigate(`/houses/${id}/warehouse`)}>📦</div>
                
                <div className="action tooltip tooltip-top" data-tip="Đăng bán SP" onClick={() => setShowCreate(!showCreate)}>➕</div>

                {(role === 'owner' || user?.role === 'admin') && (
                    <div className="action tooltip tooltip-top" data-tip="Xóa nhà" onClick={handleDeleteHouse} style={{backgroundColor: 'rgba(239, 68, 68, 0.2)'}}>🗑</div>
                )}
                
                {user && (
                    <div className="action tooltip tooltip-top" data-tip="Báo cáo vi phạm" onClick={() => { setReportConfig({ type: 'house', id: id }); setShowReportModal(true); }}>🛡</div>
                )}
            </>
          )}
        </div>
      </div>

       {/* Sửa ảnh bìa modal */}
       <dialog id="update_cover_modal" className="modal">
            <div className="modal-box bg-[#1a1f2e] border border-white/10 text-left">
                <form method="dialog"><button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button></form>
                <h3 className="font-bold text-lg mb-4 text-white">📷 Cập nhật ảnh bìa</h3>
                <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-4">
                        <span className="label-text text-white">Loại ảnh:</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="updateCoverType" className="radio radio-sm radio-primary" defaultChecked onClick={() => {
                                document.getElementById('update-cover-file').classList.remove('hidden');
                                document.getElementById('update-cover-url').classList.add('hidden');
                            }}/>
                            <span className="label-text text-sm">Tải ảnh lên</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="updateCoverType" className="radio radio-sm radio-primary" onClick={() => {
                                document.getElementById('update-cover-file').classList.add('hidden');
                                document.getElementById('update-cover-url').classList.remove('hidden');
                            }}/>
                            <span className="label-text text-sm">Link ảnh</span>
                        </label>
                    </label>
                    <input type="file" id="update-cover-file" className="file-input file-input-bordered file-input-md w-full mt-2 bg-black/20" accept="image/*,.jpn,.jpeg,.jpg,.png,.webp,.JPG,.JPN" />
                    <input type="text" id="update-cover-url" placeholder="Dán link ảnh tại đây..." className="input input-bordered w-full mt-2 hidden bg-black/20" />
                    <div className="modal-action">
                        <button className="btn btn-primary" onClick={() => {
                                const fileInput = document.getElementById('update-cover-file');
                                const urlInput = document.getElementById('update-cover-url');
                                const isUrl = !urlInput.classList.contains('hidden');
                                const mockEvent = { target: { type: isUrl ? 'url' : 'file', value: isUrl ? urlInput.value : '', files: fileInput.files } };
                                handleUpdateCover(mockEvent);
                                document.getElementById('update_cover_modal').close();
                        }}>Lưu thay đổi</button>
                    </div>
                </div>
            </div>
        </dialog>

      {/* House Chat Modal */}
      {showChat && (
          <HouseChat houseId={id} currentUserId={user?.id} onClose={() => setShowChat(false)} initialConversationId={initialConversationId} />
      )}

      {/* CREATE FORM (Conditional) */}
      {showCreate && (
          <div className="section animate-fade-in mb-8" style={{padding: '30px'}}>
              <h3 className="text-lg font-bold text-white mb-4">📝 Đăng bán sản phẩm mới</h3>
              <div className="max-w-xl mx-auto">
                <div className="flex flex-col items-center">
                    <p className="text-sm font-bold text-success mb-4 uppercase tracking-wider text-center">Import Sản phẩm từ Excel & Ảnh</p>
                    <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col gap-4 w-full transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-white/10 bg-black/20'}`} onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}>
                        <div className="text-center py-2">
                            <span className="text-2xl mb-1 block">{isDragging ? '📥' : '📄'}</span>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Kéo thả File Excel hoặc Ảnh vào đây</p>
                        </div>
                        <div className="h-px bg-white/5 w-full"></div>
                        <div>
                            <label className="text-[10px] font-bold text-white/60 mb-1.5 block uppercase">1. File Excel (.xlsx)</label>
                            <input type="file" accept=".xlsx, .xls" className="file-input file-input-xs file-input-bordered w-full bg-black/40 text-white" onChange={(e) => setExcelFile(e.target.files[0])} />
                            {excelFile && (<div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 font-bold"><span>✓</span><span className="truncate">{excelFile.name}</span></div>)}
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-white/60 mb-1.5 block uppercase">2. Ảnh SP (Nếu cần)</label>
                             <input type="file" multiple accept="image/*" className="file-input file-input-xs file-input-bordered w-full bg-black/40 text-white" onChange={(e) => setImportImages(e.target.files)} />
                             {importImages?.length > 0 && (<div className="mt-1 flex items-center gap-1 text-[10px] text-green-400 font-bold"><span>📸</span><span>Đã chọn {importImages.length} ảnh</span></div>)}
                        </div>
                        <button onClick={handleImportSubmit} disabled={!excelFile} className={`btn btn-sm btn-primary w-full disabled:opacity-50 mt-2 ${excelFile ? 'animate-pulse' : ''}`}>🚀 Tiến hành Import</button>
                        <div className="bg-black/30 p-3 rounded text-[10px] text-muted font-mono text-left">
                            <div className="flex justify-between items-center mb-2"><span className="text-white/40">Yêu cầu cột:</span><a href="/sample_products.xlsx" download className="text-blue-400 hover:underline">⬇ Tải mẫu</a></div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 opacity-60"><p className="text-success">Name</p><p className="text-success">Price</p><p className="text-success">Qty</p><p className="text-success">Desc</p></div>
                            <div className="mt-3 pt-2 border-t border-white/5 space-y-1"><p className="text-yellow-500 font-bold">Lưu ý:</p><p>• Điền <span className="text-white">Tên Ảnh</span> vào cột Image.</p><p>• Kéo toàn bộ ảnh vào ô trên.</p></div>
                        </div>
                    </div>
                </div>
              </div>
          </div>
      )}

      {/* EXCEL TABLE */}
      {house.type === 'excel' && (
          <div className="section mb-8">
              <ExcelTable houseId={id} myRole={role || (user?.role === 'admin' ? 'admin' : null)} user={user} onActivityChange={(userIds) => setActiveInExcel(userIds)} />
          </div>
      )}

      <div className="section mb-8">
        <div className="tabs">
          {house.type !== 'excel' && <div className={`tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Danh sách sản phẩm</div>}
          <div className={`tab ${activeTab === 'transactions' || (house.type === 'excel' && activeTab === 'products') ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>Lịch sử hoạt động</div>
        </div>

        {activeTab === 'products' && house.type !== 'excel' ? (
          <div className="overflow-x-auto w-full">
            <div className="flex justify-between items-center mb-4">
               {(role === 'member' || role === 'owner' || user?.role === 'admin') && products.length > 0 && (
                    <button onClick={() => { setIsSelectMode(!isSelectMode); setProductSelectedIds([]); }} className={`btn btn-sm ${isSelectMode ? 'btn-primary' : 'bg-white/10'}`} title={isSelectMode ? 'Xong' : 'Chọn nhiều'}>
                        {isSelectMode ? 'Tắt chọn' : 'Bật chọn nhiều'}
                    </button>
                )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {isSelectMode && <th style={{width: '40px'}}></th>}
                  <th>Sản phẩm</th>
                  <th>SL</th>
                  <th>Giá</th>
                  <th>Người đăng</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-6 text-slate-500">Không có sản phẩm nào.</td></tr>
                )}
                {products.map(p => (
                  <tr key={p.id} className={`${productSelectedIds.includes(p.id) ? 'bg-blue-500/10' : 'hover:bg-white/5'} transition-colors ${isSelectMode ? 'cursor-pointer' : ''}`} onClick={() => isSelectMode && toggleProductSelect(p.id)}>
                    {isSelectMode && <td><input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={productSelectedIds.includes(p.id)} readOnly /></td>}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded overflow-hidden bg-black/40 flex-shrink-0">
                          {p.image_url ? <img src={p.image_url.startsWith('http') ? p.image_url : `${p.image_url}`} onError={(e) => e.target.style.display = 'none'} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs opacity-50">🎁</div>}
                        </div>
                        <div>
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400 max-w-[150px] truncate">{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.quantity > 0 ? 'bg-slate-800 text-slate-300' : 'bg-red-500/20 text-red-400'}`}>{p.quantity}</span></td>
                    <td className="price">{Number(p.price).toLocaleString()}đ {p.unit_price && p.unit_price != p.price && <div className="text-[10px] text-emerald-400">({Number(p.unit_price).toLocaleString()}đ/1)</div>}</td>
                    <td><span className="text-xs text-slate-400">{p.owner_name}</span></td>
                    <td>
                        <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleBuyProduct(p); }} disabled={p.quantity <= 0 || buyingId === p.id} className={`btn btn-xs ${p.quantity > 0 ? 'btn-success' : 'btn-disabled opacity-50'}`}>{buyingId === p.id ? '...' : 'Mua'}</button>
                            <button className="btn btn-xs bg-white/10 hover:bg-white/20" title="Chi tiết" onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}>👀</button>
                            <button className="btn btn-xs bg-white/10 hover:bg-pink-500/20" disabled={p.quantity <= 0} title="Thêm vào giỏ" onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}>🛒</button>
                            {(role === 'owner' || user?.role === 'admin') && (
                                <button className="btn btn-xs bg-red-500/10 hover:bg-red-500/30 text-red-400" title="Xóa" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>🗑</button>
                            )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <input type="date" className="bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white outline-none" value={transactionFilters.date} onChange={(e) => setTransactionFilters(prev => ({ ...prev, date: e.target.value }))} />
                    <select className="bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white outline-none" value={transactionFilters.userId} onChange={(e) => setTransactionFilters(prev => ({ ...prev, userId: e.target.value }))}>
                        <option value="" className="bg-[#1a1f2e]">Tất cả người dùng...</option>
                        {activeMembers.map(m => (<option key={m.id} value={m.id} className="bg-[#1a1f2e]">{m.full_name || m.email}</option>))}
                    </select>
                    <button onClick={loadTransactions} className="btn btn-xs bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40">Làm mới</button>
                </div>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] scrollbar-hide space-y-2">
                {filteredTransactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🛍️</span>
                            <div>
                                <div className="text-sm">
                                    <span className="font-bold">{t.buyer_name}</span> 
                                    <span className="text-slate-400 text-xs mx-1">{t.type === 'REFUND' ? 'đã nhận hoàn tiền' : 'đã mua'}</span>
                                    <span className="text-indigo-300 text-xs font-semibold">{t.product_name || t.description}</span>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                    {new Date(t.created_at).toLocaleString('vi-VN')}
                                </div>
                            </div>
                        </div>
                        <div className={`font-bold text-sm ${t.type === 'REFUND' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.type === 'REFUND' ? '+' : '-'}{Number(t.total_price).toLocaleString()}đ
                        </div>
                    </div>
                ))}
                {transactions.length === 0 && <div className="text-center py-10 opacity-50">Chưa có giao dịch.</div>}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 grid-cols-1 gap-6 mb-8">
        <div className="member md:col-span-1">
          <h3 className="text-lg font-bold mb-4">Thành viên</h3>
          <div className="mb-4">
              <input type="text" placeholder="Tìm thành viên..." className="input input-sm w-full bg-black/20 text-white border-white/10 rounded" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
          </div>
          <div className="overflow-y-auto max-h-[300px] space-y-2 pr-2 scrollbar-hide">
             {filteredMembers.map(m => (
                  <div key={m.id} className={`flex justify-between items-center bg-black/20 p-2 rounded-lg ${house?.type === 'excel' && !activeInExcel.includes(m.id) ? 'opacity-60' : ''}`}>
                    <div>
                      <span className="text-sm font-semibold text-white">{m.role === 'owner' ? '👑' : '🟢'} {m.full_name || m.email}</span>
                      {(house?.type === 'excel' && !activeInExcel.includes(m.id)) && <div className="text-[9px] text-orange-500">Không hoạt động</div>}
                    </div>
                    <div className="flex gap-1">
                        {user && m.id !== user.id && (
                            <button onClick={() => { setReportConfig({ type: 'user', id: m.id }); setShowReportModal(true); }} className="text-yellow-500/70 hover:text-yellow-400" title="Báo cáo"><ShieldAlert size={14}/></button>
                        )}
                        {( (role === 'owner' || user?.role === 'admin') && m.id !== user?.id && m.role !== 'owner' ) && (
                            <button onClick={() => handleDeleteMember(m.id)} className="text-red-500 hover:text-red-400 pl-1" title="Đuổi">✕</button>
                        )}
                    </div>
                  </div>
              ))}
              {filteredMembers.length === 0 && <p className="text-xs text-slate-500">Không tìm thấy.</p>}
          </div>

          {(role === 'owner' || user?.role === 'admin') && pendingMembers.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-4">
                  <h4 className="text-sm font-bold text-orange-400 mb-2">Chờ duyệt ({pendingMembers.length})</h4>
                  <div className="space-y-2">
                      {pendingMembers.map(m => (
                          <div key={m.id} className="flex justify-between items-center bg-orange-500/10 border border-orange-500/20 p-2 rounded-lg">
                              <div className="text-xs">
                                  <div className="font-bold text-white">{m.full_name}</div>
                                  <div className="text-slate-400">{m.email}</div>
                              </div>
                              <div className="flex gap-1">
                                  <button onClick={() => handleMemberAction(m.id, 'member')} className="btn btn-xs btn-success rounded">✓</button>
                                  <button onClick={() => handleMemberAction(m.id, 'rejected')} className="btn btn-xs btn-error rounded">✕</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>

        <div className="section md:col-span-2 !mb-0 h-fit">
          <div className="wallet-header">
            <h3 className="text-lg font-bold">Lịch Sử Duyệt</h3>
            {(role === 'owner' || user?.role === 'admin') && pendingProducts.length > 0 && (
                <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full">{pendingProducts.length} SP cần duyệt</span>
            )}
          </div>
          <div id="walletList" className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
               {(role === 'owner' || user?.role === 'admin') ? (
                    pendingProducts.length > 0 ? pendingProducts.map(p => (
                        <div key={p.id} className="wallet-row items-center">
                            <div>
                                <div className="text-sm font-bold text-white">{p.name}</div>
                                <div className="text-xs text-slate-400">Bởi: {p.owner_name} - {Number(p.price).toLocaleString()}đ</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleApproveOne(p.id, 'active')} className="btn btn-xs btn-success">Duyệt</button>
                                <button onClick={() => handleApproveOne(p.id, 'rejected')} className="btn btn-xs btn-error">Từ chối</button>
                            </div>
                        </div>
                    )) : <div className="text-center text-slate-500 py-4 text-sm">Không có sản phẩm nào cần duyệt.</div>
               ) : (
                    <div className="text-center text-slate-500 py-4 text-sm">Với vai trò của bạn, khu vực này để trống.</div>
               )}
          </div>
        </div>
      </div>

      <div className="footer">
        © 2026 Admin - Phát triển bởi Duy Đẹp Trai
      </div>
      
      {/* Report Modal & Bulk action */}
      {showReportModal && <ReportModal targetType={reportConfig.type} targetId={reportConfig.id || id} onClose={() => setShowReportModal(false)} />}
      
      <div className={`bulk-action-bar active ${isSelectMode ? '' : '!translate-y-[150px]'}`} style={{position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#1a1f2e', padding: '15px 25px', borderRadius: '15px', zIndex: 100, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.3s'}}>
            <div className="text-slate-300 text-sm">Đã chọn <span className="text-primary font-bold">{productSelectedIds.length}</span> sản phẩm</div>
            <div className="flex gap-3">
                <button onClick={toggleSelectAllProducts} className="btn btn-sm bg-white/10">{productSelectedIds.length === products.length ? 'Bỏ chọn' : 'Tất cả'}</button>
                <button onClick={handleBulkDeleteProducts} disabled={productSelectedIds.length === 0} className="btn btn-sm btn-error">Xóa ({productSelectedIds.length})</button>
                <button onClick={() => setIsSelectMode(false)} className="btn btn-sm btn-ghost">Thoát</button>
            </div>
      </div>

    </div>
  )
"""

final_text = text[:start_return] + new_jsx + ";\n" + text[end_return:]
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_text)
print("done")
