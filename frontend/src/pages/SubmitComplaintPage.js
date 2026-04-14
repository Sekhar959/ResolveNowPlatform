import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['Infrastructure', 'Public Services', 'Sanitation', 'Utilities', 'Transport', 'Others'];

export default function SubmitComplaintPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'medium', street: '', city: '', state: '', pincode: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setErrors(er => ({ ...er, [e.target.name]: '' })); };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { addToast('Please upload an image file', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { addToast('Image must be under 10MB', 'error'); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.street.trim()) errs.street = 'Address is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append('image', image);
      const { data } = await complaintAPI.create(formData);
      addToast(`Complaint ${data.complaint.complaintId} submitted successfully!`, 'success');
      navigate(`/complaints/${data.complaint._id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Submission failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="section-header">
        <h2 className="section-title">Submit New Complaint</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/complaints')}>← Back</button>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Complaint Title *</label>
              <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="Brief description of your complaint" />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            {/* Category + Priority */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.category && <div className="form-error">{errors.category}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Priority *</label>
                <div className="priority-opts">
                  {['high', 'medium', 'low'].map(p => (
                    <div key={p} className={`priority-opt ${form.priority === p ? `sel-${p}` : ''}`} onClick={() => setForm(f => ({ ...f, priority: p }))}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Provide detailed description, include dates, affected area, any prior attempts to resolve..." style={{ minHeight: 120 }} />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>

            {/* Address */}
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>📍 Location Details</div>
            <div className="form-group">
              <label className="form-label">Street / Area *</label>
              <input className="form-control" name="street" value={form.street} onChange={handleChange} placeholder="Street name or locality" />
              {errors.street && <div className="form-error">{errors.street}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-control" name="city" value={form.city} onChange={handleChange} placeholder="City" />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-control" name="state" value={form.state} onChange={handleChange} placeholder="State" />
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 200 }}>
              <label className="form-label">Pincode</label>
              <input className="form-control" name="pincode" value={form.pincode} onChange={handleChange} placeholder="123456" maxLength={6} />
            </div>

            {/* Image upload */}
            <div className="form-group">
              <label className="form-label">Attach Image (optional) – uploaded via Cloudinary</label>
              {preview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={preview} alt="preview" style={{ width: 200, height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} />
                  <button type="button" onClick={() => { setImage(null); setPreview(''); }} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
                </div>
              ) : (
                <div
                  className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
                  <p style={{ fontSize: 13 }}>Click or drag & drop an image</p>
                  <p style={{ fontSize: 11, marginTop: 4, color: '#94A3B8' }}>PNG, JPG, WEBP – Max 10MB</p>
                  <input id="fileInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : '📤 Submit Complaint'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/complaints')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
