'use client'

import { useState } from 'react'
import { useVikobaStore } from '@/lib/mockStore'
import { PlusCircle, ArrowLeftRight, Check, X, Search, FileText } from 'lucide-react'

export default function SharesPage() {
  const { 
    members, 
    currentGroup, 
    recordPayment,
    shareTransactions,
    addAuditLog
  } = useVikobaStore()

  // Modal actions state
  const [actionModal, setActionModal] = useState<'buy' | 'transfer' | 'redeem' | null>(null)
  
  // Forms state
  const [buyForm, setBuyForm] = useState({ memberId: '', sharesCount: 10, method: 'Mobile Money' as const })
  const [transferForm, setTransferForm] = useState({ fromMemberId: '', toMemberId: '', sharesCount: 5 })
  const [redeemForm, setRedeemForm] = useState({ memberId: '', sharesCount: 5 })

  // Search state
  const [search, setSearch] = useState('')

  // Format currency helper
  const fmt = (val: number) => {
    return `${currentGroup.currency} ${val.toLocaleString()}`
  }

  // Calculate metrics
  const activeMembersWithShares = members.filter(m => m.groupId === currentGroup.id && m.shares > 0)
  const totalSharesCount = activeMembersWithShares.reduce((sum, m) => sum + m.shares, 0)
  const totalCapitalValue = totalSharesCount * 5000

  // Filter members table
  const filteredMembers = members.filter(m => {
    if (m.groupId !== currentGroup.id) return false
    return m.name.toLowerCase().includes(search.toLowerCase())
  })

  // Top shareholders (sorted)
  const topShareholders = [...activeMembersWithShares]
    .sort((a, b) => b.shares - a.shares)
    .slice(0, 4)

  const handleBuyShares = (e: React.FormEvent) => {
    e.preventDefault()
    if (buyForm.memberId && buyForm.sharesCount > 0) {
      const amount = buyForm.sharesCount * 5000
      recordPayment({
        memberId: buyForm.memberId,
        amount,
        type: 'Share Purchase',
        method: buyForm.method
      })
      setActionModal(null)
      setBuyForm({ memberId: '', sharesCount: 10, method: 'Mobile Money' })
    }
  }

  const handleTransferShares = (e: React.FormEvent) => {
    e.preventDefault()
    const { fromMemberId, toMemberId, sharesCount } = transferForm
    if (fromMemberId && toMemberId && sharesCount > 0 && fromMemberId !== toMemberId) {
      const fromMem = members.find(m => m.id === fromMemberId)
      if (fromMem && fromMem.shares >= sharesCount) {
        // Direct state manipulation for transfer demo (simple audit logs)
        fromMem.shares -= sharesCount
        const toMem = members.find(m => m.id === toMemberId)
        if (toMem) toMem.shares += sharesCount

        addAuditLog(
          'Transfer Shares', 
          'Shares', 
          fromMemberId, 
          `Transferred ${sharesCount} shares from ${fromMem.name} to ${toMem?.name}`
        )

        setActionModal(null)
        setTransferForm({ fromMemberId: '', toMemberId: '', sharesCount: 5 })
      }
    }
  }

  const handleRedeemShares = (e: React.FormEvent) => {
    e.preventDefault()
    const { memberId, sharesCount } = redeemForm
    if (memberId && sharesCount > 0) {
      const mem = members.find(m => m.id === memberId)
      if (mem && mem.shares >= sharesCount) {
        mem.shares -= sharesCount
        
        addAuditLog(
          'Redeem Shares', 
          'Shares', 
          memberId, 
          `Redeemed ${sharesCount} shares (TZS ${(sharesCount * 5000).toLocaleString()}) for ${mem.name}`
        )

        setActionModal(null)
        setRedeemForm({ memberId: '', sharesCount: 5 })
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="breadcrumb text-xs text-neutral-400 font-bold flex items-center gap-1">
            <span>Finance</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-500">Shares</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">Shares Ledger (Hisa)</h1>
          <p className="text-xs text-neutral-400">Manage member share capitals, buy-ins, and transfer logs.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setActionModal('buy')}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#d99521] hover:bg-[#c08216] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <PlusCircle size={14} /> Buy Shares
          </button>
          <button 
            onClick={() => setActionModal('transfer')}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-[#dfe8e2] hover:bg-neutral-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeftRight size={14} /> Transfer Shares
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'Total Shares Capitalized', val: `${totalSharesCount.toLocaleString()} Shares`, color: 'text-[#d99521]' },
          { title: 'Share Unit Price', val: fmt(5000), color: 'text-neutral-800', sub: 'Fixed group rate' },
          { title: 'Total Capital Value', val: fmt(totalCapitalValue), color: 'text-neutral-800' },
          { title: 'Holders Count', val: `${activeMembersWithShares.length} Members`, color: 'text-[#087f5b]' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-[#dfe8e2] rounded-xl p-5 shadow-sm">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">{s.title}</span>
            <h3 className={`text-lg md:text-xl font-black mt-2 ${s.color}`}>{s.val}</h3>
            {s.sub && <span className="text-[9px] text-neutral-400 mt-1 block font-semibold">{s.sub}</span>}
          </div>
        ))}
      </div>

      {/* Visual ownership distribution & Top holders grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-[#dfe8e2] rounded-xl p-6">
          <h3 className="font-extrabold text-neutral-800 text-sm mb-4">Ownership Share Distribution</h3>
          
          <div className="flex flex-col gap-4 mt-6">
            {topShareholders.map((m, i) => {
              const pct = totalSharesCount > 0 ? Math.round((m.shares / totalSharesCount) * 100) : 0
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold text-neutral-700">
                    <span>{m.name}</span>
                    <span>{pct}% ({m.shares} shares)</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#d99521] h-full rounded-full" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-[#dfe8e2] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-neutral-800 text-sm mb-2">Redeem Shares</h3>
            <p className="text-[10px] text-neutral-400 leading-normal">
              Need to cash out member holdings back into the group available liquidity? Perform a share redemption.
            </p>
          </div>
          <button 
            onClick={() => setActionModal('redeem')}
            className="w-full py-2.5 border border-red-200 hover:border-red-500 hover:bg-red-50 text-red-600 font-bold rounded-lg text-xs transition mt-4"
          >
            Redeem Shares Drawer
          </button>
        </div>
      </div>

      {/* Shares register table */}
      <div className="bg-white border border-[#dfe8e2] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="font-extrabold text-neutral-800 text-sm">Holders Ledger</h3>
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Filter by name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dfe8e2] rounded-lg p-2 pl-8 text-xs outline-none focus:border-[#d99521]"
            />
            <Search className="absolute left-2.5 top-2.5 text-neutral-400" size={13} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/70 text-neutral-400 uppercase text-[9px] tracking-wider border-b border-neutral-100">
                <th className="p-4 font-bold">Member</th>
                <th className="p-4 font-bold text-right">Shares Owned</th>
                <th className="p-4 font-bold text-right">Total Equity Value</th>
                <th className="p-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredMembers.map(m => (
                <tr key={m.id} className="hover:bg-neutral-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#fdfaf5] text-[#d99521] font-bold text-xs flex items-center justify-center border border-[#f3e5d0]">
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-neutral-800 block text-xs">{m.name}</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">{m.memberNo}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-extrabold text-neutral-800 text-right">{m.shares.toLocaleString()} Shares</td>
                  <td className="p-4 font-black text-neutral-800 text-right">{fmt(m.shares * 5000)}</td>
                  <td className="p-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-extrabold">
                      COMPLETED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal Overlay: Buy Shares */}
      {actionModal === 'buy' && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Buy Shares (Hisa)</h3>
              <button onClick={() => setActionModal(null)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBuyShares} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Select Member *</label>
                <select
                  required
                  value={buyForm.memberId}
                  onChange={e => setBuyForm({ ...buyForm, memberId: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#d99521] text-neutral-600 font-semibold"
                >
                  <option value="">Choose a member...</option>
                  {members.filter(m => m.groupId === currentGroup.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberNo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Shares Count *</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={buyForm.sharesCount}
                    onChange={e => setBuyForm({ ...buyForm, sharesCount: Number(e.target.value) })}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#d99521] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">Calculated Cost</label>
                  <input 
                    type="text"
                    disabled
                    value={fmt(buyForm.sharesCount * 5000)}
                    className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs bg-neutral-50 text-neutral-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Funding Source *</label>
                <select
                  value={buyForm.method}
                  onChange={e => setBuyForm({ ...buyForm, method: e.target.value as any })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#d99521] text-neutral-600 font-semibold"
                >
                  <option value="Mobile Money">Mobile Money (M-Pesa/Tigo/Airtel)</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Bank">Bank Deposit</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-[#dfe8e2] rounded-lg text-xs font-bold text-neutral-500 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#d99521] hover:bg-[#c08216] text-white rounded-lg text-xs font-bold"
                >
                  Record Share Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal Overlay: Transfer Shares */}
      {actionModal === 'transfer' && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm">Transfer Shares</h3>
              <button onClick={() => setActionModal(null)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTransferShares} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Source Member (From) *</label>
                <select
                  required
                  value={transferForm.fromMemberId}
                  onChange={e => setTransferForm({ ...transferForm, fromMemberId: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#d99521] text-neutral-600 font-semibold"
                >
                  <option value="">Select source member...</option>
                  {members.filter(m => m.groupId === currentGroup.id && m.shares > 0).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.shares} shares)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Target Member (To) *</label>
                <select
                  required
                  value={transferForm.toMemberId}
                  onChange={e => setTransferForm({ ...transferForm, toMemberId: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#d99521] text-neutral-600 font-semibold"
                >
                  <option value="">Select target member...</option>
                  {members.filter(m => m.groupId === currentGroup.id && m.id !== transferForm.fromMemberId).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Number of Shares to Transfer *</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={transferForm.sharesCount}
                  onChange={e => setTransferForm({ ...transferForm, sharesCount: Number(e.target.value) })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#d99521] font-bold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-[#dfe8e2] rounded-lg text-xs font-bold text-neutral-500 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#d99521] hover:bg-[#c08216] text-white rounded-lg text-xs font-bold"
                >
                  Complete Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal Overlay: Redeem Shares */}
      {actionModal === 'redeem' && (
        <div className="fixed inset-0 bg-[#122b1c]/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#dfe8e2] rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-sm text-red-600">Redeem Shares (Withdraw Cash)</h3>
              <button onClick={() => setActionModal(null)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRedeemShares} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Member *</label>
                <select
                  required
                  value={redeemForm.memberId}
                  onChange={e => setRedeemForm({ ...redeemForm, memberId: e.target.value })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#d99521] text-neutral-600 font-semibold"
                >
                  <option value="">Select member...</option>
                  {members.filter(m => m.groupId === currentGroup.id && m.shares > 0).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.shares} shares)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Shares to Withdraw *</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={redeemForm.sharesCount}
                  onChange={e => setRedeemForm({ ...redeemForm, sharesCount: Number(e.target.value) })}
                  className="w-full border border-[#dfe8e2] rounded-lg p-2.5 text-xs outline-none focus:border-[#d99521] font-bold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-[#dfe8e2] rounded-lg text-xs font-bold text-neutral-500 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                >
                  Approve Redemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
