import React, { useState, useEffect, useMemo } from 'react';
import { Target, Calendar, Trophy, Users, LogIn, Download, Upload, Save, Trash2, Plus, Search, Menu, X, Clock, CheckCircle, Medal, Crosshair, Shield, FileText, ClipboardList, Radio, Lock, ChevronDown, ChevronUp, UserCheck, FileSpreadsheet, RefreshCw, Wifi, WifiOff, ListPlus, PlayCircle, AlertTriangle, ChevronLeft, ChevronRight, XCircle, Ticket, Mail, Key, Ban } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  updateDoc,
  getDocs
} from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyD8eRxPpVUOiU6pV0u3_I6pCFfOaw5UeaA",
  authDomain: "shaurya-lakshya-event.firebaseapp.com",
  projectId: "shaurya-lakshya-event",
  storageBucket: "shaurya-lakshya-event.firebasestorage.app",
  messagingSenderId: "152287825820",
  appId: "1:152287825820:web:da682c3a540087b3cd0259",
  measurementId: "G-C26DDLDHB9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "shaurya-lakshya-event"; 

// --- SECURITY CONSTANTS ---
const ALLOWED_ADMIN_EMAILS = [
  "nccrvce2025@gmail.com",
  "nccrvceshaurya@gmail.com", 
  "lokakshas.cs24@rvce.edu.in", 
  "shaurya.lakshya.admin@gmail.com"
];

const EVENT_DATES = ["5th Dec", "6th Dec"];
const STANDARD_SCHEDULE = [
  {time: "08:00 HRS", capacity: 60 },
  { time: "09:00 HRS", capacity: 60 },
  { time: "10:00 HRS", capacity: 60 },
  { time: "11:00 HRS", capacity: 60 },
  { time: "13:00 HRS ",capacity:60},
  { time: "14:00 HRS ",capacity:60},
  { time: "15:00 HRS ",capacity:60},
  { time: "16:00 HRS ",capacity:60},

];

const WEAPON_IMAGES = [
  
  { src: "/achilles.jpg", title: "Achilles X3", desc: "Precision PCP Rifle" },
  { src: "/minotaur.jpg", title: "PX120 Minotaur", desc: "Tactical Bullpup Design" },
  { src: "/benchrest.jpg", title: "Benchrest Special", desc: "Competition Grade Accuracy" },
  { src: "/pp75.jpg", title: "PP75 Champion", desc: "Elite Air Pistol" },
  { src: "/pp55.jpg", title: "PP55 Match Pro Junior", desc: "Junior Competition Pistol" },
  { src: "/px100.jpg", title: "PX100 Match", desc: "Standard Match Rifle" },
  { src: "/DSC01715.jpg", title: "Precision Air Rifle", desc: "Standard 10m Competition Rifle" },
  { src: "/DSC03839.jpg", title: "Tactical Sniper", desc: "High-Powered Scoped Precision" },
  { src: "/DSC05738.jpg", title: "Competition Pistols", desc: "Dual Set Match Grade Air Pistols" },
  { src: "/DSC09093.jpg", title: "Advanced PCP", desc: "Pre-Charged Pneumatic Target Rifle" }
  
];

// --- COMPONENT ---
export default function ShauryaLakshyaApp() {
  // State
  const [user, setUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false); 
  const [view, setView] = useState('home'); 
  const [participants, setParticipants] = useState([]);
  const [slots, setSlots] = useState([]);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [dbError, setDbError] = useState(null); 

  // Admin State
  const [adminTab, setAdminTab] = useState('slots');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [newAllowedEmail, setNewAllowedEmail] = useState('');
  const [importEmailsText, setImportEmailsText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSlot, setExpandedSlot] = useState(null); 
  const [editingScoreId, setEditingScoreId] = useState(null);
  
  // Admin Slot Creation & Management State
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotCapacity, setNewSlotCapacity] = useState(60);
  const [newSlotDate, setNewSlotDate] = useState('5th Dec'); 
  const [adminViewDate, setAdminViewDate] = useState('5th Dec');

  // Leaderboard Filter State
  const [lbGender, setLbGender] = useState('Male');

  // Booking State
  const [bookingStep, setBookingStep] = useState('verify'); 
  const [participantEmail, setParticipantEmail] = useState('');
  const [bookingForm, setBookingForm] = useState({ 
    name: '', 
    gender: '', // Ensure default is empty string to force selection
    cadetType: 'General', 
    slotId: '' 
    // Removed ticketId from state
  });
  const [bookingDate, setBookingDate] = useState('5th Dec'); 
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBookedTicket, setLastBookedTicket] = useState(null); 

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Animation State
  const [animState, setAnimState] = useState('initial'); 

  // --- AUTH INIT & PERSISTENCE ---
  useEffect(() => {
    const persistedAdmin = localStorage.getItem('shaurya_admin_session');
    if (persistedAdmin === 'true') {
      setIsAdminAuthenticated(true);
    }

    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Initialization Error:", error);
        setDbError("Authentication Failed. Please refresh the page.");
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setDbError(null);
        if (!u.isAnonymous && u.email && ALLOWED_ADMIN_EMAILS.includes(u.email)) {
          setIsAdminAuthenticated(true);
          localStorage.setItem('shaurya_admin_session', 'true');
        } 
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Auth Initialization Error:", error);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- FIRESTORE LISTENERS ---
  useEffect(() => {
    if (!user) return; 
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'participants'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipants(data);
      setLoading(false);
    }, (err) => {
      console.error("Participants Sync Error:", err);
      if (err.code === 'permission-denied') setDbError("Database Permission Denied. Check Firebase Rules.");
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'slots'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        return (a.time || '').localeCompare(b.time || '');
      });
      setSlots(data);
    }, (err) => {
      console.error("Slots Sync Error:", err);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllowedEmails(data);
    }, (err) => {
      console.error("Emails Sync Error:", err);
    });
    return () => unsub();
  }, [user]);

  // --- CAROUSEL LOGIC ---
  useEffect(() => {
    if (view === 'home') {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % WEAPON_IMAGES.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [view]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % WEAPON_IMAGES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + WEAPON_IMAGES.length) % WEAPON_IMAGES.length);

  // --- ANIMATION LOGIC ---
  useEffect(() => {
    if (view === 'home') {
      setAnimState('initial');
      const t1 = setTimeout(() => setAnimState('firing'), 500); 
      const t2 = setTimeout(() => setAnimState('hit'), 1300);   
      const t3 = setTimeout(() => setAnimState('revealed'), 1600); 

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [view]);


  // --- SCORING & STATS LOGIC ---
  const calculateStats = (participantData) => {
    const scorecards = participantData.scorecards || [];
    
    let grandTotal = 0;
    let grandPenalty = 0;
    
    const scoreCounts = {};
    for (let i = 0; i <= 10; i++) scoreCounts[i] = 0;

    scorecards.forEach(card => {
      // Skip if Disqualified
      if (card.isDQ) return;

      const cardPenalty = parseFloat(card.penalty) || 0;
      grandPenalty += cardPenalty;

      const shots = card.scores || [];
      const cardTotal = shots.reduce((a, b) => {
        const val = parseFloat(b);
        return a + (isNaN(val) ? 0 : val);
      }, 0);

      grandTotal += (cardTotal - cardPenalty);

      // Populate Histogram for Tie-Breaker
      shots.forEach(s => {
        const val = parseFloat(s);
        if (!isNaN(val)) {
            let bucket = Math.floor(val); 
            if (bucket > 10) bucket = 10; 
            if (bucket < 0) bucket = 0;
            scoreCounts[bucket] = (scoreCounts[bucket] || 0) + 1;
        }
      });
    });

    return { 
      totalScore: grandTotal, 
      totalPenalty: grandPenalty,
      scoreCounts 
    };
  };

  // --- ACTIONS ---

  const handleAdminGoogleLogin = async () => {
    setAdminLoginError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (ALLOWED_ADMIN_EMAILS.includes(email)) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('shaurya_admin_session', 'true');
        setView('admin');
      } else {
        await signOut(auth); 
        setAdminLoginError("ACCESS DENIED: This Google account is not authorized for command.");
        setIsAdminAuthenticated(false);
        localStorage.removeItem('shaurya_admin_session');
        await signInAnonymously(auth); 
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (error.code === 'auth/unauthorized-domain') setAdminLoginError("DOMAIN ERROR: Add domain to Firebase Console.");
      else if (error.code === 'auth/popup-closed-by-user') setAdminLoginError("Login Cancelled.");
      else setAdminLoginError("Authentication Failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('shaurya_admin_session');
    await signInAnonymously(auth); 
    setView('home');
    setParticipantEmail('');
    setBookingStep('verify');
    setAdminLoginError('');
  };

  const verifyParticipantEmail = async (e) => {
    e.preventDefault();
    if (allowedEmails.length === 0) {
      alert("System syncing... please wait 2 seconds and try again.");
      return;
    }
    const inputEmail = participantEmail.trim().toLowerCase();
    const found = allowedEmails.find(e => (e.email || '').trim().toLowerCase() === inputEmail);
    if (found) {
      const existing = participants.find(p => p.email.toLowerCase() === inputEmail);
      if (existing) {
        alert("You have already booked a slot! You cannot book again.");
        return;
      }
      setBookingStep('form');
    } else {
      alert("ACCESS DENIED: This email is not on the approved list.");
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.slotId) {
      alert("Please select a time slot");
      return;
    }
    if (!bookingForm.gender) { 
      alert("Please select a gender from the dropdown.");
      return;
    }

    const existing = participants.find(p => p.email.toLowerCase() === participantEmail.trim().toLowerCase());
    if (existing) {
      alert("Action Aborted: You have already booked a slot.");
      return;
    }
    const selectedSlot = slots.find(s => s.id === bookingForm.slotId);
    if (!selectedSlot) return;
    if ((selectedSlot.booked || 0) >= selectedSlot.capacity) {
      alert("Slot is full!");
      return;
    }

    // Auto-generate ticket ID, as input is removed
    const finalTicketId = "TKT-" + Math.random().toString(36).substr(2, 6).toUpperCase();

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'participants'), {
        name: bookingForm.name,
        gender: bookingForm.gender,
        cadetType: 'General', 
        email: participantEmail.trim(),
        slotId: bookingForm.slotId,
        slotTime: selectedSlot.time,
        slotDate: selectedSlot.date || '5th Dec', 
        ticketId: finalTicketId, 
        scorecards: [
          { 
            id: Date.now(), 
            scores: Array(10).fill(''), 
            penalty: 0, 
            isDQ: false 
          }
        ],
        totalScore: 0,
        registeredAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', bookingForm.slotId), {
        booked: (selectedSlot.booked || 0) + 1
      });

      setLastBookedTicket(finalTicketId); 
      setShowSuccessModal(true);
      setBookingForm({ ...bookingForm, name: '', slotId: '', gender: '' }); 
      
    } catch (error) {
      console.error(error);
      alert("Booking failed: " + error.message);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setView('home'); 
    setBookingStep('verify');
    setParticipantEmail('');
  };

  // --- SCORECARD MANAGEMENT ---

  const handleScoreCardUpdate = async (participant, cardIndex, field, value, shotIndex = null) => {
    const newScorecards = [...(participant.scorecards || [])];
    const targetCard = { ...newScorecards[cardIndex] };

    if (field === 'scores' && shotIndex !== null) {
      const newScores = [...targetCard.scores];
      newScores[shotIndex] = value;
      targetCard.scores = newScores;
    } else if (field === 'penalty') {
      targetCard.penalty = value;
    } else if (field === 'isDQ') {
      targetCard.isDQ = value;
    }

    newScorecards[cardIndex] = targetCard;

    const stats = calculateStats({ scorecards: newScorecards });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', participant.id), {
      scorecards: newScorecards,
      totalScore: stats.totalScore
    });
  };

  const handleAddScorecard = async (participant) => {
    if (!window.confirm("Add a new scorecard for this participant? This implies a new round or re-entry.")) return;
    
    const newScorecards = [
      ...(participant.scorecards || []),
      { 
        id: Date.now(), 
        scores: Array(10).fill(''), 
        penalty: 0, 
        isDQ: false 
      }
    ];

    const stats = calculateStats({ scorecards: newScorecards });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', participant.id), {
      scorecards: newScorecards,
      totalScore: stats.totalScore
    });
  };

  const handleDeleteScorecard = async (participant, cardIndex) => {
    if (!window.confirm("Delete this scorecard permanently?")) return;
    
    const newScorecards = [...(participant.scorecards || [])];
    newScorecards.splice(cardIndex, 1);

    const stats = calculateStats({ scorecards: newScorecards });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', participant.id), {
      scorecards: newScorecards,
      totalScore: stats.totalScore
    });
  };

  const addAllowedEmail = async (e) => {
    e.preventDefault();
    if (!newAllowedEmail) return;
    const email = newAllowedEmail.trim();
    if (allowedEmails.some(e => (e.email || '').trim().toLowerCase() === email.toLowerCase())) {
      setNewAllowedEmail('');
      return; 
    }
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'), {
      email: email, addedAt: new Date().toISOString()
    });
    setNewAllowedEmail('');
  };

  const handleBulkEmailImport = async () => {
    const emails = importEmailsText.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
    let count = 0;
    for (const email of emails) {
      if (!allowedEmails.some(e => (e.email || '').trim().toLowerCase() === email.toLowerCase())) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'allowed_emails'), {
          email: email, addedAt: new Date().toISOString()
        });
        count++;
      }
    }
    alert(`Imported ${count} emails.`);
    setImportEmailsText('');
  };

  const removeAllowedEmail = async (id) => {
    if(window.confirm("Revoke access?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'allowed_emails', id));
    }
  };

  // --- ADMIN SLOT MANAGEMENT ---
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlotTime) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'slots'), {
        time: newSlotTime,
        capacity: parseInt(newSlotCapacity) || 60,
        date: newSlotDate, 
        booked: 0,
        sortOrder: 999 
      });
      setNewSlotTime('');
    } catch (err) {
      console.error(err);
      alert("Failed to create slot");
    }
  };

  const handleLoadStandardSchedule = async () => {
    let shouldClear = false;
    if (slots.length > 0) {
      const choice = window.confirm("Slots already exist.\n\nClick OK to CLEAR EXISTING SLOTS and load standard schedule for BOTH DAYS.\nClick CANCEL to APPEND to current list.");
      shouldClear = choice;
    }
    setProcessingAction(true);
    try {
      if (shouldClear) {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'slots'));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', d.id)));
        await Promise.all(deletePromises);
      }
      
      const addPromises = [];
      EVENT_DATES.forEach(date => {
        STANDARD_SCHEDULE.forEach((s, index) => {
          addPromises.push(addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'slots'), {
            ...s,
            date: date,
            booked: 0,
            sortOrder: index 
          }));
        });
      });
      
      await Promise.all(addPromises);
    } catch (err) {
      console.error("Error loading schedule:", err);
      alert("Error: " + err.message);
    }
    setProcessingAction(false);
  };

  const handleDeleteSlot = async (slotId, currentBooked) => {
    if (currentBooked > 0) {
      if(!window.confirm(`WARNING: This slot has ${currentBooked} candidates assigned. Deleting it will NOT remove the candidates. Continue?`)) return;
    } else {
      if(!window.confirm("Are you sure you want to delete this slot?")) return;
    }
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', slotId));
    } catch (error) {
      console.error("Error deleting slot:", error);
      alert("Failed to delete slot. " + error.message);
    }
  };

  const handleDeleteParticipant = async (id, slotId) => {
    if(!window.confirm("Discharge personnel?")) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'participants', id));
    if (slotId && slotId !== 'pending') {
      const slot = slots.find(s => s.id === slotId);
      if (slot) {
         await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'slots', slotId), {
          booked: Math.max(0, slot.booked - 1)
        });
      }
    }
  };

  const handleExport = () => {
    const headers = "Name,TicketID,Email,Gender,Date,Slot,Total_10s,Total_Penalty,Total_Score\n";
    const csv = participants.map(p => {
      const stats = calculateStats(p);
      return `${p.name},${p.ticketId || 'N/A'},${p.email},${p.gender},${p.slotDate || ''},${p.slotTime},${stats.scoreCounts[10] || 0},${stats.totalPenalty},${p.totalScore}`;
    }).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Shaurya_Lakshya_Report.csv';
    a.click();
  };

  // --- RENDER HELPERS ---
  const sortedParticipants = useMemo(() => {
    return participants
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        p.gender === lbGender && 
        true
      )
      .sort((a, b) => {
        const statsA = calculateStats(a);
        const statsB = calculateStats(b);

        if (Math.abs(statsB.totalScore - statsA.totalScore) > 0.001) {
            return statsB.totalScore - statsA.totalScore;
        }
        
        for (let i = 10; i >= 0; i--) {
            const countA = statsA.scoreCounts[i] || 0;
            const countB = statsB.scoreCounts[i] || 0;
            if (countB !== countA) {
                return countB - countA;
            }
        }
        return 0;
      });
  }, [participants, searchTerm, lbGender]);

  const bookingSlots = slots.filter(s => s.date === bookingDate);
  const adminSlots = slots.filter(s => s.date === adminViewDate);

  return (
    <div className="min-h-screen bg-stone-900 text-amber-100 font-sans uppercase tracking-wider selection:bg-amber-700 selection:text-amber-100 relative flex flex-col">
      {/* Camo BG */}
      <div className="fixed inset-0 z-0 opacity-10 mix-blend-overlay pointer-events-none" style={{
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23383225"/><path d="M174.7 229.4c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm19.5 19.5c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm-54.6 54.6c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm54.6-54.6c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6z" fill="%234a4436"/><path d="M329.7 74.7c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm19.5 19.5c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm-54.6 54.6c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6zm54.6-54.6c18.4-19.4 32.8-46 30.3-73.3-2.4-27.3-23.3-48.6-46.1-64.8-22.7-16.2-48.8-26.8-75-32.2-26.2-5.4-53.5-4.5-79.6 2.6v-1.6c24.3-6.8 49.8-7.6 74.3-2.6 24.5 5.1 48.7 15 69.8 30.1 21.1 15 40.7 34.6 43.1 59.9 2.3 25.3-11 49.8-28.1 67.8l-1.6 2.6z" fill="%232a271e"/></svg>')`
      }} />

      {/* Nav */}
      <nav className="bg-stone-800 border-b-2 border-amber-700 sticky top-0 z-50 shadow-lg shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
              <div className="flex gap-2 items-center">
                <img src="image_e3acf6.png" alt="NCC" className="h-12 w-12 object-contain drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                <img src="image_e3ad73.png" alt="RVCE" className="h-12 w-12 object-contain drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                <img src="image_e3ad1e.png" alt="8th Mile" className="h-12 w-12 object-contain drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
              </div>
              <div className="border-l-2 border-amber-700 h-10 mx-2 hidden md:block"></div>
              <span className="font-black text-xl md:text-2xl tracking-widest text-amber-500 drop-shadow-sm hidden md:block">SHAURYA<span className="text-red-600">-</span>LAKSHYA</span>
            </div>
            
            <div className="hidden md:flex space-x-2">
              <button onClick={() => setView('home')} className={`px-4 py-2 rounded-sm text-sm font-bold border-2 transition ${view === 'home' ? 'border-amber-500 bg-amber-900/30 text-amber-500' : 'border-transparent text-stone-400 hover:text-amber-100'}`}>Event Info</button>
              <button onClick={() => setView('booking')} className={`px-4 py-2 rounded-sm text-sm font-bold border-2 transition ${view === 'booking' ? 'border-amber-500 bg-amber-900/30 text-amber-500' : 'border-transparent text-stone-400 hover:text-amber-100'}`}>Slot Selection</button>
              <button onClick={() => setView('leaderboard')} className={`px-4 py-2 rounded-sm text-sm font-bold border-2 transition ${view === 'leaderboard' ? 'border-amber-500 bg-amber-900/30 text-amber-500' : 'border-transparent text-stone-400 hover:text-amber-100'}`}>Leaderboard</button>
              <button onClick={() => setView(isAdminAuthenticated ? 'admin' : 'login')} className={`px-4 py-2 rounded-sm text-sm font-bold border-2 transition ${view === 'admin' ? 'border-red-500 bg-red-900/30 text-red-500' : 'border-stone-600 text-stone-400 hover:text-red-400'}`}>
                {isAdminAuthenticated ? 'Admin Panel' : 'Admin Login'}
              </button>
            </div>
            
             {/* Mobile Menu Button */}
             <div className="md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-amber-500 hover:text-amber-100 p-2 border-2 border-amber-700 bg-amber-900/20 rounded-sm">
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-stone-800 border-b-2 border-amber-700">
             <button onClick={() => {setView('home'); setMenuOpen(false)}} className="block w-full text-left px-4 py-3 text-amber-100 hover:bg-stone-700">Event Info</button>
             <button onClick={() => {setView('booking'); setMenuOpen(false)}} className="block w-full text-left px-4 py-3 text-amber-100 hover:bg-stone-700">Slot Selection</button>
             <button onClick={() => {setView('leaderboard'); setMenuOpen(false)}} className="block w-full text-left px-4 py-3 text-amber-100 hover:bg-stone-700">Leaderboard</button>
             <button onClick={() => {setView(isAdminAuthenticated ? 'admin' : 'login'); setMenuOpen(false)}} className="block w-full text-left px-4 py-3 text-red-400 hover:bg-stone-700">
               {isAdminAuthenticated ? 'Admin Panel' : 'Admin Login'}
             </button>
          </div>
        )}
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
        
        {/* ERROR BANNER IF DB FAILS */}
        {dbError && (
          <div className="mb-6 bg-red-900/80 border-l-4 border-red-500 p-4 rounded shadow-lg flex items-start gap-3">
            <AlertTriangle className="text-red-300 mt-1" size={24} />
            <div>
              <h3 className="text-red-200 font-bold">System Connection Issue</h3>
              <p className="text-red-300 text-sm">{dbError}</p>
            </div>
          </div>
        )}

        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="space-y-16">
            <div className="text-center py-16 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
                <Crosshair size={300} className="text-amber-700" />
              </div>
              
              {/* ANIMATION CONTAINER - FIXED HEIGHT STAGE */}
              <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
                
                {/* LAYER 1: Animation Elements (Target/Bullet) - Absolute centered */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                   <div className={`target-sheet transition-all duration-300 ${animState === 'initial' ? 'opacity-100 scale-100' : animState === 'hit' ? 'opacity-0 scale-150' : 'opacity-0'}`}>
                     <Target size={180} className="text-red-600" />
                   </div>
                   <div className={`bullet absolute h-3 bg-amber-500 rounded-full shadow-[0_0_20px_#f59e0b] transition-all duration-500 ease-linear`}
                        style={{
                          width: '40px',
                          left: animState === 'initial' ? '-100px' : animState === 'firing' ? '50%' : '50%',
                          opacity: animState === 'hit' || animState === 'revealed' ? 0 : 1
                        }}
                   ></div>
                </div>

                {/* LAYER 2: Content (Title/Buttons) - Absolute centered, fades in on top */}
                <div className={`hero-content absolute inset-0 flex flex-col items-center justify-center z-10 transition-all duration-1000 ${animState === 'revealed' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                    SHAURYA<span className="text-red-600">-</span>LAKSHYA
                  </h1>
                  
                  {/* UPDATED LOGO SECTION */}
                  <div className="mt-4 flex flex-col items-center">
                    <p className="text-lg md:text-xl text-amber-500 font-bold tracking-[0.3em] uppercase drop-shadow-md">
                      Powered by
                    </p>
                    <img 
                      src="precihole_logo-removebg-preview.png" 
                      alt="Precihole Sports" 
                      className="h-24 md:h-28 mt-2 object-contain opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                    />
                  </div>
                  
                  <div className="flex justify-center gap-6 mt-12">
                    <button onClick={() => setView('booking')} className="group relative bg-amber-700 text-white px-8 py-4 rounded-sm font-bold text-lg border-2 border-amber-600 hover:bg-amber-600 transition flex items-center gap-3 shadow-[0_0_20px_rgba(217,119,6,0.4)] overflow-hidden">
                      <span className="relative z-10 flex items-center gap-2"><Calendar size={20}/> SLOT SELECTION</span>
                      {/* Glint Effect */}
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                    </button>
                    
                    <button onClick={() => setView('leaderboard')} className="bg-black/50 text-stone-300 px-8 py-4 rounded-sm font-bold text-lg border-2 border-stone-600 hover:border-amber-500 hover:text-amber-400 transition flex items-center gap-3 backdrop-blur-sm">
                      <Medal size={20}/> LIVE SCORES
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* WEAPON CAROUSEL SECTION */}
            <div className={`border-t-2 border-amber-700/50 pt-12 transition-opacity duration-1000 ${animState === 'revealed' ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="text-3xl font-black text-center mb-8 text-amber-500 uppercase tracking-widest">Featured Arsenal</h2>
              <div className="relative max-w-4xl mx-auto bg-stone-800/50 border-2 border-amber-700 rounded-sm overflow-hidden shadow-2xl group">
                
                <div className="relative h-[400px] md:h-[500px] w-full">
                  {WEAPON_IMAGES.map((img, index) => (
                    <div 
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 backdrop-blur-sm border-t-2 border-amber-700">
                        <h3 className="text-xl font-bold text-amber-500">{img.title}</h3>
                        <p className="text-stone-300 text-sm">{img.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <button 
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-amber-700 text-white p-2 rounded-full transition border border-amber-500/50"
                >
                  <ChevronLeft size={24}/>
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-amber-700 text-white p-2 rounded-full transition border border-amber-500/50"
                >
                  <ChevronRight size={24}/>
                </button>

                {/* Indicators */}
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                  {WEAPON_IMAGES.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-amber-500 w-6' : 'bg-stone-500'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'booking' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black mb-8 flex items-center gap-4 border-b-4 border-amber-700 pb-4">
              <ClipboardList className="text-amber-500" size={36} /> Slot Selection
            </h2>
            
            <div className="bg-stone-800/80 rounded-sm p-8 border-2 border-amber-700 shadow-2xl">
              
              {/* Step 1: Verify Email */}
              {bookingStep === 'verify' && (
                <form onSubmit={verifyParticipantEmail} className="space-y-6">
                   <div className="text-center text-amber-200/70 mb-6">
                     <Shield size={48} className="mx-auto mb-4 text-amber-500"/>
                     <p>Restricted Access. Enter your approved email to proceed.</p>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-amber-200/80 mb-2">Candidate Email</label>
                      <input 
                        required
                        type="email" 
                        className="w-full bg-stone-900 border-2 border-amber-700/50 rounded-sm px-4 py-4 text-amber-100 focus:border-amber-500 outline-none"
                        placeholder="candidate@email.com"
                        value={participantEmail}
                        onChange={e => setParticipantEmail(e.target.value)}
                      />
                   </div>
                   <button className="w-full bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold py-4 rounded-sm transition border-2 border-amber-600">
                     VERIFY ACCESS
                   </button>
                </form>
              )}

              {/* Step 2: Booking Form */}
              {bookingStep === 'form' && (
                <form onSubmit={handleBooking} className="space-y-6">
                  <div className="flex items-center gap-2 text-green-500 text-sm mb-4 font-bold bg-green-900/20 p-2 rounded">
                    <CheckCircle size={16}/> Access Granted: {participantEmail}
                  </div>

                  {/* DATE SELECTION TOGGLE */}
                  <div>
                    <label className="block text-sm font-bold text-amber-200/80 mb-2">Select Mission Date</label>
                    <div className="flex bg-stone-900 p-1 rounded-sm border border-amber-700/50">
                      {EVENT_DATES.map(date => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setBookingDate(date)}
                          className={`flex-1 py-2 text-sm font-bold rounded-sm transition ${bookingDate === date ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-amber-100'}`}
                        >
                          {date}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-amber-200/80 mb-2">Full Name</label>
                    <input required type="text" className="w-full bg-stone-900 border-2 border-amber-700/50 rounded-sm px-4 py-3 text-amber-100 outline-none focus:border-amber-500"
                      value={bookingForm.name} onChange={e => setBookingForm({...bookingForm, name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-amber-200/80 mb-2">Gender</label>
                      <select required className="w-full bg-stone-900 border-2 border-amber-700/50 rounded-sm px-4 py-3 text-amber-100 outline-none focus:border-amber-500"
                        value={bookingForm.gender} onChange={e => setBookingForm({...bookingForm, gender: e.target.value})}>
                        <option value="" disabled>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  {/* Removed Ticket ID Input */}

                  <div>
                    <label className="block text-sm font-bold text-amber-200/80 mb-4">Select Time Slot ({bookingDate})</label>
                    {bookingSlots.length === 0 ? (
                      <div className="text-red-500 bg-red-900/20 p-4 rounded border border-red-900/50 text-sm text-center">
                        <p className="font-bold mb-1">⚠️ No Slots Available for {bookingDate}</p>
                        <p>Check back later or try another date.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {bookingSlots.map(slot => {
                          const isFull = (slot.booked || 0) >= slot.capacity;
                          return (
                            <div key={slot.id}
                              onClick={() => !isFull && setBookingForm({...bookingForm, slotId: slot.id})}
                              className={`cursor-pointer rounded-sm p-3 border-2 text-center transition relative ${bookingForm.slotId === slot.id ? 'border-amber-500 bg-amber-900/40 text-amber-500' : 'border-amber-700/50 bg-stone-900/50'} ${isFull ? 'opacity-50 cursor-not-allowed border-red-900 text-red-500' : ''}`}>
                              <div className="font-bold">{slot.time}</div>
                              <div className="text-xs mt-1">{isFull ? 'FULL' : `${slot.capacity - (slot.booked || 0)} Open`}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold py-4 rounded-sm transition border-2 border-amber-600 shadow-lg" disabled={slots.length === 0}>
                    CONFIRM SLOT
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div>
             <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-6 border-b-4 border-amber-700 pb-4">
              <h2 className="text-3xl font-black flex items-center gap-4"><Medal className="text-amber-500" size={36} /> Merit List</h2>
              <input type="text" placeholder="Search..." className="bg-stone-800 border-2 border-amber-700/50 rounded-sm px-4 py-2 text-amber-100 w-full md:w-64 outline-none focus:border-amber-500"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* LEADERBOARD FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex bg-stone-800 p-1 rounded-sm border border-amber-700/30">
                {['Male', 'Female'].map(g => (
                  <button 
                    key={g} 
                    onClick={() => setLbGender(g)}
                    className={`px-6 py-2 rounded-sm text-sm font-bold flex-1 ${lbGender === g ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-amber-100'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-stone-800/80 rounded-sm border-2 border-amber-700 overflow-x-auto shadow-2xl">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-900 text-amber-200/60 text-xs tracking-widest border-b-2 border-amber-700">
                    <tr>
                      <th className="p-4 text-center">Rank</th>
                      <th className="p-4">Candidate</th>
                      <th className="p-4 text-center">Rounds</th>
                      <th className="p-4 text-center">Total 10s</th>
                      <th className="p-4 text-center text-red-500">Penalty</th>
                      <th className="p-4 text-right">Total Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-amber-700/30">
                    {sortedParticipants.length === 0 ? (
                      <tr><td colSpan="6" className="p-8 text-center text-stone-500 italic">No candidates found in this category.</td></tr>
                    ) : (
                      sortedParticipants.map((p, idx) => {
                        const stats = calculateStats(p);
                        const validCards = (p.scorecards || []).filter(c => !c.isDQ).length;
                        return (
                          <tr key={p.id} className="hover:bg-amber-900/20 transition">
                            <td className="p-4 text-center font-black text-amber-500 text-lg">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-amber-100">{p.name}</div>
                              <div className="text-xs text-amber-200/60">{p.gender}</div>
                            </td>
                            <td className="p-4 text-center text-stone-400 text-sm">
                              {validCards} Active {p.scorecards?.length > validCards && `(+${p.scorecards.length - validCards} DQ)`}
                            </td>
                            <td className="p-4 text-center text-amber-200/80 font-bold">
                                {stats.scoreCounts[10] || 0}
                            </td>
                            <td className="p-4 text-center text-red-500 font-bold">
                                {stats.totalPenalty > 0 ? `-${stats.totalPenalty}` : '-'}
                            </td>
                            <td className="p-4 text-right font-black text-2xl text-amber-500">{p.totalScore.toFixed(1)}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {view === 'login' && (
          <div className="flex items-center justify-center py-16">
            <div className="bg-stone-800/90 p-10 rounded-sm border-2 border-red-700 shadow-2xl w-full max-w-md">
              <div className="flex justify-center mb-6 text-red-500"><Shield size={64}/></div>
              <h2 className="text-2xl font-black text-center mb-8 text-red-500 uppercase">Restricted Access</h2>
              
              {/* Show Error Message Conditionally */}
              {adminLoginError && (
                <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-sm text-sm flex items-center gap-2">
                  <AlertTriangle size={16}/> {adminLoginError}
                </div>
              )}

              {/* PRIMARY: GOOGLE LOGIN */}
              <div className="text-center mb-8">
                <button 
                  onClick={handleAdminGoogleLogin}
                  className="w-full bg-red-800 hover:bg-red-700 text-amber-100 font-bold py-4 rounded-sm transition border-2 border-red-600 flex items-center justify-center gap-3"
                >
                  <Mail size={20}/>
                  SIGN IN WITH GOOGLE
                </button>
                <p className="text-[10px] text-stone-500 mt-2 uppercase tracking-wide">Authorized Personnel Only</p>
              </div>
            </div>
          </div>
        )}

        {view === 'admin' && isAdminAuthenticated && user && (
          <div>
            <div className="flex justify-between items-center mb-8 border-b-4 border-red-700 pb-6">
              <h2 className="text-3xl font-black text-red-500 flex items-center gap-4"><Shield size={36}/> Command Center</h2>
              <div className="flex gap-4">
                 <button onClick={handleExport} className="px-4 py-2 bg-stone-800 border-2 border-amber-700 rounded-sm text-sm hover:bg-stone-700 flex gap-2 items-center"><Download size={16}/> Export CSV</button>
                 <button onClick={handleLogout} className="px-4 py-2 bg-red-900/50 border-2 border-red-700 text-red-400 rounded-sm text-sm hover:bg-red-900/80 flex gap-2 items-center"><LogIn size={16}/> Logout</button>
              </div>
            </div>

            <div className="flex gap-2 mb-8">
              {[
                {id: 'slots', label: 'Duty Slots & Scoring', icon: Clock},
                {id: 'access', label: 'Access Control', icon: Lock},
                {id: 'participants', label: 'All Personnel', icon: Users}
              ].map(tab => (
                <button key={tab.id} onClick={() => setAdminTab(tab.id)} className={`px-6 py-3 rounded-sm uppercase text-sm font-bold flex items-center gap-2 border-2 transition ${adminTab === tab.id ? 'bg-amber-700 text-amber-100 border-amber-500' : 'text-amber-200/60 border-transparent bg-stone-800'}`}>
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
            </div>

            {adminTab === 'slots' && (
              <div className="space-y-6">
                 {/* DATE FILTER FOR ADMIN VIEW */}
                 <div className="flex items-center gap-4 mb-4 bg-stone-800 p-4 border border-amber-700/30 rounded-sm">
                   <span className="text-amber-500 font-bold text-sm">MANAGE SCHEDULE FOR:</span>
                   <div className="flex gap-2">
                     {EVENT_DATES.map(date => (
                       <button
                         key={date}
                         onClick={() => setAdminViewDate(date)}
                         className={`px-4 py-1 rounded text-xs font-bold transition ${adminViewDate === date ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-400'}`}
                       >
                         {date}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="bg-stone-800/50 border-2 border-amber-700/30 p-6 rounded-sm relative">
                    <h4 className="font-bold text-amber-100 flex items-center gap-2 mb-4"><ListPlus size={18}/> Create New Duty Slot</h4>
                    <form onSubmit={handleAddSlot} className="flex gap-4 items-end mb-6">
                       <div className="w-40">
                         <label className="block text-xs text-stone-400 mb-1">Date</label>
                         <select 
                           className="w-full bg-stone-900 border border-stone-600 p-2 rounded-sm text-white outline-none focus:border-amber-500"
                           value={newSlotDate}
                           onChange={e => setNewSlotDate(e.target.value)}
                         >
                           {EVENT_DATES.map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                       </div>
                       <div className="flex-1">
                         <label className="block text-xs text-stone-400 mb-1">Time (e.g. 08:30 HRS)</label>
                         <input 
                           type="text" 
                           className="w-full bg-stone-900 border border-stone-600 p-2 rounded-sm text-white outline-none focus:border-amber-500"
                           placeholder="08:30 HRS"
                           value={newSlotTime}
                           onChange={e => setNewSlotTime(e.target.value)}
                         />
                       </div>
                       <div className="w-32">
                         <label className="block text-xs text-stone-400 mb-1">Capacity</label>
                         <input 
                           type="number" 
                           className="w-full bg-stone-900 border border-stone-600 p-2 rounded-sm text-white outline-none focus:border-amber-500"
                           value={newSlotCapacity}
                           onChange={e => setNewSlotCapacity(e.target.value)}
                         />
                       </div>
                       <button className="bg-amber-700 hover:bg-amber-600 text-white px-6 py-2 rounded-sm font-bold h-[42px]">
                         ADD SLOT
                       </button>
                    </form>
                    
                    <button 
                      type="button"
                      onClick={handleLoadStandardSchedule}
                      className="text-xs bg-stone-700 hover:bg-stone-600 text-white px-4 py-2 rounded flex items-center gap-2 absolute top-6 right-6 font-bold shadow-md"
                      disabled={processingAction}
                    >
                      {processingAction ? (
                        <RefreshCw size={12} className="animate-spin"/>
                      ) : (
                        <PlayCircle size={12}/> 
                      )}
                      {processingAction ? "PROCESSING..." : "LOAD STANDARD SCHEDULE (ALL DAYS)"}
                    </button>
                 </div>
                 
                 <div className="space-y-4">
                   {adminSlots.length === 0 && <p className="text-stone-500 text-center italic">No slots for {adminViewDate}. Add one or load schedule.</p>}
                   {adminSlots.map(slot => {
                     const slotParticipants = participants.filter(p => p.slotId === slot.id);
                     const isExpanded = expandedSlot === slot.id;
                     
                     return (
                       <div key={slot.id} className="bg-stone-800/80 border-2 border-amber-700/50 rounded-sm overflow-hidden">
                         <div className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}>
                               {isExpanded ? <ChevronUp className="text-amber-500"/> : <ChevronDown className="text-stone-500"/>}
                               <div>
                                 <span className="text-xs text-amber-500 font-bold block">{slot.date}</span>
                                 <div className="font-black text-xl text-amber-100">{slot.time}</div>
                               </div>
                               <div className="text-sm text-amber-200/60 ml-4">{slotParticipants.length} / {slot.capacity} Candidates</div>
                            </div>
                            <div className="flex items-center gap-4 relative z-20">
                              <div className="text-amber-500 font-bold text-sm tracking-widest">
                                {slotParticipants.length > 0 ? 'ACTIVE' : 'EMPTY'}
                              </div>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSlot(slot.id, slotParticipants.length);
                                }}
                                className="text-stone-500 hover:text-red-500 p-2 hover:bg-red-900/20 rounded transition"
                                title="Delete Slot"
                              >
                                <Trash2 size={18}/>
                              </button>
                            </div>
                         </div>

                         {isExpanded && (
                           <div className="border-t-2 border-amber-700/30 p-4 bg-stone-900/50">
                             {slotParticipants.length === 0 ? (
                               <p className="text-stone-500 italic">No candidates assigned to this slot.</p>
                             ) : (
                               <div className="space-y-4">
                                 {slotParticipants.map(p => {
                                   const isScoring = editingScoreId === p.id;
                                   const stats = calculateStats(p);
                                   return (
                                     <div key={p.id} className="bg-stone-800 border border-stone-700 p-4 rounded-sm">
                                       <div className="flex justify-between items-start mb-4">
                                         <div>
                                            <div className="font-bold text-lg text-white">{p.name}</div>
                                            <div className="text-xs text-amber-500">{p.gender} | {p.email}</div>
                                         </div>
                                         <div className="text-right">
                                            <div className="text-2xl font-black text-amber-500">{stats.totalScore.toFixed(1)}</div>
                                            <button onClick={() => setEditingScoreId(isScoring ? null : p.id)} className="text-xs underline text-stone-400 hover:text-white">
                                              {isScoring ? 'Close Scoring' : 'Open Scorecard'}
                                            </button>
                                         </div>
                                       </div>

                                       {isScoring && (
                                         <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {/* RENDER EACH SCORECARD */}
                                            {(p.scorecards || []).map((card, cIdx) => (
                                              <div key={card.id} className={`bg-stone-900 p-3 rounded border relative ${card.isDQ ? 'border-red-600 opacity-70' : 'border-stone-700'}`}>
                                                
                                                {/* Header for Scorecard */}
                                                <div className="flex justify-between items-center mb-2 border-b border-stone-700 pb-2">
                                                  <div className="text-xs font-bold uppercase text-amber-500 flex items-center gap-2">
                                                    #{cIdx + 1} SCORES {card.isDQ && <span className="text-red-500 flex items-center gap-1"><Ban size={12}/> DISQUALIFIED</span>}
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <button 
                                                      onClick={() => handleScoreCardUpdate(p, cIdx, 'isDQ', !card.isDQ)}
                                                      className={`text-[10px] px-2 py-1 rounded border ${card.isDQ ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}
                                                    >
                                                      {card.isDQ ? 'REVOKE DQ' : 'DISQUALIFY'}
                                                    </button>
                                                    <button onClick={() => handleDeleteScorecard(p, cIdx)} className="text-stone-500 hover:text-red-500"><Trash2 size={14}/></button>
                                                  </div>
                                                </div>

                                                {/* Input Grid */}
                                                <div className={`grid grid-cols-10 gap-1 mb-2 ${card.isDQ ? 'pointer-events-none grayscale' : ''}`}>
                                                  {Array(10).fill(0).map((_, i) => (
                                                    <input 
                                                      key={i} 
                                                      type="number"
                                                      placeholder="0"
                                                      className="w-full bg-stone-800 border border-stone-600 text-center text-white text-sm py-1 focus:border-amber-500 outline-none"
                                                      value={card.scores[i] || ''}
                                                      onChange={(e) => handleScoreCardUpdate(p, cIdx, 'scores', e.target.value, i)}
                                                    />
                                                  ))}
                                                </div>

                                                {/* Penalty Section */}
                                                <div className={`flex justify-end items-center gap-2 ${card.isDQ ? 'pointer-events-none' : ''}`}>
                                                  <label className="text-xs text-red-400 uppercase font-bold">Penalty:</label>
                                                  <input
                                                    type="number"
                                                    className="w-20 bg-stone-800 border border-red-900/50 text-center text-red-300 text-sm py-1 focus:border-red-500 outline-none"
                                                    value={card.penalty || ''}
                                                    onChange={(e) => handleScoreCardUpdate(p, cIdx, 'penalty', e.target.value)}
                                                    placeholder="0"
                                                  />
                                                  <div className="text-right text-xs text-stone-400 ml-2">
                                                    Subtotal: {(card.scores.reduce((a,b) => a + (parseFloat(b)||0), 0) - (parseFloat(card.penalty)||0)).toFixed(1)}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}

                                            {/* ADD SCORECARD BUTTON */}
                                            <button 
                                              onClick={() => handleAddScorecard(p)}
                                              className="w-full py-2 bg-stone-800 border-2 border-dashed border-stone-600 text-stone-400 hover:text-amber-500 hover:border-amber-500 rounded text-xs font-bold flex items-center justify-center gap-2 transition"
                                            >
                                              <Plus size={14}/> {p.scorecards && p.scorecards.length > 0 ? "ADD RE-ENTRY / EXTRA ROUND" : "INITIALIZE SCORECARD"}
                                            </button>
                                         </div>
                                       )}
                                     </div>
                                   )
                                 })}
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     )
                   })}
                 </div>
              </div>
            )}

            {adminTab === 'access' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-stone-800/80 p-6 rounded-sm border-2 border-amber-700">
                   <h3 className="font-bold text-xl text-amber-500 mb-4 flex items-center gap-2"><Lock size={20}/> Authorize Personnel</h3>
                   <form onSubmit={addAllowedEmail} className="flex gap-2 mb-6">
                     <input type="email" placeholder="candidate@email.com" className="flex-1 bg-stone-900 border border-amber-700/50 p-3 rounded-sm text-white outline-none"
                        value={newAllowedEmail} onChange={e => setNewAllowedEmail(e.target.value)}/>
                     <button className="bg-amber-700 text-white px-4 font-bold rounded-sm hover:bg-amber-600">ADD</button>
                   </form>

                   <div className="border-t border-amber-700/30 pt-4">
                      <h4 className="font-bold text-amber-500 mb-2 flex items-center gap-2"><FileSpreadsheet size={16}/> Bulk Import</h4>
                      <p className="text-xs text-stone-400 mb-2">Paste email column from Google Sheets</p>
                      <textarea 
                        className="w-full bg-stone-900 border border-amber-700/50 p-2 rounded-sm text-xs text-white h-32 mb-2"
                        placeholder="email1@example.com&#10;email2@example.com"
                        value={importEmailsText}
                        onChange={e => setImportEmailsText(e.target.value)}
                      />
                      <button onClick={handleBulkEmailImport} className="w-full bg-stone-700 hover:bg-stone-600 text-white py-2 rounded-sm text-sm font-bold">
                        IMPORT EMAILS
                      </button>
                   </div>
                </div>
                
                <div className="bg-stone-800/80 p-6 rounded-sm border-2 border-amber-700">
                   <h3 className="font-bold text-xl text-amber-500 mb-4 flex items-center gap-2"><UserCheck size={20}/> Authorized List</h3>
                   <div className="max-h-96 overflow-y-auto space-y-2">
                     {allowedEmails.map(entry => (
                       <div key={entry.id} className="flex justify-between items-center p-3 bg-stone-900 rounded-sm border-l-2 border-green-500">
                         <span className="text-sm text-stone-300">{entry.email}</span>
                         <button onClick={() => removeAllowedEmail(entry.id)} className="text-red-500 hover:text-white"><Trash2 size={14}/></button>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
            
            {adminTab === 'participants' && (
              <div className="bg-stone-800/80 border-2 border-amber-700 rounded-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-900 text-stone-400">
                    <tr><th className="p-3">Name</th><th className="p-3">Ticket ID</th><th className="p-3">Email</th><th className="p-3">Date</th><th className="p-3">Slot</th><th className="p-3 text-right">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-700">
                    {participants.map(p => (
                      <tr key={p.id}>
                        <td className="p-3">{p.name}</td>
                        <td className="p-3 font-mono text-amber-500">{p.ticketId}</td>
                        <td className="p-3 text-stone-400">{p.email}</td>
                        <td className="p-3 text-stone-400">{p.slotDate}</td>
                        <td className="p-3">{p.slotTime}</td>
                        <td className="p-3 text-right"><button onClick={() => handleDeleteParticipant(p.id, p.slotId)} className="text-red-500 hover:text-white"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border-2 border-green-500 rounded-lg p-8 max-w-md w-full text-center relative shadow-2xl shadow-green-900/20 animate-in zoom-in duration-300">
            <button onClick={closeSuccessModal} className="absolute top-4 right-4 text-stone-500 hover:text-white">
              <X size={24} />
            </button>
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Mission Confirmed</h3>
            
            {lastBookedTicket && (
              <div className="my-4 bg-black/50 border border-green-700 p-3 rounded">
                <div className="text-xs text-stone-400 uppercase tracking-widest mb-1">Ticket ID</div>
                <div className="text-xl font-mono font-bold text-green-400 flex items-center justify-center gap-2">
                  <Ticket size={20}/> {lastBookedTicket}
                </div>
              </div>
            )}

            <p className="text-stone-400 mb-8">
              Your slot has been successfully booked. Report to the range at your designated time. Good luck, Candidate.
            </p>
            <button onClick={closeSuccessModal} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-sm transition uppercase tracking-widest">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* DEBUG FOOTER */}
      <footer className="bg-stone-950 border-t border-stone-800 p-2 text-[10px] text-stone-500 flex justify-between items-center z-50">
         <div className="flex gap-4">
           <span className={`flex items-center gap-1 ${auth.currentUser ? 'text-green-500' : 'text-red-500'}`}>
             {auth.currentUser ? <Wifi size={10}/> : <WifiOff size={10}/>} {auth.currentUser ? 'System Online' : 'Disconnected'}
           </span>
           <span>Slots Loaded: {slots.length}</span>
           <span>Emails Loaded: {allowedEmails.length}</span>
         </div>
         <div>App ID: {appId}</div>
      </footer>
    </div>
  );
}