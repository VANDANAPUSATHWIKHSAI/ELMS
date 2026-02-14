import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from "../context/AuthContext"; 
import { 
  User, Camera, Save, X, Image as ImageIcon, Video, Edit3 
} from 'lucide-react';

// --- REUSABLE INPUT COMPONENT (From Old Code) ---
const ProfileField = ({ label, name, value, isReadOnly, isEditing, onChange, type = "text" }) => {
  const kmitOrange = "#d1551b";
  return (
    <div style={styles.inputGroup}>
      <label style={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        value={value || ""}
        disabled={isReadOnly || !isEditing}
        onChange={(e) => onChange(name, e.target.value)}
        style={{
          ...styles.profileInput,
          backgroundColor: isReadOnly ? '#f1f5f9' : (isEditing ? '#fff' : '#f8fafc'),
          border: isEditing && !isReadOnly ? `1px solid ${kmitOrange}` : '1px solid #e2e8f0',
          color: isReadOnly ? '#64748b' : '#1e293b',
          cursor: isReadOnly ? 'not-allowed' : 'text'
        }}
      />
    </div>
  );
};

const Profile = () => {
  const { user: authUser } = useAuth(); // Get User info from Context
  const kmitOrange = "#d1551b";

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  // Camera/Image States (From Old Code)
  const [profileImg, setProfileImg] = useState(null); 
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // --- 1. FETCH DATA (From New Code) ---
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.employeeId) return;
      try {
        const res = await fetch(`http://localhost:5000/api/user/${authUser.employeeId}`);
        const data = await res.json();
        if (res.ok) {
          // Format dates for inputs (YYYY-MM-DD)
          const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : "";
          setFormData({ ...data, dob: formatDate(data.dob), doj: formatDate(data.doj) });
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [authUser]);

  // --- 2. HANDLERS ---
  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:5000/api/user/${authUser.employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      alert("Updated Successfully!");
      setIsEditing(false);
    } catch (err) { alert("Update failed"); }
  };

  // --- 3. PHOTO LOGIC (From Old Code) ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImg(reader.result);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setProfileImg(canvas.toDataURL('image/png'));
    stopCamera();
    setShowPhotoOptions(false);
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  if (loading) return <p style={{textAlign:'center', marginTop: '50px'}}>Loading Profile...</p>;

  return (
    <div style={styles.container}>
      
      {/* --- HEADER --- */}
      <header style={styles.header}>
        <h1 style={styles.welcomeText}>My <span style={{color: kmitOrange}}>Profile</span></h1>
        
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
            <Edit3 size={18} /> Edit Profile
          </button>
        ) : (
           <div style={{display:'flex', gap:'10px'}}>
              <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>
                <X size={18} /> Cancel
              </button>
              <button onClick={handleSave} style={styles.saveBtn}>
                <Save size={18} /> Save Changes
              </button>
           </div>
        )}
      </header>

      {/* --- MAIN CARD --- */}
      <div style={styles.profileCard}>
        
        {/* TOP SECTION: AVATAR + NAME */}
        <div style={styles.profileTop}>
          <div style={styles.avatarWrapper}>
            <div style={styles.avatarCircle}>
              {profileImg ? (
                <img src={profileImg} alt="Profile" style={styles.profilePreview} />
              ) : (
                <User size={60} color="#94a3b8" />
              )}
            </div>
            {/* Camera Icon Trigger */}
            <div style={styles.cameraIcon} onClick={() => setShowPhotoOptions(true)}>
              <Camera size={16} color="#fff" />
            </div>
          </div>
          
          <div style={{marginLeft: '25px'}}>
            <h2 style={{margin: 0, color: '#1e293b'}}>{formData.firstName} {formData.lastName}</h2>
            <p style={{margin: '5px 0', color: '#64748b', fontWeight: '500'}}>
              {formData.designation} • {formData.employeeId}
            </p>
          </div>
        </div>

        <div style={styles.divider}></div>

        {/* BOTTOM SECTION: FORM GRID */}
        <form style={styles.infoGrid}>
            <ProfileField label="Employee ID" name="employeeId" value={formData.employeeId} isReadOnly={true} isEditing={isEditing} onChange={handleInputChange} />
            <ProfileField label="Date of Birth" name="dob" type="date" value={formData.dob} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            
            <ProfileField label="First Name" name="firstName" value={formData.firstName} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            <ProfileField label="Date of Joining" name="doj" type="date" value={formData.doj} isReadOnly={true} isEditing={isEditing} onChange={handleInputChange} />
            
            <ProfileField label="Last Name" name="lastName" value={formData.lastName} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            <ProfileField label="Mobile" name="mobile" value={formData.mobile} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            
            <ProfileField label="Email" name="email" value={formData.email} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            <ProfileField label="Department" name="department" value={formData.department} isReadOnly={true} isEditing={isEditing} onChange={handleInputChange} />
            
            <ProfileField label="Designation" name="designation" value={formData.designation} isReadOnly={true} isEditing={isEditing} onChange={handleInputChange} />
            <ProfileField label="Gender" name="gender" value={formData.gender} isReadOnly={true} isEditing={isEditing} onChange={handleInputChange} />
            
            <ProfileField label="Aadhaar" name="aadhaar" value={formData.aadhaar} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            <ProfileField label="PAN" name="pan" value={formData.pan} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            
            <ProfileField label="JNTU UID" name="jntuUid" value={formData.jntuUid} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            <ProfileField label="AICTE ID" name="aicteId" value={formData.aicteId} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            
            <div style={{gridColumn: 'span 2'}}>
              <ProfileField label="Address" name="address" value={formData.address} isReadOnly={false} isEditing={isEditing} onChange={handleInputChange} />
            </div>
        </form>
      </div>

      {/* --- PHOTO OPTIONS MODAL (From Old Code) --- */}
      {showPhotoOptions && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Update Profile Photo</h3>
              <X style={{cursor:'pointer', color: '#64748b'}} onClick={() => { stopCamera(); setShowPhotoOptions(false); }} />
            </div>
            
            {!isCameraActive ? (
              <div style={styles.modalBody}>
                <button 
                  style={styles.optionBtn} 
                  onClick={() => fileInputRef.current.click()}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                >
                  <ImageIcon size={24} color={kmitOrange} />
                  <span style={styles.optionText}>Choose from Library</span>
                </button>
                <button 
                  style={styles.optionBtn} 
                  onClick={startCamera}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                >
                  <Video size={24} color={kmitOrange} />
                  <span style={styles.optionText}>Take Real-time Photo</span>
                </button>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
              </div>
            ) : (
              <div style={styles.cameraContainer}>
                <video ref={videoRef} autoPlay style={styles.videoStream}></video>
                <div style={styles.cameraControls}>
                  <button style={styles.camCancelBtn} onClick={stopCamera}>Cancel</button>
                  <button style={styles.captureBtn} onClick={capturePhoto}>Capture Photo</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  // Container allows Layout to scroll
  container: { width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
  
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  welcomeText: { margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: '700' },
  
  // Buttons
  editBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#d1551b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  cancelBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },

  // Card
  profileCard: { background: '#fff', borderRadius: '20px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  
  // Top Section (Avatar)
  profileTop: { display: 'flex', alignItems: 'center', marginBottom: '30px' },
  avatarWrapper: { position: 'relative' },
  avatarCircle: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #e2e8f0', overflow: 'hidden' },
  profilePreview: { width: '100%', height: '100%', objectFit: 'cover' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#d1551b', padding: '6px', borderRadius: '50%', border: '2px solid #fff', display: 'flex', cursor: 'pointer' },
  
  divider: { height: '1px', backgroundColor: '#e2e8f0', margin: '0 0 30px 0' },
  
  // Form Grid
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  profileInput: { padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: '500', outline: 'none', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box' },

  // Modal Styles
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' },
  modal: { background: '#fff', padding: '30px', borderRadius: '20px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  modalTitle: { margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: '700' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: '16px' },
  optionBtn: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s ease', width: '100%' },
  optionText: { fontSize: '16px', fontWeight: '600', color: '#334155' }, 
  
  // Camera Specific
  cameraContainer: { textAlign: 'center' },
  videoStream: { width: '100%', borderRadius: '12px', marginBottom: '20px', backgroundColor: '#000' },
  cameraControls: { display: 'flex', gap: '12px', justifyContent: 'center' },
  camCancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  captureBtn: { background: '#d1551b', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default Profile;