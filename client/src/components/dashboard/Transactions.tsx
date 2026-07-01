import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaMoneyBillWave, FaSearch, FaFilter, FaArrowUp, FaArrowDown,
  FaFileDownload, FaPlus, FaRegCalendarAlt, FaTags, FaRupeeSign,
  FaReceipt, FaCreditCard, FaCashRegister, FaRegClock,
  FaChevronRight, FaTimes, FaFileExport, FaCopy, FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { transactionsAPI } from '../../services/api';

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category?: 'credit' | 'debit' | 'subscription' | 'refund';
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const Transactions: React.FC = () => {

  // ── API State ──────────────────────────────────────────────────────────────
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [stats, setStats]               = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ── UI / Filter State ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]           = useState('');
  const [filterType, setFilterType]             = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [filterCategory, setFilterCategory]     = useState<'all' | 'credit' | 'debit' | 'subscription' | 'refund'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showExportModal, setShowExportModal]   = useState(false);
  const [exportFormat, setExportFormat]         = useState<'csv' | 'json' | 'pdf'>('csv');
  const [exportDateRange, setExportDateRange]   = useState<'all' | 'current-month' | 'last-3-months' | 'last-6-months' | 'custom'>('all');
  const [exportStatus, setExportStatus]         = useState<'idle' | 'exporting' | 'completed'>('idle');
  const [currentPage, setCurrentPage]           = useState(1);
  const [itemsPerPage]                          = useState(8);
  const [sortOrder, setSortOrder]               = useState<'newest' | 'oldest'>('newest');

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchTransactions(); }, [filterType, filterCategory, sortOrder, currentPage]);
  useEffect(() => { fetchStats(); },       []);

  // ── API Calls ──────────────────────────────────────────────────────────────
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page:  currentPage,
        limit: itemsPerPage,
        sort:  sortOrder === 'newest' ? '-date' : 'date',
      };

      if (filterType     !== 'all') params.type     = filterType;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (searchQuery)               params.search   = searchQuery;

      const response = await transactionsAPI.getTransactions(params);

      if (response.data.success && response.data.data?.transactions) {
        const mappedTransactions = response.data.data.transactions.map((txn: any) => ({
          id:          txn._id,
          date:        txn.date,
          amount:      txn.amount,
          description: txn.description,
          category:    txn.category,
        }));
        setTransactions(mappedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await transactionsAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // ── Derived Values ─────────────────────────────────────────────────────────
  const depositTotal    = stats?.totalCredits || transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const withdrawalTotal = stats?.totalDebits  || transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const totalAmount     = stats?.netTotal     || transactions.reduce((s, t) => s + t.amount, 0);

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch    = txn.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType      = filterType === 'all' || (filterType === 'deposit' && txn.amount > 0) || (filterType === 'withdrawal' && txn.amount < 0);
    const matchesCategory  = filterCategory === 'all' || txn.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dA = new Date(a.date).getTime(), dB = new Date(b.date).getTime();
    return sortOrder === 'newest' ? dB - dA : dA - dB;
  });

  const indexOfLastItem     = currentPage * itemsPerPage;
  const indexOfFirstItem    = indexOfLastItem - itemsPerPage;
  const currentTransactions = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages          = Math.ceil(sortedTransactions.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // ── Utilities ──────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Newsprint-style category badge — sharp corners, monospace, uppercase
  const getCategoryIcon = (category?: string) => {
    const base = 'inline-flex items-center gap-1.5 border font-bold uppercase tracking-widest text-[0.6rem] px-2 py-1';
    switch (category) {
      case 'credit':
        return (
          <span className={`${base} border-[#111111] bg-[#111111] text-[#F9F9F7]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaArrowUp size={8} /> CREDIT
          </span>
        );
      case 'debit':
        return (
          <span className={`${base} border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaArrowDown size={8} /> DEBIT
          </span>
        );
      case 'subscription':
        return (
          <span className={`${base} border-[#111111] text-[#111111]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaRegClock size={8} /> SUBSCR.
          </span>
        );
      case 'refund':
        return (
          <span className={`${base} border-[#111111] text-[#111111] bg-[#E5E5E0]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaCashRegister size={8} /> REFUND
          </span>
        );
      default:
        return (
          <span className={`${base} border-[#A3A3A3] text-[#525252]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <FaReceipt size={8} /> OTHER
          </span>
        );
    }
  };

  // ── Export Handler (logic untouched) ───────────────────────────────────────
  const handleExportData = async () => {
    setExportStatus('exporting');

    try {
      if (exportFormat === 'csv') {
        const filters: any = {};

        if (exportDateRange !== 'all') {
          const now = new Date();
          let startDate = new Date();

          if      (exportDateRange === 'current-month')  startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          else if (exportDateRange === 'last-3-months')  startDate.setMonth(now.getMonth() - 3);
          else if (exportDateRange === 'last-6-months')  startDate.setMonth(now.getMonth() - 6);

          filters.startDate = startDate.toISOString().split('T')[0];
          filters.endDate   = now.toISOString().split('T')[0];
        }

        const response = await transactionsAPI.exportCSV(filters);
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        let dataToExport = sortedTransactions;

        if (exportDateRange !== 'all') {
          const now = new Date();
          let cutoffDate = new Date();

          if      (exportDateRange === 'current-month') cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
          else if (exportDateRange === 'last-3-months') cutoffDate.setMonth(now.getMonth() - 3);
          else if (exportDateRange === 'last-6-months') cutoffDate.setMonth(now.getMonth() - 6);

          dataToExport = dataToExport.filter(txn => new Date(txn.date) >= cutoffDate);
        }

        if (exportFormat === 'json') {
          const jsonContent = JSON.stringify(dataToExport, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const url  = window.URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href     = url;
          a.download = `transactions-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else if (exportFormat === 'pdf') {
          console.log('PDF export would be generated here with a library like jsPDF');
        }
      }

      setExportStatus('completed');
      setTimeout(() => { setExportStatus('idle'); setShowExportModal(false); }, 2000);
    } catch (err: any) {
      console.error('Error exporting transactions:', err);
      setExportStatus('idle');
      alert('Failed to export transactions. Please try again.');
    }
  };

  const exportTransactions = () => { setShowExportModal(true); setExportStatus('idle'); };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading && transactions.length === 0) {
    return (
      <div
        className="min-h-screen bg-[#F9F9F7] flex items-center justify-center"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}
      >
        <div className="text-center border-4 border-[#111111] p-16 bg-[#F9F9F7] relative overflow-hidden max-w-sm w-full mx-4">
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(0deg, transparent 98%, rgba(0,0,0,0.08) 100%), linear-gradient(90deg, transparent 98%, rgba(0,0,0,0.08) 100%)', backgroundSize: '3px 3px' }}
          />
          <div className="relative z-10">
            <FaSpinner className="animate-spin text-[#111111] mx-auto mb-6" style={{ fontSize: '2.5rem' }} />
            <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              [RETRIEVING LEDGER]
            </div>
            <h2 className="text-3xl font-black text-[#111111] uppercase leading-tight tracking-tighter mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              LOADING<br />RECORDS
            </h2>
            <p className="text-[#525252] text-sm leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>
              Fetching your financial transaction data…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="min-h-screen bg-[#F9F9F7] flex items-center justify-center"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}
      >
        <div className="max-w-lg w-full mx-4 border-4 border-[#CC0000] bg-[#F9F9F7]">
          <div className="bg-[#CC0000] p-8 flex items-center gap-6">
            <div className="p-4 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#CC0000]">
              <FaExclamationTriangle className="text-2xl" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-[#F9F9F7]" style={{ fontFamily: "'Playfair Display', serif" }}>
              DATA ERROR
            </h2>
          </div>
          <div className="p-10">
            <p className="text-[#111111] font-bold mb-8 border-l-4 border-[#CC0000] pl-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              {error}
            </p>
            <button
              onClick={fetchTransactions}
              className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              RETRY OPERATION
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Inline Style Definitions ─ Newsprint Font & Utility Classes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');

        .newsprint-texture { position: relative; }
        .newsprint-texture::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(0deg, transparent 98%, rgba(0,0,0,0.02) 100%),
            linear-gradient(90deg, transparent 98%, rgba(0,0,0,0.02) 100%);
          background-size: 3px 3px;
          pointer-events: none;
          opacity: 0.5;
        }
        .hard-shadow-hover {
          transition: box-shadow 0.15s ease-out, transform 0.15s ease-out;
        }
        .hard-shadow-hover:hover {
          box-shadow: 4px 4px 0px 0px #111111;
          transform: translate(-2px, -2px);
        }
        .txn-row:hover { background-color: #E5E5E0; }
      `}</style>

      <div
        className="bg-[#F9F9F7]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
        }}
      >

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="border-b-4 border-[#111111] bg-[#F9F9F7] p-8 md:p-12 relative overflow-hidden newsprint-texture">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">

            {/* Headline block */}
            <div>
              <div
                className="inline-block border border-[#111111] px-3 py-1 mb-6 text-[0.65rem] font-black uppercase tracking-widest text-[#111111]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                FINANCIAL LEDGER &bull; TRANSACTIONS
              </div>
              <h2
                className="text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter text-[#111111]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                FINANCIAL<br />
                <span className="italic" style={{ color: "#CC0000" }}>RECORDS</span>
              </h2>
              <p
                className="mt-6 text-lg text-[#525252] max-w-2xl leading-relaxed border-l-4 border-[#CC0000] pl-4"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Track, manage, and analyze all your financial activities. Every rupee accounted for.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-8 md:mt-0">
              <button
                onClick={exportTransactions}
                className="px-6 py-4 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] hard-shadow-hover flex items-center justify-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaFileExport /> EXPORT DATA
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaPlus /> ADD TRANSACTION
              </button>
            </div>
          </div>

          {/* Stats Strip ── collapsed-border grid like BackUp.tsx */}
          <div className="mt-12 pt-6 border-t-4 border-[#111111] grid grid-cols-2 md:grid-cols-5 gap-0 bg-[#111111]">
            <div className="col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
              <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[NET BALANCE]</div>
              <div className={`font-black text-2xl flex items-center gap-1 ${totalAmount >= 0 ? 'text-[#111111]' : 'text-[#CC0000]'}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                <FaRupeeSign className="text-lg" />{totalAmount.toFixed(0)}
              </div>
            </div>
            <div className="col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
              <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[TOTAL INCOME]</div>
              <div className="font-black text-2xl text-[#111111] flex items-center gap-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                <FaArrowUp className="text-lg" />₹{depositTotal.toFixed(0)}
              </div>
            </div>
            <div className="col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
              <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[EXPENSES]</div>
              <div className="font-black text-2xl text-[#CC0000] flex items-center gap-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                <FaArrowDown className="text-lg" />₹{Math.abs(withdrawalTotal).toFixed(0)}
              </div>
            </div>
            <div className="col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
              <div className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[TRANSACTIONS]</div>
              <div className="font-black text-2xl text-[#111111] flex items-center gap-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                <FaReceipt className="text-lg" /> {transactions.length}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1 bg-[#111111]">
              <button
                onClick={() => { setFilterType('all'); setFilterCategory('all'); setSearchQuery(''); }}
                className="w-full h-full flex items-center justify-center gap-2 bg-[#111111] text-[#F9F9F7] font-black text-xs uppercase tracking-widest p-4 hover:bg-[#CC0000] transition-colors min-h-[64px]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaTimes /> CLEAR FILTERS
              </button>
            </div>
          </div>
        </div>

        {/* ── SUMMARY CARDS ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b-4 border-[#111111]">

          {/* Net Balance Card */}
          <div className="border-r border-[#111111] bg-[#F9F9F7] p-8 hover:bg-[#E5E5E0] transition-colors">
            <div className="flex items-center justify-between mb-8 border-b-2 border-[#111111] pb-4">
              <h3 className="text-2xl font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>NET BALANCE</h3>
              <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
                <FaRupeeSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[0.65rem] text-[#CC0000] uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CURRENT BALANCE</p>
              <p className={`text-4xl font-black tracking-tighter border-l-2 border-[#111111] pl-3 py-1 ${totalAmount >= 0 ? 'text-[#111111]' : 'text-[#CC0000]'}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                ₹{totalAmount.toFixed(2)}
              </p>
            </div>
            <div className="pt-4 border-t border-[#111111] flex justify-between items-center text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="text-[#525252]">{transactions.length} TOTAL ENTRIES</span>
              <span className={`${totalAmount >= 0 ? 'text-[#111111]' : 'text-[#CC0000]'}`}>
                {totalAmount >= 0 ? '▲ SURPLUS' : '▼ DEFICIT'}
              </span>
            </div>
          </div>

          {/* Income Card */}
          <div className="border-r border-[#111111] bg-[#F9F9F7] p-8 hover:bg-[#E5E5E0] transition-colors">
            <div className="flex items-center justify-between mb-8 border-b-2 border-[#111111] pb-4">
              <h3 className="text-2xl font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>INCOME</h3>
              <div className="p-2 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
                <FaArrowUp className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <p className="text-4xl font-black text-[#111111] tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>₹{depositTotal.toFixed(2)}</p>
              <span className="text-[0.65rem] border border-[#111111] text-[#111111] px-2 py-0.5 uppercase tracking-widest font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {transactions.filter(t => t.amount > 0).length} DEP.
              </span>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full border border-[#111111] bg-white">
                <div
                  className="h-full bg-[#111111]"
                  style={{ width: `${depositTotal + Math.abs(withdrawalTotal) > 0 ? (depositTotal / (depositTotal + Math.abs(withdrawalTotal))) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[0.6rem] text-[#525252] font-bold tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span>₹0</span>
                <span>{depositTotal + Math.abs(withdrawalTotal) > 0 ? Math.round((depositTotal / (depositTotal + Math.abs(withdrawalTotal))) * 100) : 0}% OF FLOW</span>
              </div>
            </div>
          </div>

          {/* Expenses Card */}
          <div className="bg-[#F9F9F7] p-8 hover:bg-[#E5E5E0] transition-colors">
            <div className="flex items-center justify-between mb-8 border-b-2 border-[#111111] pb-4">
              <h3 className="text-2xl font-black text-[#111111]" style={{ fontFamily: "'Playfair Display', serif" }}>EXPENSES</h3>
              <div className="p-2 border-2 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]">
                <FaArrowDown className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <p className="text-4xl font-black text-[#CC0000] tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>₹{Math.abs(withdrawalTotal).toFixed(2)}</p>
              <span className="text-[0.65rem] border border-[#CC0000] text-[#CC0000] px-2 py-0.5 uppercase tracking-widest font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {transactions.filter(t => t.amount < 0).length} WITH.
              </span>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full border border-[#111111] bg-white">
                <div
                  className="h-full bg-[#CC0000]"
                  style={{ width: `${depositTotal + Math.abs(withdrawalTotal) > 0 ? (Math.abs(withdrawalTotal) / (depositTotal + Math.abs(withdrawalTotal))) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[0.6rem] text-[#525252] font-bold tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span>₹0</span>
                <span>{depositTotal + Math.abs(withdrawalTotal) > 0 ? Math.round((Math.abs(withdrawalTotal) / (depositTotal + Math.abs(withdrawalTotal))) * 100) : 0}% OF FLOW</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SEARCH & FILTERS ─────────────────────────────────────────────── */}
        <div className="border-b-4 border-[#111111] bg-[#F9F9F7] p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

            {/* Search box */}
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <FaSearch className="text-[#111111]" />
              </div>
              <input
                type="text"
                placeholder="SEARCH TRANSACTIONS BY DESCRIPTION..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-[#111111] bg-[#F9F9F7] text-[#111111] font-bold text-xs tracking-widest uppercase placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-0 transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            {/* Filter dropdowns */}
            <div className="flex flex-wrap items-center gap-0 border-2 border-[#111111] divide-x-2 divide-[#111111] w-full md:w-auto">

              <div className="flex items-center gap-2 px-4 py-4 hover:bg-[#E5E5E0] transition-colors">
                <FaFilter className="text-[#111111] flex-shrink-0" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-transparent border-none text-[0.65rem] uppercase tracking-widest font-bold text-[#111111] focus:ring-0 focus:outline-none cursor-pointer"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <option value="all">ALL TYPES</option>
                  <option value="deposit">DEPOSITS</option>
                  <option value="withdrawal">WITHDRAWALS</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-4 py-4 hover:bg-[#E5E5E0] transition-colors">
                <FaTags className="text-[#111111] flex-shrink-0" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="bg-transparent border-none text-[0.65rem] uppercase tracking-widest font-bold text-[#111111] focus:ring-0 focus:outline-none cursor-pointer"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <option value="all">ALL CATEGORIES</option>
                  <option value="credit">CREDIT</option>
                  <option value="debit">DEBIT</option>
                  <option value="subscription">SUBSCRIPTION</option>
                  <option value="refund">REFUND</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-4 py-4 hover:bg-[#E5E5E0] transition-colors">
                <FaRegCalendarAlt className="text-[#111111] flex-shrink-0" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-transparent border-none text-[0.65rem] uppercase tracking-widest font-bold text-[#111111] focus:ring-0 focus:outline-none cursor-pointer"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <option value="newest">NEWEST FIRST</option>
                  <option value="oldest">OLDEST FIRST</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── TRANSACTION HISTORY TABLE ─────────────────────────────────────── */}
        <div className="bg-[#F9F9F7]">

          {/* Section header */}
          <div className="bg-[#111111] text-[#F9F9F7] p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-4 border-[#111111]">
            <div className="flex items-center gap-6">
              <div className="p-3 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                <FaReceipt className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tighter uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                  TRANSACTION HISTORY
                </h3>
                <p className="text-[#A3A3A3] mt-1 max-w-md" style={{ fontFamily: "'Lora', serif" }}>
                  Complete record of your financial activities.
                </p>
              </div>
            </div>
            <div
              className="text-[0.65rem] font-bold text-[#F9F9F7] uppercase tracking-widest border border-[#A3A3A3] px-4 py-2 flex-shrink-0"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              SHOWING {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, sortedTransactions.length)} OF {sortedTransactions.length}
            </div>
          </div>

          {/* Table body */}
          <div className="p-6 md:p-8">
            {sortedTransactions.length === 0 ? (

              // ── Empty State ──
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 border-4 border-dashed border-[#111111]"
              >
                <div className="mx-auto w-16 h-16 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-8">
                  <FaReceipt className="text-2xl" />
                </div>
                <h3
                  className="text-3xl font-black text-[#111111] mb-3 uppercase tracking-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  NO RECORDS FOUND
                </h3>
                <p className="text-[#525252] max-w-md mx-auto mb-10" style={{ fontFamily: "'Lora', serif" }}>
                  No transactions match your current search or filters. Try adjusting your criteria or add a new transaction.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => { setFilterType('all'); setFilterCategory('all'); setSearchQuery(''); }}
                    className="px-6 py-3 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    CLEAR FILTERS
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <FaPlus /> ADD TRANSACTION
                  </button>
                </div>
              </motion.div>

            ) : (
              <>
                {/* ── Table ── */}
                <div className="overflow-x-auto border-2 border-[#111111]">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-[#E5E5E0] border-b-2 border-[#111111]">
                        {['DATE', 'DESCRIPTION', 'CATEGORY', 'AMOUNT', ''].map((col, i) => (
                          <th
                            key={i}
                            className={`px-6 py-4 text-left text-[0.6rem] font-bold uppercase tracking-widest text-[#111111] ${i < 4 ? 'border-r border-[#111111]' : ''}`}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E0]">
                      {currentTransactions.map((txn, index) => (
                        <motion.tr
                          key={txn.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04 } }}
                          onClick={() => setSelectedTransaction(txn)}
                          className="txn-row cursor-pointer transition-colors bg-white border-b border-[#E5E5E0]"
                        >
                          {/* Date */}
                          <td className="px-6 py-5 whitespace-nowrap border-r border-[#E5E5E0]">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 border-2 flex-shrink-0 ${txn.amount > 0 ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]' : 'border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]'}`}>
                                {txn.amount > 0
                                  ? <FaArrowUp className="w-3 h-3" />
                                  : <FaArrowDown className="w-3 h-3" />
                                }
                              </div>
                              <span className="text-xs font-bold text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {formatDate(txn.date)}
                              </span>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="px-6 py-5 border-r border-[#E5E5E0]">
                            <div className="font-bold text-[#111111] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {txn.description}
                            </div>
                            <div className="text-[0.6rem] text-[#A3A3A3] mt-0.5 uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              ID: {txn.id}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-5 whitespace-nowrap border-r border-[#E5E5E0]">
                            {getCategoryIcon(txn.category)}
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-5 whitespace-nowrap border-r border-[#E5E5E0]">
                            <span
                              className={`font-black text-lg tracking-tight ${txn.amount >= 0 ? 'text-[#111111]' : 'text-[#CC0000]'}`}
                              style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                              {txn.amount >= 0 ? '+' : ''}₹{txn.amount.toFixed(2)}
                            </span>
                          </td>

                          {/* Action chevron */}
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <button
                              className="p-2 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                              aria-label="View details"
                            >
                              <FaChevronRight size={12} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t-2 border-[#111111] pt-6 mt-6">
                    <p className="text-xs font-bold text-[#525252] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, sortedTransactions.length)} of {sortedTransactions.length} records
                    </p>
                    <nav className="flex items-center gap-0 border-2 border-[#111111] divide-x-2 divide-[#111111]" aria-label="Pagination">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#E5E5E0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        &larr; PREV
                      </button>

                      {[...Array(totalPages)].map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => paginate(idx + 1)}
                          className={`px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                            currentPage === idx + 1
                              ? 'bg-[#111111] text-[#F9F9F7]'
                              : 'text-[#111111] hover:bg-[#E5E5E0]'
                          }`}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {idx + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#111111] hover:bg-[#E5E5E0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        NEXT &rarr;
                      </button>
                    </nav>
                  </div>
                )}

                {/* Load older link */}
                {sortedTransactions.length > 0 && (
                  <div className="text-center pt-8">
                    <button
                      className="text-xs font-black text-[#111111] uppercase tracking-widest border-b-2 border-[#111111] hover:text-[#CC0000] hover:border-[#CC0000] pb-1 transition-colors"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      VIEW FULL HISTORY &darr;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── MODALS ───────────────────────────────────────────────────────── */}
        <AnimatePresence>

          {/* ── Transaction Detail Modal ── */}
          {selectedTransaction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#111111]/70 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTransaction(null)}
            >
              <motion.div
                initial={{ scale: 0.97, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.97, opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-[#F9F9F7] border-4 border-[#111111] max-w-md w-full overflow-hidden"
                style={{ boxShadow: '8px 8px 0px 0px #111111' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className={`p-6 border-b-4 border-[#111111] flex justify-between items-center ${selectedTransaction.amount >= 0 ? 'bg-[#111111]' : 'bg-[#CC0000]'} text-[#F9F9F7]`}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                      {selectedTransaction.amount >= 0 ? <FaArrowUp className="h-5 w-5" /> : <FaArrowDown className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {selectedTransaction.amount >= 0 ? 'INCOME ENTRY' : 'EXPENSE ENTRY'}
                      </h3>
                      <p className="text-[0.65rem] uppercase tracking-widest mt-1 opacity-70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        TRANSACTION DETAILS
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="p-2 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Modal body */}
                <div className="p-8 space-y-6">

                  {/* Amount block */}
                  <div className="border-2 border-[#111111] p-6 text-center">
                    <div className="text-[0.6rem] text-[#CC0000] uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      [TRANSACTION AMOUNT]
                    </div>
                    <div
                      className={`text-5xl font-black tracking-tighter ${selectedTransaction.amount >= 0 ? 'text-[#111111]' : 'text-[#CC0000]'}`}
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {selectedTransaction.amount >= 0 ? '+' : ''}₹{selectedTransaction.amount.toFixed(2)}
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-0 border-2 border-[#111111] divide-x-2 divide-[#111111]">
                    <div className="p-4">
                      <div className="text-[0.6rem] text-[#CC0000] uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>DATE</div>
                      <div className="font-bold text-[#111111] flex items-center gap-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                        <FaRegCalendarAlt className="text-[#525252]" size={12} />
                        {formatDate(selectedTransaction.date)}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-[0.6rem] text-[#CC0000] uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CATEGORY</div>
                      <div>{getCategoryIcon(selectedTransaction.category)}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-2 border-[#111111] p-4">
                    <div className="text-[0.6rem] text-[#CC0000] uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>DESCRIPTION</div>
                    <p className="font-bold text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {selectedTransaction.description}
                    </p>
                  </div>

                  {/* Transaction ID */}
                  <div className="border-2 border-[#111111] p-4">
                    <div className="text-[0.6rem] text-[#CC0000] uppercase tracking-widest font-bold mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TRANSACTION ID</div>
                    <div className="flex items-center justify-between bg-[#E5E5E0] p-3 border border-[#111111]">
                      <span className="text-xs text-[#525252] font-mono break-all">{selectedTransaction.id}</span>
                      <button
                        className="p-1.5 border border-[#111111] bg-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors ml-3 flex-shrink-0"
                        onClick={() => navigator.clipboard?.writeText(selectedTransaction.id)}
                        aria-label="Copy transaction ID"
                      >
                        <FaCopy size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => setSelectedTransaction(null)}
                      className="flex-1 px-6 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      CLOSE
                    </button>
                    <button
                      className="flex-1 px-6 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      EDIT ENTRY
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── Add Transaction Modal ── */}
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#111111]/70 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.97, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.97, opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-[#F9F9F7] border-4 border-[#111111] max-w-md w-full overflow-hidden"
                style={{ boxShadow: '8px 8px 0px 0px #111111' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="bg-[#111111] text-[#F9F9F7] p-6 border-b-4 border-[#111111] flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                      <FaPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
                        NEW TRANSACTION
                      </h3>
                      <p className="text-[0.65rem] uppercase tracking-widest mt-1 text-[#A3A3A3]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        LOG A FINANCIAL ENTRY
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Form */}
                <div className="p-8">
                  <form className="space-y-6">

                    {/* Amount */}
                    <div>
                      <label
                        className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-3"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        TRANSACTION AMOUNT
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <FaRupeeSign className="text-[#525252]" size={14} />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          className="block w-full pl-10 pr-4 py-4 border-2 border-[#111111] bg-white text-[#111111] font-bold text-xl focus:outline-none focus:ring-2 focus:ring-[#111111] transition-all"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex gap-3 mt-3">
                        <span className="text-[0.6rem] px-3 py-2 border border-[#111111] bg-[#111111] text-[#F9F9F7] font-bold uppercase tracking-widest cursor-pointer hover:bg-[#333] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          INCOME (+)
                        </span>
                        <span className="text-[0.6rem] px-3 py-2 border border-[#CC0000] text-[#CC0000] font-bold uppercase tracking-widest cursor-pointer hover:bg-[#CC0000] hover:text-[#F9F9F7] transition-colors" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          EXPENSE (-)
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-3"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        DESCRIPTION
                      </label>
                      <input
                        type="text"
                        className="block w-full px-4 py-4 border-2 border-[#111111] bg-white text-[#111111] font-bold focus:outline-none focus:ring-2 focus:ring-[#111111] transition-all"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                        placeholder="What is this transaction for?"
                      />
                    </div>

                    {/* Date + Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          DATE
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <FaRegCalendarAlt className="text-[#525252]" size={12} />
                          </div>
                          <input
                            type="date"
                            className="block w-full pl-9 pr-3 py-4 border-2 border-[#111111] bg-white text-[#111111] font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#111111] transition-all"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-3"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          CATEGORY
                        </label>
                        <select
                          className="block w-full px-4 py-4 border-2 border-[#111111] bg-white text-[#111111] font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[#111111] appearance-none transition-all"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          <option value="credit">CREDIT</option>
                          <option value="debit">DEBIT</option>
                          <option value="subscription">SUBSCRIPTION</option>
                          <option value="refund">REFUND</option>
                        </select>
                      </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="pt-4 border-t-2 border-[#111111] flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-6 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center justify-center gap-2"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <FaPlus /> LOG TRANSACTION
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── Export Modal ── */}
          {showExportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#111111]/70 z-50 flex items-center justify-center p-4"
              onClick={() => exportStatus === 'idle' && setShowExportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.97, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.97, opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-[#F9F9F7] border-4 border-[#111111] max-w-md w-full max-h-[92vh] overflow-y-auto"
                style={{ boxShadow: '8px 8px 0px 0px #111111' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="bg-[#111111] text-[#F9F9F7] p-6 border-b-4 border-[#111111] flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                      <FaFileExport className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
                        EXPORT LEDGER
                      </h3>
                      <p className="text-[0.65rem] uppercase tracking-widest mt-1 text-[#A3A3A3]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        DOWNLOAD TRANSACTION DATA
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => exportStatus === 'idle' && setShowExportModal(false)}
                    disabled={exportStatus !== 'idle'}
                    className="p-2 border-2 border-[#F9F9F7] hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors disabled:opacity-30"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Modal body */}
                <div className="p-8">
                  {exportStatus === 'idle' ? (
                    <div className="space-y-8">

                      {/* Info block */}
                      <div className="border-2 border-[#111111] p-6 bg-white flex items-start gap-4">
                        <div className="p-3 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7] flex-shrink-0">
                          <FaFileDownload />
                        </div>
                        <div>
                          <h4 className="font-black text-[#111111] uppercase tracking-wide mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                            EXPORT YOUR DATA
                          </h4>
                          <p className="text-sm text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                            Choose your preferred format and date range to export your complete transaction history.
                          </p>
                        </div>
                      </div>

                      {/* Format selection */}
                      <div>
                        <label className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-4 border-b-2 border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          EXPORT FORMAT
                        </label>
                        <div className="grid grid-cols-3 gap-0 border-2 border-[#111111] divide-x-2 divide-[#111111]">
                          {(['csv', 'json', 'pdf'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => setExportFormat(fmt)}
                              className={`flex flex-col items-center gap-3 p-5 transition-all ${
                                exportFormat === fmt
                                  ? 'bg-[#111111] text-[#F9F9F7]'
                                  : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
                              }`}
                            >
                              <div className={`p-2 border-2 ${exportFormat === fmt ? 'border-[#F9F9F7]' : 'border-[#111111]'}`}>
                                <FaFileDownload size={16} />
                              </div>
                              <div className="text-center">
                                <span className="block font-black text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  {fmt.toUpperCase()}
                                </span>
                                <span className={`block text-[0.6rem] mt-0.5 ${exportFormat === fmt ? 'text-[#A3A3A3]' : 'text-[#525252]'}`} style={{ fontFamily: "'Lora', serif" }}>
                                  {fmt === 'csv' ? 'Excel ready' : fmt === 'json' ? 'Dev format' : 'Print ready'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Date range selection */}
                      <div>
                        <label className="block text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-4 border-b-2 border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          DATE RANGE
                        </label>
                        <div className="space-y-0 border-2 border-[#111111] divide-y-2 divide-[#111111]">
                          {[
                            { value: 'all',            label: 'ALL TIME',      desc: `${transactions.length} transactions` },
                            { value: 'current-month',  label: 'CURRENT MONTH', desc: 'This month only' },
                            { value: 'last-3-months',  label: 'LAST 3 MONTHS', desc: 'Recent quarter' },
                            { value: 'last-6-months',  label: 'LAST 6 MONTHS', desc: 'Recent half year' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setExportDateRange(opt.value as any)}
                              className={`w-full flex items-center justify-between p-4 transition-all text-left ${
                                exportDateRange === opt.value
                                  ? 'bg-[#111111] text-[#F9F9F7]'
                                  : 'bg-white text-[#111111] hover:bg-[#E5E5E0]'
                              }`}
                            >
                              <div>
                                <div className="font-black text-xs uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  {opt.label}
                                </div>
                                <div className={`text-[0.6rem] mt-0.5 ${exportDateRange === opt.value ? 'text-[#A3A3A3]' : 'text-[#525252]'}`} style={{ fontFamily: "'Lora', serif" }}>
                                  {opt.desc}
                                </div>
                              </div>
                              {exportDateRange === opt.value && (
                                <div className="w-3 h-3 border-2 border-[#F9F9F7] bg-[#CC0000] flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Export summary */}
                      <div className="border-2 border-[#111111] p-5 bg-[#E5E5E0]">
                        <div className="text-[0.65rem] font-bold text-[#111111] uppercase tracking-widest mb-4 border-b border-[#111111] pb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          EXPORT SUMMARY
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: 'FORMAT',            value: exportFormat.toUpperCase() },
                            { label: 'DATE RANGE',        value: exportDateRange === 'all' ? 'ALL TIME' : exportDateRange.toUpperCase().replace(/-/g, ' ') },
                            { label: 'TOTAL RECORDS',     value: sortedTransactions.length.toString() },
                          ].map((row) => (
                            <div key={row.label} className="flex justify-between items-center">
                              <span className="text-[0.6rem] text-[#525252] uppercase tracking-widest font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{row.label}:</span>
                              <span className="text-[0.65rem] font-black text-[#111111] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer buttons */}
                      <div className="flex gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowExportModal(false)}
                          className="flex-1 px-6 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          CANCEL
                        </button>
                        <button
                          type="button"
                          onClick={handleExportData}
                          className="flex-1 px-6 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center justify-center gap-2"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <FaFileExport /> EXPORT NOW
                        </button>
                      </div>
                    </div>

                  ) : exportStatus === 'exporting' ? (

                    // ── Exporting State ──
                    <div className="py-10 space-y-8">
                      <div className="bg-[#111111] text-[#F9F9F7] p-8 border-b-4 border-[#CC0000]">
                        <div className="flex items-center gap-6 mb-8">
                          <div className="p-4 border-2 border-[#F9F9F7]">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                              <FaFileDownload className="h-8 w-8" />
                            </motion.div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-black uppercase tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                              GENERATING FILE
                            </h3>
                            <p className="text-[#A3A3A3] mt-1 text-sm" style={{ fontFamily: "'Lora', serif" }}>
                              Please keep the application open
                            </p>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-4 border-2 border-[#F9F9F7] bg-[#111111]">
                          <motion.div
                            className="h-full bg-[#CC0000]"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, ease: 'easeInOut' }}
                          />
                        </div>
                      </div>
                      {/* Steps */}
                      <div className="space-y-3">
                        {[
                          { delay: 0.2,  label: 'COLLECTING TRANSACTION DATA…' },
                          { delay: 0.6,  label: 'FORMATTING RECORDS…' },
                          { delay: 1.0,  label: `GENERATING ${exportFormat.toUpperCase()} FILE…` },
                        ].map((step, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: step.delay }}
                            className="flex items-center gap-3 border border-[#111111] p-3 bg-white"
                          >
                            <div className="w-2 h-2 bg-[#CC0000] flex-shrink-0" />
                            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[#111111]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {step.label}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                  ) : (

                    // ── Completed State ──
                    <div className="py-10 space-y-8">
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className="mx-auto w-20 h-20 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-8"
                        >
                          <FaFileDownload className="text-3xl" />
                        </motion.div>
                        <h4
                          className="text-3xl font-black text-[#111111] uppercase tracking-tighter mb-3"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          EXPORT COMPLETE
                        </h4>
                        <p className="text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                          Your transaction data has been downloaded.
                        </p>
                      </div>
                      <div className="border-2 border-[#111111] p-5 flex items-center gap-4 bg-white">
                        <div className="p-3 border-2 border-[#111111] bg-[#111111] text-[#F9F9F7]">
                          <FaFileDownload />
                        </div>
                        <div>
                          <div className="font-black text-[#111111] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                            transactions-{new Date().toISOString().split('T')[0]}.{exportFormat}
                          </div>
                          <div className="text-[0.6rem] text-[#525252] uppercase tracking-widest mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {sortedTransactions.length} TRANSACTIONS EXPORTED
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Transactions;